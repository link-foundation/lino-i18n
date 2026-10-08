import { i18n, requireLocale } from '../../../i18n.js';
export const dynamic = 'force-static';
export const dynamicParams = false;
export const generateStaticParams = i18n.generateStaticParams;
export async function generateMetadata({ params }) {
  const { locale } = await params;
  requireLocale(locale);
  return i18n.getMetadata('/static', 'https://example.org', locale);
}
export default async function StaticPage({ params }) {
  const { locale } = await params;
  requireLocale(locale);
  const gt = await i18n.getGT(locale);
  return (
    <main id="content">
      <h1>{gt('Static page')}</h1>
    </main>
  );
}
