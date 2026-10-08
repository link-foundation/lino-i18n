#!/usr/bin/env rust-script
//! Issue 26: toml 0.9+ parses `str::parse::<toml::Value>()` as one TOML value,
//! so the toml 0.8 idiom used by check-version-modification.rs rejects whole
//! manifests. `toml::Table` is the document type in toml 1.
//! ```cargo
//! [dependencies]
//! toml = "1"
//! ```
fn main() {
    let manifest = "[package]\nname = \"a\"\nversion = \"1.2.3\"\n";
    match manifest.parse::<toml::Value>() {
        Ok(value) => println!("Value parse (toml 0.8 idiom): ok {value:?}"),
        Err(error) => println!("Value parse (toml 0.8 idiom): error: {error}"),
    }
    let table = manifest.parse::<toml::Table>().expect("documents parse as tables");
    println!("Table parse (toml 1 idiom): version = {}", table["package"]["version"]);
}
