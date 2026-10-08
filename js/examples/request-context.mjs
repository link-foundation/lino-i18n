// Run with Node, Bun, or Deno: each concurrent request owns its translator.
import { withRequestTranslation, gt, getLocale } from '../src/node.js';

const options = {
  locales: {
    en: { 'Hi {name}': 'Hi {name}' },
    fr: { 'Hi {name}': 'Salut {name}' },
  },
};
function greeting() {
  return `${getLocale()}: ${gt('Hi {name}', { name: 'Ada' })}`;
}
console.log(
  await Promise.all(
    ['en', 'fr'].map((locale) =>
      withRequestTranslation(
        new Request(`https://example.org/${locale}`),
        options,
        async () => {
          await Promise.resolve();
          return greeting();
        }
      )
    )
  )
);
