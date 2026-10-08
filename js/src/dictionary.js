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

function dictionarySchema(schema) {
  const ancestors = new Set();
  const sources = [];
  let visited = 0;
  function clone(node, path, depth) {
    visited += 1;
    if (depth > 20 || visited > 10000) {
      throw new TypeError('Dictionary depth/node limit exceeded');
    }
    if (typeof node === 'string') {
      sources.push([path.join('.'), node]);
      return node;
    }
    if (!node || typeof node !== 'object') {
      throw new TypeError('Dictionary leaves must be source strings');
    }
    if (ancestors.has(node)) {
      throw new TypeError('Dictionary cycle detected');
    }
    ancestors.add(node);
    const keys = Object.keys(node);
    if (keys.length > 10000 || (Array.isArray(node) && node.length > 10000)) {
      throw new TypeError('Dictionary node limit exceeded');
    }
    if (
      Array.isArray(node) &&
      (keys.length !== node.length ||
        keys.some((key, index) => key !== String(index)))
    ) {
      throw new TypeError(
        'Dictionary arrays cannot be sparse or have named properties'
      );
    }
    const entries = keys.map((key) => {
      if (!key || key.includes('.')) {
        throw new TypeError(`Invalid dictionary key ${key}`);
      }
      const descriptor = Object.getOwnPropertyDescriptor(node, key);
      if (!Object.hasOwn(descriptor, 'value')) {
        throw new TypeError('Dictionary accessors are not supported');
      }
      return [key, clone(descriptor.value, [...path, key], depth + 1)];
    });
    ancestors.delete(node);
    return Object.freeze(
      Array.isArray(node)
        ? entries.map(([, value]) => value)
        : Object.fromEntries(entries)
    );
  }
  if (!schema || typeof schema !== 'object') {
    throw new TypeError('A dictionary schema must be an object or array');
  }
  return { schema: clone(schema, [], 0), sources: Object.fromEntries(sources) };
}

export function defineDictionary(schema) {
  return dictionarySchema(schema).schema;
}

export function scopedDictionary(getTranslator, prefix = '') {
  const path = (key) => (prefix ? (key ? `${prefix}.${key}` : prefix) : key);
  const translate = (key, values, options) => {
    const i18n = getTranslator();
    if (!i18n.dictionary) {
      throw new Error('Dictionary helpers require a createTranslator instance');
    }
    return i18n.dictionary(path(key), values, options);
  };
  translate.obj = (key = '', values, options) =>
    getTranslator().dictionaryTree(path(key), values, options);
  return translate;
}

export function withDictionary(options) {
  if (options.dictionary === undefined) {
    return options;
  }
  const { schema, sources } = dictionarySchema(options.dictionary);
  const locale = options.sourceLocale || 'en';
  return {
    ...options,
    dictionary: schema,
    locales: {
      ...options.locales,
      [locale]: { ...sources, ...options.locales?.[locale] },
    },
  };
}

function renderDictionary(node, path, translate) {
  if (typeof node === 'string') {
    return translate(path);
  }
  const entries = Object.entries(node).map(([key, value]) => [
    key,
    renderDictionary(value, path ? `${path}.${key}` : key, translate),
  ]);
  return Array.isArray(node)
    ? entries.map(([, value]) => value)
    : Object.fromEntries(entries);
}

export function createDictionaryApi(
  core,
  gt,
  tables,
  { sourceLocale = 'en', dictionary: schema } = {}
) {
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
  function dictionaryTree(prefix = '', values, options) {
    if (schema === undefined) {
      return dictionaryObject(prefix, values, options);
    }
    let node = schema;
    for (const key of prefix ? prefix.split('.') : []) {
      if (!node || typeof node !== 'object' || !Object.hasOwn(node, key)) {
        throw new Error(`Unknown dictionary path ${prefix}`);
      }
      node = node[key];
    }
    return renderDictionary(node, prefix, (key) =>
      dictionary(key, values, options)
    );
  }
  dictionary.obj = dictionaryTree;
  return { dictionary, dictionaryObject, dictionaryTree };
}
