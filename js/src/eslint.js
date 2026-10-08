import babelTraverse from '@babel/traverse';
import { apiName, extractMessages, parseSource } from './extract.js';

const traverse = babelTraverse.default || babelTraverse;
const cache = new WeakMap();
const bounds = {
  maxBytes: [1024 * 1024, 10 * 1024 * 1024],
  maxNodes: [100000, 200000],
  maxDepth: [100, 200],
};
const schema = [
  {
    type: 'object',
    properties: Object.fromEntries(
      Object.entries(bounds).map(([name, [, maximum]]) => [
        name,
        { type: 'integer', minimum: 1, maximum },
      ])
    ),
    additionalProperties: false,
  },
];

function checkBudget(sourceCode, options) {
  const limits = Object.fromEntries(
    Object.entries(bounds).map(([name, [fallback]]) => [
      name,
      options[name] ?? fallback,
    ])
  );
  if (new TextEncoder().encode(sourceCode.text).length > limits.maxBytes) {
    throw new Error(`Lint source exceeds ${limits.maxBytes} bytes`);
  }
  const stack = [[sourceCode.ast, 0]];
  let count = 0;
  while (stack.length) {
    const [node, depth] = stack.pop();
    if (++count > limits.maxNodes || depth > limits.maxDepth) {
      throw new Error('Lint source exceeds AST node or depth budget');
    }
    for (const key of sourceCode.visitorKeys[node.type] || []) {
      const value = node[key];
      for (const child of Array.isArray(value) ? value : [value]) {
        if (child?.type) {
          stack.push([child, depth + 1]);
        }
      }
    }
  }
}

function variableSuggestion(path, usedNames) {
  // A direct identifier has an unambiguous name and is evaluated exactly once.
  const child = path.node.children.find(
    (node) =>
      node.type === 'JSXExpressionContainer' &&
      node.expression.type === 'Identifier'
  );
  if (!child) {
    return undefined;
  }
  const bindings = path.scope.getAllBindings();
  let component = Object.keys(bindings).find(
    (name) => apiName(path, { type: 'Identifier', name }) === 'Var'
  );
  let importText = '';
  if (!component) {
    component = 'LinoVar';
    let suffix = 0;
    while (bindings[component] || usedNames.has(component)) {
      component = `LinoVar${++suffix}`;
    }
    importText = `import { Var as ${component} } from 'lino-i18n/react';\n`;
  }
  return { child, component, importText, name: child.expression.name };
}

function analyze(sourceCode, options, file) {
  let byOptions = cache.get(sourceCode);
  if (!byOptions) {
    byOptions = new Map();
    cache.set(sourceCode, byOptions);
  }
  const key = JSON.stringify(options);
  if (byOptions.has(key)) {
    return byOptions.get(key);
  }
  const reports = [];
  try {
    checkBudget(sourceCode, options);
    const usedNames = new Set(
      (sourceCode.ast.tokens || [])
        .filter((token) => token.type === 'Identifier')
        .map((token) => token.value)
    );
    const ast = parseSource(sourceCode.text, file);
    extractMessages(sourceCode.text, {
      file,
      ast,
      onDiagnostic(diagnostic, path) {
        const jsx = path.node.type === 'JSXElement';
        reports.push({
          rule: jsx ? 'static-jsx' : 'static-string',
          loc: path.node.loc,
          message: diagnostic.message,
          ...(jsx && diagnostic.message.startsWith('Wrap dynamic JSX')
            ? { suggestion: variableSuggestion(path, usedNames) }
            : {}),
        });
      },
    });
    traverse(ast, {
      JSXElement(path) {
        if (apiName(path, path.node.openingElement.name) !== 'Branch') {
          return;
        }
        for (const attribute of path.node.openingElement.attributes) {
          if (
            attribute.type === 'JSXAttribute' &&
            attribute.name.name?.startsWith('data-')
          ) {
            reports.push({
              rule: 'no-data-attrs-on-branch',
              loc: attribute.loc,
              message:
                'Branch is headless; place data attributes on a rendered element.',
            });
          }
        }
      },
    });
  } catch (error) {
    reports.push({ rule: 'static-string', message: error.message });
  }
  byOptions.set(key, reports);
  return reports;
}

function suggestionFix(suggestion, sourceCode, fixer) {
  const { child, component, importText, name } = suggestion;
  const expression = sourceCode.text.slice(child.start, child.end);
  const fixes = [
    fixer.replaceTextRange(
      [child.start, child.end],
      `<${component} name="${name}">${expression}</${component}>`
    ),
  ];
  if (importText) {
    // Imports must follow a directive prologue (notably Next's 'use client').
    const first = sourceCode.ast.body[0];
    let directive;
    for (const statement of sourceCode.ast.body) {
      if (!statement.directive) {
        break;
      }
      directive = statement;
    }
    const at = directive?.range[1] ?? first?.range[0] ?? sourceCode.text.length;
    fixes.push(
      fixer.insertTextBeforeRange(
        [at, at],
        `${directive ? '\n' : ''}${importText}`
      )
    );
  }
  return fixes;
}

function rule(name, description) {
  return {
    meta: {
      type: 'problem',
      docs: {
        description,
        url: 'https://github.com/link-foundation/lino-i18n/blob/main/docs/eslint.md',
      },
      schema,
      hasSuggestions: name === 'static-jsx',
      messages: {
        problem: '{{message}}',
        variable: 'Wrap this value in an explicitly named Var.',
      },
    },
    create(context) {
      return {
        'Program:exit'() {
          const sourceCode = context.sourceCode;
          const reports = analyze(
            sourceCode,
            context.options[0] || {},
            context.filename
          );
          for (const report of reports) {
            if (report.rule !== name) {
              continue;
            }
            context.report({
              ...(report.loc ? { loc: report.loc } : { node: sourceCode.ast }),
              messageId: 'problem',
              data: { message: report.message },
              ...(report.suggestion && {
                suggest: [
                  {
                    messageId: 'variable',
                    fix: (fixer) =>
                      suggestionFix(report.suggestion, sourceCode, fixer),
                  },
                ],
              }),
            });
          }
        },
      };
    },
  };
}

const plugin = {
  meta: { name: 'lino-i18n/eslint' },
  rules: {
    'static-string': rule(
      'static-string',
      'Require extractable static source messages and metadata.'
    ),
    'static-jsx': rule(
      'static-jsx',
      'Require extractable source JSX with explicit variables and branches.'
    ),
    'no-data-attrs-on-branch': rule(
      'no-data-attrs-on-branch',
      'Disallow ignored data attributes on headless Branch components.'
    ),
  },
  configs: {},
};
plugin.configs.recommended = {
  name: 'lino-i18n/recommended',
  plugins: { 'lino-i18n': plugin },
  rules: Object.fromEntries(
    Object.keys(plugin.rules).map((name) => [`lino-i18n/${name}`, 'error'])
  ),
};

export default plugin;
