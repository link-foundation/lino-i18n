import { createI18n as createRuntime } from './i18n.js';
import { loadLocalesFromFile, loadLocalesFromDirectory } from './loaders.js';

// Preserve the main entry point's file-loading API around the shared engine.
export function createI18n(options = {}) {
  const i18n = createRuntime(options);

  async function loadLocaleFile(filePath) {
    const loaded = await loadLocalesFromFile(filePath);
    for (const { locale, translations } of loaded) {
      i18n.addLocale(locale, translations);
    }
    return loaded[0]?.locale;
  }

  async function loadDirectory(directory) {
    const loaded = await loadLocalesFromDirectory(directory);
    for (const [locale, translations] of Object.entries(loaded)) {
      i18n.addLocale(locale, translations);
    }
    return Object.keys(loaded);
  }

  return { ...i18n, loadLocaleFile, loadDirectory };
}
