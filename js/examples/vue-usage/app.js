import { createSSRApp } from 'vue';
import { createVueI18n } from '../../src/vue.js';
import { App, locales } from './shared.js';

const plugin = createVueI18n({
  ...window.__LINO_SNAPSHOT__,
  loadCatalog: async (locale) => {
    if (!Object.hasOwn(locales, locale)) {
      throw new Error(`No catalog for ${locale}`);
    }
    return await Promise.resolve(locales[locale]);
  },
});
createSSRApp(App).use(plugin).mount('#app');
