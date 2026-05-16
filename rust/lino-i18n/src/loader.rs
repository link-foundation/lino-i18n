//! Parse `.lino` catalogues into flat `(locale, key → value)` maps.
//!
//! The authoring format is an i18n-focused subset of indented Links
//! Notation. Top-level blocks are locale identifiers, nested blocks become
//! dotted keys, and selector blocks become suffix keys such as
//! `cart.items_one` and `role_female`.

use std::collections::BTreeMap;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

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

#[derive(Debug, Clone, PartialEq, Eq)]
enum TreeValue {
    Leaf(String),
    Branch(TreeMap),
}

type TreeMap = BTreeMap<String, TreeValue>;
type LocaleTree = (String, TreeMap);

#[derive(Debug, Clone, PartialEq, Eq)]
struct LogicalLine {
    indent: usize,
    key: String,
    value: Option<String>,
}

const SELECTOR_SUFFIXES: &[&str] = &[
    "zero", "one", "two", "few", "many", "other", "male", "female", "neutral",
];

/// Parse a `.lino` string into a [`Catalogue`].
pub fn parse_lino_catalog(text: &str) -> Result<Catalogue, LoaderError> {
    parse_lino_catalog_with_path(text, Path::new("<inline>"))
}

/// Parse every top-level locale block in a `.lino` string.
pub fn parse_lino_catalogs(text: &str) -> Result<Vec<Catalogue>, LoaderError> {
    parse_lino_catalogs_with_path(text, Path::new("<inline>"))
}

fn parse_lino_catalog_with_path(text: &str, path: &Path) -> Result<Catalogue, LoaderError> {
    let mut catalogues = parse_lino_catalogs_with_path(text, path)?;
    if catalogues.is_empty() {
        return Err(LoaderError::Shape {
            path: path.to_path_buf(),
        });
    }
    Ok(catalogues.remove(0))
}

fn parse_lino_catalogs_with_path(text: &str, path: &Path) -> Result<Vec<Catalogue>, LoaderError> {
    let roots = parse_locale_trees(text, path)?;
    let mut catalogues = Vec::with_capacity(roots.len());
    for (locale, tree) in roots {
        if locale.is_empty() {
            return Err(LoaderError::Shape {
                path: path.to_path_buf(),
            });
        }
        let mut translations = BTreeMap::new();
        flatten_tree(&tree, &[], &mut translations);
        catalogues.push(Catalogue {
            locale,
            translations,
        });
    }
    Ok(catalogues)
}

fn parse_error(path: &Path, message: impl Into<String>) -> LoaderError {
    LoaderError::Parse {
        path: path.to_path_buf(),
        message: message.into(),
    }
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

/// Read a `.lino` file that may contain multiple top-level locale blocks.
pub fn load_lino_catalogs(path: impl AsRef<Path>) -> Result<Vec<Catalogue>, LoaderError> {
    let path = path.as_ref();
    let text = fs::read_to_string(path).map_err(|source| LoaderError::Io {
        path: path.to_path_buf(),
        source,
    })?;
    parse_lino_catalogs_with_path(&text, path)
}

/// Read every `*.lino` file in `directory` and return one catalogue per
/// top-level locale block. The files are sorted alphabetically for
/// deterministic ordering.
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
        out.extend(load_lino_catalogs(&path)?);
    }
    Ok(out)
}

/// Serialise a [`Catalogue`] back into `.lino` text using the default
/// two-space indent.
#[must_use]
pub fn format_lino_catalog(locale: &str, translations: &BTreeMap<String, String>) -> String {
    let tree = translations_to_tree(translations);
    let mut lines = vec![locale.to_string()];
    format_tree_lines(&tree, "  ", &mut lines);
    lines.join("\n")
}

fn is_selector_suffix(value: &str) -> bool {
    SELECTOR_SUFFIXES.contains(&value)
}

fn count_indent(line: &str) -> usize {
    let mut count = 0;
    for ch in line.chars() {
        match ch {
            ' ' => count += 1,
            '\t' => count += 2,
            _ => break,
        }
    }
    count
}

fn strip_content_indent(line: &str, indent: usize) -> &str {
    let mut remaining = indent;
    let mut index = 0;
    for (offset, ch) in line.char_indices() {
        match ch {
            ' ' if remaining > 0 => {
                remaining -= 1;
                index = offset + ch.len_utf8();
            }
            '\t' if remaining > 0 => {
                remaining = remaining.saturating_sub(2);
                index = offset + ch.len_utf8();
            }
            _ => break,
        }
    }
    &line[index..]
}

fn find_closing_quote(value: &str, quote: char, start: usize) -> Option<usize> {
    let mut escaped = false;
    for (index, ch) in value.char_indices().skip_while(|(index, _)| *index < start) {
        if escaped {
            escaped = false;
            continue;
        }
        if ch == '\\' {
            escaped = true;
            continue;
        }
        if ch == quote {
            return Some(index);
        }
    }
    None
}

fn unescape_value(value: &str, quote: char) -> String {
    let mut out = String::with_capacity(value.len());
    let mut chars = value.chars();
    while let Some(ch) = chars.next() {
        if ch != '\\' {
            out.push(ch);
            continue;
        }
        match chars.next() {
            Some('n') => out.push('\n'),
            Some('r') => out.push('\r'),
            Some('t') => out.push('\t'),
            Some('\\') | None => out.push('\\'),
            Some(next) if next == quote => out.push(quote),
            Some(next) => {
                out.push('\\');
                out.push(next);
            }
        }
    }
    out
}

fn escape_value(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for ch in value.chars() {
        match ch {
            '\\' => out.push_str("\\\\"),
            '"' => out.push_str("\\\""),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            _ => out.push(ch),
        }
    }
    out
}

fn parse_triple_quoted_value(
    lines: &[&str],
    index: usize,
    rest: &str,
    indent: usize,
    path: &Path,
) -> Result<(String, usize), LoaderError> {
    let same_line = &rest[3..];
    if !same_line.trim().is_empty() {
        if let Some(closing) = same_line.rfind("\"\"\"") {
            return Ok((same_line[..closing].to_string(), index + 1));
        }
    }

    let mut value_lines = Vec::new();
    let content_indent = indent + 2;
    for (current, raw) in lines.iter().enumerate().skip(index + 1) {
        if raw.trim() == "\"\"\"" {
            return Ok((value_lines.join("\n"), current + 1));
        }
        value_lines.push(strip_content_indent(raw, content_indent).to_string());
    }
    Err(parse_error(path, "unterminated multiline string"))
}

fn parse_quoted_value(
    lines: &[&str],
    index: usize,
    rest: &str,
    indent: usize,
    path: &Path,
) -> Result<(String, usize), LoaderError> {
    if rest.starts_with("\"\"\"") {
        return parse_triple_quoted_value(lines, index, rest, indent, path);
    }

    let quote = rest.chars().next().unwrap_or('"');
    if let Some(closing) = find_closing_quote(rest, quote, 1) {
        return Ok((unescape_value(&rest[1..closing], quote), index + 1));
    }

    let mut chunks = vec![rest[1..].to_string()];
    for (current, raw) in lines.iter().enumerate().skip(index + 1) {
        if let Some(closing) = find_closing_quote(raw, quote, 0) {
            chunks.push(raw[..closing].to_string());
            return Ok((unescape_value(&chunks.join("\n"), quote), current + 1));
        }
        chunks.push((*raw).to_string());
    }
    Err(parse_error(path, "unterminated quoted string"))
}

fn parse_logical_lines(text: &str, path: &Path) -> Result<Vec<LogicalLine>, LoaderError> {
    let normalized = text.replace("\r\n", "\n");
    let lines: Vec<&str> = normalized.lines().collect();
    let mut entries = Vec::new();
    let mut index = 0;

    while index < lines.len() {
        let content = lines[index].trim_end();
        let trimmed = content.trim_start();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            index += 1;
            continue;
        }

        let indent = count_indent(content);
        let mut parts = trimmed.splitn(2, char::is_whitespace);
        let mut key = parts.next().unwrap_or_default().to_string();
        let rest = parts.next().map(str::trim_start);
        if rest.is_none() && key.ends_with(':') {
            key.pop();
        }

        if let Some(rest) = rest {
            if rest.starts_with('"') || rest.starts_with('\'') {
                let (value, next_index) = parse_quoted_value(&lines, index, rest, indent, path)?;
                entries.push(LogicalLine {
                    indent,
                    key,
                    value: Some(value),
                });
                index = next_index;
            } else {
                entries.push(LogicalLine {
                    indent,
                    key,
                    value: Some(unescape_value(rest.trim(), '"')),
                });
                index += 1;
            }
        } else {
            entries.push(LogicalLine {
                indent,
                key,
                value: None,
            });
            index += 1;
        }
    }

    Ok(entries)
}

fn parse_entries_at(
    lines: &[LogicalLine],
    start: usize,
    indent: usize,
    path: &Path,
) -> Result<(TreeMap, usize), LoaderError> {
    let mut tree = BTreeMap::new();
    let mut index = start;

    while index < lines.len() {
        let line = &lines[index];
        if line.indent < indent {
            break;
        }
        if line.indent > indent {
            return Err(parse_error(
                path,
                format!("unexpected indentation before {}", line.key),
            ));
        }

        index += 1;
        if let Some(value) = &line.value {
            tree.insert(line.key.clone(), TreeValue::Leaf(value.clone()));
        } else if index < lines.len() && lines[index].indent > line.indent {
            let (children, next_index) = parse_entries_at(lines, index, lines[index].indent, path)?;
            tree.insert(line.key.clone(), TreeValue::Branch(children));
            index = next_index;
        } else {
            tree.insert(line.key.clone(), TreeValue::Branch(BTreeMap::new()));
        }
    }

    Ok((tree, index))
}

fn parse_locale_trees(text: &str, path: &Path) -> Result<Vec<LocaleTree>, LoaderError> {
    let lines = parse_logical_lines(text, path)?;
    let mut catalogues = Vec::new();
    let mut index = 0;

    while index < lines.len() {
        let root = &lines[index];
        if root.indent != 0 {
            return Err(parse_error(
                path,
                format!("expected a locale root before {}", root.key),
            ));
        }
        if root.value.is_some() {
            return Err(parse_error(
                path,
                format!("locale root {} cannot have a direct value", root.key),
            ));
        }

        index += 1;
        let mut tree = BTreeMap::new();
        if index < lines.len() && lines[index].indent > root.indent {
            let (children, next_index) =
                parse_entries_at(&lines, index, lines[index].indent, path)?;
            tree = children;
            index = next_index;
        }
        catalogues.push((root.key.clone(), tree));
    }

    Ok(catalogues)
}

fn is_selector_group(tree: &TreeMap) -> bool {
    !tree.is_empty()
        && tree
            .iter()
            .all(|(key, value)| is_selector_suffix(key) && matches!(value, TreeValue::Leaf(_)))
}

fn flatten_tree(tree: &TreeMap, path: &[String], out: &mut BTreeMap<String, String>) {
    for (key, value) in tree {
        match value {
            TreeValue::Leaf(text) => {
                let mut parts = path.to_vec();
                parts.push(key.clone());
                out.insert(parts.join("."), text.clone());
            }
            TreeValue::Branch(children) if is_selector_group(children) => {
                let mut parts = path.to_vec();
                parts.push(key.clone());
                let base = parts.join(".");
                for (suffix, child) in children {
                    if let TreeValue::Leaf(text) = child {
                        out.insert(format!("{base}_{suffix}"), text.clone());
                    }
                }
            }
            TreeValue::Branch(children) => {
                let mut parts = path.to_vec();
                parts.push(key.clone());
                flatten_tree(children, &parts, out);
            }
        }
    }
}

fn split_selector_suffix(key: &str) -> Option<(&str, &str)> {
    let (base, suffix) = key.rsplit_once('_')?;
    if base.is_empty() || !is_selector_suffix(suffix) {
        return None;
    }
    Some((base, suffix))
}

fn set_nested_value(tree: &mut TreeMap, parts: &[&str], value: String) {
    if let Some((first, rest)) = parts.split_first() {
        if rest.is_empty() {
            tree.insert((*first).to_string(), TreeValue::Leaf(value));
            return;
        }

        let entry = tree
            .entry((*first).to_string())
            .or_insert_with(|| TreeValue::Branch(BTreeMap::new()));
        if !matches!(entry, TreeValue::Branch(_)) {
            *entry = TreeValue::Branch(BTreeMap::new());
        }
        if let TreeValue::Branch(children) = entry {
            set_nested_value(children, rest, value);
        }
    }
}

fn translations_to_tree(translations: &BTreeMap<String, String>) -> TreeMap {
    let mut tree = BTreeMap::new();
    for (key, value) in translations {
        if let Some((base, suffix)) = split_selector_suffix(key) {
            let mut parts: Vec<&str> = base.split('.').collect();
            parts.push(suffix);
            set_nested_value(&mut tree, &parts, value.clone());
        } else {
            let parts: Vec<&str> = key.split('.').collect();
            set_nested_value(&mut tree, &parts, value.clone());
        }
    }
    tree
}

fn format_value(value: &str, indent: &str) -> String {
    if value.contains('\n') {
        let content_indent = format!("{indent}  ");
        let mut out = String::from("\"\"\"\n");
        for (index, line) in value.split('\n').enumerate() {
            if index > 0 {
                out.push('\n');
            }
            out.push_str(&content_indent);
            out.push_str(line);
        }
        out.push('\n');
        out.push_str(indent);
        out.push_str("\"\"\"");
        return out;
    }
    format!("\"{}\"", escape_value(value))
}

fn format_tree_lines(tree: &TreeMap, indent: &str, lines: &mut Vec<String>) {
    for (key, value) in tree {
        match value {
            TreeValue::Leaf(text) => {
                lines.push(format!("{indent}{key} {}", format_value(text, indent)));
            }
            TreeValue::Branch(children) => {
                lines.push(format!("{indent}{key}"));
                format_tree_lines(children, &format!("{indent}  "), lines);
            }
        }
    }
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
    fn parses_nested_catalogue() {
        let text = [
            "en",
            "  greeting \"Hello, {{name}}!\"",
            "  path \"C:\\\\new\"",
            "  cart",
            "    title \"Your cart\"",
            "    items",
            "      zero \"Your cart is empty\"",
            "      one \"{{count}} item\"",
            "      other \"{{count}} items\"",
            "  role",
            "    male \"He is a developer\"",
            "    female \"She is a developer\"",
            "    other \"They are a developer\"",
            "  legal \"\"\"",
            "    First line",
            "    Second line",
            "  \"\"\"",
            "",
        ]
        .join("\n");
        let cat = parse_lino_catalog(&text).unwrap();
        assert_eq!(cat.locale, "en");
        assert_eq!(
            cat.translations.get("cart.items_zero"),
            Some(&"Your cart is empty".to_string())
        );
        assert_eq!(cat.translations.get("path"), Some(&"C:\\new".to_string()));
        assert_eq!(
            cat.translations.get("cart.items_other"),
            Some(&"{{count}} items".to_string())
        );
        assert_eq!(
            cat.translations.get("role_female"),
            Some(&"She is a developer".to_string())
        );
        assert_eq!(
            cat.translations.get("legal"),
            Some(&"First line\nSecond line".to_string())
        );
    }

    #[test]
    fn parses_bundled_multi_locale_file() {
        let text = "en\n  greeting \"Hello\"\nru\n  greeting \"Привет\"\n";
        let cats = parse_lino_catalogs(text).unwrap();
        assert_eq!(cats.len(), 2);
        assert_eq!(cats[0].locale, "en");
        assert_eq!(cats[1].locale, "ru");
        assert_eq!(
            cats[1].translations.get("greeting"),
            Some(&"Привет".to_string())
        );
    }

    #[test]
    fn round_trips() {
        let mut t = BTreeMap::new();
        t.insert("greeting".to_string(), "Hello, {{name}}!".to_string());
        t.insert("cart.title".to_string(), "Your cart".to_string());
        t.insert("cart.items_one".to_string(), "{{count}} item".to_string());
        t.insert(
            "cart.items_other".to_string(),
            "{{count}} items".to_string(),
        );
        t.insert("legal".to_string(), "First line\nSecond line".to_string());
        let text = format_lino_catalog("en", &t);
        assert!(text.contains("cart\n    items\n      one \"{{count}} item\""));
        assert!(text.contains("legal \"\"\"\n    First line\n    Second line\n  \"\"\""));
        let cat = parse_lino_catalog(&text).unwrap();
        assert_eq!(cat.locale, "en");
        assert_eq!(cat.translations, t);
    }
}
