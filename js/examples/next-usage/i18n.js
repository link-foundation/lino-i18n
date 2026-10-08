import { createNextI18n } from 'lino-i18n/next/server';
import { options } from './config.js';
export const i18n = createNextI18n(options);

import { notFound } from 'next/navigation.js';
export function requireLocale(locale) {
  if (!options.supportedLanguages.includes(locale)) {
    notFound();
  }
  return locale;
}
