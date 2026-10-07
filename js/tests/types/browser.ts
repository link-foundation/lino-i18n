import {
  createI18n,
  detectLanguage,
  loadCatalogs,
  resolveLanguage,
  type I18nCoreInstance,
} from 'lino-i18n/browser';
import { createI18n as createNodeI18n } from 'lino-i18n';
import { I18nProvider, useI18n, useTranslation } from 'lino-i18n/react';

const locales = await loadCatalogs(
  ['/en.lino', new URL('https://example.org/ru.lino')],
  {
    fetch: globalThis.fetch,
    requestInit: { signal: new AbortController().signal },
    compatibilityAliases: ['collapseTail'],
  }
);
const options = {
  supportedLanguages: Object.keys(locales),
  defaultLocale: 'en',
};
const i18n: I18nCoreInstance = createI18n({
  locales,
  defaultLocale: detectLanguage('auto', options),
});
i18n.setLocale(resolveLanguage('ru', ['en-US'], options));
i18n.t('greeting', { name: 'Ada' }, { locale: 'en' });
I18nProvider({ i18n });
I18nProvider({ i18n: createNodeI18n() });
createNodeI18n().loadLocaleFile('en.lino');
useI18n().loadLocaleFile('en.lino');
useTranslation().i18n.loadDirectory('locales');
useTranslation<I18nCoreInstance>().i18n.t('greeting');
// @ts-expect-error Browser hooks can expose the narrower browser instance.
useI18n<I18nCoreInstance>().loadLocaleFile('en.lino');
// @ts-expect-error File loading belongs to the Node adapter.
i18n.loadLocaleFile('en.lino');
