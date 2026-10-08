import type { RequestMiddlewareAfterServer } from '@tanstack/react-start';
import type { TranslationContext } from '../node.js';
import type { RequestTranslatorOptions } from '../server.js';
import type { Translator } from '../messages.js';
export {
  getRequestLocale,
  localizePath,
  stripLocale,
  createLocaleMiddleware,
} from '../server.js';
export interface TanStackI18n extends TranslationContext {
  middleware: RequestMiddlewareAfterServer<{}, undefined, { lino: Translator }>;
  getSnapshot(): ReturnType<Translator['snapshot']>;
  getEnabled(): boolean;
  loadSnapshot(locale: string): Promise<ReturnType<Translator['snapshot']>>;
}
export declare function createTanStackI18n(
  options?: RequestTranslatorOptions
): TanStackI18n;
