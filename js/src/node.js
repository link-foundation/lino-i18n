// Opt-in ambient request access; no Node imports enter the browser/core graph.
import { AsyncLocalStorage } from 'node:async_hooks';
import { createRequestTranslator } from './server.js';

export function createTranslationContext() {
  const storage = new AsyncLocalStorage();
  function getTranslator() {
    const i18n = storage.getStore();
    if (!i18n) {
      throw new Error('No active translation context; use run or withRequest');
    }
    return i18n;
  }
  function run(i18n, callback) {
    if (!i18n?.gt || !i18n?.getLocale || typeof callback !== 'function') {
      throw new TypeError('run requires a translator and a callback');
    }
    return storage.run(i18n, callback);
  }
  return {
    run,
    async withRequest(request, options, callback) {
      return run(await createRequestTranslator(request, options), callback);
    },
    getTranslator,
    getGT: () => getTranslator().gt,
    getMessages: () => getTranslator().m,
    getTranslations(prefix = '') {
      // Resolve inside each call so a retained helper cannot capture another request.
      return (key, values, options) =>
        getTranslator().dictionary(
          prefix ? `${prefix}.${key}` : key,
          values,
          options
        );
    },
    gt: (...args) => getTranslator().gt(...args),
    tx: (...args) => getTranslator().tx(...args),
    getLocale: () => getTranslator().getLocale(),
    getLocales: () => getTranslator().listLocales(),
    getDefaultLocale: () => getTranslator().getDefaultLocale(),
    getVersion: () => getTranslator().getVersion(),
    getLocaleProperties: () => {
      const i18n = getTranslator();
      return i18n.getLocaleConfig().getLocaleProperties(i18n.getLocale());
    },
  };
}

const context = createTranslationContext();
export const {
  run: runWithTranslator,
  withRequest: withRequestTranslation,
  getTranslator,
  getGT,
  getMessages,
  getTranslations,
  gt,
  tx,
  getLocale,
  getLocales,
  getDefaultLocale,
  getVersion,
  getLocaleProperties,
} = context;
