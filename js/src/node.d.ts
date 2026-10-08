import type { MessageTranslator, Translator } from './messages.js';
import type { RequestTranslatorOptions } from './server.js';
export interface TranslationContext {
  run<T>(i18n: Translator, callback: () => T): T;
  withRequest<T>(
    request: Request,
    options: RequestTranslatorOptions,
    callback: () => T
  ): Promise<Awaited<T>>;
  getTranslator(): Translator;
  getGT(): MessageTranslator;
  getMessages(): MessageTranslator;
  getTranslations(prefix?: string): Translator['dictionary'];
  gt: MessageTranslator;
  tx: Translator['tx'];
  getLocale(): string;
  getLocales(): string[];
  getDefaultLocale(): string;
  getVersion(): string;
  getLocaleProperties(): ReturnType<
    import('./intl.js').LocaleConfig['getLocaleProperties']
  >;
}
export declare function createTranslationContext(): TranslationContext;
export declare const runWithTranslator: TranslationContext['run'];
export declare const withRequestTranslation: TranslationContext['withRequest'];
export declare const getTranslator: TranslationContext['getTranslator'];
export declare const getGT: TranslationContext['getGT'];
export declare const getMessages: TranslationContext['getMessages'];
export declare const getTranslations: TranslationContext['getTranslations'];
export declare const gt: TranslationContext['gt'];
export declare const tx: TranslationContext['tx'];
export declare const getLocale: TranslationContext['getLocale'];
export declare const getLocales: TranslationContext['getLocales'];
export declare const getDefaultLocale: TranslationContext['getDefaultLocale'];
export declare const getVersion: TranslationContext['getVersion'];
export declare const getLocaleProperties: TranslationContext['getLocaleProperties'];
