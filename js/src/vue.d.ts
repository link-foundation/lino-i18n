import type {
  ComputedRef,
  DefineComponent,
  Plugin,
  SelectHTMLAttributes,
} from 'vue';
import type {
  Translator,
  TranslatorOptions,
  MessageTranslator,
} from './messages.js';

export declare function createVueI18n(
  options?: TranslatorOptions & { i18n?: Translator }
): Plugin & {
  i18n: Translator;
  gt: MessageTranslator;
  m: MessageTranslator;
  initialize(): Promise<string>;
};
export declare function useI18n(): Translator;
export declare function useLocale(): ComputedRef<string>;
export declare function useLocales(): ComputedRef<string[]>;
export declare function useRegion(): ComputedRef<string | undefined>;
export declare function useEnabled(): ComputedRef<boolean>;
export declare function useDefaultLocale(): ComputedRef<string>;
export declare function useLocaleDirection(): ComputedRef<'ltr' | 'rtl'>;
export declare function useLocaleProperties(): ComputedRef<
  ReturnType<ReturnType<Translator['getLocaleConfig']>['getLocaleProperties']>
>;
export declare function useSetLocale(): Translator['switchLocale'];
export declare function useSetRegion(): Translator['setRegion'];
export declare function useSetEnabled(): Translator['setEnabled'];
export declare function useGT(): MessageTranslator;
export { useGT as useMessages };
export declare function useTranslations(
  prefix?: string
): Translator['dictionary'];

export declare const T: DefineComponent<{
  id?: string;
  source?: string;
  values?: Record<string, unknown>;
  locale?: string;
  description?: string;
}>;
export declare const Var: DefineComponent<{ name: string; value?: unknown }>;
export { Var as Static };
export declare const Derive: DefineComponent;
export declare const Branch: DefineComponent<{
  name?: string;
  value: string | number;
  cases?: Record<string, unknown>;
}>;
export declare const Plural: DefineComponent<{
  name?: string;
  count: number;
  ordinal?: boolean;
  locale?: string;
  cases?: Record<string, unknown>;
  zero?: unknown;
  one?: unknown;
  two?: unknown;
  few?: unknown;
  many?: unknown;
  other?: unknown;
}>;
export declare const NumberFormat: DefineComponent<{
  value: number | bigint;
  locale?: string;
  options?: Intl.NumberFormatOptions;
}>;
export declare const CurrencyFormat: DefineComponent<{
  value: number | bigint;
  currency: string;
  locale?: string;
  options?: Intl.NumberFormatOptions;
}>;
export declare const DateTimeFormat: DefineComponent<{
  value: number | Date;
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
}>;
export declare const RelativeTimeFormat: DefineComponent<{
  value: number;
  unit: Intl.RelativeTimeFormatUnit;
  locale?: string;
  options?: Intl.RelativeTimeFormatOptions;
}>;
export declare const RelativeDate: DefineComponent<{
  value: number | string | Date;
  now: number | string | Date;
  locale?: string;
  options?: Intl.RelativeTimeFormatOptions;
}>;
export declare const ListFormat: DefineComponent<{
  values: string[];
  locale?: string;
  options?: Intl.ListFormatOptions;
}>;
export declare const LocaleSelector: DefineComponent<
  SelectHTMLAttributes & {
    locales?: string[];
    labels?: Record<string, string>;
    onError?: (error: unknown) => void;
  }
>;
export declare const RegionSelector: DefineComponent<
  SelectHTMLAttributes & {
    regions: string[];
    labels?: Record<string, string>;
    onError?: (error: unknown) => void;
  }
>;
export {
  NumberFormat as Num,
  CurrencyFormat as Currency,
  DateTimeFormat as DateTime,
  RelativeTimeFormat as RelativeTime,
};
