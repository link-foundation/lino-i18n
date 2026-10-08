import { escapeMessageText } from './message-schema.js';

export function literal(node) {
  if (
    node?.type === 'StringLiteral' ||
    node?.type === 'NumericLiteral' ||
    node?.type === 'BooleanLiteral'
  ) {
    return node.value;
  }
  if (node?.type === 'JSXExpressionContainer') {
    return literal(node.expression);
  }
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0].value.cooked;
  }
  return undefined;
}

export function jsxAttributes(node) {
  if (
    node.openingElement.attributes.some(
      (attribute) => attribute.type === 'JSXSpreadAttribute'
    )
  ) {
    throw new Error(
      'Translation elements require explicit attributes for extraction'
    );
  }
  return Object.fromEntries(
    node.openingElement.attributes
      .filter((attribute) => attribute.type === 'JSXAttribute')
      .map((attribute) => [attribute.name.name, attribute.value])
  );
}

function jsxText(value) {
  const lines = value.replaceAll('\t', ' ').split(/\r\n|\n|\r/);
  const nonEmpty = lines
    .map((line, index) => {
      if (index !== 0) {
        line = line.trimStart();
      }
      if (index !== lines.length - 1) {
        line = line.trimEnd();
      }
      return line;
    })
    .filter(Boolean);
  return nonEmpty.join(' ');
}

function opaqueElement(name, child, api) {
  return (
    (api !== 'NativeText' &&
      (name.type !== 'JSXIdentifier' || !/^[a-z]/.test(name.name))) ||
    child.children.every(
      (entry) =>
        (entry.type === 'JSXText' && !jsxText(entry.value)) ||
        (entry.type === 'JSXExpressionContainer' &&
          entry.expression.type === 'JSXEmptyExpression')
    )
  );
}

function validateNativeElement(child, api, native) {
  if (
    native &&
    api !== 'NativeText' &&
    child.children.some(
      (entry) => entry.type !== 'JSXText' || entry.value.trim()
    )
  ) {
    throw new Error(
      'Native rich JSX requires an imported Text; wrap opaque custom components in Var or provide an explicit source'
    );
  }
}

export function extractJSX(
  node,
  resolveName,
  resolveDerived,
  { native = false } = {}
) {
  let nodeId = 0;
  let branchId = 0;

  function serializeBranch(element, plural) {
    const attributes = jsxAttributes(element);
    const name = literal(attributes.name) ?? `n${branchId++}`;
    const cases = {};
    const caseExpression = attributes.cases?.expression;
    if (caseExpression?.type === 'ObjectExpression') {
      for (const property of caseExpression.properties) {
        if (property.type !== 'ObjectProperty' || property.computed) {
          throw new Error('Branch cases must have static keys');
        }
        cases[property.key.name ?? property.key.value] = property.value;
      }
    }
    for (const category of ['zero', 'one', 'two', 'few', 'many', 'other']) {
      if (Object.hasOwn(attributes, category)) {
        cases[category === 'zero' ? '=0' : category] = attributes[category];
      }
    }
    if (!Object.hasOwn(cases, 'other')) {
      throw new Error('Branch and Plural require a static other case');
    }
    const kind = branchKind(plural, attributes);
    const variants = Object.entries(cases)
      .map(([key, child]) => `${key} {${serializeNode(child)}}`)
      .join(' ');
    return `{${name}, ${kind}, ${variants}}`;
  }

  function serializeNode(child) {
    if (child.type === 'BooleanLiteral') {
      return '';
    }
    if (child.type === 'JSXText') {
      return escapeMessageText(jsxText(child.value));
    }
    if (child.type === 'JSXFragment') {
      return serialize(child.children);
    }
    if (child.type === 'JSXExpressionContainer') {
      if (child.expression.type === 'JSXEmptyExpression') {
        return '';
      }
      return serializeNode(child.expression);
    }
    if (literal(child) !== undefined) {
      return escapeMessageText(literal(child));
    }
    if (child.type !== 'JSXElement') {
      throw new Error('Wrap dynamic JSX content in <Var name="...">');
    }
    const name = child.openingElement.name;
    const api = resolveName(name);
    if (api === 'Derive') {
      return resolveDerived(child);
    }
    if (api === 'Var' || api === 'Static') {
      const variable = literal(jsxAttributes(child).name);
      if (!variable) {
        throw new Error('Var and Static require a static name');
      }
      return `{${variable}}`;
    }
    if (api === 'Plural' || api === 'Branch') {
      return serializeBranch(child, api === 'Plural');
    }
    const token = `c${nodeId++}`;
    validateNativeElement(child, api, native);
    if (opaqueElement(name, child, api)) {
      return `{${token}}`;
    }
    return `<${token}>${serialize(child.children)}</${token}>`;
  }

  function serialize(children) {
    return children.map(serializeNode).join('');
  }
  return serialize(node.children);
}

function branchKind(plural, attributes) {
  if (!plural) {
    return 'select';
  }
  return Object.hasOwn(attributes, 'ordinal') &&
    literal(attributes.ordinal) !== false
    ? 'selectordinal'
    : 'plural';
}
