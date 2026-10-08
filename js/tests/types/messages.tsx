import {
  createTranslator,
  createDictionaryTranslator,
  defineDictionary,
  msg,
  declareStatic,
  derive,
  bindMessage,
} from 'lino-i18n/messages';
import { T, Var, Plural, useGT, useTranslation } from 'lino-i18n/react';
import { Tx } from 'lino-i18n/react-server';
import {
  createRequestTranslator,
  createLocaleMiddleware,
} from 'lino-i18n/server';
import { extractMessages, translateCatalog } from 'lino-i18n/tooling';
import { createExtractionPlugin, transformJSX } from 'lino-i18n/compiler';
import { formatList, getLocaleDirection, LocaleConfig } from 'lino-i18n/intl';
import { runWithTranslator, getGT } from 'lino-i18n/node';
const i18n = createTranslator({
  loadCatalog: async () => ({ greeting: 'Hello {name}' }),
});
i18n.gt(msg('Hi {name}'), { name: 'Ada' });
i18n.gt`Hi ${'Ada'}`;
i18n.m(
  bindMessage('A {gender} {genderValue}', {
    gender: declareStatic('Ada', 'female'),
  })
);
i18n.gt`Hello ${derive('Alice')}`;
i18n.tx('Hello {name}', { name: 'Ada' }, { locale: 'en' });
T({ children: Var({ name: 'name', children: 'Ada' }), id: 'hello' });
Plural({ count: 2, other: 'items' });
useGT()('Hi');
useTranslation<typeof i18n>().i18n.switchLocale('fr');
Tx({ i18n, source: 'Hi' });
createRequestTranslator(new Request('https://example.org/'));
createLocaleMiddleware({ supportedLanguages: ['en'] });
formatList(['Ada', 'Lin']);
getLocaleDirection('ar');
const manifest = extractMessages('');
await translateCatalog(
  manifest.messages,
  {},
  { locale: 'fr', provider: async () => ({}) }
);
createExtractionPlugin({ locale: 'fr' });
createExtractionPlugin({
  transform: { attributes: ['placeholder'], attributeTranslator: 'gt' },
});
transformJSX('<p>Hello</p>', { file: 'page.tsx' }).code.toUpperCase();
const config = new LocaleConfig({
  locales: ['company'],
  customMapping: { company: { code: 'fr-CA' } },
});
createTranslator({ localeConfig: config });
config.formatNum(2, 'company', { locales: 'en' });
config.formatRelativeTimeFromDate('2026-01-02', 'en', {
  baseDate: '2026-01-01',
});
runWithTranslator(i18n, () => getGT()('Hi'));
const dictionary = defineDictionary({
  actions: ['Save', 'Cancel'],
  card: { title: 'Hello' },
});
const typed = createDictionaryTranslator(dictionary);
const actions: [string, string] = typed.dictionaryTree('actions');
const title: string = typed.dictionaryTree('card.title');
typed.dictionaryTree().card.title.toUpperCase();
actions.push(title);
// @ts-expect-error Unknown dictionary paths are rejected.
typed.dictionaryTree('card.typo');
// @ts-expect-error A dictionary array is not a scalar message.
const scalar: string = typed.dictionaryTree('actions');
// @ts-expect-error Defined schemas are deeply readonly.
dictionary.actions[0] = 'Changed';
// @ts-expect-error Deferred descriptors require source text.
msg(123);
// @ts-expect-error Counts must be numeric.
Plural({ count: 'two', other: 'items' });
// @ts-expect-error An async server component needs a translator that can load data.
Tx({ i18n: {}, source: 'Hi' });
