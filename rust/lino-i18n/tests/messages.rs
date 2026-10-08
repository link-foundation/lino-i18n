use lino_i18n::{I18n, Message, TOptions};

#[test]
fn source_keys_roundtrip_through_lino() {
    use lino_i18n::{format_lino_catalog, parse_lino_catalog};
    let translations = [
        ("Add an item".to_string(), "Ajouter un article".to_string()),
        ("\"Hello\" {name}".to_string(), "Bonjour {name}".to_string()),
        ("# comment".to_string(), "Text".to_string()),
        ("line\nbreak".to_string(), "Lines".to_string()),
    ]
    .into_iter()
    .collect();
    let text = format_lino_catalog("fr", &translations);
    assert_eq!(
        parse_lino_catalog(&text).unwrap().translations,
        translations
    );
}

#[test]
fn source_and_deferred_messages_use_existing_catalogs_and_fallbacks() {
    let mut i18n = I18n::new("en");
    i18n.add_translations("fr", [("hello", "Bonjour {name}")]);
    let message = Message::new("Hello {name}").id("hello");
    assert_eq!(i18n.gt("Hi {name}", &[("name", "Ada")]), "Hi Ada");
    assert_eq!(
        i18n.m(&message, &[("name", "Ada")], &TOptions::new().locale("fr")),
        "Bonjour Ada"
    );
}

#[cfg(feature = "icu")]
#[test]
fn icu_formats_the_same_source_catalog_as_javascript() {
    use lino_i18n::{Value, Values};
    let i18n = I18n::new("en");
    let message = Message::new(
        "{gender, select, female {{count, plural, one {# photo} other {# photos}}} other {none}}",
    );
    let values = Values::from([
        ("gender".to_owned(), Value::from("female")),
        ("count".to_owned(), Value::from(2_i64)),
    ]);
    assert_eq!(
        i18n.format_message(&message, &values, &TOptions::new())
            .unwrap(),
        "2 photos"
    );
    assert!(
        i18n.format_message(&message, &Values::new(), &TOptions::new())
            .is_err()
    );
}
