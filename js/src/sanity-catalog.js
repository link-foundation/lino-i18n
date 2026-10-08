import {
  BaseDocumentSerializer,
  BaseDocumentDeserializer,
  BaseDocumentMerger,
  defaultStopTypes,
} from 'gt-sanity';
import { formatLinoCatalog, parseLinoCatalogs } from './catalogs.js';

const reserved = new Set(['__proto__', 'prototype', 'constructor']);
const maxArrayItems = 1000;

function limits(options) {
  const bounds = {
    maxBytes: [1024 * 1024, 10 * 1024 * 1024],
    maxNodes: [10000, 100000],
    maxDepth: [100, 200],
  };
  return Object.fromEntries(
    Object.entries(bounds).map(([name, [fallback, maximum]]) => {
      const value = options[name] ?? fallback;
      if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
        throw new RangeError(`${name} must be between 1 and ${maximum}`);
      }
      return [name, value];
    })
  );
}

function bytes(text, budget) {
  if (
    typeof text !== 'string' ||
    text.length > budget.maxBytes ||
    new TextEncoder().encode(text).length > budget.maxBytes
  ) {
    throw new RangeError(
      `Sanity data exceeds ${budget.maxBytes} bytes or is not a string`
    );
  }
}

function primitiveBytes(value, budget) {
  if (
    !['string', 'number', 'boolean', 'object'].includes(typeof value) ||
    (typeof value === 'number' && !Number.isFinite(value))
  ) {
    throw new TypeError('Sanity documents must contain JSON values');
  }
  if (typeof value !== 'string') {
    return 0;
  }
  bytes(value, budget);
  return new TextEncoder().encode(value).length;
}

function plainJSON(entry) {
  const prototype = Object.getPrototypeOf(entry);
  return (
    Array.isArray(entry) || prototype === Object.prototype || prototype === null
  );
}

function ownJSONValue(entry, key) {
  const descriptor = Object.getOwnPropertyDescriptor(entry, key);
  if (reserved.has(key) || descriptor.get || descriptor.set) {
    throw new TypeError('Sanity JSON contains reserved keys or accessors');
  }
  return descriptor.value;
}

function jsonCopy(value, budget) {
  const stack = [[value, 0]];
  const seen = new Set();
  let count = 0;
  let textBytes = 0;
  while (stack.length) {
    const [entry, depth] = stack.pop();
    if (++count > budget.maxNodes || depth > budget.maxDepth) {
      throw new RangeError('Sanity JSON exceeds node or depth budget');
    }
    if (!entry || typeof entry !== 'object') {
      textBytes += primitiveBytes(entry, budget);
      if (textBytes > budget.maxBytes) {
        throw new RangeError('Sanity JSON exceeds byte budget');
      }
      continue;
    }
    if (seen.has(entry)) {
      throw new TypeError('Sanity JSON contains a cycle or repeated reference');
    }
    seen.add(entry);
    if (!plainJSON(entry)) {
      throw new TypeError('Sanity documents must contain plain JSON objects');
    }
    if (Array.isArray(entry) && entry.length > maxArrayItems) {
      throw new RangeError(
        `Sanity arrays cannot exceed ${maxArrayItems} items`
      );
    }
    const keys = Object.keys(entry);
    if (keys.length + stack.length + count > budget.maxNodes) {
      throw new RangeError('Sanity JSON exceeds node budget');
    }
    for (const key of keys) {
      stack.push([ownJSONValue(entry, key), depth + 1]);
    }
  }
  const text = JSON.stringify(value);
  bytes(text, budget);
  return JSON.parse(text);
}

function locale(value) {
  if (
    typeof value !== 'string' ||
    !/^[A-Za-z][A-Za-z0-9_-]{0,99}$/.test(value) ||
    reserved.has(value)
  ) {
    throw new TypeError('A safe non-empty Sanity locale is required');
  }
  return value;
}

export function sanityDocumentKey(document) {
  for (const field of ['_id', '_rev', '_type']) {
    if (
      typeof document?.[field] !== 'string' ||
      !document[field] ||
      document[field].length > 512
    ) {
      throw new TypeError(`A Sanity document requires a non-empty ${field}`);
    }
  }
  return `sanity:${JSON.stringify([document._id, document._rev])}`;
}

function mode(options) {
  const value = options.mode ?? 'document';
  if (!['document', 'field'].includes(value)) {
    throw new TypeError('Catalog serialization mode must be document or field');
  }
  return value;
}

function htmlFor(document, schema, options, budget) {
  if (
    typeof globalThis.document === 'undefined' ||
    typeof globalThis.DOMParser === 'undefined'
  ) {
    throw new Error('Sanity serialization requires a DOM environment');
  }
  sanityDocumentKey(document);
  if (!schema?.get?.(document._type)) {
    throw new Error('The document type is missing from the Sanity schema');
  }
  const serializer = BaseDocumentSerializer(schema);
  const stopTypes = [
    ...defaultStopTypes,
    ...(options.additionalStopTypes || []),
  ];
  const input = jsonCopy(document, budget);
  const { content } = serializer.serializeDocument(
    input,
    mode(options),
    locale(options.sourceLocale),
    stopTypes,
    options.serializers
  );
  bytes(content, budget);
  return content;
}

export function exportSanityDocument(document, schema, options) {
  const budget = limits(options);
  const content = htmlFor(document, schema, options, budget);
  const catalog = formatLinoCatalog(
    locale(options.sourceLocale),
    { [sanityDocumentKey(document)]: content },
    { style: 'flat' }
  );
  bytes(catalog, budget);
  return catalog;
}

function htmlTree(html, budget) {
  const tree = new globalThis.DOMParser().parseFromString(html, 'text/html');
  const stack = [[tree, 0]];
  let count = 0;
  while (stack.length) {
    const [node, depth] = stack.pop();
    if (++count > budget.maxNodes || depth > budget.maxDepth) {
      throw new RangeError('Sanity HTML exceeds node or depth budget');
    }
    for (const child of node.childNodes) {
      stack.push([child, depth + 1]);
    }
  }
  return tree;
}

function validateStructure(source, translated, budget) {
  const stack = [[htmlTree(source, budget), htmlTree(translated, budget)]];
  while (stack.length) {
    const [left, right] = stack.pop();
    if (
      left.nodeType !== right.nodeType ||
      left.nodeName !== right.nodeName ||
      left.childNodes.length !== right.childNodes.length
    ) {
      throw new Error('Translated Sanity HTML must preserve source structure');
    }
    if (left.nodeType === 3) {
      continue;
    }
    if (
      left.nodeValue !== right.nodeValue ||
      left.attributes?.length !== right.attributes?.length
    ) {
      throw new Error(
        'Translated Sanity HTML must preserve metadata and attributes'
      );
    }
    for (const attribute of left.attributes || []) {
      if (right.getAttribute(attribute.name) !== attribute.value) {
        throw new Error(
          'Translated Sanity HTML must preserve metadata and attributes'
        );
      }
    }
    left.childNodes.forEach((child, index) =>
      stack.push([child, right.childNodes[index]])
    );
  }
}

function restoreBlockChildren(translated, source) {
  const children = source.children;
  if (
    !Array.isArray(children) ||
    children.length !== translated.children.length
  ) {
    throw new Error(
      'Portable Text span structure changed during deserialization'
    );
  }
  translated.children.forEach((child, index) => {
    const original = children[index];
    if (
      child._type !== original._type ||
      JSON.stringify(child.marks) !== JSON.stringify(original.marks)
    ) {
      throw new Error(
        'Portable Text span marks changed during deserialization'
      );
    }
    child._key = original._key;
  });
}

function preserveSpanKeys(translated, source) {
  if (
    !translated ||
    typeof translated !== 'object' ||
    !source ||
    typeof source !== 'object'
  ) {
    return;
  }
  if (Array.isArray(translated)) {
    if (!Array.isArray(source)) {
      throw new Error(
        'Portable Text array structure changed during deserialization'
      );
    }
    const originals = new Map(
      source.filter((item) => item?._key).map((item) => [item._key, item])
    );
    for (const entry of translated) {
      const original = originals.get(entry?._key);
      if (original) {
        preserveSpanKeys(entry, original);
      }
    }
    return;
  }
  if (translated._type === 'block' && Array.isArray(translated.children)) {
    restoreBlockChildren(translated, source);
  }
  for (const [name, value] of Object.entries(translated)) {
    if (name !== 'children' || translated._type !== 'block') {
      preserveSpanKeys(value, source[name]);
    }
  }
}

function validateTargetArrays(translated, target) {
  const stack = [[translated, target]];
  while (stack.length) {
    const [value, current] = stack.pop();
    if (!value || typeof value !== 'object') {
      continue;
    }
    if (Array.isArray(value)) {
      if (value.every((item) => typeof item === 'string')) {
        continue;
      }
      const entries = new Map(
        (Array.isArray(current) ? current : []).map((item) => [
          item?._key,
          item,
        ])
      );
      for (const item of value) {
        if (!item?._key || !entries.has(item._key)) {
          throw new Error(
            'The target document array must retain every translated source key'
          );
        }
        stack.push([item, entries.get(item._key)]);
      }
      continue;
    }
    for (const [name, entry] of Object.entries(value)) {
      stack.push([entry, current?.[name]]);
    }
  }
}

export function prepareSanityImport(source, target, schema, catalog, options) {
  const budget = limits(options);
  const sourceCopy = jsonCopy(source, budget);
  const targetCopy = jsonCopy(target, budget);
  const key = sanityDocumentKey(sourceCopy);
  sanityDocumentKey(targetCopy);
  const targetLocale = locale(options.locale);
  if (targetLocale === locale(options.sourceLocale)) {
    throw new Error('The target locale must differ from the source locale');
  }
  const translationMode = mode(options);
  if (targetCopy._type !== sourceCopy._type) {
    throw new Error('Source and target Sanity schema types must match');
  }
  if (translationMode === 'document' && sourceCopy._id === targetCopy._id) {
    throw new Error(
      'Document localization requires a target distinct from the source document'
    );
  }
  if (
    translationMode === 'field' &&
    (sourceCopy._id !== targetCopy._id || sourceCopy._rev !== targetCopy._rev)
  ) {
    throw new Error(
      'Field localization requires the same current document revision'
    );
  }
  bytes(catalog, budget);
  const catalogs = parseLinoCatalogs(catalog).filter(
    (entry) => entry.locale === targetLocale
  );
  if (catalogs.length !== 1) {
    throw new Error('Exactly one target locale catalog is required');
  }
  const html = catalogs[0].translations[key];
  if (typeof html !== 'string') {
    throw new Error('Translation is missing for this source document revision');
  }
  bytes(html, budget);
  const original = htmlFor(sourceCopy, schema, options, budget);
  validateStructure(original, html, budget);
  const translated = jsonCopy(
    BaseDocumentDeserializer.deserializeDocument(
      html,
      options.deserializers,
      options.blockDeserializers
    ),
    budget
  );
  preserveSpanKeys(translated, sourceCopy);
  if (translationMode === 'document') {
    validateTargetArrays(translated, targetCopy);
  }
  const merged =
    translationMode === 'field'
      ? BaseDocumentMerger.fieldLevelMerge(
          translated,
          sourceCopy,
          targetLocale,
          options.sourceLocale
        )
      : BaseDocumentMerger.documentLevelMerge(translated, targetCopy);
  const set = Object.fromEntries(
    Object.entries(merged).filter(
      ([name, value]) =>
        !name.startsWith('_') &&
        JSON.stringify(value) !== JSON.stringify(targetCopy[name])
    )
  );
  jsonCopy(set, budget);
  return { documentId: targetCopy._id, revision: targetCopy._rev, set };
}

export async function commitSanityImport(client, plan) {
  if (
    !plan?.documentId ||
    !plan.revision ||
    !plan.set ||
    Object.keys(plan.set).length === 0
  ) {
    throw new TypeError(
      'A non-empty revision-bound Sanity import plan is required'
    );
  }
  return await client
    .patch(plan.documentId)
    .ifRevisionId(plan.revision)
    .set(plan.set)
    .commit();
}
