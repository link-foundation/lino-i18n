//! The high-level [`I18n`] runtime.

use std::collections::{BTreeMap, HashMap};
use std::path::Path;
use std::sync::Arc;

use crate::format::interpolate;
use crate::loader::{
    compatibility_aliases_for_key, load_lino_catalogs, load_lino_directory, parse_lino_catalogs,
    CompatibilityAlias, LoaderError,
};
use crate::plurals::plural_suffix;

/// Callback invoked when a key cannot be resolved in any locale or fallback.
/// Returning `Some` replaces the would-be fallback (typically the raw key)
/// with the provided string.
pub type MissingKeyHandler =
    Arc<dyn Fn(&str, &[(&str, &str)], &TOptions) -> Option<String> + Send + Sync>;

/// Per-call translation options.
#[derive(Debug, Clone, Default)]
pub struct TOptions<'a> {
    /// Override the active locale for this call only.
    pub locale: Option<&'a str>,
    /// Context (gender) suffix appended to the key with `_`.
    pub context: Option<&'a str>,
    /// Numeric count used to pick the plural form.
    pub count: Option<i64>,
    /// Value returned when the key is missing in every locale.
    pub default_value: Option<&'a str>,
}

impl<'a> TOptions<'a> {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    #[must_use]
    pub fn locale(mut self, locale: &'a str) -> Self {
        self.locale = Some(locale);
        self
    }

    #[must_use]
    pub fn context(mut self, context: &'a str) -> Self {
        self.context = Some(context);
        self
    }

    #[must_use]
    pub fn count(mut self, count: i64) -> Self {
        self.count = Some(count);
        self
    }

    #[must_use]
    pub fn default_value(mut self, default_value: &'a str) -> Self {
        self.default_value = Some(default_value);
        self
    }
}

/// The main translation engine. Stores one flat map per locale plus a
/// configurable fallback chain.
pub struct I18n {
    default_locale: String,
    current_locale: String,
    fallback: Vec<String>,
    locales: BTreeMap<String, HashMap<String, String>>,
    compatibility_aliases: Vec<CompatibilityAlias>,
    on_missing: Option<MissingKeyHandler>,
}

impl std::fmt::Debug for I18n {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("I18n")
            .field("default_locale", &self.default_locale)
            .field("current_locale", &self.current_locale)
            .field("fallback", &self.fallback)
            .field("locales", &self.locales.keys().collect::<Vec<_>>())
            .field("compatibility_aliases", &self.compatibility_aliases)
            .field("on_missing", &self.on_missing.as_ref().map(|_| "<handler>"))
            .finish()
    }
}

impl I18n {
    #[must_use]
    pub fn new(default_locale: impl Into<String>) -> Self {
        let default_locale = default_locale.into();
        Self {
            current_locale: default_locale.clone(),
            default_locale,
            fallback: Vec::new(),
            locales: BTreeMap::new(),
            compatibility_aliases: Vec::new(),
            on_missing: None,
        }
    }

    /// Register a flat translation map for a locale.
    pub fn add_translations<I, K, V>(&mut self, locale: impl Into<String>, entries: I)
    where
        I: IntoIterator<Item = (K, V)>,
        K: Into<String>,
        V: Into<String>,
    {
        let locale = locale.into();
        let table = self.locales.entry(locale).or_default();
        for (k, v) in entries {
            table.insert(k.into(), v.into());
        }
        expand_hash_compatibility_aliases(table, &self.compatibility_aliases);
    }

    /// Configure compatibility aliases generated from canonical keys.
    ///
    /// Existing explicit translations are preserved. Changing aliases expands
    /// every loaded locale table immediately and also affects future loads.
    pub fn set_compatibility_aliases<I>(&mut self, aliases: I)
    where
        I: IntoIterator<Item = CompatibilityAlias>,
    {
        self.compatibility_aliases = aliases.into_iter().collect();
        for table in self.locales.values_mut() {
            expand_hash_compatibility_aliases(table, &self.compatibility_aliases);
        }
    }

    /// Return the configured compatibility alias modes.
    #[must_use]
    pub fn compatibility_aliases(&self) -> &[CompatibilityAlias] {
        &self.compatibility_aliases
    }

    /// Load a `.lino` catalogue from text and register it.
    pub fn load_lino(&mut self, text: &str) -> Result<String, LoaderError> {
        let cats = parse_lino_catalogs(text)?;
        let first_locale =
            cats.first()
                .map(|cat| cat.locale.clone())
                .ok_or_else(|| LoaderError::Shape {
                    path: Path::new("<inline>").to_path_buf(),
                })?;
        for cat in cats {
            self.add_translations(cat.locale, cat.translations);
        }
        Ok(first_locale)
    }

    /// Load one `.lino` file from disk. Bundled files with multiple top-level
    /// locale blocks register every locale and return the first locale name.
    pub fn load_lino_file(&mut self, path: impl AsRef<Path>) -> Result<String, LoaderError> {
        let cats = load_lino_catalogs(path)?;
        let first_locale =
            cats.first()
                .map(|cat| cat.locale.clone())
                .ok_or_else(|| LoaderError::Shape {
                    path: Path::new("<file>").to_path_buf(),
                })?;
        for cat in cats {
            self.add_translations(cat.locale, cat.translations);
        }
        Ok(first_locale)
    }

    /// Load every `*.lino` file from a directory.
    pub fn load_lino_directory(
        &mut self,
        directory: impl AsRef<Path>,
    ) -> Result<Vec<String>, LoaderError> {
        let cats = load_lino_directory(directory)?;
        let mut loaded = Vec::with_capacity(cats.len());
        for cat in cats {
            self.add_translations(cat.locale.clone(), cat.translations);
            loaded.push(cat.locale);
        }
        Ok(loaded)
    }

    /// Set the active locale.
    pub fn set_locale(&mut self, locale: impl Into<String>) {
        self.current_locale = locale.into();
    }

    /// Returns the active locale.
    pub fn locale(&self) -> &str {
        &self.current_locale
    }

    /// Returns the fallback chain.
    pub fn fallbacks(&self) -> &[String] {
        &self.fallback
    }

    /// Replace the fallback chain.
    pub fn set_fallbacks(&mut self, fallback: impl IntoIterator<Item = String>) {
        self.fallback = fallback.into_iter().collect();
    }

    /// List loaded locales in deterministic order.
    pub fn list_locales(&self) -> Vec<&str> {
        self.locales.keys().map(String::as_str).collect()
    }

    /// Returns true if `key` resolves in `locale` (with the same plural and
    /// context rules as [`Self::t`]).
    #[must_use]
    pub fn has(&self, key: &str, locale: &str) -> bool {
        if let Some(table) = self.locales.get(locale) {
            return resolve(table, key, locale, &TOptions::default()).is_some();
        }
        false
    }

    /// Install a missing-key handler. The handler is invoked when no
    /// locale (including fallbacks) contains the key. Returning `Some(s)`
    /// replaces the would-be fallback (typically the raw key).
    pub fn on_missing_key(&mut self, handler: MissingKeyHandler) {
        self.on_missing = Some(handler);
    }

    /// Translate `key` with positional parameters.
    pub fn t(&self, key: &str, params: &[(&str, &str)]) -> String {
        self.t_with(key, params, &TOptions::default())
    }

    /// Translate `key` with an explicit count for plural resolution.
    pub fn t_count(&self, key: &str, count: i64, params: &[(&str, &str)]) -> String {
        self.t_with(key, params, &TOptions::new().count(count))
    }

    /// Translate `key` using full [`TOptions`].
    pub fn t_with(&self, key: &str, params: &[(&str, &str)], options: &TOptions<'_>) -> String {
        let primary = options.locale.unwrap_or(self.current_locale.as_str());
        let mut chain: Vec<&str> = vec![primary];
        for fb in &self.fallback {
            let s = fb.as_str();
            if !chain.contains(&s) {
                chain.push(s);
            }
        }
        if !chain.contains(&self.default_locale.as_str()) {
            chain.push(self.default_locale.as_str());
        }

        for locale in chain {
            if let Some(table) = self.locales.get(locale) {
                if let Some(template) = resolve(table, key, locale, options) {
                    return apply(&template, params);
                }
            }
        }

        if let Some(handler) = &self.on_missing {
            if let Some(value) = handler(key, params, options) {
                return value;
            }
        }
        if let Some(default_value) = options.default_value {
            return apply(default_value, params);
        }
        key.to_string()
    }
}

fn apply(template: &str, params: &[(&str, &str)]) -> String {
    let map: HashMap<&str, String> = params.iter().map(|(k, v)| (*k, (*v).to_string())).collect();
    interpolate(template, &map)
}

fn expand_hash_compatibility_aliases(
    table: &mut HashMap<String, String>,
    aliases: &[CompatibilityAlias],
) {
    if aliases.is_empty() {
        return;
    }
    let originals: Vec<(String, String)> = table
        .iter()
        .map(|(key, value)| (key.clone(), value.clone()))
        .collect();
    for (key, value) in originals {
        for alias in compatibility_aliases_for_key(&key, aliases) {
            table.entry(alias).or_insert_with(|| value.clone());
        }
    }
}

fn resolve(
    table: &HashMap<String, String>,
    key: &str,
    locale: &str,
    options: &TOptions<'_>,
) -> Option<String> {
    let with_context: String;
    let targets: Vec<&str> = if let Some(ctx) = options.context {
        with_context = format!("{key}_{ctx}");
        vec![with_context.as_str(), key]
    } else {
        vec![key]
    };

    for target in &targets {
        if let Some(count) = options.count {
            if count == 0 {
                if let Some(v) = table.get(&format!("{target}_zero")) {
                    return Some(v.clone());
                }
            }
            let suffix = plural_suffix(locale, count);
            if let Some(v) = table.get(&format!("{target}_{suffix}")) {
                return Some(v.clone());
            }
            if let Some(v) = table.get(&format!("{target}_other")) {
                return Some(v.clone());
            }
        }
        if let Some(v) = table.get(*target) {
            return Some(v.clone());
        }
    }

    if options.context.is_some() {
        if let Some(v) = table.get(&format!("{key}_other")) {
            return Some(v.clone());
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    fn english_catalogue() -> I18n {
        let mut i18n = I18n::new("en");
        i18n.add_translations(
            "en",
            [
                ("greeting", "Hello, {{name}}!"),
                ("cart.items_zero", "Your cart is empty"),
                ("cart.items_one", "{{count}} item"),
                ("cart.items_other", "{{count}} items"),
                ("role_male", "He is a developer"),
                ("role_female", "She is a developer"),
                ("role_other", "They are a developer"),
                ("nav:home", "Home"),
            ],
        );
        i18n
    }

    #[test]
    fn interpolates() {
        let i18n = english_catalogue();
        assert_eq!(i18n.t("greeting", &[("name", "World")]), "Hello, World!");
    }

    #[test]
    fn plurals_in_english() {
        let i18n = english_catalogue();
        assert_eq!(
            i18n.t_count("cart.items", 0, &[("count", "0")]),
            "Your cart is empty"
        );
        assert_eq!(i18n.t_count("cart.items", 1, &[("count", "1")]), "1 item");
        assert_eq!(i18n.t_count("cart.items", 5, &[("count", "5")]), "5 items");
    }

    #[test]
    fn plurals_in_russian() {
        let mut i18n = I18n::new("en");
        i18n.add_translations(
            "ru",
            [
                ("cart.items_one", "{{count}} товар"),
                ("cart.items_few", "{{count}} товара"),
                ("cart.items_many", "{{count}} товаров"),
                ("cart.items_other", "{{count}} товаров"),
            ],
        );
        i18n.set_locale("ru");
        assert_eq!(i18n.t_count("cart.items", 1, &[("count", "1")]), "1 товар");
        assert_eq!(i18n.t_count("cart.items", 3, &[("count", "3")]), "3 товара");
        assert_eq!(
            i18n.t_count("cart.items", 7, &[("count", "7")]),
            "7 товаров"
        );
    }

    #[test]
    fn fallback_chain() {
        let mut i18n = I18n::new("ru");
        i18n.add_translations("en", [("hi", "Hello")]);
        i18n.add_translations("ru", [("bye", "Пока")]);
        i18n.set_fallbacks(["en".to_string()]);
        assert_eq!(i18n.t("hi", &[]), "Hello");
        assert_eq!(i18n.t("bye", &[]), "Пока");
    }

    #[test]
    fn context_suffix() {
        let i18n = english_catalogue();
        assert_eq!(
            i18n.t_with("role", &[], &TOptions::new().context("male"),),
            "He is a developer"
        );
        assert_eq!(
            i18n.t_with("role", &[], &TOptions::new().context("unknown")),
            "They are a developer"
        );
    }

    #[test]
    fn missing_key_handler() {
        let mut i18n = I18n::new("en");
        i18n.add_translations("en", [("hi", "Hello")]);
        let seen = Arc::new(std::sync::Mutex::new(Vec::<String>::new()));
        let seen_for_handler = Arc::clone(&seen);
        i18n.on_missing_key(Arc::new(move |key, _, _| {
            seen_for_handler.lock().unwrap().push(key.to_string());
            Some(format!("??{key}??"))
        }));
        assert_eq!(i18n.t("missing", &[]), "??missing??");
        assert_eq!(seen.lock().unwrap().as_slice(), &["missing".to_string()]);
    }

    #[test]
    fn default_value_used_when_missing() {
        let i18n = english_catalogue();
        assert_eq!(
            i18n.t_with("xx", &[], &TOptions::new().default_value("fallback")),
            "fallback"
        );
    }

    #[test]
    fn compatibility_aliases_resolve_migrated_deep_keys() {
        let mut i18n = I18n::new("en");
        i18n.set_compatibility_aliases([
            CompatibilityAlias::CollapseTail,
            CompatibilityAlias::ParentLabel,
        ]);
        i18n.add_translations(
            "en",
            [
                (
                    "telegram.help.solve.alias.detail",
                    "Tool aliases imply --tool <tool>",
                ),
                ("error.label", "Error"),
            ],
        );

        assert_eq!(
            i18n.t("telegram.help_solve_alias_detail", &[]),
            "Tool aliases imply --tool <tool>"
        );
        assert_eq!(
            i18n.t("telegram.help.solve_alias_detail", &[]),
            "Tool aliases imply --tool <tool>"
        );
        assert_eq!(
            i18n.t("telegram.help.solve.alias_detail", &[]),
            "Tool aliases imply --tool <tool>"
        );
        assert_eq!(i18n.t("error", &[]), "Error");
    }
}
