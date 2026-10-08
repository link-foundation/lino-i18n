// Optional ICU/source-message runtime. The native browser entry stays dependency-free.
import { IntlMessageFormat } from 'intl-messageformat';
import { createI18n } from './i18n.js';
import { parseLinoCatalogs } from './catalogs.js';
import { escapeMessageText } from './message-schema.js';
import { createDictionaryApi, withDictionary } from './dictionary.js';
import { LocaleConfig } from './intl.js';

export { defineDictionary } from './dictionary.js';
export function createDictionaryTranslator(schema, options = {}) {
  return createTranslator({ ...options, dictionary: schema });
}

const compiled = new Map();

export function formatMessage(source, values = {}, locale = 'en') {
  const key = JSON.stringify([locale, source]);
  let message = compiled.get(key);
  if (!message) {
    message = new IntlMessageFormat(source, locale);
    if (compiled.size >= 100) {
      compiled.delete(compiled.keys().next().value);
    }
    compiled.set(key, message);
  }
  return message.format(values);
}

export function msg(source, options = {}) {
  if (Array.isArray(source)) {
    return Object.freeze(
      source.map((entry, index) =>
        msg(entry, {
          ...options,
          ...(options.id && { id: `${options.id}.${index}` }),
        })
      )
    );
  }
  if (typeof source !== 'string') {
    throw new TypeError('msg requires a source string');
  }
  return Object.freeze({ ...options, source, id: options.id || source });
}

export function declareStatic(value, context = String(value)) {
  return Object.freeze({ value, context });
}

export function bindMessage(message, values = {}) {
  const descriptor = typeof message === 'string' ? msg(message) : message;
  return Object.freeze({
    ...descriptor,
    values: { ...descriptor.values, ...values },
  });
}

export function derive(value) {
  if (!['string', 'number', 'boolean'].includes(typeof value)) {
    throw new TypeError('derive expects a string, number or boolean');
  }
  return Object.freeze({ derived: value });
}

function templateMessage(strings, values) {
  return {
    source: strings.reduce(
      (text, part, index) =>
        text +
        (index ? templateVariable(values[index - 1], index - 1) : '') +
        escapeMessageText(part),
      ''
    ),
    values: Object.fromEntries(
      values
        .map((value, index) => [`v${index}`, value])
        .filter(
          ([, value]) =>
            !(
              value &&
              typeof value === 'object' &&
              Object.hasOwn(value, 'derived')
            )
        )
    ),
  };
}

function templateVariable(value, index) {
  return value && typeof value === 'object' && Object.hasOwn(value, 'derived')
    ? escapeMessageText(value.derived)
    : `{v${index}}`;
}

function resolveDerived(descriptor, values) {
  let source = descriptor.source;
  const variables = { ...descriptor.values, ...values };
  for (const [name, value] of Object.entries(variables)) {
    if (value && typeof value === 'object' && Object.hasOwn(value, 'derived')) {
      if (!source.includes(`{${name}}`)) {
        throw new Error('Derived values require a simple named {placeholder}');
      }
      source = source.replaceAll(`{${name}}`, escapeMessageText(value.derived));
      delete variables[name];
    }
  }
  if (source !== descriptor.source && descriptor.id !== descriptor.source) {
    throw new Error(
      'Derived messages use source identities; omit an explicit id'
    );
  }
  return {
    ...descriptor,
    source,
    id: source === descriptor.source ? descriptor.id : source,
    values: variables,
  };
}

function catalogTable(locale, data) {
  if (typeof data !== 'string') {
    if (
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      Object.values(data).some((value) => typeof value !== 'string')
    ) {
      throw new TypeError(
        'loadCatalog must return .lino text or a string table'
      );
    }
    return { ...data };
  }
  const catalog = parseLinoCatalogs(data).find(
    (entry) => entry.locale === locale
  );
  if (!catalog) {
    throw new Error(`Loaded catalog does not contain locale ${locale}`);
  }
  return catalog.translations;
}

function prepareVariables(descriptor, values) {
  const variables = { ...descriptor.values, ...values };
  for (const [name, value] of Object.entries(variables)) {
    if (
      value &&
      typeof value === 'object' &&
      Object.hasOwn(value, 'context') &&
      Object.hasOwn(value, 'value')
    ) {
      variables[name] = value.context;
      variables[`${name}Value`] = value.value;
    }
  }
  return variables;
}

function createCatalogLoader(options, addLocale, tables) {
  const pending = new Map();
  const loaded = new Set();
  async function fetchTable(locale, key) {
    const cached = await options.cache?.get(key);
    if (cached !== undefined && cached !== null) {
      return catalogTable(locale, cached);
    }
    if (!options.loadCatalog) {
      throw new Error('load requires a loadCatalog function');
    }
    const table = catalogTable(
      locale,
      await options.loadCatalog(locale, {
        version: options.version || 'default',
      })
    );
    await options.cache?.set(key, table);
    return table;
  }

  function load(locale) {
    const key = JSON.stringify([options.version || 'default', locale]);
    if (loaded.has(key) || (!options.loadCatalog && tables.has(locale))) {
      return Promise.resolve(locale);
    }
    if (!pending.has(key)) {
      const request = fetchTable(locale, key)
        .then((table) => {
          addLocale(locale, table);
          loaded.add(key);
          options.onTrace?.({ type: 'load', locale });
          return locale;
        })
        .finally(() => pending.delete(key));
      pending.set(key, request);
    }
    return pending.get(key);
  }

  return load;
}

function translatorSnapshot(core, tables, options, state, localeConfig) {
  return {
    locales: Object.fromEntries(
      Array.from(tables, ([locale, table]) => [locale, { ...table }])
    ),
    defaultLocale: core.getLocale(),
    fallback: core.getFallbacks(),
    ...state,
    version: options.version,
    sourceLocale: options.sourceLocale,
    dictionary: options.dictionary,
    localeConfig: localeConfig.snapshot(),
    compatibilityAliases: options.compatibilityAliases,
  };
}

function configuredLocales(options) {
  return options.localeConfig instanceof LocaleConfig
    ? options.localeConfig
    : new LocaleConfig({
        defaultLocale: options.defaultLocale,
        ...options.localeConfig,
      });
}

function cloneTables(options) {
  return new Map(
    Object.entries(options.locales || {}).map(([locale, table]) => [
      locale,
      { ...table },
    ])
  );
}

function resolveFormatLocale(config, code, region) {
  const locale = new Intl.Locale(config.resolveCanonicalLocale(code));
  return region
    ? new Intl.Locale(locale, { region }).toString()
    : locale.toString();
}

export function createTranslator(options = {}) {
  options = withDictionary(options);
  const localeConfig = configuredLocales(options);
  const core = createI18n({
    ...options,
    defaultLocale: options.defaultLocale || localeConfig.defaultLocale,
  });
  const tables = cloneTables(options);
  const listeners = new Set();
  let enabled = options.enabled ?? true;
  let region = options.region;
  let revision = 0;
  let switchId = 0;

  function notify() {
    revision += 1;
    for (const listener of listeners) {
      listener();
    }
  }
  core.subscribe(notify);

  function addLocale(locale, table) {
    const validated = catalogTable(locale, table);
    tables.set(locale, { ...tables.get(locale), ...validated });
    core.addLocale(locale, validated);
  }

  function gt(message, values = {}, callOptions = {}) {
    if (Array.isArray(message) && Object.hasOwn(message, 'raw')) {
      const template = templateMessage(
        message,
        Array.prototype.slice.call(arguments, 1)
      );
      return gt(template.source, template.values);
    }
    const input =
      typeof message === 'string'
        ? msg(message, {
            id: callOptions.id,
            description: callOptions.description,
          })
        : message;
    const descriptor = input && resolveDerived(input, values);
    if (!descriptor || typeof descriptor.source !== 'string') {
      throw new TypeError('gt requires a source string or msg descriptor');
    }
    const locale = callOptions.locale || core.getLocale();
    const source = enabled
      ? core.t(
          descriptor.id,
          {},
          { ...callOptions, defaultValue: descriptor.source }
        )
      : descriptor.source;
    const variables = prepareVariables(descriptor, {});
    const result = formatMessage(
      source,
      variables,
      localeConfig.resolveCanonicalLocale(locale)
    );
    options.onTrace?.({
      type: 'translation',
      id: descriptor.id,
      locale,
      translated: source !== descriptor.source,
    });
    return result;
  }

  const load = createCatalogLoader(options, addLocale, tables);

  async function switchLocale(locale) {
    const id = ++switchId;
    await load(locale);
    if (id === switchId) {
      core.setLocale(locale);
    }
    return core.getLocale();
  }

  function setLocale(locale) {
    switchId += 1;
    core.setLocale(locale);
  }

  function setEnabled(value) {
    if (typeof value !== 'boolean') {
      throw new TypeError('setEnabled expects a boolean');
    }
    if (enabled !== value) {
      enabled = value;
      notify();
    }
  }

  function setRegion(value) {
    if (value !== undefined && !/^(?:[A-Z]{2}|\d{3})$/.test(value)) {
      throw new TypeError('setRegion expects an uppercase region code');
    }
    if (region !== value) {
      region = value;
      notify();
    }
  }

  return {
    ...core,
    gt,
    m: gt,
    ...createDictionaryApi(core, gt, tables, options),
    async tx(message, values, callOptions = {}) {
      const locale = callOptions.locale || core.getLocale();
      await load(locale);
      return gt(message, values, { ...callOptions, locale });
    },
    addLocale,
    loadLocale(locale, text) {
      return Promise.resolve().then(() => {
        addLocale(locale, catalogTable(locale, text));
        return locale;
      });
    },
    load,
    switchLocale,
    setLocale,
    getEnabled: () => enabled,
    setEnabled,
    getRegion: () => region,
    setRegion,
    getDefaultLocale: () => options.defaultLocale || localeConfig.defaultLocale,
    getVersion: () => options.version || 'default',
    getLocaleConfig: () => localeConfig,
    getFormatLocale: () =>
      resolveFormatLocale(localeConfig, core.getLocale(), region),
    getRevision: () => revision,
    subscribe(listener) {
      if (typeof listener !== 'function') {
        throw new TypeError('subscribe expects a function');
      }
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    snapshot() {
      return translatorSnapshot(
        core,
        tables,
        options,
        { enabled, region },
        localeConfig
      );
    },
  };
}
