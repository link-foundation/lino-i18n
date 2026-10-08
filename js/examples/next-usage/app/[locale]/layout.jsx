import { i18n } from '../../i18n.js';
import { options } from '../../config.js';
export default async function Layout({ children, params }) {
  const { locale: requested } = await params;
  const locale = options.supportedLanguages.includes(requested)
    ? requested
    : options.defaultLocale;
  const translator = await i18n.getTranslator(locale);
  const config = translator.getLocaleConfig();
  return (
    <html
      lang={config.resolveCanonicalLocale(locale)}
      dir={config.getLocaleDirection(locale)}
    >
      <body style={{ fontFamily: 'system-ui', margin: '3rem', maxWidth: 800 }}>
        {children}
      </body>
    </html>
  );
}
