import {
  collectHashNodes,
  collectRecordedText,
  overlayFromDict,
  stringOverlay,
} from 'gt-rrweb/harvest';
import { createReplayLoader, replayLimit } from './catalog.js';

export { toReplayCatalog, createReplayLoader } from './catalog.js';

function validateRecording(events, options) {
  const maxEvents = replayLimit(options, 'maxEvents', 30000, 100000);
  const maxNodes = replayLimit(options, 'maxNodes', 100000, 200000);
  const maxDepth = replayLimit(options, 'maxDepth', 100, 200);
  const maxTextBytes = replayLimit(options, 'maxTextBytes', 10485760, 52428800);
  if (!Array.isArray(events) || events.length > maxEvents) {
    throw new RangeError(
      'Replay recording exceeds maxEvents or is not an events array'
    );
  }
  const encoder = new TextEncoder();
  const active = new WeakSet();
  let nodes = 0;
  let bytes = 0;
  const stack = events.map((value) => ({ value, depth: 1 }));
  while (stack.length) {
    const { value, depth, exit } = stack.pop();
    if (exit) {
      active.delete(value);
      continue;
    }
    if (typeof value === 'string') {
      bytes += encoder.encode(value).length;
      if (bytes > maxTextBytes) {
        throw new RangeError('Replay exceeds maxTextBytes');
      }
    } else if (value && typeof value === 'object') {
      if (active.has(value)) {
        throw new TypeError('Replay recording contains a cycle');
      }
      if (++nodes > maxNodes) {
        throw new RangeError('Replay exceeds maxNodes');
      }
      if (depth > maxDepth) {
        throw new RangeError('Replay exceeds maxDepth');
      }
      active.add(value);
      stack.push({ value, exit: true });
      for (const child of Object.values(value)) {
        stack.push({ value: child, depth: depth + 1 });
      }
    }
  }
}

/** Harvest text without rerendering the app or changing recorded variables/events. */
export async function harvestReplay(events, locales, options = {}) {
  validateRecording(events, options);
  if (
    !Array.isArray(locales) ||
    locales.length > 200 ||
    locales.some((locale) => typeof locale !== 'string' || !locale)
  ) {
    throw new TypeError(
      'Replay locales must be an array of at most 200 locale names'
    );
  }
  if (options.sourceLocale && options.sourceLocale !== locales[0]) {
    throw new RangeError('Replay locales must list sourceLocale first');
  }
  const overlay = Object.create(null);
  if (!options.loadCatalog) {
    return overlay;
  }
  const source = options.sourceLocale || locales[0];
  const loader = createReplayLoader(options.loadCatalog, options);
  const marked = collectHashNodes(events);
  const recorded = collectRecordedText(events);
  // Cover variables and unchanged leaves too. The upstream bare-text fallback
  // otherwise treats a variable's value as a separate source message.
  const covered = new Set(
    marked.flatMap((node) => node.textNodes.map((text) => text.id))
  );
  for (const locale of new Set(locales)) {
    if (locale === source) {
      continue;
    }
    let dict;
    try {
      dict = await loader(locale);
    } catch (error) {
      options.onError?.(error, locale);
      overlay[locale] = {};
      continue;
    }
    overlay[locale] = {
      ...overlayFromDict(marked, dict),
      ...stringOverlay(recorded, covered, dict, (text) => text),
    };
  }
  return overlay;
}
