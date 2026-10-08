// Finite static derivation. Never executes application code during extraction.
import { literal } from './extract-jsx.js';

export function combine(left, right, join = (a, b) => a + b) {
  if (left.length * right.length > 100) {
    throw new Error('Derivation exceeds 100 message variants; use ICU Branch');
  }
  return [...new Set(left.flatMap((a) => right.map((b) => join(a, b))))];
}

function returns(node) {
  if (!node || typeof node !== 'object') {
    return [];
  }
  if (node.type === 'ReturnStatement') {
    return [node.argument];
  }
  if (/^(?:Function|ArrowFunction)/.test(node.type)) {
    return [];
  }
  return Object.values(node).flatMap((value) =>
    Array.isArray(value) ? value.flatMap(returns) : returns(value)
  );
}

function declaration(path, node) {
  if (node?.type !== 'Identifier') {
    throw new Error('Derivation requires a local static declaration');
  }
  const binding = path.scope.getBinding(node.name);
  if (!binding?.constant) {
    throw new Error(`Cannot statically derive ${node.name}`);
  }
  return binding.path.isVariableDeclarator()
    ? binding.path.get('init')
    : binding.path;
}

function propertyValues(path, node, depth) {
  const object =
    node.object.type === 'Identifier'
      ? declaration(path, node.object).node
      : node.object;
  if (object.type !== 'ObjectExpression') {
    throw new Error('Derivation supports local literal dictionaries');
  }
  const key = node.computed ? literal(node.property) : node.property.name;
  const properties = object.properties.filter(
    (property) =>
      key === undefined || (property.key?.name ?? property.key?.value) === key
  );
  if (
    !properties.length ||
    properties.some(
      (property) => property.type !== 'ObjectProperty' || property.computed
    )
  ) {
    throw new Error('Derived dictionary keys must be static');
  }
  return properties.flatMap((property) =>
    staticValues(path, property.value, depth + 1)
  );
}

function functionValues(path, node, depth) {
  const functionPath = declaration(path, node.callee);
  const fn = functionPath.node;
  if (
    ![
      'FunctionDeclaration',
      'FunctionExpression',
      'ArrowFunctionExpression',
    ].includes(fn.type)
  ) {
    throw new Error(
      'Derivation supports local functions with static return values'
    );
  }
  const expressions =
    fn.body.type === 'BlockStatement' ? returns(fn.body) : [fn.body];
  if (!expressions.length) {
    throw new Error('Derived function has no static return values');
  }
  return expressions.flatMap((expression) =>
    staticValues(functionPath, expression, depth + 1)
  );
}

export function staticValues(path, node, depth = 0) {
  if (depth > 20) {
    throw new Error('Derivation exceeds 20 levels or contains a cycle');
  }
  const value = literal(node);
  if (value !== undefined) {
    return [value];
  }
  let result;
  switch (node?.type) {
    case 'ConditionalExpression':
      result = [
        ...staticValues(path, node.consequent, depth + 1),
        ...staticValues(path, node.alternate, depth + 1),
      ];
      break;
    case 'Identifier': {
      const declared = declaration(path, node);
      result = staticValues(declared, declared.node, depth + 1);
      break;
    }
    case 'MemberExpression':
      result = propertyValues(path, node, depth);
      break;
    case 'CallExpression':
      result = functionValues(path, node, depth);
      break;
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
      result = staticValues(path, node.expression, depth + 1);
      break;
    default:
      throw new Error(
        'Cannot statically derive this expression; use Var or ICU Branch'
      );
  }
  result = [...new Set(result)];
  if (result.length > 100) {
    throw new Error('Derivation exceeds 100 values; use ICU Branch');
  }
  return result;
}
