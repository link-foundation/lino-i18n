import { parse } from '@babel/parser';
import babelTraverse from '@babel/traverse';
import babelGenerate from '@babel/generator';
import * as types from '@babel/types';
import { apiName } from './extract.js';
import { escapeMessageText } from './message-schema.js';

const traverse = babelTraverse.default || babelTraverse;
const generate = babelGenerate.default || babelGenerate;

function tagName(node) {
  return node.type === 'JSXIdentifier'
    ? node.name
    : node.type === 'JSXMemberExpression'
      ? `${tagName(node.object)}.${tagName(node.property)}`
      : undefined;
}

function nativeElement(node) {
  return node.type === 'JSXIdentifier' && /^[a-z]/.test(node.name);
}

function translatorExpression(name) {
  if (!/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(name || '')) {
    throw new TypeError(
      'attributeTranslator must name an in-scope translation function'
    );
  }
  return name
    .split('.')
    .reduce(
      (object, key) =>
        object
          ? types.memberExpression(object, types.identifier(key))
          : types.identifier(key),
      undefined
    );
}

function localizeAttributes(path, options) {
  const opening = path.node.openingElement;
  const configured = nativeElement(opening.name)
    ? options.attributes || []
    : options.components?.[tagName(opening.name)] || [];
  const selected = opening.attributes.filter(
    (attribute) =>
      attribute.type === 'JSXAttribute' &&
      configured.includes(attribute.name.name)
  );
  for (const attribute of selected) {
    const value =
      attribute.value?.type === 'JSXExpressionContainer'
        ? attribute.value.expression
        : attribute.value;
    if (!types.isStringLiteral(value) && !types.isTemplateLiteral(value)) {
      continue; // Runtime values already have application-owned translation logic.
    }
    if (
      opening.attributes.some((entry) => entry.type === 'JSXSpreadAttribute')
    ) {
      throw new Error(
        'Automatic translated attributes cannot have prop spreads'
      );
    }
    const translator = translatorExpression(options.attributeTranslator);
    if (!['gt', 'm'].includes(apiName(path, translator))) {
      throw new Error(
        `Attribute translator ${options.attributeTranslator} is not a lino translation function in scope`
      );
    }
    const translated = types.isTemplateLiteral(value)
      ? types.taggedTemplateExpression(translator, value)
      : types.callExpression(translator, [
          types.stringLiteral(escapeMessageText(value.value)),
        ]);
    types.inherits(translated, value);
    attribute.value = types.jsxExpressionContainer(translated);
  }
}

function textContent(node) {
  return node.children.some(
    (child) =>
      (child.type === 'JSXText' && child.value.trim()) ||
      (child.type === 'JSXExpressionContainer' &&
        types.isStringLiteral(child.expression) &&
        child.expression.value.trim())
  );
}

function automaticChildren(children, variableName, state) {
  return children.map((child) => {
    if (
      child.type === 'JSXExpressionContainer' &&
      child.expression.type !== 'JSXEmptyExpression' &&
      !types.isStringLiteral(child.expression) &&
      !types.isNumericLiteral(child.expression) &&
      !types.isBooleanLiteral(child.expression)
    ) {
      const marker = types.jsxIdentifier(variableName);
      const wrapped = types.jsxElement(
        types.jsxOpeningElement(marker, [
          types.jsxAttribute(
            types.jsxIdentifier('name'),
            types.stringLiteral(`auto${state.index++}`)
          ),
        ]),
        types.jsxClosingElement(marker),
        [child],
        false
      );
      return types.inherits(wrapped, child);
    }
    if (child.type === 'JSXFragment') {
      child.children = automaticChildren(child.children, variableName, state);
    } else if (
      child.type === 'JSXElement' &&
      nativeElement(child.openingElement.name)
    ) {
      child.children = automaticChildren(child.children, variableName, state);
    }
    return child;
  });
}

export function transformJSX(code, options = {}) {
  const file = options.file || '<source>';
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    sourceFilename: file,
  });
  const protectedElements = new WeakSet();
  let contentName;
  let variableName;
  let modified = false;
  traverse(ast, {
    Program(path) {
      contentName = path.scope.generateUidIdentifier('LinoT').name;
      variableName = path.scope.generateUidIdentifier('LinoVar').name;
    },
    JSXElement(path) {
      localizeAttributes(path, options);
      if (apiName(path, path.node.openingElement.name) === 'T') {
        protectedElements.add(path.node);
      }
      const ancestor = path.findParent(
        (parent) => parent.isJSXElement() && protectedElements.has(parent.node)
      );
      if (
        options.autoText === false ||
        ancestor ||
        protectedElements.has(path.node) ||
        !nativeElement(path.node.openingElement.name) ||
        !textContent(path.node)
      ) {
        return;
      }
      const marker = types.jsxIdentifier(contentName);
      const attributes = [];
      if (options.serverTranslator) {
        attributes.push(
          types.jsxAttribute(
            types.jsxIdentifier('i18n'),
            types.jsxExpressionContainer(
              translatorExpression(options.serverTranslator)
            )
          )
        );
      }
      const wrapped = types.jsxElement(
        types.jsxOpeningElement(marker, attributes),
        types.jsxClosingElement(marker),
        automaticChildren(path.node.children, variableName, { index: 0 }),
        false
      );
      types.inherits(wrapped, path.node);
      path.node.children = [wrapped];
      protectedElements.add(wrapped);
      modified = true;
    },
  });
  if (modified) {
    const runtime = options.serverTranslator
      ? 'lino-i18n/react-server'
      : 'lino-i18n/react';
    ast.program.body.unshift(
      types.importDeclaration(
        [
          types.importSpecifier(
            types.identifier(contentName),
            types.identifier('T')
          ),
          types.importSpecifier(
            types.identifier(variableName),
            types.identifier('Var')
          ),
        ],
        types.stringLiteral(runtime)
      )
    );
  }
  return generate(
    ast,
    { sourceMaps: true, sourceFileName: file, retainLines: true },
    code
  );
}
