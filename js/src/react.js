import React, {
  createContext,
  createElement,
  useCallback,
  useContext,
  useSyncExternalStore,
} from 'react';

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

function Format({ value, formatter, options }) {
  const locale = useLocale();
  return new Intl[formatter](locale, options).format(value);
}

export function NumberFormat(props) {
  return createElement(Format, { ...props, formatter: 'NumberFormat' });
}

export function DateTimeFormat(props) {
  return createElement(Format, { ...props, formatter: 'DateTimeFormat' });
}

export function RelativeTimeFormat({ value, unit, options }) {
  const locale = useLocale();
  return new Intl.RelativeTimeFormat(locale, options).format(value, unit);
}

export function CurrencyFormat({ value, currency, options }) {
  return createElement(NumberFormat, {
    value,
    options: { style: 'currency', currency, ...options },
  });
}
