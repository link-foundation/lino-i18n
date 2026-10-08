// No React context or mutable singleton: suitable for Server Components and SSG.
import {
  renderContent,
  selectPlural,
  Plural as PluralMarker,
} from './react-content.js';
export { Var, Static, Branch } from './react-content.js';

export function T({ i18n, ...props }) {
  if (!i18n) {
    throw new TypeError('Server T requires a request-scoped i18n instance');
  }
  return renderContent(i18n, props);
}

export async function Tx({ i18n, ...props }) {
  await i18n.load(props.locale || i18n.getLocale());
  return T({ i18n, ...props });
}

export function Plural({ i18n, ...props }) {
  return selectPlural(props.locale || i18n.getLocale(), props);
}
Plural.contentMarker = PluralMarker;
