import type { I18nCoreInstance, I18nOptions, TOptions } from './index.js';
import type { LocaleConfig, LocaleConfigOptions } from './intl.js';

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
  | { readonly derived: string | number | boolean }
  | { readonly value: unknown; readonly context: string };
export type MessageValues = Record<string, MessageValue>;
export interface MessageOptions extends TOptions {
  id?: string;
  description?: string;
}
export interface MessageTranslator {
  (
    message: string | MessageDescriptor,
    values?: MessageValues,
    options?: MessageOptions
  ): string;
  (strings: TemplateStringsArray, ...values: MessageValue[]): string;
}
export interface TranslatorOptions extends I18nOptions {
  dictionary?: DictionarySchema;
  localeConfig?: LocaleConfig | LocaleConfigOptions;
  sourceLocale?: string;
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
  dictionary: DictionaryFunction;
  dictionaryObject(
    prefix?: string,
    values?: MessageValues,
    options?: TOptions
  ): DictionaryObject;
  dictionaryTree(
    prefix?: string,
    values?: MessageValues,
    options?: TOptions
  ): DictionaryTree;
  tx(
    message: string | MessageDescriptor,
    values?: MessageValues,
    options?: MessageOptions
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
  getLocaleConfig(): LocaleConfig;
  snapshot(): TranslatorOptions;
}
export declare function createTranslator(
  options?: TranslatorOptions
): Translator;
export interface DictionaryObject {
  [key: string]: string | DictionaryObject;
}
export type DictionarySchema =
  | string
  | readonly DictionarySchema[]
  | {
      readonly [key: string]: DictionarySchema;
    };
export type DictionaryTree =
  string | DictionaryTree[] | { [key: string]: DictionaryTree };
export interface DictionaryFunction {
  (key: string, values?: MessageValues, options?: TOptions): string;
  obj(
    prefix?: string,
    values?: MessageValues,
    options?: TOptions
  ): DictionaryTree;
}
export type TranslatedDictionary<T> = T extends string
  ? string
  : {
      -readonly [K in keyof T]: TranslatedDictionary<T[K]>;
    };
export type ReadonlyDictionary<T> = T extends string
  ? T
  : {
      readonly [K in keyof T]: ReadonlyDictionary<T[K]>;
    };
export type DictionaryPath<
  T,
  Depth extends unknown[] = [],
> = Depth['length'] extends 8
  ? never
  : T extends string
    ? never
    : T extends readonly (infer Element)[]
      ? | `${number}`
        | `${number}.${DictionaryPath<Element, [...Depth, unknown]>}`
      : {
          [K in keyof T & string]:
            K | `${K}.${DictionaryPath<T[K], [...Depth, unknown]>}`;
        }[keyof T & string];
export type DictionaryAt<
  T,
  Path extends string,
> = Path extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? DictionaryAt<T[Key], Rest>
    : T extends readonly (infer Element)[]
      ? DictionaryAt<Element, Rest>
      : never
  : Path extends keyof T
    ? T[Path]
    : T extends readonly (infer Element)[]
      ? Element
      : never;
export type TypedTranslator<T> = Omit<Translator, 'dictionaryTree'> & {
  dictionaryTree(
    prefix?: '',
    values?: MessageValues,
    options?: TOptions
  ): TranslatedDictionary<T>;
  dictionaryTree<Path extends DictionaryPath<T>>(
    prefix: Path,
    values?: MessageValues,
    options?: TOptions
  ): TranslatedDictionary<DictionaryAt<T, Path>>;
};
export declare function defineDictionary<
  const T extends Exclude<DictionarySchema, string>,
>(schema: T): ReadonlyDictionary<T>;
export declare function createDictionaryTranslator<
  const T extends Exclude<DictionarySchema, string>,
>(schema: T, options?: TranslatorOptions): TypedTranslator<T>;
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
export declare function derive(value: string | number | boolean): {
  readonly derived: string | number | boolean;
};
export declare function bindMessage(
  message: string | MessageDescriptor,
  values?: MessageValues
): MessageDescriptor;
export declare function formatMessage(
  source: string,
  values?: MessageValues,
  locale?: string
): string;
