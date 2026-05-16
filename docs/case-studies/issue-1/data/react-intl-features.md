# react-intl / FormatJS — Feature Inventory

Captured from https://formatjs.io and the
[`formatjs/formatjs`](https://github.com/formatjs/formatjs) monorepo.

## Core translation API

- `<IntlProvider locale="en" messages={messages}>` provides catalogues.
- `<FormattedMessage id="cart.items" values={{ count }}/>` for inline use.
- `useIntl().formatMessage({ id }, values)` for programmatic use.
- AST messages compiled from ICU MessageFormat via `formatjs compile`.

## File format

- JSON object `{ [id]: <ICU template> }` (compiled form: `{ [id]: AST }`).
- IDs are flat strings, often prefixed for namespacing (`cart.title`).

## Interpolation

- ICU MessageFormat `{var}`.
- Rich-text placeholders: `<b>{name}</b>` becomes a React node.

## Plurals & select

- ICU `plural`, `selectordinal`, `select`.
- `{count, plural, one {# item} other {# items}}`.
- `{gender, select, male {he} female {she} other {they}}`.

## Formatting

- `formatNumber`, `formatDate`, `formatTime`, `formatRelativeTime`,
  `formatPlural`, `formatList`, `formatDisplayName` (all delegate to
  `Intl.*`).
- Per-locale custom formats.

## Things we adopt

- ICU-style `{var}` interpolation alongside `{{var}}`.
- Pre-compilation step (optional via the CLI).
- Delegating number/date helpers to `Intl.*`.

## Things we intentionally drop

- Full ICU MessageFormat AST: at 0.0.1 we only implement `plural` and
  variable substitution. The structure leaves room to add `select` later.
- React-specific runtime: we provide a thin `useTranslation` hook but do
  not depend on React.
