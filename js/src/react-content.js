import React, { Children, createElement, isValidElement } from 'react';
import { formatMessage } from './messages.js';
import { escapeMessageText } from './message-schema.js';

export function Var({ children, value }) {
  return children ?? value ?? null;
}

export function Static(props) {
  return createElement(Var, props);
}

export function Derive({ children }) {
  return children;
}

function inlineContent(node) {
  return node.type === React.Fragment || node.type === Derive;
}

function pluralCases(props) {
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
export function prepareContent(children) {
  const values = Object.create(null);
  let nodeId = 0;
  let branchId = 0;
  let renderedId = 0;
  let derived = false;

  function serializeInline(node) {
    derived ||= node.type === Derive;
    return serialize(node.props.children);
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
    const plural =
      element.type === Plural || element.type.contentMarker === Plural;
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

  function serializeNode(node) {
    if (typeof node === 'string' || typeof node === 'number') {
      return escapeMessageText(node);
    }
    if (!isValidElement(node)) {
      return '';
    }
    if (inlineContent(node)) {
      return serializeInline(node);
    }
    if (node.type === Var || node.type === Static) {
      return register(
        node.props.name,
        node.props.children ?? node.props.value ?? ''
      );
    }
    if (
      node.type === Plural ||
      node.type.contentMarker === Plural ||
      node.type === Branch
    ) {
      return serializeBranch(node);
    }
    const name = `c${nodeId++}`;
    if (Object.hasOwn(values, name)) {
      throw new Error(`Reserved content variable ${name}`);
    }
    if (typeof node.type !== 'string' || node.props.children === undefined) {
      values[name] = node;
      return `{${name}}`;
    }
    values[name] = (chunks) =>
      React.cloneElement(node, { key: `${name}-${renderedId++}` }, ...chunks);
    return `<${name}>${serialize(node.props.children)}</${name}>`;
  }

  function serialize(nodes) {
    return Children.toArray(nodes).map(serializeNode).join('');
  }
  const source = serialize(children);
  return { source, values, derived };
}

export function renderContent(
  i18n,
  { children, id, source, values = {}, locale }
) {
  const prepared =
    source === undefined ? prepareContent(children) : { source, values: {} };
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
    locale || i18n.getLocale()
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

// The React adapter injects its locale through wrappers; these markers remain
// recognizable when nested inside T before React evaluates them.
export function Plural(props) {
  return selectPlural(props.locale || 'en', props);
}

export function Branch({ value, cases }) {
  return cases?.[String(value)] ?? cases?.other ?? null;
}
