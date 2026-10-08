// Standalone upstream probe: npm install --no-save @generaltranslation/python-extractor@0.2.60
import { extractFromPythonSource } from '@generaltranslation/python-extractor';
import {
  listSupportedLocales,
  getSupportedLocale,
} from '@generaltranslation/supported-locales';
const sources = {
  literal:
    'from gt_flask import t as translate\ntranslate("Hello {name}", name="Ada", _id="hello", _context="Greeting")\n',
  shadow:
    'from gt_flask import t\ndef unrelated(t):\n    t("Must not extract")\nt("Extract")\n',
  dynamic:
    'from gt_fastapi import t, derive\nname = input()\nt(f"Hello {name}")\nt(f"Type {derive("cat" if name else "dog")}")\n',
  invalid: 'from gt_flask import t\nt("bad"\n',
};
for (const [name, source] of Object.entries(sources)) {
  console.log(
    name,
    JSON.stringify(await extractFromPythonSource(source, `${name}.py`), null, 2)
  );
}
const locales = listSupportedLocales();
console.log(
  'locales',
  locales.length,
  locales.slice(0, 8),
  getSupportedLocale('zh-Hant-TW'),
  getSupportedLocale('not_a_locale')
);
