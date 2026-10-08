import { createStart } from '@tanstack/react-start';
import { createTanStackI18n } from '../../src/tanstack-start/server.js';
import {
  TanStackI18nProvider,
  LocaleSelector,
  LocaleLink,
  T,
  Var,
  useSetLocale,
} from '../../src/tanstack-start/client.js';

const translation = createTanStackI18n({
  sourceLocale: 'en',
  supportedLanguages: ['en', 'fr'],
  locales: { fr: { Hello: 'Bonjour' } },
});
createStart(() => ({ requestMiddleware: [translation.middleware] }));
const snapshot = await translation.loadSnapshot('fr');
function App() {
  const setLocale = useSetLocale();
  void setLocale('fr');
  return (
    <TanStackI18nProvider snapshot={snapshot}>
      <T>
        Hello <Var name="name" value="Ada" />
      </T>
      <LocaleSelector
        aria-label="Language"
        onError={(error: unknown) => void error}
      />
      <LocaleLink to="/details" locale="fr" preload="intent">
        Details
      </LocaleLink>
    </TanStackI18nProvider>
  );
}
void App;
// @ts-expect-error locale must be a string
translation.loadSnapshot(42);
// @ts-expect-error snapshot locale identities must be strings
const invalid = <TanStackI18nProvider snapshot={{ defaultLocale: 42 }} />;
void invalid;
