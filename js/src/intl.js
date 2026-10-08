// Locale and formatting functions work in plain code and every framework.
export const formatNum = (value, locale = 'en', options) =>
  new Intl.NumberFormat(locale, options).format(value);
export const formatCurrency = (value, currency, locale = 'en', options) =>
  formatNum(value, locale, { ...options, style: 'currency', currency });
export const formatDateTime = (value, locale = 'en', options) =>
  new Intl.DateTimeFormat(locale, options).format(value);
export const formatRelativeTime = (value, unit, locale = 'en', options) =>
  new Intl.RelativeTimeFormat(locale, options).format(value, unit);
export const formatList = (values, locale = 'en', options) =>
  new Intl.ListFormat(locale, options).format(values);
export const formatListToParts = (values, locale = 'en', options) =>
  new Intl.ListFormat(locale, options).formatToParts(values);

export function formatRelativeTimeFromDate(value, now, locale = 'en', options) {
  const seconds = (Number(new Date(value)) - Number(new Date(now))) / 1000;
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
  ];
  const [unit, size] =
    units.find(([, size]) => Math.abs(seconds) >= size) || units.at(-1);
  return formatRelativeTime(Math.round(seconds / size), unit, locale, options);
}

export function formatCutoff(text, length, locale = 'en', suffix = '…') {
  if (!Number.isInteger(length) || length < 0) {
    throw new TypeError('length must be a non-negative integer');
  }
  const segments = Array.from(
    new Intl.Segmenter(locale, { granularity: 'grapheme' }).segment(text),
    (part) => part.segment
  );
  return segments.length <= length
    ? text
    : segments.slice(0, length).join('') + suffix;
}

export function resolveCanonicalLocale(locale) {
  return Intl.getCanonicalLocales(locale.replaceAll('_', '-'))[0];
}

export function isValidLocale(locale) {
  try {
    return Boolean(resolveCanonicalLocale(locale));
  } catch {
    return false;
  }
}

export function isSameLanguage(a, b) {
  return (
    new Intl.Locale(resolveCanonicalLocale(a)).language ===
    new Intl.Locale(resolveCanonicalLocale(b)).language
  );
}

export function isSameDialect(a, b) {
  return (
    new Intl.Locale(resolveCanonicalLocale(a)).maximize().baseName ===
    new Intl.Locale(resolveCanonicalLocale(b)).maximize().baseName
  );
}

export function getLocaleDirection(locale) {
  const parsed = new Intl.Locale(resolveCanonicalLocale(locale));
  return (
    (parsed.getTextInfo?.() || parsed.textInfo)?.direction ||
    (/^(Arab|Hebr|Thaa|Nkoo|Adlm|Rohg|Syrc)$/.test(parsed.maximize().script)
      ? 'rtl'
      : 'ltr')
  );
}

export function getLocaleName(locale, displayLocale = locale) {
  return new Intl.DisplayNames(displayLocale, { type: 'language' }).of(
    resolveCanonicalLocale(locale)
  );
}

export function getRegionProperties(region, displayLocale = 'en') {
  const code = region.toUpperCase();
  return {
    code,
    name: new Intl.DisplayNames(displayLocale, { type: 'region' }).of(code),
  };
}

export function getLocaleEmoji(locale) {
  const region = new Intl.Locale(resolveCanonicalLocale(locale)).maximize()
    .region;
  return /^[A-Z]{2}$/.test(region || '')
    ? Array.from(region, (letter) =>
        String.fromCodePoint(127397 + letter.charCodeAt(0))
      ).join('')
    : '';
}

export function getLocaleProperties(locale, displayLocale = locale) {
  const parsed = new Intl.Locale(resolveCanonicalLocale(locale));
  return {
    locale: parsed.toString(),
    language: parsed.language,
    script: parsed.maximize().script,
    region: parsed.region,
    name: getLocaleName(locale, displayLocale),
    direction: getLocaleDirection(locale),
    emoji: getLocaleEmoji(locale),
  };
}

export function isSupersetLocale(superLocale, subLocale) {
  const parent = new Intl.Locale(resolveCanonicalLocale(superLocale));
  const child = new Intl.Locale(resolveCanonicalLocale(subLocale));
  return (
    parent.language === child.language &&
    (!parent.script || parent.script === child.script) &&
    (!parent.region || parent.region === child.region)
  );
}

// Exact identities precede canonical matches, dialects, and broad language tags.
// A script-specific catalog is never selected for a different writing system.
export function determineLocale(candidates, approvedLocales) {
  return new LocaleConfig({ locales: approvedLocales }).determineLocale(
    candidates
  );
}

export function requiresTranslation(target, source = 'en', approvedLocales) {
  return new LocaleConfig().requiresTranslation(
    target,
    source,
    approvedLocales
  );
}

const localeKey = (locale) => locale.trim().toLowerCase().replaceAll('_', '-');

function freezeMapping(mapping) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(mapping).map(([key, value]) => [
        key,
        typeof value === 'string' ? value : Object.freeze({ ...value }),
      ])
    )
  );
}

export class LocaleConfig {
  #mapping;
  #aliases;

  constructor({
    defaultLocale = 'en',
    locales = [],
    customMapping = {},
    aliases = {},
  } = {}) {
    this.defaultLocale = defaultLocale;
    this.locales = Object.freeze([...locales]);
    this.customMapping = freezeMapping(customMapping);
    this.aliases = Object.freeze({ ...aliases });
    this.#mapping = new Map(
      Object.entries(this.customMapping).map(([key, value]) => [
        localeKey(key),
        value,
      ])
    );
    this.#aliases = new Map(
      Object.entries(aliases).map(([key, value]) => [localeKey(key), value])
    );
    // Validate all configured chains now, rather than hanging during a render.
    for (const locale of [
      defaultLocale,
      ...locales,
      ...Object.keys(customMapping),
      ...Object.keys(aliases),
    ]) {
      this.resolveCanonicalLocale(locale);
    }
    Object.freeze(this);
  }

  snapshot() {
    return {
      defaultLocale: this.defaultLocale,
      locales: [...this.locales],
      customMapping: Object.fromEntries(
        Object.entries(this.customMapping).map(([key, value]) => [
          key,
          typeof value === 'string' ? value : { ...value },
        ])
      ),
      aliases: { ...this.aliases },
    };
  }

  resolveCanonicalLocale(locale) {
    const visited = new Set();
    let code = locale;
    while (true) {
      const key = localeKey(code);
      if (visited.has(key)) {
        throw new TypeError(`Locale mapping cycle at ${code}`);
      }
      visited.add(key);
      const mapping = this.#mapping.get(key);
      const next =
        this.#aliases.get(key) || (typeof mapping === 'object' && mapping.code);
      if (!next || (localeKey(next) === key && isValidLocale(code))) {
        return resolveCanonicalLocale(code);
      }
      code = next;
    }
  }

  resolveAliasLocale(locale) {
    const canonical = this.resolveCanonicalLocale(locale);
    return (
      this.locales.find(
        (entry) => this.resolveCanonicalLocale(entry) === canonical
      ) || canonical
    );
  }

  isValidLocale(locale) {
    try {
      return Boolean(this.resolveCanonicalLocale(locale));
    } catch {
      return false;
    }
  }

  determineLocale(candidates, approvedLocales = this.locales) {
    const approved = approvedLocales.map((identity) => ({
      identity,
      code: this.resolveCanonicalLocale(identity),
    }));
    for (const candidate of Array.isArray(candidates)
      ? candidates
      : [candidates]) {
      if (!this.isValidLocale(candidate)) {
        continue;
      }
      const exact = approved.find(({ identity }) => identity === candidate);
      const code = this.resolveCanonicalLocale(candidate);
      const matched =
        exact ||
        approved.find((entry) => entry.code === code) ||
        approved.find((entry) => isSameDialect(entry.code, code)) ||
        approved.find((entry) => isSupersetLocale(entry.code, code));
      if (matched) {
        return matched.identity;
      }
    }
    return undefined;
  }

  requiresTranslation(
    target,
    source = this.defaultLocale,
    approvedLocales = this.locales
  ) {
    const resolved = approvedLocales?.length
      ? this.determineLocale(target, approvedLocales)
      : target;
    return Boolean(resolved && !this.isSameDialect(resolved, source));
  }

  isSameLanguage(a, b) {
    return isSameLanguage(
      this.resolveCanonicalLocale(a),
      this.resolveCanonicalLocale(b)
    );
  }

  isSameDialect(a, b) {
    return isSameDialect(
      this.resolveCanonicalLocale(a),
      this.resolveCanonicalLocale(b)
    );
  }

  isSupersetLocale(a, b) {
    return isSupersetLocale(
      this.resolveCanonicalLocale(a),
      this.resolveCanonicalLocale(b)
    );
  }

  getLocaleDirection(locale) {
    return (
      this.#mapping.get(localeKey(locale))?.direction ||
      getLocaleDirection(this.resolveCanonicalLocale(locale))
    );
  }

  getLocaleName(locale, displayLocale = this.defaultLocale) {
    const mapping = this.#mapping.get(localeKey(locale));
    return (
      (typeof mapping === 'string' ? mapping : mapping?.name) ||
      getLocaleName(
        this.resolveCanonicalLocale(locale),
        this.resolveCanonicalLocale(displayLocale)
      )
    );
  }

  getLocaleEmoji(locale) {
    return (
      this.#mapping.get(localeKey(locale))?.emoji ||
      getLocaleEmoji(this.resolveCanonicalLocale(locale))
    );
  }

  getLocaleProperties(locale, displayLocale = this.defaultLocale) {
    return {
      ...getLocaleProperties(
        this.resolveCanonicalLocale(locale),
        this.resolveCanonicalLocale(displayLocale)
      ),
      name: this.getLocaleName(locale, displayLocale),
      direction: this.getLocaleDirection(locale),
      emoji: this.getLocaleEmoji(locale),
    };
  }

  #format(formatter, value, targetLocale, options = {}) {
    const { locales, ...intlOptions } = options;
    const requested = locales ?? [
      targetLocale || this.defaultLocale,
      this.defaultLocale,
      'en',
    ];
    const codes = (Array.isArray(requested) ? requested : [requested]).map(
      (locale) => this.resolveCanonicalLocale(locale)
    );
    return new Intl[formatter](codes, intlOptions).format(value);
  }

  formatNum(value, locale, options) {
    return this.#format('NumberFormat', value, locale, options);
  }

  formatCurrency(value, currency, locale, options) {
    return this.formatNum(value, locale, {
      ...options,
      style: 'currency',
      currency,
    });
  }

  formatDateTime(value, locale, options) {
    return this.#format('DateTimeFormat', value, locale, options);
  }

  formatList(values, locale, options) {
    return this.#format('ListFormat', values, locale, options);
  }

  formatListToParts(values, locale, options = {}) {
    const { locales, ...intlOptions } = options;
    const requested = locales ?? locale ?? this.defaultLocale;
    const codes = (Array.isArray(requested) ? requested : [requested]).map(
      (entry) => this.resolveCanonicalLocale(entry)
    );
    return new Intl.ListFormat(codes, intlOptions).formatToParts(values);
  }

  formatRelativeTime(value, unit, locale, options = {}) {
    const { locales, ...intlOptions } = options;
    const requested = locales ?? locale ?? this.defaultLocale;
    const codes = (Array.isArray(requested) ? requested : [requested]).map(
      (entry) => this.resolveCanonicalLocale(entry)
    );
    return formatRelativeTime(value, unit, codes, intlOptions);
  }

  formatRelativeTimeFromDate(value, locale, { baseDate, ...options } = {}) {
    if (baseDate === undefined) {
      throw new TypeError('Relative dates require an explicit baseDate');
    }
    const { locales, ...intlOptions } = options;
    const requested = locales ?? locale ?? this.defaultLocale;
    const codes = (Array.isArray(requested) ? requested : [requested]).map(
      (entry) => this.resolveCanonicalLocale(entry)
    );
    return formatRelativeTimeFromDate(value, baseDate, codes, intlOptions);
  }

  formatCutoff(value, locale, { length, suffix, locales } = {}) {
    const requested = Array.isArray(locales) ? locales[0] : locales;
    return formatCutoff(
      value,
      length,
      this.resolveCanonicalLocale(requested || locale || this.defaultLocale),
      suffix
    );
  }
}
