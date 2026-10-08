import { literal } from './extract-jsx.js';
import { staticDeclaration } from './extract-bindings.js';

function declaration(path, node) {
  const declared = staticDeclaration(path, node);
  return { path: declared, node: declared.node };
}

function untyped(node) {
  while (
    ['TSAsExpression', 'TSSatisfiesExpression', 'TSNonNullExpression'].includes(
      node?.type
    )
  ) {
    node = node.expression;
  }
  return node;
}

function alreadyDeclared(path, source, resolveName, depth = 0) {
  const node = untyped(source);
  if (depth > 20) {
    throw new Error('Dictionary depth/node limit exceeded');
  }
  if (node?.type === 'Identifier') {
    const declared = declaration(path, node);
    return alreadyDeclared(
      declared.path,
      declared.node,
      resolveName,
      depth + 1
    );
  }
  return (
    node?.type === 'CallExpression' &&
    resolveName(path, node.callee) === 'defineDictionary'
  );
}

function schemaArgument(path, resolveName) {
  const name = resolveName(path, path.node.callee);
  if (['defineDictionary', 'createDictionaryTranslator'].includes(name)) {
    const source = path.node.arguments[0];
    return name === 'defineDictionary' ||
      !alreadyDeclared(path, source, resolveName)
      ? source
      : undefined;
  }
  if (!['createTranslator', 'createRequestTranslator'].includes(name)) {
    return undefined;
  }
  const options = path.node.arguments[name === 'createTranslator' ? 0 : 1];
  const property =
    options?.type === 'ObjectExpression'
      ? options.properties.find(
          (entry) =>
            entry.type === 'ObjectProperty' &&
            !entry.computed &&
            (entry.key.name ?? entry.key.value) === 'dictionary'
        )
      : undefined;
  return property && !alreadyDeclared(path, property.value, resolveName)
    ? property.value
    : undefined;
}

function dictionaryKey(property) {
  const key = property.key?.name ?? property.key?.value;
  if (
    property.type !== 'ObjectProperty' ||
    property.computed ||
    key === undefined ||
    !String(key) ||
    String(key).includes('.') ||
    key === '__proto__'
  ) {
    throw new Error(
      'Dictionary keys must be static, non-empty and without dots or prototype setters'
    );
  }
  return String(key);
}

export function dictionaryEntries(path, resolveName) {
  const source = schemaArgument(path, resolveName);
  if (!source) {
    return [];
  }
  const result = [];
  let visited = 0;
  function visit(scope, sourceNode, keys, depth) {
    const node = untyped(sourceNode);
    if (++visited > 10000 || depth > 20) {
      throw new Error('Dictionary depth/node limit exceeded');
    }
    if (node?.type === 'Identifier') {
      const declared = declaration(scope, node);
      visit(declared.path, declared.node, keys, depth + 1);
    } else if (typeof literal(node) === 'string' && keys.length) {
      result.push({ id: keys.join('.'), source: literal(node) });
    } else if (node?.type === 'ObjectExpression') {
      for (const property of node.properties) {
        visit(
          scope,
          property.value,
          [...keys, dictionaryKey(property)],
          depth + 1
        );
      }
    } else if (node?.type === 'ArrayExpression') {
      node.elements.forEach((entry, index) =>
        visit(scope, entry, [...keys, String(index)], depth + 1)
      );
    } else {
      throw new Error(
        'Dictionary leaves must be static source strings; sparse arrays and spreads are unsupported'
      );
    }
  }
  visit(path, source, [], 0);
  return result;
}
