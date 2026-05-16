//! Compile-time companion to the `lino-i18n` runtime.
//!
//! The [`i18n!`] macro reads every `.lino` file in a directory at
//! compilation time and expands to an expression that builds an
//! `::lino_i18n::I18n` instance from embedded catalogue text.
//!
//! ```ignore
//! use std::sync::OnceLock;
//! use lino_i18n::{i18n, I18n};
//!
//! fn catalog() -> &'static I18n {
//!     static C: OnceLock<I18n> = OnceLock::new();
//!     C.get_or_init(|| i18n!("locales"))
//! }
//! ```
//!
//! Paths are resolved relative to the consuming crate's
//! `CARGO_MANIFEST_DIR`. Each `.lino` file's mtime is tracked via
//! generated `include_str!` calls so Cargo rebuilds when translations
//! change.

use std::path::{Path, PathBuf};

use proc_macro::TokenStream;
use proc_macro2::TokenStream as TokenStream2;
use quote::quote;
use syn::parse::{Parse, ParseStream};
use syn::{parse_macro_input, LitStr, Token};

/// Arguments accepted by the macro:
///
/// ```text
/// i18n!("locales")
/// i18n!("locales", default = "en")
/// i18n!("locales", default = "en", fallback = "en")
/// ```
struct MacroArgs {
    directory: LitStr,
    default_locale: Option<LitStr>,
    fallback: Option<LitStr>,
}

impl Parse for MacroArgs {
    fn parse(input: ParseStream<'_>) -> syn::Result<Self> {
        let directory: LitStr = input.parse()?;
        let mut default_locale: Option<LitStr> = None;
        let mut fallback: Option<LitStr> = None;
        while input.peek(Token![,]) {
            let _: Token![,] = input.parse()?;
            if input.is_empty() {
                break;
            }
            let key: syn::Ident = input.parse()?;
            let _: Token![=] = input.parse()?;
            let value: LitStr = input.parse()?;
            match key.to_string().as_str() {
                "default" | "default_locale" => default_locale = Some(value),
                "fallback" => fallback = Some(value),
                other => {
                    return Err(syn::Error::new(
                        key.span(),
                        format!("unknown argument `{other}` (expected `default` or `fallback`)"),
                    ))
                }
            }
        }
        Ok(Self {
            directory,
            default_locale,
            fallback,
        })
    }
}

#[proc_macro]
pub fn i18n(input: TokenStream) -> TokenStream {
    let args = parse_macro_input!(input as MacroArgs);
    expand(&args)
        .unwrap_or_else(syn::Error::into_compile_error)
        .into()
}

fn expand(args: &MacroArgs) -> syn::Result<TokenStream2> {
    let directory_lit = &args.directory;
    let directory_str = directory_lit.value();
    let directory = resolve_directory(&directory_str)
        .map_err(|err| syn::Error::new(directory_lit.span(), err))?;

    let mut paths: Vec<PathBuf> = std::fs::read_dir(&directory)
        .map_err(|err| {
            syn::Error::new(
                directory_lit.span(),
                format!("cannot read directory {}: {err}", directory.display()),
            )
        })?
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|path| {
            path.extension()
                .and_then(|ext| ext.to_str())
                .is_some_and(|ext| ext.eq_ignore_ascii_case("lino"))
        })
        .collect();
    paths.sort();

    if paths.is_empty() {
        return Err(syn::Error::new(
            directory_lit.span(),
            format!("no .lino files found in {}", directory.display()),
        ));
    }

    let mut default_locale_candidate = None;
    let mut add_calls = Vec::with_capacity(paths.len());
    for path in &paths {
        let text = std::fs::read_to_string(path).map_err(|err| {
            syn::Error::new(
                directory_lit.span(),
                format!("cannot read {}: {err}", path.display()),
            )
        })?;
        let first_locale = first_locale_in_text(&text).ok_or_else(|| {
            syn::Error::new(
                directory_lit.span(),
                format!("{} is missing a locale identifier", path.display()),
            )
        })?;
        if first_locale.is_empty() {
            return Err(syn::Error::new(
                directory_lit.span(),
                format!("{} is missing a locale identifier", path.display()),
            ));
        }
        default_locale_candidate.get_or_insert(first_locale);
        let path_str = path.to_string_lossy().to_string();
        add_calls.push(quote! {
            for __catalogue in ::lino_i18n::parse_lino_catalogs(include_str!(#path_str))
                .expect(concat!("failed to parse ", #path_str))
            {
                __i18n.add_translations(__catalogue.locale, __catalogue.translations);
            }
        });
    }

    let default_locale = args
        .default_locale
        .as_ref()
        .map(LitStr::value)
        .or(default_locale_candidate)
        .expect("at least one catalogue exists");

    let fallback_setup = if let Some(fallback) = &args.fallback {
        let fb = fallback.value();
        quote! { __i18n.set_fallbacks([ #fb .to_string() ]); }
    } else {
        quote! {}
    };

    Ok(quote! {{
        let mut __i18n = ::lino_i18n::I18n::new(#default_locale);
        #( #add_calls )*
        #fallback_setup
        __i18n
    }})
}

fn resolve_directory(input: &str) -> Result<PathBuf, String> {
    let path = Path::new(input);
    if path.is_absolute() {
        return Ok(path.to_path_buf());
    }
    let manifest = std::env::var("CARGO_MANIFEST_DIR")
        .map_err(|_| "CARGO_MANIFEST_DIR not set; macro must be invoked from a cargo build")?;
    Ok(Path::new(&manifest).join(path))
}

fn first_locale_in_text(text: &str) -> Option<String> {
    for raw in text.lines() {
        let trimmed = raw.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        if raw.starts_with(' ') || raw.starts_with('\t') {
            return None;
        }
        let token = trimmed.split_whitespace().next()?;
        return Some(token.trim_end_matches(':').to_string());
    }
    None
}
