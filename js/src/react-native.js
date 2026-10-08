'use client';

import { createElement } from 'react';
import * as react from './react.js';
import { createTranslator } from './messages.js';
import { createContentRenderer } from './react-content.js';
import { renderContent } from './content.js';
import { createNativeState } from './native-state.js';

export {
  Var,
  Static,
  Derive,
  Branch,
  Plural,
  useGT,
  useMessages,
  useTranslations,
  useTranslation,
  useI18n,
  useLocale,
  useLocales,
  useSetLocale,
  useDefaultLocale,
  useLocaleDirection,
  useLocaleProperties,
  useRegion,
  useSetRegion,
  useEnabled,
  useSetEnabled,
  useFormatLocale,
} from './react.js';

export function createNativeI18n({
  Text,
  richComponents = [],
  storage,
  storageKey = 'lino-locale',
  i18n: provided,
  sourceLocale: configuredSource,
  ...options
}) {
  if (!Text || typeof Text === 'string' || !Array.isArray(richComponents)) {
    throw new TypeError(
      'Native i18n requires a code-owned Text component and rich component array'
    );
  }
  if (
    storage &&
    (typeof storage.getItem !== 'function' ||
      typeof storage.setItem !== 'function')
  ) {
    throw new TypeError('Native storage requires getItem and setItem');
  }
  const sourceLocale =
    configuredSource || provided?.snapshot().sourceLocale || 'en';
  const raw = provided || createTranslator({ ...options, sourceLocale });
  const state = createNativeState(raw, { sourceLocale, storage, storageKey });
  const prepare = createContentRenderer([Text, ...richComponents]);

  function Provider({ children }) {
    return createElement(react.I18nProvider, { i18n: state.i18n }, children);
  }
  function T({ textProps, ...props }) {
    const output = renderContent(react.useI18n(), props, prepare);
    return createElement(Text, textProps, output);
  }
  function nativeFormat(Component) {
    return function NativeFormat({ textProps, ...props }) {
      return createElement(Text, textProps, createElement(Component, props));
    };
  }
  function useLocaleSelector(locales) {
    const i18n = react.useI18n();
    return {
      locale: i18n.getLocale(),
      locales: locales || i18n.listLocales(),
      setLocale: i18n.switchLocale,
      direction: react.useLocaleDirection(),
    };
  }
  function useRegionSelector(regions = []) {
    const i18n = react.useI18n();
    return {
      region: i18n.getRegion(),
      regions,
      setRegion: i18n.setRegion,
      locale: i18n.getLocale(),
      setLocale: i18n.switchLocale,
    };
  }
  return {
    ...state,
    Provider,
    T,
    useLocaleSelector,
    useRegionSelector,
    Var: react.Var,
    Static: react.Static,
    Derive: react.Derive,
    Branch: react.Branch,
    Plural: react.Plural,
    Num: nativeFormat(react.Num),
    Currency: nativeFormat(react.Currency),
    DateTime: nativeFormat(react.DateTime),
    RelativeTime: nativeFormat(react.RelativeTime),
    RelativeDate: nativeFormat(react.RelativeDate),
    List: nativeFormat(react.ListFormat),
  };
}
