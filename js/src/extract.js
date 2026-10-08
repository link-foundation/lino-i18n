import { parse } from '@babel/parser';
import babelTraverse from '@babel/traverse';
import { jsxAttributes, literal } from './extract-jsx.js';
import { messageVariables } from './message-schema.js';
import { dictionaryEntries } from './extract-dictionary.js';
import {
  derivedTemplates,
  derivedCalls,
  derivedJSX,
} from './extract-derived.js';

const traverse = babelTraverse.default || babelTraverse;

export function apiName(path, node, seen = new Set()) {
  if (!node) {
    return undefined;
  }
  if (node.type === 'MemberExpression' || node.type === 'JSXMemberExpression') {
    return memberApi(path, node, seen);
  }
  if (node.type !== 'Identifier' && node.type !== 'JSXIdentifier') {
    return undefined;
  }
  const binding = path.scope.getBinding(node.name);
  if (!binding || seen.has(binding) || !binding.constant) {
    return undefined;
  }
  seen.add(binding);
  return bindingApi(binding, node.name, seen);
}

function memberApi(path, node, seen) {
  const object = apiName(path, node.object, seen);
  const property = node.computed ? literal(node.property) : node.property.name;
  return object === '*' ||
    (object === 'translator' && ['gt', 'm', 'tx'].includes(property))
    ? property
    : undefined;
}

function bindingApi(binding, localName, seen) {
  if (
    binding.path.isImportSpecifier() ||
    binding.path.isImportNamespaceSpecifier()
  ) {
    const source = binding.path.parent.source.value;
    if (
      !/^lino-i18n(?:\/(?:messages|react|react-server|server|node))?$/.test(
        source
      )
    ) {
      return undefined;
    }
    return binding.path.isImportNamespaceSpecifier()
      ? '*'
      : binding.path.node.imported.name;
  }
  if (binding.path.isVariableDeclarator()) {
    const { id } = binding.path.node;
    const init =
      binding.path.node.init?.type === 'AwaitExpression'
        ? binding.path.node.init.argument
        : binding.path.node.init;
    if (init?.type === 'CallExpression') {
      const name = apiName(binding.path, init.callee, seen);
      if (['useGT', 'useMessages', 'getGT', 'getMessages'].includes(name)) {
        return 'gt';
      }
      if (
        [
          'createTranslator',
          'createDictionaryTranslator',
          'createRequestTranslator',
        ].includes(name)
      ) {
        return id.type === 'ObjectPattern'
          ? id.properties.find((property) => property.value?.name === localName)
              ?.key?.name
          : 'translator';
      }
    }
    return apiName(binding.path, init, seen);
  }
  return undefined;
}

function staticOptions(node) {
  if (!node) {
    return {};
  }
  if (node.type !== 'ObjectExpression') {
    throw new Error('Message options must be a static object for extraction');
  }
  const result = {};
  for (const property of node.properties) {
    const key = property.key?.name ?? property.key?.value;
    if (property.type === 'SpreadElement' || property.computed) {
      throw new Error(
        'Message options cannot contain spreads or computed keys'
      );
    }
    if (key === 'id' || key === 'description') {
      const value = literal(property.value);
      if (typeof value !== 'string') {
        throw new Error(`${key} must be a static string`);
      }
      result[key] = value;
    }
  }
  return result;
}

function usesDescriptor(path, source) {
  if (source?.type === 'CallExpression') {
    return ['msg', 'bindMessage'].includes(apiName(path, source.callee));
  }
  if (source?.type === 'Identifier') {
    const binding = path.scope.getBinding(source.name)?.path;
    if (binding?.node.init?.type === 'CallExpression') {
      return ['msg', 'bindMessage'].includes(
        apiName(binding, binding.node.init.callee)
      );
    }
  }
  return false;
}

export function extractMessages(code, { file = '<source>' } = {}) {
  const ast = parse(code, {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'typescript'],
    sourceFilename: file,
  });
  const messages = [];
  const diagnostics = [];

  function add(path, source, options = {}) {
    try {
      if (typeof source !== 'string') {
        throw new Error(
          'Message source must be static; use msg for deferred messages'
        );
      }
      messages.push({
        id: options.id || source,
        source,
        ...options,
        variables: messageVariables(source),
        file,
        line: path.node.loc.start.line,
        column: path.node.loc.start.column + 1,
      });
    } catch (error) {
      diagnostics.push({
        file,
        line: path.node.loc.start.line,
        message: error.message,
      });
    }
  }

  function safely(path, callback) {
    try {
      callback();
    } catch (error) {
      diagnostics.push({
        file,
        line: path.node.loc.start.line,
        message: error.message,
      });
    }
  }

  traverse(ast, {
    CallExpression(path) {
      const name = apiName(path, path.node.callee);
      if (
        [
          'defineDictionary',
          'createDictionaryTranslator',
          'createTranslator',
          'createRequestTranslator',
        ].includes(name)
      ) {
        safely(path, () =>
          dictionaryEntries(path, apiName).forEach(({ id, source }) =>
            add(path, source, { id })
          )
        );
        return;
      }
      if (!['msg', 'bindMessage', 'gt', 'm', 'tx'].includes(name)) {
        return;
      }
      safely(path, () => {
        const [source, options] = path.node.arguments;
        // Descriptor declarations are extracted at msg(), not their uses.
        if (name !== 'msg' && usesDescriptor(path, source)) {
          return;
        }
        const metadata = staticOptions(
          name === 'msg' ? options : path.node.arguments[2]
        );
        if (name === 'msg' && source?.type === 'ArrayExpression') {
          source.elements.forEach((entry, index) =>
            add(path, literal(entry), {
              ...metadata,
              ...(metadata.id && { id: `${metadata.id}.${index}` }),
            })
          );
        } else {
          const text = literal(source);
          const variants =
            typeof text === 'string' && name !== 'msg'
              ? derivedCalls(path, text, (node) => apiName(path, node))
              : [text];
          if (variants.some((variant) => variant !== text) && metadata.id) {
            throw new Error(
              'Derived messages use source identities; omit an explicit id'
            );
          }
          variants.forEach((variant) => add(path, variant, metadata));
        }
      });
    },
    TaggedTemplateExpression(path) {
      if (!['gt', 'm'].includes(apiName(path, path.node.tag))) {
        return;
      }
      safely(path, () =>
        derivedTemplates(path, (node) => apiName(path, node)).forEach(
          (source) => add(path, source)
        )
      );
    },
    JSXElement(path) {
      if (apiName(path, path.node.openingElement.name) !== 'T') {
        return;
      }
      safely(path, () => {
        const attributes = jsxAttributes(path.node);
        const id = literal(attributes.id);
        if (attributes.id && typeof id !== 'string') {
          throw new Error('T id must be static');
        }
        const { sources, derived } = attributes.source
          ? { sources: [literal(attributes.source)], derived: false }
          : derivedJSX(path, (name) => apiName(path, name));
        if (derived && id) {
          throw new Error(
            'Derived messages use source identities; omit an explicit id'
          );
        }
        sources.forEach((source) =>
          add(path, source, {
            ...(id && { id }),
            ...(literal(attributes.description) && {
              description: literal(attributes.description),
            }),
          })
        );
      });
    },
  });
  return { version: 1, messages, diagnostics };
}
