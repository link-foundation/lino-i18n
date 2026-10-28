import {
  loadLocalesFromDirectory,
  type DirectoryLoaderOptions,
} from 'lino-i18n/loaders';
import { loadLocalesFromDirectory as loadFromMain } from 'lino-i18n';

const options: DirectoryLoaderOptions = {
  recursive: true,
  compatibilityAliases: ['collapseTail', 'parentLabel'],
};
const catalogues: Record<
  string,
  Record<string, string>
> = await loadLocalesFromDirectory('./locales', options);
await loadFromMain('./locales', { recursive: false, mode: 'parent-label' });
await loadLocalesFromDirectory('./locales');
// @ts-expect-error recursive must be a boolean
await loadLocalesFromDirectory('./locales', { recursive: 'yes' });
void catalogues;
