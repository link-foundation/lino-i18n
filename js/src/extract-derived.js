import { combine, staticValues } from './static-values.js';
import { escapeMessageText } from './message-schema.js';
import { literal, extractJSX } from './extract-jsx.js';

export function derivedTemplates(path, resolveApi) {
  const { quasis, expressions } = path.node.quasi;
  let messages = [escapeMessageText(quasis[0].value.cooked)];
  expressions.forEach((expression, index) => {
    const choices =
      expression.type === 'CallExpression' &&
      resolveApi(expression.callee) === 'derive'
        ? staticValues(path, expression.arguments[0]).map(escapeMessageText)
        : [`{v${index}}`];
    messages = combine(messages, choices);
    messages = messages.map(
      (message) => message + escapeMessageText(quasis[index + 1].value.cooked)
    );
  });
  return messages;
}

export function derivedCalls(path, source, resolveApi) {
  let messages = [source];
  const values = path.node.arguments[1];
  if (values?.type !== 'ObjectExpression') {
    return messages;
  }
  for (const property of values.properties) {
    const value = property.value;
    if (
      value?.type !== 'CallExpression' ||
      resolveApi(value.callee) !== 'derive'
    ) {
      continue;
    }
    const name = property.key.name ?? literal(property.key);
    if (property.computed || !source.includes(`{${name}}`)) {
      throw new Error('Derived values require a simple named {placeholder}');
    }
    const choices = staticValues(path, value.arguments[0]);
    messages = combine(messages, choices, (message, choice) =>
      message.replaceAll(`{${name}}`, escapeMessageText(choice))
    );
  }
  return messages;
}

export function derivedJSX(path, resolveApi, options) {
  const choices = [];
  const source = extractJSX(
    path.node,
    resolveApi,
    (element) => {
      const children = element.children.filter(
        (child) => child.type !== 'JSXText' || child.value.trim()
      );
      if (
        children.length !== 1 ||
        children[0].type !== 'JSXExpressionContainer'
      ) {
        throw new Error(
          'Derive requires a single statically derivable expression'
        );
      }
      const token = `\uE002derived${choices.length}\uE003`;
      choices.push({
        token,
        values: staticValues(path, children[0].expression),
      });
      return token;
    },
    options
  );
  const sources = choices.reduce(
    (messages, { token, values }) =>
      combine(messages, values, (message, value) =>
        message.replace(
          token,
          typeof value === 'boolean' ? '' : escapeMessageText(value)
        )
      ),
    [source]
  );
  return { sources, derived: choices.length > 0 };
}
