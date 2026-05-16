//! Placeholder interpolation.
//!
//! Two placeholder styles are accepted, matching the JavaScript runtime:
//!
//! * `{{name}}` — the default i18next style.
//! * `{name}` — ICU `MessageFormat` style used by `react-intl`.
//!
//! Names may contain ASCII letters, digits, underscore, dot, dash and
//! colon (for namespaces). Missing names are left untouched so the
//! caller can detect the mistake during testing.

use std::collections::HashMap;
use std::hash::BuildHasher;

#[must_use]
pub fn interpolate<S: BuildHasher>(template: &str, params: &HashMap<&str, String, S>) -> String {
    if !template.contains('{') {
        return template.to_string();
    }

    let mut out = String::with_capacity(template.len());
    let bytes = template.as_bytes();
    let mut i = 0;

    while i < bytes.len() {
        if bytes[i] == b'{' {
            let double = i + 1 < bytes.len() && bytes[i + 1] == b'{';
            let name_start = if double { i + 2 } else { i + 1 };
            if let Some((name, name_end)) = read_name(template, name_start) {
                let closing_ok = if double {
                    name_end + 1 < bytes.len()
                        && bytes[name_end] == b'}'
                        && bytes[name_end + 1] == b'}'
                } else {
                    name_end < bytes.len() && bytes[name_end] == b'}'
                };
                if closing_ok {
                    if let Some(value) = params.get(name) {
                        out.push_str(value);
                    } else {
                        let end = if double { name_end + 2 } else { name_end + 1 };
                        out.push_str(&template[i..end]);
                    }
                    i = if double { name_end + 2 } else { name_end + 1 };
                    continue;
                }
            }
        }
        // Copy one UTF-8 code point (1-4 bytes) verbatim.
        let lead = bytes[i];
        let width = utf8_width(lead);
        out.push_str(&template[i..i + width]);
        i += width;
    }
    out
}

fn read_name(template: &str, start: usize) -> Option<(&str, usize)> {
    let bytes = template.as_bytes();
    let mut end = start;
    while end < bytes.len() && (bytes[end] == b' ' || bytes[end] == b'\t') {
        end += 1;
    }
    let name_start = end;
    while end < bytes.len() {
        let c = bytes[end];
        let ok = c.is_ascii_alphanumeric()
            || c == b'_'
            || c == b'.'
            || c == b'-'
            || c == b':'
            || c == b'$';
        if !ok {
            break;
        }
        end += 1;
    }
    if name_start == end {
        return None;
    }
    let name_end = end;
    while end < bytes.len() && (bytes[end] == b' ' || bytes[end] == b'\t') {
        end += 1;
    }
    Some((&template[name_start..name_end], end))
}

#[inline]
fn utf8_width(lead: u8) -> usize {
    if lead < 0x80 {
        1
    } else if lead < 0xC0 {
        // Continuation byte appearing mid-codepoint; treat as a single
        // byte to make forward progress. The input is guaranteed UTF-8
        // by `&str`, so this branch is unreachable in practice.
        1
    } else if lead < 0xE0 {
        2
    } else if lead < 0xF0 {
        3
    } else {
        4
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn p<'a>(pairs: &[(&'a str, &'a str)]) -> HashMap<&'a str, String> {
        pairs.iter().map(|(k, v)| (*k, (*v).to_string())).collect()
    }

    #[test]
    fn double_braces() {
        assert_eq!(
            interpolate("Hello, {{name}}!", &p(&[("name", "World")])),
            "Hello, World!"
        );
    }

    #[test]
    fn single_braces() {
        assert_eq!(
            interpolate("You have {count} items", &p(&[("count", "3")])),
            "You have 3 items"
        );
    }

    #[test]
    fn missing_value_left_untouched() {
        assert_eq!(interpolate("Hi {{name}}", &HashMap::new()), "Hi {{name}}");
    }

    #[test]
    fn whitespace_inside_braces() {
        assert_eq!(
            interpolate("Hi {{ name }}", &p(&[("name", "Alice")])),
            "Hi Alice"
        );
    }

    #[test]
    fn dotted_names_supported() {
        assert_eq!(
            interpolate("{{user.name}}", &p(&[("user.name", "Bob")])),
            "Bob"
        );
    }

    #[test]
    fn preserves_multibyte_text() {
        assert_eq!(
            interpolate("Привет, {{name}}!", &p(&[("name", "Алиса")])),
            "Привет, Алиса!"
        );
        assert_eq!(
            interpolate("{{count}} товар", &p(&[("count", "1")])),
            "1 товар"
        );
    }
}
