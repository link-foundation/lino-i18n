'use client';

import { createElement, useCallback } from 'react';
import { GTRecorder, GT_EVENT } from 'gt-rrweb';
import { parse } from '@formatjs/icu-messageformat-parser';
import { T as SourceT } from '../react.js';
import { prepareContent } from '../react-content.js';
import { harvestReplay } from './harvest.js';

export {
  GTRecorder,
  RecordingOverlay,
  useRecorder,
  GT_EVENT,
  DEFAULT_CONTENT_SELECTOR,
} from 'gt-rrweb';
export {
  Branch,
  Currency,
  CurrencyFormat,
  DateTime,
  DateTimeFormat,
  Derive,
  I18nProvider,
  ListFormat,
  LocaleSelector,
  Num,
  NumberFormat,
  Plural,
  RegionSelector,
  RelativeDate,
  RelativeTime,
  RelativeTimeFormat,
  Static,
  Trans,
  Var,
  useDefaultLocale,
  useEnabled,
  useFormatLocale,
  useGT,
  useI18n,
  useLocale,
  useLocaleDirection,
  useLocaleProperties,
  useLocales,
  useMessages,
  useRegion,
  useSetEnabled,
  useSetLocale,
  useSetRegion,
  useTranslation,
  useTranslations,
} from '../react.js';
export { harvestReplay } from './harvest.js';
export { toReplayCatalog, createReplayLoader } from './catalog.js';

/** Source T with an interoperable marker for the published rrweb harvester. */
export function T(props) {
  const prepared =
    props.source === undefined
      ? prepareContent(props.children)
      : { source: props.source, values: {} };
  if (prepared.derived && props.id) {
    throw new Error(
      'Derived messages use source identities; omit an explicit id'
    );
  }
  const source = prepared.source;
  const values = { ...prepared.values, ...props.values };
  const stack = [...parse(source)];
  const variables = new Set();
  const formatted = new Set();
  while (stack.length) {
    const node = stack.pop();
    if (node.type === 1) {
      variables.add(node.value);
    }
    if ([2, 3, 4, 5, 6].includes(node.type)) {
      formatted.add(node.value);
    }
    stack.push(...(node.children || []));
    for (const option of Object.values(node.options || {})) {
      stack.push(...option.value);
    }
  }
  for (const name of variables) {
    if (!Object.hasOwn(values, name) || formatted.has(name)) {
      continue;
    }
    values[name] = createElement(
      'span',
      { key: name, style: { display: 'contents' }, 'data-lino-var': name },
      values[name]
    );
  }
  return createElement(
    'span',
    { style: { display: 'contents' }, 'data-_gt-hash': props.id || source },
    createElement(SourceT, { ...props, source, values })
  );
}

/** Actual GT recorder, followed by bounded .lino harvesting with protected variables. */
export function Recorder({
  catalogs = {},
  onComplete,
  onError = console.error,
  ...props
}) {
  const complete = useCallback(
    async (bundle) => {
      try {
        const overlay = await harvestReplay(
          bundle.events,
          bundle.locales,
          catalogs
        );
        const events = bundle.events.map((event) =>
          event.type === 5 && event.data.tag === GT_EVENT.i18n
            ? { ...event, data: { ...event.data, payload: overlay } }
            : event
        );
        onComplete?.({ ...bundle, events, overlay });
      } catch (error) {
        onError(error);
      }
    },
    [catalogs, onComplete, onError]
  );
  return createElement(GTRecorder, {
    ...props,
    harvest: {},
    onComplete: complete,
  });
}
