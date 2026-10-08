import { formatMessage } from './messages.js';
import { escapeMessageText } from './message-schema.js';

export function pluralCases(props) {
  const cases = { ...props.cases };
  for (const name of ['zero', 'one', 'two', 'few', 'many', 'other']) {
    if (props[name] !== undefined) {
      cases[name === 'zero' ? '=0' : name] = props[name];
    }
  }
  return cases;
}

// The same structural message is used by T and the build-time extractor.
// Only code-owned elements can be restored. Translations never create props.
export function prepareContent(children, adapter) {
  const values = Object.create(null);
  let nodeId = 0;
  let branchId = 0;
  let renderedId = 0;
  let derived = false;

  function serializeInline(node) {
    derived ||= node.derived;
    return serialize(node.children);
  }

  function register(name, value) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      throw new Error(`Invalid variable name ${name}`);
    }
    if (Object.hasOwn(values, name) && values[name] !== value) {
      throw new Error(`Duplicate content variable ${name}`);
    }
    values[name] = value;
    return `{${name}}`;
  }

  function serializeBranch(element) {
    const plural = element.plural;
    const name = element.props.name || `n${branchId++}`;
    register(name, plural ? element.props.count : String(element.props.value));
    const cases = plural ? pluralCases(element.props) : element.props.cases;
    if (!cases || !Object.hasOwn(cases, 'other')) {
      throw new Error('Branch and Plural require an other case');
    }
    const kind = plural
      ? element.props.ordinal
        ? 'selectordinal'
        : 'plural'
      : 'select';
    const variants = Object.entries(cases)
      .map(([key, content]) => {
        if (!/^(?:[A-Za-z_][A-Za-z0-9_]*|=-?\d+(?:\.\d+)?)$/.test(key)) {
          throw new Error(`Invalid branch case ${key}`);
        }
        return `${key} {${serialize(content)}}`;
      })
      .join(' ');
    return `{${name}, ${kind}, ${variants}}`;
  }

  function serializeNode(original) {
    const node = adapter.describe(original);
    if (!node) {
      return '';
    }
    if (node.kind === 'text') {
      return escapeMessageText(node.value);
    }
    if (node.kind === 'inline') {
      return serializeInline(node);
    }
    if (node.kind === 'variable') {
      return register(node.name, node.value);
    }
    if (node.kind === 'branch') {
      return serializeBranch(node);
    }
    const name = `c${nodeId++}`;
    if (Object.hasOwn(values, name)) {
      throw new Error(`Reserved content variable ${name}`);
    }
    if (node.opaque) {
      values[name] = original;
      return `{${name}}`;
    }
    values[name] = (chunks) =>
      adapter.clone(original, chunks, `${name}-${renderedId++}`);
    return `<${name}>${serialize(node.children)}</${name}>`;
  }

  function serialize(nodes) {
    return adapter.nodes(nodes).map(serializeNode).join('');
  }
  const source = serialize(children);
  return { source, values, derived };
}

export function renderContent(
  i18n,
  { children, id, source, values = {}, locale },
  prepare
) {
  const prepared =
    source === undefined ? prepare(children) : { source, values: {} };
  if (prepared.derived && id) {
    throw new Error(
      'Derived messages use source identities; omit an explicit id'
    );
  }
  const key = id || prepared.source;
  const message =
    i18n.getEnabled?.() === false
      ? prepared.source
      : i18n.t(key, {}, { locale, defaultValue: prepared.source });
  return formatMessage(
    message,
    { ...prepared.values, ...values },
    i18n
      .getLocaleConfig?.()
      .resolveCanonicalLocale(locale || i18n.getLocale()) ||
      locale ||
      i18n.getLocale()
  );
}

export function selectPlural(locale, props) {
  const cases = pluralCases(props);
  const exact = `=${props.count}`;
  const category = new Intl.PluralRules(locale, {
    type: props.ordinal ? 'ordinal' : 'cardinal',
  }).select(props.count);
  return cases[exact] ?? cases[category] ?? cases.other ?? null;
}
