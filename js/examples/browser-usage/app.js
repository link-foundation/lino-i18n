// With a bundler, use the package subpath: 'lino-i18n/browser'.
import { createI18n, detectLanguage, loadCatalogs } from '../../src/browser.js';

const locales = await loadCatalogs(['./en.lino', './ru.lino']);
const i18n = createI18n({
  locales,
  defaultLocale: detectLanguage('auto', {
    supportedLanguages: Object.keys(locales),
    defaultLocale: 'en',
  }),
  fallback: ['en'],
});
const selector = document.querySelector('#language');

function render() {
  document.documentElement.lang = i18n.getLocale();
  selector.value = i18n.getLocale();
  document.querySelector('#greeting').textContent = i18n.t('greeting', {
    name: 'Ada',
  });
  document.querySelector('#items').textContent = i18n.t('items', { count: 2 });
  document.querySelector('#fallback').textContent = i18n.t('onlyEnglish');
}

i18n.subscribe(render);
selector.addEventListener('change', () => i18n.setLocale(selector.value));
render();
