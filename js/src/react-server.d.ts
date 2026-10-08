import type { ReactNode } from 'react';
import type { I18nCoreInstance } from './index.js';
import type { Translator } from './messages.js';
import type { ContentProps, PluralProps } from './react.js';
export { Var, Static, Branch, Derive } from './react.js';
export declare function T(
  props: ContentProps & { i18n: I18nCoreInstance }
): ReactNode;
export declare function Tx(
  props: ContentProps & { i18n: Translator }
): Promise<ReactNode>;
export declare function Plural(
  props: PluralProps & { i18n: I18nCoreInstance }
): ReactNode;
