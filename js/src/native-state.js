export function createNativeState(raw, { sourceLocale, storage, storageKey }) {
  let selection = 0;
  let initialization;
  let writes = Promise.resolve();

  function setLocale(locale) {
    selection += 1;
    raw.setLocale(locale);
  }

  async function switchLocale(locale) {
    if (!raw.getLocaleConfig().isValidLocale(locale)) {
      throw new TypeError(`Invalid native locale ${locale}`);
    }
    const id = ++selection;
    if (locale === sourceLocale) {
      raw.setLocale(locale);
    } else {
      await raw.switchLocale(locale);
    }
    if (id === selection && storage) {
      // Serialize writes so an older in-flight write cannot finish last.
      writes = writes
        .catch(() => {})
        .then(() =>
          id === selection
            ? storage.setItem(storageKey, raw.getLocale())
            : undefined
        );
      await writes;
    }
    return raw.getLocale();
  }

  function initialize() {
    if (initialization) {
      return initialization;
    }
    const id = selection;
    initialization = Promise.resolve()
      .then(async () => {
        const stored = storage ? await storage.getItem(storageKey) : null;
        if (id !== selection) {
          return raw.getLocale();
        }
        const locale =
          stored && raw.getLocaleConfig().isValidLocale(stored)
            ? stored
            : raw.getLocale();
        if (locale !== sourceLocale) {
          await raw.load(locale);
        }
        if (id === selection) {
          raw.setLocale(locale);
        }
        return raw.getLocale();
      })
      .catch((error) => {
        initialization = undefined;
        throw error;
      });
    return initialization;
  }

  const i18n = {
    ...raw,
    setLocale,
    switchLocale,
    listLocales: () => [...new Set([sourceLocale, ...raw.listLocales()])],
  };
  return { i18n, switchLocale, initialize };
}
