'use client';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { Link, useRouter, useLocation } from '@tanstack/react-router';
import { createTranslator } from '../messages.js';
import { localizePath } from '../server.js';
import { I18nProvider, useI18n, useLocale } from '../react.js';
export * from '../react.js';

const Options = createContext({ cookieName: 'locale' });
function persist(cookieName, locale) {
  document.cookie = `${encodeURIComponent(cookieName)}=${encodeURIComponent(locale)}; Path=/; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
}
export function TanStackI18nProvider({
  snapshot,
  cookieName = 'locale',
  children,
}) {
  const i18n = useMemo(() => createTranslator(snapshot), [snapshot]);
  const router = useRouter();
  const options = useMemo(() => ({ cookieName }), [cookieName]);
  useEffect(
    () =>
      router.subscribe('onResolved', ({ toLocation }) => {
        const locale = toLocation.pathname.split('/')[1];
        if (i18n.getLocaleConfig().locales.includes(locale)) {
          persist(cookieName, locale);
        }
      }),
    [router, i18n, cookieName]
  );
  return React.createElement(
    Options.Provider,
    { value: options },
    React.createElement(I18nProvider, { i18n }, children)
  );
}
export function useSetLocale() {
  const i18n = useI18n();
  const router = useRouter();
  const location = useLocation();
  const { cookieName } = useContext(Options);
  return async (locale) => {
    const to = localizePath(
      location.pathname,
      locale,
      i18n.getLocaleConfig().locales
    );
    if ((await i18n.switchLocale(locale)) !== locale) {
      return;
    }
    persist(cookieName, locale);
    await router.navigate({
      to,
      search: location.search,
      hash: location.hash,
      replace: true,
    });
  };
}
export function LocaleSelector({
  locales,
  labels = {},
  onChange,
  onError = console.error,
  ...props
}) {
  const i18n = useI18n();
  const locale = useLocale();
  const setLocale = useSetLocale();
  return React.createElement(
    'select',
    {
      ...props,
      value: locale,
      onChange: (event) => {
        setLocale(event.target.value).catch(onError);
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
export function LocaleLink({ to, locale, ...props }) {
  const current = useLocale();
  const i18n = useI18n();
  const target =
    typeof to === 'string' && to.startsWith('/') && !to.startsWith('//')
      ? localizePath(to, locale || current, i18n.getLocaleConfig().locales)
      : to;
  return React.createElement(Link, { ...props, to: target });
}
