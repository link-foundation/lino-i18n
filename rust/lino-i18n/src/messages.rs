//! Source messages and deferred declarations for code-only consumers.

use crate::{I18n, TOptions};

/// A source message with an optional stable catalogue identifier.
#[derive(Debug, Clone, Copy)]
pub struct Message<'a> {
    pub source: &'a str,
    pub id: &'a str,
}

impl<'a> Message<'a> {
    #[must_use]
    pub const fn new(source: &'a str) -> Self {
        Self { source, id: source }
    }

    #[must_use]
    pub const fn id(mut self, id: &'a str) -> Self {
        self.id = id;
        self
    }
}

impl I18n {
    /// Translate source text, using the source itself as the catalogue key.
    pub fn gt(&self, source: &str, params: &[(&str, &str)]) -> String {
        self.m(&Message::new(source), params, &TOptions::new())
    }

    /// Resolve a deferred message using existing interpolation and fallbacks.
    pub fn m(
        &self,
        message: &Message<'_>,
        params: &[(&str, &str)],
        options: &TOptions<'_>,
    ) -> String {
        let options = TOptions {
            default_value: Some(message.source),
            ..*options
        };
        self.t_with(message.id, params, &options)
    }

    /// Format ICU source messages, including nested plural/select and skeletons.
    ///
    /// Requires the `icu` feature and Rust 1.92. The compiled message cache is
    /// bounded to 100 entries and formatting accepts a locale per call.
    #[cfg(feature = "icu")]
    pub fn format_message(
        &self,
        message: &Message<'_>,
        values: &crate::Values,
        options: &TOptions<'_>,
    ) -> Result<String, crate::MessageFormatError> {
        let source = self.m(message, &[], options);
        let compiled = {
            let mut cache = self
                .message_cache
                .lock()
                .unwrap_or_else(std::sync::PoisonError::into_inner);
            if let Some(compiled) = cache.get(&source) {
                std::sync::Arc::clone(compiled)
            } else {
                let compiled = std::sync::Arc::new(crate::IcuMessageFormat::try_new(&source)?);
                if cache.len() >= 100 {
                    if let Some(first) = cache.keys().next().cloned() {
                        cache.remove(&first);
                    }
                }
                cache.insert(source, std::sync::Arc::clone(&compiled));
                compiled
            }
        };
        compiled.format_to_string(options.locale.unwrap_or(self.locale()), values)
    }
}
