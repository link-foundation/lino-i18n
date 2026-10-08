'use client';
import React, { createContext, useContext, useMemo } from 'react';
import NextLink from 'next/link.js';
import { usePathname, useRouter } from 'next/navigation.js';
import { createTranslator } from '../messages.js';
import { localizePath } from '../server.js';
import { I18nProvider, useLocale, useTranslation } from '../react.js';

export {
  I18nProvider,
  Trans,
  T,
  Var,
  Static,
  Branch,
  Plural,
  Derive,
  NumberFormat,
  CurrencyFormat,
  DateTimeFormat,
  RelativeTimeFormat,
  Num,
  Currency,
  DateTime,
  RelativeTime,
  RelativeDate,
  ListFormat,
  RegionSelector,
  useI18n,
  useGT,
  useMessages,
  useTranslations,
  useLocale,
  useLocales,
  useDefaultLocale,
  useLocaleDirection,
  useLocaleProperties,
  useFormatLocale,
  useEnabled,
  useSetEnabled,
  useRegion,
  useSetRegion,
  useTranslation,
} from '../react.js';

const Link = NextLink.default || NextLink;
const NextContext = createContext({ cookieName: 'locale' });

function persistLocale(cookieName, locale) {
  document.cookie = `${encodeURIComponent(cookieName)}=${encodeURIComponent(locale)}; Path=/; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
}

export function NextI18nProvider({
  snapshot,
  cookieName = 'locale',
  children,
}) {
  const i18n = useMemo(() => createTranslator(snapshot), [snapshot]);
  const options = useMemo(() => ({ cookieName }), [cookieName]);
  return React.createElement(
    NextContext.Provider,
    { value: options },
    React.createElement(I18nProvider, { i18n }, children)
  );
}

export function useSetLocale() {
  const { i18n } = useTranslation();
  const { cookieName } = useContext(NextContext);
  const pathname = usePathname();
  const router = useRouter();
  return async (locale) => {
    const path = localizePath(
      (pathname || '/') + window.location.search + window.location.hash,
      locale,
      [...i18n.getLocaleConfig().locales]
    );
    if ((await i18n.switchLocale(locale)) !== locale) {
      return;
    }
    persistLocale(cookieName, locale);
    router.replace(path, { scroll: false });
  };
}

export function LocaleSelector({
  locales,
  labels = {},
  onChange,
  onError = console.error,
  ...props
}) {
  const { i18n } = useTranslation();
  const locale = useLocale();
  const setLocale = useSetLocale();
  return React.createElement(
    'select',
    {
      ...props,
      value: locale,
      onChange: (event) => {
        const next = event.target.value;
        setLocale(next).catch(onError);
        onChange?.(event);
      },
    },
    ...(locales || i18n.getLocaleConfig().locales).map((value) =>
      React.createElement(
        'option',
        { key: value, value },
        labels[value] || value
      )
    )
  );
}

export function LocaleLink({ href, locale, ...props }) {
  const current = useLocale();
  const { i18n } = useTranslation();
  const { cookieName } = useContext(NextContext);
  const path =
    typeof href === 'string'
      ? href
      : href.protocol || href.host
        ? undefined
        : href.pathname;
  const localized =
    path?.startsWith('/') && !path.startsWith('//')
      ? localizePath(path, locale || current, [
          ...i18n.getLocaleConfig().locales,
        ])
      : path;
  return React.createElement(Link, {
    ...props,
    onNavigate: (event) => {
      let cancelled = false;
      props.onNavigate?.({
        ...event,
        preventDefault() {
          cancelled = true;
          event.preventDefault();
        },
      });
      if (
        !cancelled &&
        localized?.startsWith('/') &&
        !localized.startsWith('//')
      ) {
        persistLocale(cookieName, locale || current);
      }
    },
    href:
      typeof href === 'string'
        ? localized
        : path === undefined
          ? href
          : { ...href, pathname: localized },
  });
}
