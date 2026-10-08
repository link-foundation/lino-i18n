import { createServerFn } from '@tanstack/react-start';
import { msg } from 'lino-i18n/messages';
import { getTranslation } from './i18n.js';
const greeting = msg('Hello from the server');
export const snapshot = createServerFn({ method: 'GET' })
  .validator((locale) => {
    if (!['en', 'fr'].includes(locale)) {
      throw new Error('Unsupported locale');
    }
    return locale;
  })
  .handler(({ data }) => getTranslation().loadSnapshot(data));
export const serverGreeting = createServerFn({ method: 'GET' }).handler(() => ({
  locale: getTranslation().getLocale(),
  message: getTranslation().getGT()(greeting),
}));
