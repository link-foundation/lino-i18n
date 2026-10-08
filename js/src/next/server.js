// App Router adapter: React cache scopes the instance to one server render.
import { cache, createElement } from 'react';
import { headers } from 'next/headers.js';
import { createTranslator } from '../messages.js';
import { createRequestTranslator, localizePath } from '../server.js';
import { LocaleConfig } from '../intl.js';
import { scopedDictionary } from '../dictionary.js';
import { T as ServerT } from '../react-server.js';

export { Var, Static, Branch, Derive, Plural } from '../react-server.js';

export function createNextI18n(options) {
  const locales =
    options.supportedLanguages || Object.keys(options.locales || {});
  const config =
    options.localeConfig instanceof LocaleConfig
      ? options.localeConfig
      : new LocaleConfig({
          defaultLocale: options.defaultLocale,
          locales,
          ...options.localeConfig,
        });
  const cachedTranslator = cache(async (locale) => {
    if (locale !== undefined) {
      if (!locales.includes(locale)) {
        throw new Error(`Unsupported locale ${locale}`);
      }
      const i18n = createTranslator({
        ...options,
        localeConfig: config,
        defaultLocale: locale,
      });
      if (options.loadCatalog) {
        await i18n.load(locale);
      }
      return i18n;
    }
    const incoming = await headers();
    return createRequestTranslator(
      new Request('https://lino.invalid/', { headers: incoming }),
      {
        ...options,
        localeConfig: config,
        locale: incoming.get('x-lino-locale') || undefined,
      }
    );
  });
  // Normalize omitted and explicit undefined into one React cache key.
  const getTranslator = (locale) => cachedTranslator(locale);
  return {
    getTranslator,
    getGT: async (locale) => (await getTranslator(locale)).gt,
    getMessages: async (locale) => (await getTranslator(locale)).m,
    getLocale: async () => (await getTranslator()).getLocale(),
    async getTranslations(prefix = '', locale) {
      const i18n = await getTranslator(locale);
      return scopedDictionary(() => i18n, prefix);
    },
    async T({ locale, ...props }) {
      return createElement(ServerT, {
        ...props,
        locale,
        i18n: await getTranslator(locale),
      });
    },
    async Tx({ locale, ...props }) {
      return createElement(ServerT, {
        ...props,
        locale,
        i18n: await getTranslator(locale),
      });
    },
    generateStaticParams: () => locales.map((locale) => ({ locale })),
    getMetadata(
      path,
      origin,
      locale = options.defaultLocale || config.defaultLocale
    ) {
      const languages = Object.fromEntries(
        locales.map((entry) => [
          config.resolveCanonicalLocale(entry),
          new URL(localizePath(path, entry, locales), origin).href,
        ])
      );
      languages['x-default'] = new URL(
        localizePath(
          path,
          options.defaultLocale || config.defaultLocale,
          locales
        ),
        origin
      ).href;
      return {
        alternates: {
          canonical: new URL(localizePath(path, locale, locales), origin).href,
          languages,
        },
      };
    },
  };
}
