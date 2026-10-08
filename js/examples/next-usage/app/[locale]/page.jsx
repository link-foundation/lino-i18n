import { NextI18nProvider } from 'lino-i18n/next/client';
import { i18n, requireLocale } from '../../i18n.js';
import Client from './client.jsx';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  requireLocale(locale);
  return i18n.getMetadata('/', 'https://example.org', locale);
}
export default async function Page({ params }) {
  requireLocale((await params).locale);
  const translator = await i18n.getTranslator();
  const repeated = await i18n.getTranslator();
  const gt = await i18n.getGT();
  return (
    <main>
      <h1>lino-i18n · Next.js App Router</h1>
      <p
        data-testid="server"
        data-locale={translator.getLocale()}
        data-cached={translator === repeated}
        data-source-cached={gt === translator.gt}
      >
        {gt('Hello from the server')}
      </p>
      <p>
        <i18n.T>
          A <strong>localized</strong> page
        </i18n.T>
      </p>
      <NextI18nProvider snapshot={translator.snapshot()}>
        <Client />
      </NextI18nProvider>
    </main>
  );
}
