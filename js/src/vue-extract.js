import { parse as parseSFC } from '@vue/compiler-sfc';
import { parseExpression } from '@babel/parser';
import { Buffer } from 'node:buffer';
import * as t from '@babel/types';
import { extractMessages, parseSource } from './extract.js';
import { extractProject } from './extract-project.js';

function expression(source, origin) {
  const start = origin?.loc.start;
  return parseExpression(source, {
    startLine: start?.line || 1,
    startColumn: (start?.column || 1) - 1,
    startIndex: start?.offset || 0,
    plugins: ['typescript'],
  });
}

function location(node, source) {
  node.loc = {
    start: { line: source.loc.start.line, column: source.loc.start.column - 1 },
    end: { line: source.loc.end.line, column: source.loc.end.column - 1 },
  };
  return node;
}

function attributes(node) {
  return node.props.flatMap((prop) => {
    if (prop.type === 6) {
      return [
        t.jsxAttribute(
          t.jsxIdentifier(prop.name),
          prop.value ? t.stringLiteral(prop.value.content) : null
        ),
      ];
    }
    if (prop.name !== 'bind') {
      return [];
    }
    if (!prop.arg?.isStatic) {
      return [t.jsxSpreadAttribute(expression(prop.exp?.content || '{}'))];
    }
    return [
      t.jsxAttribute(
        t.jsxIdentifier(prop.arg.content),
        t.jsxExpressionContainer(
          expression(prop.exp?.content || prop.arg.content)
        )
      ),
    ];
  });
}

function bindings(ast) {
  const markers = new Map();
  for (const statement of ast.program.body) {
    if (
      statement.type !== 'ImportDeclaration' ||
      statement.source.value !== 'lino-i18n/vue' ||
      statement.importKind === 'type'
    ) {
      continue;
    }
    for (const specifier of statement.specifiers) {
      if (specifier.importKind === 'type') {
        continue;
      }
      if (specifier.type === 'ImportNamespaceSpecifier') {
        markers.set(specifier.local.name, '*');
      } else {
        markers.set(specifier.local.name, specifier.imported?.name);
      }
    }
  }
  return markers;
}

function marker(markers, tag) {
  const [name, property] = tag.split('.');
  return markers.get(name) === '*' ? property : markers.get(tag);
}

function jsxName(tag) {
  return tag
    .split('.')
    .map((name) => t.jsxIdentifier(name))
    .reduce((object, property) => t.jsxMemberExpression(object, property));
}

function scope(element, node) {
  let result = element;
  for (const prop of node.props) {
    if (['if', 'else', 'else-if'].includes(prop.name)) {
      result = t.conditionalExpression(
        prop.exp
          ? expression(prop.exp.content, prop.exp)
          : t.booleanLiteral(true),
        result,
        t.nullLiteral()
      );
      continue;
    }
    if (!['for', 'slot'].includes(prop.name) || !prop.exp) {
      continue;
    }
    let source = prop.exp.content;
    if (prop.name === 'for') {
      const match = /^(.*?)\s+(?:in|of)\s+.+$/.exec(source);
      if (!match) {
        throw new Error('Unsupported Vue v-for binding');
      }
      source = match[1].trim().replace(/^\((.*)\)$/, '$1');
    }
    const arrow = expression(`(${source}) => 0`);
    arrow.body = result;
    result = arrow;
  }
  return result === element ? element : t.jsxExpressionContainer(result);
}

function lower(node, markers, budget = { nodes: 0 }, depth = 0) {
  if (++budget.nodes > 10000 || depth > 100) {
    throw new Error('Vue template node/depth limit exceeded');
  }
  if (node.type === 2) {
    return location(
      t.jsxExpressionContainer(t.stringLiteral(node.content)),
      node
    );
  }
  if (node.type === 5) {
    return location(
      t.jsxExpressionContainer(expression(node.content.content, node.content)),
      node
    );
  }
  if (node.type !== 1) {
    return undefined;
  }
  const api = node.tagType === 1 ? marker(markers, node.tag) : undefined;
  const children = node.children
    .map((child) => lower(child, markers, budget, depth + 1))
    .filter(Boolean);
  const element = makeElement(node, markers, api, children);
  return location(scope(location(element, node), node), node);
}

function makeElement(node, markers, api, children) {
  const text = node.props.find((prop) => prop.name === 'text');
  if (text) {
    children = [
      t.jsxExpressionContainer(expression(text.exp?.content || 'undefined')),
    ];
  }
  let element;
  if (node.tag === 'template') {
    element = t.jsxFragment(
      t.jsxOpeningFragment(),
      t.jsxClosingFragment(),
      children
    );
  } else {
    // Vue resolves registered lowercase custom components as opaque VNodes.
    const name = jsxName(elementTag(node, markers, api));
    const props = contentAttributes(node, children, api);
    element = t.jsxElement(
      t.jsxOpeningElement(name, props, children.length === 0),
      children.length ? t.jsxClosingElement(name) : null,
      children,
      children.length === 0
    );
  }
  return element;
}

function elementTag(node, markers, api) {
  return node.tagType === 0 && marker(markers, node.tag)
    ? 'NativeVueElement'
    : node.tagType === 1 && !api && !/^[A-Z]/.test(node.tag)
      ? 'OpaqueVueComponent'
      : node.tag;
}

function contentAttributes(node, children, api) {
  const props = attributes(node);
  if (api === 'Branch' || api === 'Plural') {
    const cases = namedCases(node, children, api === 'Plural');
    if (cases.length) {
      const existing = props.find((prop) => prop.name?.name === 'cases')?.value
        ?.expression;
      if (existing && existing.type !== 'ObjectExpression') {
        throw new Error('Branch cases must be a static object for extraction');
      }
      cases.unshift(...(existing?.properties || []));
      props.push(
        t.jsxAttribute(
          t.jsxIdentifier('cases'),
          t.jsxExpressionContainer(t.objectExpression(cases))
        )
      );
    }
  }
  return props;
}

function namedCases(node, children, plural) {
  const cases = [];
  let index = 0;
  for (const child of node.children) {
    if (![1, 2, 5].includes(child.type)) {
      continue;
    }
    const content = children[index++];
    const slot = child.props?.find((prop) => prop.name === 'slot');
    if (!slot) {
      continue;
    }
    if (!slot.arg?.isStatic || slot.exp) {
      throw new Error('Branch slots require static unscoped names');
    }
    const name = slot.arg.content;
    const key =
      name === 'default' ? 'other' : plural && name === 'zero' ? '=0' : name;
    cases.push(
      t.objectProperty(
        t.stringLiteral(key),
        content.type === 'JSXExpressionContainer' ? content.expression : content
      )
    );
  }
  return cases;
}

export function parseVueSource(
  source,
  { file = '<source.vue>', maxBytes = 1024 * 1024 } = {}
) {
  if (
    !Number.isInteger(maxBytes) ||
    maxBytes < 1 ||
    maxBytes > 100 * 1024 * 1024 ||
    Buffer.byteLength(source) > maxBytes
  ) {
    throw new Error('Vue source byte limit exceeded or invalid');
  }
  const { descriptor, errors } = parseSFC(source, { filename: file });
  if (errors.length) {
    throw errors[0];
  }
  const blocks = [descriptor.script, descriptor.scriptSetup].filter(Boolean);
  if (blocks.some((block) => block.src)) {
    throw new Error('External Vue scripts require project-level resolution');
  }
  const script = source
    .split('')
    .map((char, index) =>
      blocks.some(
        (block) =>
          index >= block.loc.start.offset && index < block.loc.end.offset
      ) ||
      char === '\n' ||
      char === '\r'
        ? char
        : ' '
    )
    .join('');
  const ast = parseSource(script, file);
  if (descriptor.template) {
    if (descriptor.template.src) {
      throw new Error(
        'External Vue templates require project-level resolution'
      );
    }
    if (descriptor.template.lang && descriptor.template.lang !== 'html') {
      throw new Error('Vue extraction requires an HTML template');
    }
    const children = descriptor.template.ast.children
      .map((node) => lower(node, bindings(ast)))
      .filter(Boolean);
    const fragment = t.jsxFragment(
      t.jsxOpeningFragment(),
      t.jsxClosingFragment(),
      children
    );
    ast.program.body.push(
      t.expressionStatement(t.arrowFunctionExpression([], fragment))
    );
  }
  return ast;
}

export function extractVueMessages(source, options = {}) {
  return extractMessages(source, {
    file: options.file || '<source.vue>',
    ast: parseVueSource(source, options),
  });
}
export function extractVueProject(sources, options = {}) {
  return extractProject(sources, options, (code, file) =>
    file.endsWith('.vue')
      ? parseVueSource(code, { file })
      : parseSource(code, file)
  );
}
