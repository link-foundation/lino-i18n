//! Compile-time companion to the `lino-i18n` runtime.
//!
//! The [`i18n!`] macro reads every `.lino` file in a directory at
//! compilation time and expands to an expression that builds an
//! `::lino_i18n::I18n` instance with every translation already baked in.
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

use std::collections::HashMap;
use std::path::{Path, PathBuf};

use lino_objects_codec::format::parse_indented;
use proc_macro::TokenStream;
use proc_macro2::TokenStream as TokenStream2;
use quote::{format_ident, quote};
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

    let mut catalogues: Vec<(String, Vec<(String, String)>)> = Vec::new();
    let mut tracked: Vec<PathBuf> = Vec::with_capacity(paths.len());
    for path in &paths {
        let text = std::fs::read_to_string(path).map_err(|err| {
            syn::Error::new(
                directory_lit.span(),
                format!("cannot read {}: {err}", path.display()),
            )
        })?;
        let (locale, map) = parse_indented(&text).map_err(|err| {
            syn::Error::new(
                directory_lit.span(),
                format!("failed to parse {}: {err}", path.display()),
            )
        })?;
        if locale.is_empty() {
            return Err(syn::Error::new(
                directory_lit.span(),
                format!("{} is missing a locale identifier", path.display()),
            ));
        }
        let entries = sort_map(map);
        catalogues.push((locale, entries));
        tracked.push(path.clone());
    }

    let default_locale = args
        .default_locale
        .as_ref()
        .map(LitStr::value)
        .or_else(|| catalogues.first().map(|(l, _)| l.clone()))
        .expect("at least one catalogue exists");

    let mut add_calls = Vec::with_capacity(catalogues.len());
    for (locale, entries) in &catalogues {
        let pairs = entries.iter().map(|(k, v)| {
            let k = k.as_str();
            let v = v.as_str();
            quote! { (#k, #v) }
        });
        add_calls.push(quote! {
            __i18n.add_translations(#locale, [ #( #pairs ),* ]);
        });
    }

    let track_includes: Vec<TokenStream2> = tracked
        .iter()
        .enumerate()
        .map(|(index, path)| {
            let path_str = path.to_string_lossy().to_string();
            let const_name = format_ident!("__LINO_I18N_INCLUDE_{}", index);
            quote! { const #const_name: &'static str = include_str!(#path_str); }
        })
        .collect();

    let fallback_setup = if let Some(fallback) = &args.fallback {
        let fb = fallback.value();
        quote! { __i18n.set_fallbacks([ #fb .to_string() ]); }
    } else {
        quote! {}
    };

    Ok(quote! {{
        #( #track_includes )*
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

fn sort_map(map: HashMap<String, String>) -> Vec<(String, String)> {
    let mut entries: Vec<(String, String)> = map.into_iter().collect();
    entries.sort_by(|a, b| a.0.cmp(&b.0));
    entries
}
