import { Comment, Fragment, Text, cloneVNode, createVNode, isVNode } from 'vue';
import { prepareContent as prepare } from './content.js';

export function slotChildren(node) {
  return node.children?.default ? node.children.default() : node.children;
}

export function branchProps(props, slots, plural = false) {
  const cases = Object.assign(Object.create(null), props.cases);
  for (const [name, slot] of Object.entries(slots || {})) {
    if (typeof slot === 'function') {
      cases[
        name === 'default' ? 'other' : plural && name === 'zero' ? '=0' : name
      ] = slot();
    }
  }
  return {
    ...props,
    cases,
    ordinal: props.ordinal === '' || props.ordinal === true,
  };
}

function describe(node) {
  if (typeof node === 'string' || typeof node === 'number') {
    return { kind: 'text', value: node };
  }
  if (!isVNode(node) || node.type === Comment) {
    return undefined;
  }
  if (node.type === Text) {
    return { kind: 'text', value: node.children };
  }
  return describeElement(node);
}

function describeElement(node) {
  const marker = node.type.linoContentMarker;
  if (node.type === Fragment || marker === 'derive') {
    return {
      kind: 'inline',
      children: slotChildren(node),
      derived: marker === 'derive',
    };
  }
  if (marker === 'variable') {
    return {
      kind: 'variable',
      name: node.props?.name,
      value: slotChildren(node) ?? node.props?.value ?? '',
    };
  }
  if (marker === 'branch' || marker === 'plural') {
    return {
      kind: 'branch',
      props: branchProps(node.props || {}, node.children, marker === 'plural'),
      plural: marker === 'plural',
    };
  }
  return {
    kind: 'element',
    children: node.children,
    opaque: typeof node.type !== 'string' || node.children === null,
  };
}

function clone(node, chunks, key) {
  const copy = cloneVNode(node);
  // Vue normalizes replacement children by OR-ing the child shape flag.
  // Clear the original text/array/slot flags and cached compiled children first.
  copy.shapeFlag &= ~(8 | 16 | 32);
  copy.dynamicChildren = null;
  return createVNode(copy, { key }, chunks);
}

export function prepareVueContent(children) {
  return prepare(children, {
    nodes: (nodes) => (Array.isArray(nodes) ? nodes.flat(Infinity) : [nodes]),
    describe,
    clone,
  });
}
