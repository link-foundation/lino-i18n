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

export interface LocaleConfigOptions {
  defaultLocale?: string;
  locales?: string[];
  aliases?: Record<string, string>;
  customMapping?: Record<
    string,
    | string
    | {
        code?: string;
        name?: string;
        emoji?: string;
        direction?: 'ltr' | 'rtl';
      }
  >;
}
export type WithLocales<T> = T & { locales?: string | string[] };
export declare class LocaleConfig {
  constructor(options?: LocaleConfigOptions);
  readonly defaultLocale: string;
  readonly locales: readonly string[];
  readonly customMapping: Readonly<
    NonNullable<LocaleConfigOptions['customMapping']>
  >;
  readonly aliases: Readonly<Record<string, string>>;
  snapshot(): LocaleConfigOptions;
  resolveCanonicalLocale(locale: string): string;
  resolveAliasLocale(locale: string): string;
  isValidLocale(locale: string): boolean;
  determineLocale(
    candidates: string | string[],
    approvedLocales?: readonly string[]
  ): string | undefined;
  requiresTranslation(
    target: string,
    source?: string,
    approvedLocales?: readonly string[]
  ): boolean;
  isSameLanguage(a: string, b: string): boolean;
  isSameDialect(a: string, b: string): boolean;
  isSupersetLocale(a: string, b: string): boolean;
  getLocaleDirection(locale: string): 'ltr' | 'rtl';
  getLocaleName(locale: string, displayLocale?: string): string | undefined;
  getLocaleEmoji(locale: string): string;
  getLocaleProperties(
    locale: string,
    displayLocale?: string
  ): ReturnType<typeof getLocaleProperties>;
  formatNum(
    value: number | bigint,
    locale?: string,
    options?: WithLocales<Intl.NumberFormatOptions>
  ): string;
  formatCurrency(
    value: number | bigint,
    currency: string,
    locale?: string,
    options?: WithLocales<Intl.NumberFormatOptions>
  ): string;
  formatDateTime(
    value: Date | number,
    locale?: string,
    options?: WithLocales<Intl.DateTimeFormatOptions>
  ): string;
  formatList(
    values: string[],
    locale?: string,
    options?: WithLocales<Intl.ListFormatOptions>
  ): string;
  formatListToParts(
    values: string[],
    locale?: string,
    options?: WithLocales<Intl.ListFormatOptions>
  ): ReturnType<typeof formatListToParts>;
  formatRelativeTime(
    value: number,
    unit: Intl.RelativeTimeFormatUnit,
    locale?: string,
    options?: WithLocales<Intl.RelativeTimeFormatOptions>
  ): string;
  formatRelativeTimeFromDate(
    value: Date | number | string,
    locale: string | undefined,
    options: WithLocales<Intl.RelativeTimeFormatOptions> & {
      baseDate: Date | number | string;
    }
  ): string;
  formatCutoff(
    value: string,
    locale: string | undefined,
    options: { length: number; suffix?: string; locales?: string | string[] }
  ): string;
}
export declare function isSupersetLocale(
  superLocale: string,
  subLocale: string
): boolean;
export declare function determineLocale(
  candidates: string | string[],
  approvedLocales: string[]
): string | undefined;
export declare function requiresTranslation(
  target: string,
  source?: string,
  approvedLocales?: string[]
): boolean;
