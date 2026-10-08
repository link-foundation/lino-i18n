function put(object, parts, value) {
  const [key, ...remaining] = parts;
  if (remaining.length) {
    if (!Object.hasOwn(object, key) || typeof object[key] !== 'object') {
      Object.defineProperty(object, key, {
        value: {},
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    put(object[key], remaining, value);
  } else {
    Object.defineProperty(object, key, {
      value,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
}

export function createDictionaryApi(core, gt, tables, sourceLocale) {
  function dictionary(key, values, options) {
    const source = core.t(key, {}, { locale: sourceLocale });
    return gt({ source, id: key }, values, options);
  }
  function dictionaryObject(prefix = '', values, options) {
    const keys = new Set(
      [...tables.values()].flatMap((table) => Object.keys(table))
    );
    const object = {};
    for (const key of [...keys].sort()) {
      if (!prefix || key.startsWith(`${prefix}.`)) {
        put(
          object,
          (prefix ? key.slice(prefix.length + 1) : key).split('.'),
          dictionary(key, values, options)
        );
      }
    }
    return object;
  }
  return { dictionary, dictionaryObject };
}
