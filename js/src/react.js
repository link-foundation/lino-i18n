'use client';

import React, {
  createContext,
  createElement,
  useCallback,
  useContext,
  useSyncExternalStore,
} from 'react';
import {
  renderContent,
  Var,
  Static,
  Derive,
  Branch,
  Plural as PluralMarker,
  selectPlural,
} from './react-content.js';
import {
  getLocaleDirection,
  getLocaleProperties,
  formatList,
  formatRelativeTimeFromDate,
} from './intl.js';

export { Var, Static, Branch, Derive };

const I18nContext = createContext(null);

function useI18nContext() {
  const i18n = useContext(I18nContext);
  if (!i18n) {
    throw new Error(
      'lino-i18n React hooks must be used inside an I18nProvider'
    );
  }
  useSyncExternalStore(i18n.subscribe, i18n.getRevision, i18n.getRevision);
  return i18n;
}

export function I18nProvider({ i18n, children }) {
  if (!i18n?.t || !i18n?.subscribe) {
    throw new TypeError('I18nProvider requires a createI18n instance');
  }
  return createElement(I18nContext.Provider, { value: i18n }, children);
}

export function useI18n() {
  return useI18nContext();
}

export function useLocale() {
  return useI18nContext().getLocale();
}

export function useTranslation(keyPrefix = '') {
  const i18n = useI18nContext();
  const t = useCallback(
    (key, params, options) =>
      i18n.t(keyPrefix ? `${keyPrefix}.${key}` : key, params, options),
    [i18n, keyPrefix]
  );
  return { t, i18n, locale: i18n.getLocale() };
}

export function Trans({ id, values = {}, options, fallback }) {
  const i18n = useI18nContext();
  const entries = Object.entries(values);
  const markers = Object.fromEntries(
    entries.map(([key, value], index) => [
      key,
      React.isValidElement(value) ? `\uE000${index}\uE001` : value,
    ])
  );
  const translated = i18n.t(
    id,
    { ...markers, defaultValue: fallback },
    options
  );
  if (!entries.some(([, value]) => React.isValidElement(value))) {
    return translated;
  }
  const pattern = /(\uE000\d+\uE001)/g;
  return translated.split(pattern).map((part, index) => {
    const match = /^\uE000(\d+)\uE001$/.exec(part);
    return match
      ? React.cloneElement(entries[Number(match[1])][1], { key: index })
      : part;
  });
}

export function LocaleSelector({ locales, labels = {}, ...props }) {
  const i18n = useI18nContext();
  const available = locales || i18n.listLocales();
  return createElement(
    'select',
    {
      'aria-label': 'Language',
      ...props,
      value: i18n.getLocale(),
      onChange: (event) => {
        i18n.setLocale(event.target.value);
        props.onChange?.(event);
      },
    },
    available.map((locale) =>
      createElement(
        'option',
        { key: locale, value: locale },
        labels[locale] || locale
      )
    )
  );
}

function Format({ value, children, formatter, options, locale }) {
  const activeLocale = useFormatLocale(locale);
  return new Intl[formatter](activeLocale, options).format(children ?? value);
}

export function NumberFormat(props) {
  return createElement(Format, { ...props, formatter: 'NumberFormat' });
}

export function DateTimeFormat(props) {
  return createElement(Format, { ...props, formatter: 'DateTimeFormat' });
}

export function RelativeTimeFormat({ value, children, unit, options, locale }) {
  const activeLocale = useFormatLocale(locale);
  return new Intl.RelativeTimeFormat(activeLocale, options).format(
    children ?? value,
    unit
  );
}

export function RelativeDate({ value, children, now, locale, options }) {
  const activeLocale = useFormatLocale(locale);
  if (now === undefined) {
    throw new TypeError('RelativeDate requires an explicit now');
  }
  return formatRelativeTimeFromDate(
    children ?? value,
    now,
    activeLocale,
    options
  );
}

export function CurrencyFormat({ currency, options, ...props }) {
  return createElement(NumberFormat, {
    ...props,
    options: { style: 'currency', currency, ...options },
  });
}

export function T(props) {
  return renderContent(useI18nContext(), props);
}

export function Plural(props) {
  return selectPlural(useFormatLocale(props.locale), props);
}
// Share the marker identity used by the serializer without invoking hooks there.
Plural.contentMarker = PluralMarker;

export function useGT() {
  const i18n = useI18nContext();
  if (!i18n.gt) {
    throw new Error('useGT requires a createTranslator instance');
  }
  return i18n.gt;
}

export function useMessages() {
  return useGT();
}

export function useTranslations(prefix = '') {
  const i18n = useI18nContext();
  return useCallback(
    (key, values, options) => {
      if (!i18n.dictionary) {
        throw new Error('useTranslations requires a createTranslator instance');
      }
      return i18n.dictionary(
        prefix ? `${prefix}.${key}` : key,
        values,
        options
      );
    },
    [i18n, prefix]
  );
}

export function useLocales() {
  return useI18nContext().listLocales();
}

export function useSetLocale() {
  const i18n = useI18nContext();
  return i18n.switchLocale || i18n.setLocale;
}

export function useLocaleDirection() {
  const i18n = useI18nContext();
  return (
    i18n.getLocaleConfig?.().getLocaleDirection(i18n.getLocale()) ||
    getLocaleDirection(i18n.getLocale())
  );
}

export function useRegion() {
  return useI18nContext().getRegion?.();
}

export function useEnabled() {
  return useI18nContext().getEnabled?.() ?? true;
}

export function ListFormat({ values, options, locale }) {
  return formatList(values, useFormatLocale(locale), options);
}

export function useFormatLocale(locale) {
  const i18n = useI18nContext();
  if (locale) {
    return i18n.getLocaleConfig?.().resolveCanonicalLocale(locale) || locale;
  }
  return i18n.getFormatLocale?.() || i18n.getLocale();
}

export function useDefaultLocale() {
  return useI18nContext().getDefaultLocale?.() || 'en';
}

export function useLocaleProperties() {
  const i18n = useI18nContext();
  return (
    i18n.getLocaleConfig?.().getLocaleProperties(i18n.getLocale()) ||
    getLocaleProperties(i18n.getLocale())
  );
}

export function useSetRegion() {
  return useI18nContext().setRegion;
}

export function useSetEnabled() {
  return useI18nContext().setEnabled;
}

export function RegionSelector({ regions, labels = {}, ...props }) {
  const i18n = useI18nContext();
  if (!i18n.setRegion) {
    throw new Error('RegionSelector requires a createTranslator instance');
  }
  return createElement(
    'select',
    {
      'aria-label': 'Region',
      ...props,
      value: i18n.getRegion() || '',
      onChange: (event) => {
        i18n.setRegion(event.target.value);
        props.onChange?.(event);
      },
    },
    regions.map((region) =>
      createElement(
        'option',
        { key: region, value: region },
        labels[region] || region
      )
    )
  );
}

export {
  NumberFormat as Num,
  DateTimeFormat as DateTime,
  CurrencyFormat as Currency,
  RelativeTimeFormat as RelativeTime,
};
