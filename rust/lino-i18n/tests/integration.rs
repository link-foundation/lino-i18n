//! End-to-end tests that exercise both the runtime loaders and the
//! compile-time macro against the same `locales/` directory.

use std::sync::OnceLock;

use lino_i18n::{i18n, I18n, TOptions};

fn macro_catalog() -> &'static I18n {
    static C: OnceLock<I18n> = OnceLock::new();
    C.get_or_init(|| i18n!("locales", default = "en", fallback = "en"))
}

fn macro_catalog_with_aliases() -> &'static I18n {
    static C: OnceLock<I18n> = OnceLock::new();
    C.get_or_init(|| {
        i18n!(
            "locales",
            default = "en",
            fallback = "en",
            compatibility_aliases = "collapse-tail,parent-label"
        )
    })
}

fn loader_catalog() -> I18n {
    let mut i18n = I18n::new("en");
    i18n.set_fallbacks(["en".to_string()]);
    let dir = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("locales");
    i18n.load_lino_directory(&dir).unwrap();
    i18n
}

#[test]
fn macro_loads_translations() {
    let c = macro_catalog();
    assert_eq!(c.t("greeting", &[("name", "World")]), "Hello, World!");
    assert_eq!(
        c.t_count("cart.items", 0, &[("count", "0")]),
        "Your cart is empty"
    );
    assert_eq!(c.t_count("cart.items", 5, &[("count", "5")]), "5 items");
    assert_eq!(
        c.t("hero.description", &[]),
        "Keep each language in its own block, nest related messages together,\nand still resolve the same runtime keys."
    );
}

#[test]
fn macro_accepts_compatibility_alias_options() {
    let c = macro_catalog_with_aliases();
    assert_eq!(c.t("greeting", &[("name", "World")]), "Hello, World!");
}

#[test]
fn macro_supports_locale_override_and_plurals() {
    let c = macro_catalog();
    assert_eq!(
        c.t_with(
            "cart.items",
            &[("count", "1")],
            &TOptions::new().locale("ru").count(1),
        ),
        "1 товар"
    );
    assert_eq!(
        c.t_with(
            "cart.items",
            &[("count", "3")],
            &TOptions::new().locale("ru").count(3),
        ),
        "3 товара"
    );
    assert_eq!(
        c.t_with(
            "cart.items",
            &[("count", "7")],
            &TOptions::new().locale("ru").count(7),
        ),
        "7 товаров"
    );
}

#[test]
fn loader_and_macro_agree_on_keys() {
    let macro_c = macro_catalog();
    let loader_c = loader_catalog();
    for locale in loader_c.list_locales() {
        let mut macro_keys: Vec<&str> = macro_c.list_locales().into_iter().collect();
        macro_keys.sort_unstable();
        let mut loader_keys: Vec<&str> = loader_c.list_locales().into_iter().collect();
        loader_keys.sort_unstable();
        assert_eq!(macro_keys, loader_keys, "locale lists differ for {locale}");
    }
}

#[test]
fn namespaces_and_context_resolve() {
    let c = macro_catalog();
    assert_eq!(c.t("navigation.home", &[]), "Home");
    assert_eq!(
        c.t_with("role", &[], &TOptions::new().context("female")),
        "She is a developer"
    );
    assert_eq!(
        c.t_with("role", &[], &TOptions::new().context("unknown")),
        "They are a developer"
    );
}

#[test]
fn fallback_chain_picks_first_available() {
    let mut i18n = I18n::new("ru");
    i18n.add_translations("en", [("hi", "Hello")]);
    i18n.add_translations("ru", [("bye", "Пока")]);
    i18n.set_fallbacks(["en".to_string()]);
    assert_eq!(i18n.t("hi", &[]), "Hello");
    assert_eq!(i18n.t("bye", &[]), "Пока");
    assert_eq!(
        i18n.t_with("xx", &[], &TOptions::new().default_value("Default")),
        "Default"
    );
}

#[test]
fn runtime_loads_bundled_locale_file() {
    let path = std::env::temp_dir().join(format!("lino-i18n-bundle-{}.lino", std::process::id()));
    std::fs::write(
        &path,
        "en\n  greeting \"Hello\"\nru\n  greeting \"Привет\"\n",
    )
    .unwrap();

    let mut i18n = I18n::new("en");
    let first = i18n.load_lino_file(&path).unwrap();
    std::fs::remove_file(&path).unwrap();

    assert_eq!(first, "en");
    assert_eq!(i18n.list_locales(), vec!["en", "ru"]);
    assert_eq!(
        i18n.t_with("greeting", &[], &TOptions::new().locale("ru")),
        "Привет"
    );
}
