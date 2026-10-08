import { createNextI18n } from 'lino-i18n/next/server';
import { createNextLocaleProxy } from 'lino-i18n/next/proxy';
import {
  NextI18nProvider,
  LocaleLink,
  LocaleSelector,
  useSetLocale,
} from 'lino-i18n/next/client';
const next = createNextI18n({
  defaultLocale: 'en',
  supportedLanguages: ['en', 'fr'],
});
const translator = await next.getTranslator('fr');
(await next.getGT())('Hello');
(await next.getTranslations('page')).obj();
next.getMetadata('/', 'https://example.org');
next.generateStaticParams();
next.T({ children: 'Hello' });
NextI18nProvider({ snapshot: translator.snapshot(), children: 'Hello' });
LocaleSelector({ onError: (error) => console.log(error) });
LocaleLink({
  href: '/about',
  locale: 'fr',
  children: 'About',
  prefetch: false,
});
LocaleLink({ href: { pathname: '/about', query: { page: '2' } } });
useSetLocale()('fr');
createNextLocaleProxy({
  supportedLanguages: ['en'],
  cookieOptions: { sameSite: 'lax', maxAge: 3600 },
})(new Request('https://example.org'));
// @ts-expect-error A provider requires a serializable translator snapshot.
NextI18nProvider({ snapshot: 1 });
// @ts-expect-error Cookie same-site values use the platform vocabulary.
createNextLocaleProxy({ cookieOptions: { sameSite: 'anything' } });
