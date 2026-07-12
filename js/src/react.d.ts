import type { ReactNode, SelectHTMLAttributes } from 'react';
import type { I18nInstance, TOptions, TParams } from './index.js';

export declare function I18nProvider(props: {
  i18n: I18nInstance;
  children?: ReactNode;
}): ReactNode;
export declare function useI18n(): I18nInstance;
export declare function useLocale(): string;
export declare function useTranslation(keyPrefix?: string): {
  t(key: string, params?: TParams, options?: TOptions): string;
  i18n: I18nInstance;
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
