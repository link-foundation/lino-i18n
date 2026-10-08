import { createNextLocaleProxy } from 'lino-i18n/next/proxy';
import { options } from './config.js';
export const proxy = createNextLocaleProxy(options);
export const config = { matcher: ['/((?!api|_next|.*\\..*).*)'] };
