//! `lino-i18n`: a universal internationalisation runtime that stores
//! translation catalogues as Links Notation (`.lino`) text files.
//!
//! The library covers the features users expect from `i18next`, `i18n-js`
//! and `react-intl` (interpolation, CLDR plurals, context/gender suffixes,
//! namespaces, fallback chains) while keeping the catalogue file format
//! human-friendly and diff-friendly.
//!
//! # Quick start
//!
//! ```
//! use lino_i18n::I18n;
//!
//! let mut i18n = I18n::new("en");
//! i18n.add_translations(
//!     "en",
//!     [
//!         ("greeting", "Hello, {{name}}!"),
//!         ("cart.items_one", "{{count}} item"),
//!         ("cart.items_other", "{{count}} items"),
//!     ],
//! );
//!
//! assert_eq!(
//!     i18n.t("greeting", &[("name", "World")]),
//!     "Hello, World!"
//! );
//! assert_eq!(
//!     i18n.t_count("cart.items", 5, &[("count", "5")]),
//!     "5 items"
//! );
//! ```
//!
//! # Compile-time loading
//!
//! Enable the default `macros` feature and use [`i18n!`] to embed every
//! `.lino` file in a directory at compile time. See the macro's
//! documentation for details.

mod format;
mod i18n;
mod loader;
mod plurals;

pub use format::interpolate;
pub use i18n::{I18n, MissingKeyHandler, TOptions};
pub use loader::{
    expand_compatibility_aliases, format_lino_catalog, load_lino_catalog, load_lino_catalogs,
    load_lino_directory, parse_lino_catalog, parse_lino_catalogs, Catalogue, CompatibilityAlias,
    LoaderError,
};
pub use plurals::{plural_category, plural_suffix, PluralCategory};

#[cfg(feature = "macros")]
pub use lino_i18n_macros::i18n;
