import React, { Children, createElement, isValidElement } from 'react';
import {
  prepareContent as prepare,
  renderContent as render,
  selectPlural,
} from './content.js';
export { selectPlural };
export function Var({ children, value }) {
  return children ?? value ?? null;
}
export function Static(props) {
  return createElement(Var, props);
}
export function Derive({ children }) {
  return children;
}
function describe(node) {
  if (typeof node === 'string' || typeof node === 'number') {
    return { kind: 'text', value: node };
  }
  if (!isValidElement(node)) {
    return undefined;
  }
  const { type, props } = node;
  if (type === React.Fragment || type === Derive) {
    return {
      kind: 'inline',
      children: props.children,
      derived: type === Derive,
    };
  }
  if (type === Var || type === Static) {
    return {
      kind: 'variable',
      name: props.name,
      value: props.children ?? props.value ?? '',
    };
  }
  if (type === Plural || type.contentMarker === Plural || type === Branch) {
    return { kind: 'branch', props, plural: type !== Branch };
  }
  return {
    kind: 'element',
    children: props.children,
    opaque: typeof type !== 'string' || props.children === undefined,
  };
}
export function prepareContent(children) {
  return prepare(children, {
    nodes: Children.toArray,
    describe,
    clone: (node, chunks, key) => React.cloneElement(node, { key }, ...chunks),
  });
}
export function renderContent(i18n, props) {
  return render(i18n, props, prepareContent);
}
export function Plural(props) {
  return selectPlural(props.locale || 'en', props);
}
export function Branch({ value, cases }) {
  return cases?.[String(value)] ?? cases?.other ?? null;
}
