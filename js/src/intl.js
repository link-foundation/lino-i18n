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
