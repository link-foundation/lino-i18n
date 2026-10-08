import { NextResponse } from 'next/server.js';
import { getRequestLocale, localizePath } from '../server.js';

// Export from proxy.js in Next 16; the same function works as older middleware.
export function createNextLocaleProxy(options) {
  const supported =
    options.supportedLanguages || Object.keys(options.locales || {});
  return (request) => {
    const locale = getRequestLocale(request, options);
    const url = new URL(request.url);
    const path = localizePath(url.pathname, locale, supported);
    let response;
    if (url.pathname !== path && `${url.pathname}/` !== path) {
      url.pathname = path;
      response = NextResponse.redirect(url, 307);
    } else {
      const incoming = new Headers(request.headers);
      incoming.set('x-lino-locale', locale);
      response = NextResponse.next({ request: { headers: incoming } });
    }
    // Next normalizes RSC requests and strips their Flight/prefetch headers.
    // Browser fetches must not persist a preference merely by loading a payload.
    const background =
      request.headers.get('sec-fetch-dest') === 'empty' ||
      request.headers.get('next-router-prefetch') === '1' ||
      ['purpose', 'sec-purpose'].some(
        (name) => request.headers.get(name)?.split(';')[0].trim() === 'prefetch'
      );
    if (options.persistLocale !== false && !background) {
      response.cookies.set(options.cookieName || 'locale', locale, {
        path: '/',
        sameSite: 'lax',
        secure: url.protocol === 'https:',
        ...options.cookieOptions,
      });
    }
    return response;
  };
}
