import type { ReactNode, SelectHTMLAttributes } from 'react';
import type { MessageTranslator } from './messages.js';
import type {
  I18nCoreInstance,
  I18nInstance,
  TOptions,
  TParams,
} from './index.js';

export declare function I18nProvider(props: {
  i18n: I18nCoreInstance;
  children?: ReactNode;
}): ReactNode;
export declare function useI18n<T extends I18nCoreInstance = I18nInstance>(): T;
export declare function useLocale(): string;
export declare function useTranslation<
  T extends I18nCoreInstance = I18nInstance,
>(
  keyPrefix?: string
): {
  t(key: string, params?: TParams, options?: TOptions): string;
  i18n: T;
  locale: string;
};
export declare function Trans(props: {
  id: string;
  values?: Record<string, unknown>;
  options?: TOptions;
  fallback?: string;
}): ReactNode;
export declare function LocaleSelector(
  props: SelectHTMLAttributes<HTMLSelectElement> & {
    locales?: string[];
    labels?: Record<string, ReactNode>;
  }
): ReactNode;
export declare function NumberFormat(props: {
  value: number | bigint;
  options?: Intl.NumberFormatOptions;
}): ReactNode;
export declare function DateTimeFormat(props: {
  value: Date | number;
  options?: Intl.DateTimeFormatOptions;
}): ReactNode;
export declare function RelativeTimeFormat(props: {
  value: number;
  unit: Intl.RelativeTimeFormatUnit;
  options?: Intl.RelativeTimeFormatOptions;
}): ReactNode;
export declare function CurrencyFormat(props: {
  value: number | bigint;
  currency: string;
  options?: Intl.NumberFormatOptions;
}): ReactNode;

export interface ContentProps {
  id?: string;
  source?: string;
  children?: ReactNode;
  values?: Record<string, unknown>;
  locale?: string;
  description?: string;
}
export declare function T(props: ContentProps): ReactNode;
export declare function Var(props: {
  name: string;
  children?: ReactNode;
  value?: ReactNode;
}): ReactNode;
export declare function Static(props: {
  name: string;
  children?: ReactNode;
  value?: ReactNode;
}): ReactNode;
export interface PluralProps {
  count: number;
  name?: string;
  locale?: string;
  ordinal?: boolean;
  zero?: ReactNode;
  one?: ReactNode;
  two?: ReactNode;
  few?: ReactNode;
  many?: ReactNode;
  other: ReactNode;
  cases?: Record<string, ReactNode>;
}
export declare function Plural(props: PluralProps): ReactNode;
export declare function Branch(props: {
  value: string | number;
  name?: string;
  cases: Record<string, ReactNode>;
}): ReactNode;
export declare function useGT(): MessageTranslator;
export declare function useMessages(): MessageTranslator;
export declare function useLocales(): string[];
export declare function useSetLocale(): (
  locale: string
) => void | Promise<string>;
export declare function useLocaleDirection(): 'ltr' | 'rtl';
export declare function useRegion(): string | undefined;
export declare function useEnabled(): boolean;
export declare function useFormatLocale(): string;
export declare function useDefaultLocale(): string;
export declare function useLocaleProperties(): ReturnType<
  typeof import('./intl.js').getLocaleProperties
>;
export declare function useSetRegion():
  import('./messages.js').Translator['setRegion'] | undefined;
export declare function useSetEnabled():
  import('./messages.js').Translator['setEnabled'] | undefined;
export declare function ListFormat(props: {
  values: string[];
  options?: Intl.ListFormatOptions;
}): ReactNode;
export declare function RegionSelector(
  props: SelectHTMLAttributes<HTMLSelectElement> & {
    regions: string[];
    labels?: Record<string, ReactNode>;
  }
): ReactNode;
export {
  NumberFormat as Num,
  DateTimeFormat as DateTime,
  CurrencyFormat as Currency,
  RelativeTimeFormat as RelativeTime,
};
