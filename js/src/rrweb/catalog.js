import { parse } from '@formatjs/icu-messageformat-parser';
import { parseLinoCatalogs } from '../catalogs.js';

const encoder = new TextEncoder();
export function replayLimit(options, name, fallback, ceiling) {
  const value = options[name] ?? fallback;
  if (!Number.isSafeInteger(value) || value < 1 || value > ceiling) {
    throw new RangeError(`${name} must be an integer from 1 to ${ceiling}`);
  }
  return value;
}

function readCatalog(input, locale, limits) {
  let table = input;
  if (typeof input === 'string') {
    if (encoder.encode(input).length > limits.bytes) {
      throw new RangeError('Replay catalog exceeds maxCatalogBytes');
    }
    const catalogs = parseLinoCatalogs(input);
    const selected = locale
      ? catalogs.find((catalog) => catalog.locale === locale)
      : catalogs.length === 1 && catalogs[0];
    if (!selected) {
      throw new RangeError('Select an available replay catalog locale');
    }
    table = selected.translations;
  }
  if (!table || typeof table !== 'object' || Array.isArray(table)) {
    throw new TypeError(
      'Replay catalog must be .lino text or a flat string table'
    );
  }
  const entries = Object.entries(table);
  if (entries.length > limits.entries) {
    throw new RangeError('Replay catalog exceeds maxEntries');
  }
  let bytes = 0;
  for (const [key, value] of entries) {
    if (typeof value !== 'string') {
      throw new TypeError(`Replay catalog message ${key} must be text`);
    }
    bytes += encoder.encode(key).length + encoder.encode(value).length;
    if (bytes > limits.bytes) {
      throw new RangeError('Replay catalog exceeds maxCatalogBytes');
    }
  }
  return Object.fromEntries(entries);
}

function boundedAst(message, limits) {
  if (encoder.encode(message).length > limits.messageBytes) {
    throw new RangeError('Replay ICU message exceeds maxMessageBytes');
  }
  // Bound nesting before entering the recursive ICU parser. Counting quoted braces
  // too is conservative: an unusually deep literal can be split into messages.
  let depth = 0;
  for (const char of message) {
    if (char === '{' && ++depth > limits.depth) {
      throw new RangeError('Replay ICU message exceeds maxDepth');
    }
    if (char === '}') {
      depth = Math.max(0, depth - 1);
    }
  }
  depth = 0;
  for (const [tag] of message.matchAll(/<\/?[A-Za-z][^<>]*>/g)) {
    depth = tag.startsWith('</') ? Math.max(0, depth - 1) : depth + 1;
    if (depth > limits.depth) {
      throw new RangeError('Replay ICU tags exceed maxDepth');
    }
  }
  let ast;
  try {
    ast = parse(message);
  } catch (error) {
    throw new SyntaxError(`Invalid replay ICU message: ${error.message}`, {
      cause: error,
    });
  }
  return ast;
}

function readMessage(message, limits) {
  const ast = boundedAst(message, limits);
  const leaves = [];
  const signature = [];
  const stack = ast.map((node) => ({ node, depth: 1 })).reverse();
  let count = 0;
  let rich = false;
  while (stack.length) {
    const { node, depth } = stack.pop();
    if (++count > limits.nodes || depth > limits.depth) {
      throw new RangeError('Replay ICU message exceeds AST node/depth limits');
    }
    if (node.type === 5 || node.type === 6) {
      return null;
    }
    if (node.type === 8) {
      rich = true;
      stack.push(
        ...node.children
          .map((child) => ({ node: child, depth: depth + 1 }))
          .reverse()
      );
    } else if (node.type === 0) {
      if (node.value) {
        leaves.push(node.value);
        signature.push('text');
      }
    } else {
      leaves.push({ k: node.value || '#' });
      signature.push(`variable:${node.value || '#'}:${node.type}`);
    }
  }
  return { leaves, signature, rich };
}

/** Convert ICU catalogs into the published GT replay harvester's text-leaf format. */
export function toReplayCatalog(input, options = {}) {
  const limits = {
    bytes: replayLimit(options, 'maxCatalogBytes', 10485760, 52428800),
    messageBytes: replayLimit(options, 'maxMessageBytes', 65536, 262144),
    entries: replayLimit(options, 'maxEntries', 10000, 100000),
    nodes: replayLimit(options, 'maxAstNodes', 10000, 50000),
    depth: replayLimit(options, 'maxDepth', 100, 200),
  };
  const table = readCatalog(input, options.locale, limits);
  const sources =
    options.sources === undefined
      ? Object.create(null)
      : readCatalog(options.sources, options.sourceLocale, limits);
  const result = Object.create(null);
  for (const [id, message] of Object.entries(table)) {
    const target = readMessage(message, limits);
    const source = readMessage(
      Object.hasOwn(sources, id) ? sources[id] : id,
      limits
    );
    const compatible =
      target &&
      source &&
      target.signature.join('\0') === source.signature.join('\0');
    result[id] = !compatible
      ? null
      : !target.rich && target.leaves.every((leaf) => typeof leaf === 'string')
        ? target.leaves.join('')
        : target.leaves;
  }
  return result;
}

export function createReplayLoader(loadCatalog, options = {}) {
  if (typeof loadCatalog !== 'function') {
    throw new TypeError('createReplayLoader requires a catalog loader');
  }
  return async (locale) =>
    toReplayCatalog(await loadCatalog(locale), { ...options, locale });
}
