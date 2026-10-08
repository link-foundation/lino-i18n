import type { I18nCoreInstance, I18nOptions, TOptions } from './index.js';

export interface MessageDescriptor {
  readonly source: string;
  readonly id: string;
  readonly description?: string;
  readonly values?: MessageValues;
}
export type MessageValue =
  | string
  | number
  | bigint
  | boolean
  | Date
  | null
  | undefined
  | { readonly value: unknown; readonly context: string };
export type MessageValues = Record<string, MessageValue>;
export interface MessageTranslator {
  (
    message: string | MessageDescriptor,
    values?: MessageValues,
    options?: TOptions
  ): string;
  (strings: TemplateStringsArray, ...values: MessageValue[]): string;
}
export interface TranslatorOptions extends I18nOptions {
  enabled?: boolean;
  region?: string;
  version?: string;
  loadCatalog?: (
    locale: string,
    options: { version: string }
  ) => Promise<string | Record<string, string>>;
  cache?: {
    get(key: string): unknown | Promise<unknown>;
    set(key: string, table: Record<string, string>): unknown | Promise<unknown>;
  };
  onTrace?: (event: {
    type: 'translation' | 'load';
    locale: string;
    id?: string;
    translated?: boolean;
  }) => void;
}
export interface Translator extends I18nCoreInstance {
  gt: MessageTranslator;
  m: MessageTranslator;
  tx(
    message: string | MessageDescriptor,
    values?: MessageValues,
    options?: TOptions
  ): Promise<string>;
  load(locale: string): Promise<string>;
  switchLocale(locale: string): Promise<string>;
  getEnabled(): boolean;
  setEnabled(enabled: boolean): void;
  getRegion(): string | undefined;
  setRegion(region: string | undefined): void;
  getDefaultLocale(): string;
  getVersion(): string;
  getFormatLocale(): string;
  snapshot(): TranslatorOptions;
}
export declare function createTranslator(
  options?: TranslatorOptions
): Translator;
export declare function msg(
  source: string,
  options?: { id?: string; description?: string; values?: MessageValues }
): MessageDescriptor;
export declare function msg(
  source: readonly string[],
  options?: { id?: string; description?: string; values?: MessageValues }
): readonly MessageDescriptor[];
export declare function declareStatic(
  value: unknown,
  context?: string
): { readonly value: unknown; readonly context: string };
export declare function derive(
  message: string | MessageDescriptor,
  values?: MessageValues
): MessageDescriptor;
export declare function formatMessage(
  source: string,
  values?: MessageValues,
  locale?: string
): string;
