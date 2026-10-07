function normalizeTag(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll('_', '-');
}

function matchLanguage(value, supported) {
  let tag = normalizeTag(value);
  if (tag === 'auto') {
    return undefined;
  }
  while (tag) {
    if (supported.has(tag)) {
      return supported.get(tag);
    }
    const separator = tag.lastIndexOf('-');
    tag = separator === -1 ? '' : tag.slice(0, separator);
  }
  return undefined;
}

// Return the catalogue's original locale spelling after comparing normalized
// tags. Unsupported preferences defer to candidates in their supplied order.
export function resolveLanguage(preference, candidates = [], options = {}) {
  const { supportedLanguages = ['en'], defaultLocale = 'en' } = options;
  const supported = new Map(
    supportedLanguages.map((locale) => [normalizeTag(locale), locale])
  );
  const languages = Array.isArray(candidates) ? candidates : [candidates];
  for (const candidate of [preference, ...languages, defaultLocale]) {
    const matched = matchLanguage(candidate, supported);
    if (matched) {
      return matched;
    }
  }
  return supportedLanguages[0] || defaultLocale;
}

export function detectLanguage(preference = 'auto', options = {}) {
  const navigator = globalThis.navigator;
  const candidates = navigator?.languages?.length
    ? Array.from(navigator.languages)
    : [navigator?.language];
  return resolveLanguage(preference, candidates, options);
}
