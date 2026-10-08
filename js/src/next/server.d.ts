import type { ReactNode } from 'react';
import type { Translator, MessageTranslator } from '../messages.js';
import type { RequestTranslatorOptions } from '../server.js';
import type { ContentProps } from '../react.js';
export { Var, Static, Branch, Derive, Plural } from '../react-server.js';
export interface NextI18n {
  getTranslator(locale?: string): Promise<Translator>;
  getGT(locale?: string): Promise<MessageTranslator>;
  getMessages(locale?: string): Promise<MessageTranslator>;
  getLocale(): Promise<string>;
  getTranslations(
    prefix?: string,
    locale?: string
  ): Promise<Translator['dictionary']>;
  T(props: ContentProps): Promise<ReactNode>;
  Tx(props: ContentProps): Promise<ReactNode>;
  generateStaticParams(): Array<{ locale: string }>;
  getMetadata(
    path: string,
    origin: string,
    locale?: string
  ): {
    alternates: { canonical: string; languages: Record<string, string> };
  };
}
export declare function createNextI18n(
  options: RequestTranslatorOptions
): NextI18n;
