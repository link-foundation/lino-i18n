import type { ComponentType, ReactNode } from 'react';
import type { Translator, TranslatorOptions } from './messages.js';
import type { ContentProps } from './react.js';
export {
  Var,
  Static,
  Derive,
  Branch,
  Plural,
  useGT,
  useMessages,
  useTranslations,
  useTranslation,
  useI18n,
  useLocale,
  useLocales,
  useSetLocale,
  useDefaultLocale,
  useLocaleDirection,
  useLocaleProperties,
  useRegion,
  useSetRegion,
  useEnabled,
  useSetEnabled,
  useFormatLocale,
} from './react.js';
export interface NativeStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): unknown | Promise<unknown>;
}
export interface NativeOptions<TextProps> extends TranslatorOptions {
  Text: ComponentType<TextProps>;
  richComponents?: ComponentType<never>[];
  storage?: NativeStorage;
  storageKey?: string;
  i18n?: Translator;
}
type NativeFormatter<Properties, TextProps> = (
  props: Properties & { textProps?: TextProps }
) => ReactNode;
export interface NativeI18n<TextProps> {
  i18n: Translator;
  initialize(): Promise<string>;
  switchLocale(locale: string): Promise<string>;
  Provider(props: { children?: ReactNode }): ReactNode;
  T(props: ContentProps & { textProps?: TextProps }): ReactNode;
  Var: typeof import('./react.js').Var;
  Static: typeof import('./react.js').Static;
  Derive: typeof import('./react.js').Derive;
  Branch: typeof import('./react.js').Branch;
  Plural: typeof import('./react.js').Plural;
  Num: NativeFormatter<
    Parameters<typeof import('./react.js').Num>[0],
    TextProps
  >;
  Currency: NativeFormatter<
    Parameters<typeof import('./react.js').Currency>[0],
    TextProps
  >;
  DateTime: NativeFormatter<
    Parameters<typeof import('./react.js').DateTime>[0],
    TextProps
  >;
  RelativeTime: NativeFormatter<
    Parameters<typeof import('./react.js').RelativeTime>[0],
    TextProps
  >;
  RelativeDate: NativeFormatter<
    Parameters<typeof import('./react.js').RelativeDate>[0],
    TextProps
  >;
  List: NativeFormatter<
    Parameters<typeof import('./react.js').ListFormat>[0],
    TextProps
  >;
  useLocaleSelector(locales?: string[]): {
    locale: string;
    locales: string[];
    setLocale(locale: string): Promise<string>;
    direction: 'ltr' | 'rtl';
  };
  useRegionSelector(regions?: string[]): {
    region: string | undefined;
    regions: string[];
    setRegion: Translator['setRegion'];
    locale: string;
    setLocale(locale: string): Promise<string>;
  };
}
export declare function createNativeI18n<TextProps>(
  options: NativeOptions<TextProps>
): NativeI18n<TextProps>;
