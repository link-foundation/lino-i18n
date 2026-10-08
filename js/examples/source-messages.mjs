import {
  createTranslator,
  msg,
  declareStatic,
  derive,
  bindMessage,
} from 'lino-i18n/messages';
import { loadLocalesFromDirectory } from 'lino-i18n/loaders';
import { fileURLToPath } from 'node:url';

const locales = await loadLocalesFromDirectory(
  fileURLToPath(new URL('./react-usage', import.meta.url))
);
const i18n = createTranslator({ locales, defaultLocale: 'fr' });
console.log(i18n.gt('Add an item'));
const greeting = msg('Hello {name}', {
  id: 'greeting',
  description: 'A greeting',
});
console.log(i18n.m(greeting, { name: 'Ada' }));
const title = bindMessage(
  '{gender, select, female {She} male {He} other {They}} is {genderValue}.',
  { gender: declareStatic('Ada', 'female') }
);
console.log(i18n.gt(title));
const subject = Math.random() > 0.5 ? 'Alice' : 'Brian';
console.log(i18n.gt`Hello ${derive(subject)}`);
