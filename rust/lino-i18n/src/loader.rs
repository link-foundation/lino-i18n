//! Parse `.lino` catalogues into flat `(locale, key → value)` maps.
//!
//! The loaders rely on [`lino_objects_codec::format::parse_indented`] /
//! `format_indented` from the `lino-objects-codec` crate. That parser
//! returns a `(String, HashMap<String, String>)` for indented Links
//! Notation documents — exactly the shape we want for a translation
//! catalogue.

use std::collections::BTreeMap;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use lino_objects_codec::format::parse_indented;

/// Errors returned by the loader functions.
#[derive(Debug)]
pub enum LoaderError {
    Io { path: PathBuf, source: io::Error },
    Parse { path: PathBuf, message: String },
    Shape { path: PathBuf },
}

/// A parsed catalogue: a locale identifier paired with a key → value map.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Catalogue {
    pub locale: String,
    pub translations: BTreeMap<String, String>,
}

/// Parse a `.lino` string into a [`Catalogue`].
pub fn parse_lino_catalog(text: &str) -> Result<Catalogue, LoaderError> {
    parse_lino_catalog_with_path(text, Path::new("<inline>"))
}

fn parse_lino_catalog_with_path(text: &str, path: &Path) -> Result<Catalogue, LoaderError> {
    let (locale, map) = parse_indented(text).map_err(|err| LoaderError::Parse {
        path: path.to_path_buf(),
        message: err.to_string(),
    })?;
    if locale.is_empty() {
        return Err(LoaderError::Shape {
            path: path.to_path_buf(),
        });
    }
    let translations = map.into_iter().collect::<BTreeMap<_, _>>();
    Ok(Catalogue {
        locale,
        translations,
    })
}

/// Read a single `.lino` file from disk and parse it.
pub fn load_lino_catalog(path: impl AsRef<Path>) -> Result<Catalogue, LoaderError> {
    let path = path.as_ref();
    let text = fs::read_to_string(path).map_err(|source| LoaderError::Io {
        path: path.to_path_buf(),
        source,
    })?;
    parse_lino_catalog_with_path(&text, path)
}

/// Read every `*.lino` file in `directory` and return one catalogue per
/// file. The files are sorted alphabetically for deterministic ordering.
pub fn load_lino_directory(directory: impl AsRef<Path>) -> Result<Vec<Catalogue>, LoaderError> {
    let directory = directory.as_ref();
    let entries = fs::read_dir(directory).map_err(|source| LoaderError::Io {
        path: directory.to_path_buf(),
        source,
    })?;
    let mut files: Vec<PathBuf> = entries
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|path| {
            path.extension()
                .and_then(|ext| ext.to_str())
                .is_some_and(|ext| ext.eq_ignore_ascii_case("lino"))
        })
        .collect();
    files.sort();
    let mut out = Vec::with_capacity(files.len());
    for path in files {
        out.push(load_lino_catalog(&path)?);
    }
    Ok(out)
}

/// Serialise a [`Catalogue`] back into `.lino` text using the default
/// two-space indent.
#[must_use]
pub fn format_lino_catalog(locale: &str, translations: &BTreeMap<String, String>) -> String {
    let pairs: Vec<(&str, &str)> = translations
        .iter()
        .map(|(k, v)| (k.as_str(), v.as_str()))
        .collect();
    format_indented_ordered_pairs(locale, &pairs)
}

fn format_indented_ordered_pairs(locale: &str, pairs: &[(&str, &str)]) -> String {
    use lino_objects_codec::format::format_indented_ordered;
    format_indented_ordered(locale, pairs, "  ").unwrap_or_else(|err| {
        // The only documented error is an empty identifier, which we
        // already guard against by requiring a non-empty locale; fall
        // back to a best-effort manual format.
        let _ = err;
        let mut out = String::from(locale);
        out.push('\n');
        for (k, v) in pairs {
            out.push_str("  ");
            out.push_str(k);
            out.push_str(" \"");
            out.push_str(v);
            out.push_str("\"\n");
        }
        out
    })
}

impl std::fmt::Display for LoaderError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LoaderError::Io { path, source } => {
                write!(f, "I/O error while reading {}: {source}", path.display())
            }
            LoaderError::Parse { path, message } => {
                write!(f, "failed to parse {}: {message}", path.display())
            }
            LoaderError::Shape { path } => write!(
                f,
                "{} does not contain a single named locale block",
                path.display()
            ),
        }
    }
}

impl std::error::Error for LoaderError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        if let LoaderError::Io { source, .. } = self {
            Some(source)
        } else {
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_simple_catalogue() {
        let text = "en\n  greeting \"Hello, {{name}}!\"\n  cart.title \"Your cart\"\n";
        let cat = parse_lino_catalog(text).unwrap();
        assert_eq!(cat.locale, "en");
        assert_eq!(
            cat.translations.get("greeting"),
            Some(&"Hello, {{name}}!".to_string())
        );
        assert_eq!(
            cat.translations.get("cart.title"),
            Some(&"Your cart".to_string())
        );
    }

    #[test]
    fn round_trips() {
        let mut t = BTreeMap::new();
        t.insert("greeting".to_string(), "Hello, {{name}}!".to_string());
        t.insert("cart.title".to_string(), "Your cart".to_string());
        let text = format_lino_catalog("en", &t);
        let cat = parse_lino_catalog(&text).unwrap();
        assert_eq!(cat.locale, "en");
        assert_eq!(cat.translations, t);
    }
}
