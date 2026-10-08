import type { Translator, TranslatorOptions } from './messages.js';
export interface RequestTranslatorOptions extends TranslatorOptions {
  supportedLanguages?: string[];
  locale?: string;
  cookieName?: string;
}
export declare function getRequestLocale(
  request: Request,
  options?: RequestTranslatorOptions
): string;
export declare function createRequestTranslator(
  request: Request,
  options?: RequestTranslatorOptions
): Promise<Translator>;
export declare function localizePath(
  path: string,
  locale: string,
  supportedLanguages: string[]
): string;
export declare function stripLocale(
  path: string,
  supportedLanguages: string[]
): string;
export declare function createLocaleMiddleware(
  options: RequestTranslatorOptions
): (request: Request) => Response | undefined;
