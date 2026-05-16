//! CLDR-style plural categorisation.
//!
//! The rules implemented here cover the languages people actually translate
//! into: English, Russian/Ukrainian/Belarusian, Polish, Czech/Slovak,
//! Arabic, French, German, Spanish/Portuguese/Italian, plus the no-plural
//! East Asian languages. Locales that are not in the table fall back to the
//! Germanic `one`/`other` split, which matches the behaviour of
//! `Intl.PluralRules` for unknown locales.
//!
//! The categories are spelled exactly the way CLDR / i18next spell them so
//! that catalogues are interoperable with the JavaScript runtime.

#![allow(clippy::match_same_arms)]

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PluralCategory {
    Zero,
    One,
    Two,
    Few,
    Many,
    Other,
}

impl PluralCategory {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Zero => "zero",
            Self::One => "one",
            Self::Two => "two",
            Self::Few => "few",
            Self::Many => "many",
            Self::Other => "other",
        }
    }
}

/// Returns the [`PluralCategory`] for a given language tag and integer
/// count. The language tag is matched on its primary subtag only (so
/// `en-GB`, `en_US` and `en` all hit the same rule set).
#[must_use]
pub fn plural_category(locale: &str, count: i64) -> PluralCategory {
    let lang = primary_subtag(locale);
    let n = count.unsigned_abs();

    match lang.as_str() {
        // Languages with a single form.
        "ja" | "zh" | "ko" | "vi" | "th" | "id" | "ms" | "lo" | "my" => PluralCategory::Other,

        // English-like: one only for n == 1.
        "en" | "de" | "nl" | "sv" | "no" | "nb" | "nn" | "da" | "fi" | "et" | "el" | "he"
        | "hu" | "tr" | "az" | "ka" | "bg" | "ca" | "es" | "pt" | "it" | "gl" | "eu" => {
            if count == 1 {
                PluralCategory::One
            } else {
                PluralCategory::Other
            }
        }

        // French-style: one for 0 or 1.
        "fr" | "pt-br" => {
            if count == 0 || count == 1 {
                PluralCategory::One
            } else {
                PluralCategory::Other
            }
        }

        // Russian, Ukrainian, Belarusian, Serbian/Croatian, Bosnian.
        "ru" | "uk" | "be" | "sr" | "hr" | "bs" => slavic_three(n),

        // Polish.
        "pl" => {
            let mod10 = n % 10;
            let mod100 = n % 100;
            if count == 1 {
                PluralCategory::One
            } else if (2..=4).contains(&mod10) && !(12..=14).contains(&mod100) {
                PluralCategory::Few
            } else if (mod10 == 0 || (5..=9).contains(&mod10) || (12..=14).contains(&mod100))
                && count != 1
            {
                PluralCategory::Many
            } else {
                PluralCategory::Other
            }
        }

        // Czech / Slovak.
        "cs" | "sk" => {
            if count == 1 {
                PluralCategory::One
            } else if (2..=4).contains(&count) {
                PluralCategory::Few
            } else {
                PluralCategory::Other
            }
        }

        // Arabic.
        "ar" => {
            let mod100 = n % 100;
            if count == 0 {
                PluralCategory::Zero
            } else if count == 1 {
                PluralCategory::One
            } else if count == 2 {
                PluralCategory::Two
            } else if (3..=10).contains(&mod100) {
                PluralCategory::Few
            } else if (11..=99).contains(&mod100) {
                PluralCategory::Many
            } else {
                PluralCategory::Other
            }
        }

        // Fallback: Germanic two-form rule.
        _ => {
            if count == 1 {
                PluralCategory::One
            } else {
                PluralCategory::Other
            }
        }
    }
}

/// Convenience wrapper around [`plural_category`] returning the CLDR
/// suffix string (the same string i18next would append to the key).
#[must_use]
pub fn plural_suffix(locale: &str, count: i64) -> &'static str {
    plural_category(locale, count).as_str()
}

fn slavic_three(n: u64) -> PluralCategory {
    let mod10 = n % 10;
    let mod100 = n % 100;
    if mod10 == 1 && mod100 != 11 {
        PluralCategory::One
    } else if (2..=4).contains(&mod10) && !(12..=14).contains(&mod100) {
        PluralCategory::Few
    } else if mod10 == 0 || (5..=9).contains(&mod10) || (11..=14).contains(&mod100) {
        PluralCategory::Many
    } else {
        PluralCategory::Other
    }
}

fn primary_subtag(locale: &str) -> String {
    let mut out = String::new();
    for ch in locale.chars() {
        if ch == '-' || ch == '_' {
            break;
        }
        out.extend(ch.to_lowercase());
    }
    // Special case for Brazilian Portuguese, the only multi-tag we treat.
    if locale.eq_ignore_ascii_case("pt-br") || locale.eq_ignore_ascii_case("pt_br") {
        return "pt-br".to_string();
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn english() {
        assert_eq!(plural_suffix("en", 0), "other");
        assert_eq!(plural_suffix("en", 1), "one");
        assert_eq!(plural_suffix("en-US", 2), "other");
    }

    #[test]
    fn russian() {
        assert_eq!(plural_suffix("ru", 0), "many");
        assert_eq!(plural_suffix("ru", 1), "one");
        assert_eq!(plural_suffix("ru", 2), "few");
        assert_eq!(plural_suffix("ru", 5), "many");
        assert_eq!(plural_suffix("ru", 11), "many");
        assert_eq!(plural_suffix("ru", 21), "one");
        assert_eq!(plural_suffix("ru", 22), "few");
    }

    #[test]
    fn polish() {
        assert_eq!(plural_suffix("pl", 1), "one");
        assert_eq!(plural_suffix("pl", 2), "few");
        assert_eq!(plural_suffix("pl", 5), "many");
        assert_eq!(plural_suffix("pl", 22), "few");
    }

    #[test]
    fn arabic() {
        assert_eq!(plural_suffix("ar", 0), "zero");
        assert_eq!(plural_suffix("ar", 1), "one");
        assert_eq!(plural_suffix("ar", 2), "two");
        assert_eq!(plural_suffix("ar", 5), "few");
        assert_eq!(plural_suffix("ar", 25), "many");
    }

    #[test]
    fn japanese_has_one_form() {
        assert_eq!(plural_suffix("ja", 0), "other");
        assert_eq!(plural_suffix("ja", 1), "other");
    }

    #[test]
    fn french_zero_is_one() {
        assert_eq!(plural_suffix("fr", 0), "one");
        assert_eq!(plural_suffix("fr", 1), "one");
        assert_eq!(plural_suffix("fr", 2), "other");
    }
}
