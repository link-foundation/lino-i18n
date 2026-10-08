// Request primitives accept Web Requests: Next, TanStack, Workers and Node.
import { createTranslator } from './messages.js';
import { resolveLanguage } from './language.js';
import { LocaleConfig } from './intl.js';

function acceptedLanguages(header) {
  return (header || '')
    .split(',')
    .map((entry, index) => {
      const [locale, ...parameters] = entry.trim().split(';');
      const weight = parameters.find((parameter) =>
        parameter.trim().startsWith('q=')
      );
      return {
        locale,
        quality: weight ? Number(weight.trim().slice(2)) : 1,
        index,
      };
    })
    .filter(
      ({ locale, quality }) =>
        locale && Number.isFinite(quality) && quality > 0 && quality <= 1
    )
    .sort((a, b) => b.quality - a.quality || a.index - b.index)
    .map(({ locale }) => locale);
}

function localeCookie(header, name) {
  const entry = (header || '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  try {
    return entry ? decodeURIComponent(entry.slice(name.length + 1)) : undefined;
  } catch {
    return undefined;
  }
}

export function getRequestLocale(request, options = {}) {
  const supportedLanguages =
    options.supportedLanguages || Object.keys(options.locales || {});
  const url = new URL(request.url);
  const pathLocale = url.pathname.split('/')[1];
  const cookie = localeCookie(
    request.headers.get('cookie'),
    options.cookieName || 'locale'
  );
  const candidates = [
    options.locale,
    pathLocale,
    cookie,
    ...acceptedLanguages(request.headers.get('accept-language')),
  ].filter(Boolean);
  if (options.localeConfig) {
    const config =
      options.localeConfig instanceof LocaleConfig
        ? options.localeConfig
        : new LocaleConfig({
            defaultLocale: options.defaultLocale,
            ...options.localeConfig,
          });
    return (
      config.determineLocale(
        [...candidates, options.defaultLocale || config.defaultLocale],
        supportedLanguages
      ) ||
      supportedLanguages[0] ||
      config.defaultLocale
    );
  }
  return resolveLanguage(undefined, candidates, {
    supportedLanguages,
    defaultLocale: options.defaultLocale || 'en',
  });
}

export async function createRequestTranslator(request, options = {}) {
  const i18n = createTranslator({
    ...options,
    defaultLocale: getRequestLocale(request, options),
  });
  if (options.loadCatalog) {
    await i18n.load(i18n.getLocale());
  }
  return i18n;
}

function pathParts(path) {
  if (
    typeof path !== 'string' ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('\\')
  ) {
    throw new TypeError('Expected a site-relative path starting with /');
  }
  const suffixIndex = path.search(/[?#]/);
  return suffixIndex === -1
    ? [path, '']
    : [path.slice(0, suffixIndex), path.slice(suffixIndex)];
}

export function stripLocale(path, supportedLanguages) {
  const [pathname, suffix] = pathParts(path);
  const segments = pathname.split('/');
  if (
    supportedLanguages.some(
      (locale) => locale.toLowerCase() === segments[1].toLowerCase()
    )
  ) {
    segments.splice(1, 1);
  }
  return (segments.join('/') || '/') + suffix;
}

export function localizePath(path, locale, supportedLanguages) {
  if (!supportedLanguages.includes(locale)) {
    throw new Error(`Unsupported locale ${locale}`);
  }
  return `/${locale}${stripLocale(path, supportedLanguages)}`;
}

export function createLocaleMiddleware(options) {
  return (request) => {
    const locale = getRequestLocale(request, options);
    const url = new URL(request.url);
    const supported =
      options.supportedLanguages || Object.keys(options.locales || {});
    const localized = localizePath(url.pathname, locale, supported);
    if (localized === url.pathname || localized === `${url.pathname}/`) {
      return undefined;
    }
    url.pathname = localized;
    return Response.redirect(url, 307);
  };
}
