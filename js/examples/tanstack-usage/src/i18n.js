import { createServerOnlyFn } from '@tanstack/react-start';
import { createTanStackI18n } from 'lino-i18n/tanstack-start/server';
import { options } from './config.js';
let translation;
export const getTranslation = createServerOnlyFn(
  () => (translation ||= createTanStackI18n(options))
);
