export declare function formatNum(
  value: number | bigint,
  locale?: string,
  options?: Intl.NumberFormatOptions
): string;
export declare function formatCurrency(
  value: number | bigint,
  currency: string,
  locale?: string,
  options?: Intl.NumberFormatOptions
): string;
export declare function formatDateTime(
  value: Date | number,
  locale?: string,
  options?: Intl.DateTimeFormatOptions
): string;
export declare function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale?: string,
  options?: Intl.RelativeTimeFormatOptions
): string;
export declare function formatRelativeTimeFromDate(
  value: Date | number | string,
  now: Date | number | string,
  locale?: string,
  options?: Intl.RelativeTimeFormatOptions
): string;
export declare function formatList(
  values: string[],
  locale?: string,
  options?: Intl.ListFormatOptions
): string;
export declare function formatListToParts(
  values: string[],
  locale?: string,
  options?: Intl.ListFormatOptions
): Array<{ type: 'element' | 'literal'; value: string }>;
export declare function formatCutoff(
  text: string,
  length: number,
  locale?: string,
  suffix?: string
): string;
export declare function resolveCanonicalLocale(locale: string): string;
export declare function isValidLocale(locale: string): boolean;
export declare function isSameLanguage(a: string, b: string): boolean;
export declare function isSameDialect(a: string, b: string): boolean;
export declare function getLocaleDirection(locale: string): 'ltr' | 'rtl';
export declare function getLocaleName(
  locale: string,
  displayLocale?: string
): string | undefined;
export declare function getLocaleEmoji(locale: string): string;
export declare function getRegionProperties(
  region: string,
  displayLocale?: string
): { code: string; name: string | undefined };
export declare function getLocaleProperties(
  locale: string,
  displayLocale?: string
): {
  locale: string;
  language: string;
  script: string | undefined;
  region: string | undefined;
  name: string | undefined;
  direction: 'ltr' | 'rtl';
  emoji: string;
};
