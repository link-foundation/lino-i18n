import type {
  ReactNode,
  SelectHTMLAttributes,
  AnchorHTMLAttributes,
} from 'react';
import type { LinkProps } from 'next/link.js';
import type { TranslatorOptions } from '../messages.js';
export {
  I18nProvider,
  Trans,
  T,
  Var,
  Static,
  Branch,
  Plural,
  Derive,
  NumberFormat,
  CurrencyFormat,
  DateTimeFormat,
  RelativeTimeFormat,
  Num,
  Currency,
  DateTime,
  RelativeTime,
  RelativeDate,
  ListFormat,
  RegionSelector,
  useI18n,
  useGT,
  useMessages,
  useTranslations,
  useLocale,
  useLocales,
  useDefaultLocale,
  useLocaleDirection,
  useLocaleProperties,
  useFormatLocale,
  useEnabled,
  useSetEnabled,
  useRegion,
  useSetRegion,
  useTranslation,
} from '../react.js';
export declare function NextI18nProvider(props: {
  snapshot: TranslatorOptions;
  cookieName?: string;
  children?: ReactNode;
}): ReactNode;
export declare function useSetLocale(): (locale: string) => Promise<void>;
export declare function LocaleSelector(
  props: SelectHTMLAttributes<HTMLSelectElement> & {
    locales?: string[];
    labels?: Record<string, ReactNode>;
    onError?: (error: unknown) => void;
  }
): ReactNode;
export declare function LocaleLink(
  props: Omit<LinkProps, 'locale'> &
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
      locale?: string;
    }
): ReactNode;
