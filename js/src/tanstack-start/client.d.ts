import type { ReactNode, SelectHTMLAttributes } from 'react';
import type { LinkProps } from '@tanstack/react-router';
import type { Translator } from '../messages.js';
export * from '../react.js';
export declare function TanStackI18nProvider(props: {
  snapshot: ReturnType<Translator['snapshot']>;
  cookieName?: string;
  children?: ReactNode;
}): ReactNode;
export declare function useSetLocale(): (locale: string) => Promise<void>;
export declare function LocaleSelector(
  props: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value'> & {
    locales?: string[];
    labels?: Record<string, string>;
    onError?: (error: unknown) => void;
  }
): ReactNode;
export declare function LocaleLink(
  props: LinkProps & { locale?: string; children?: ReactNode }
): ReactNode;
