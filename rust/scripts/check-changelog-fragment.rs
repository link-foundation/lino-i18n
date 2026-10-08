#!/usr/bin/env rust-script
//! Require a new, valid fragment for every published Rust package change.
//! ```cargo
//! [dependencies]
//! regex = "1"
//! ```
use std::process::exit;
#[path = "git-changes.rs"]
#[allow(dead_code)]
mod git_changes;

fn check() -> Result<(), String> {
    let (base, head) = git_changes::comparison()?;
    let files = git_changes::changes(&base, &head, "ACDMRT")?;
    if !files.iter().any(|f| git_changes::release_source(f)) {
        return Ok(());
    }
    let prefix = format!("{}changelog.d/", git_changes::rust_root());
    let added = git_changes::additions(&base, &head)?;
    let fragments: Vec<_> = added
        .iter()
        .filter(|f| f.starts_with(&prefix) && f.ends_with(".md") && !f.ends_with("README.md"))
        .collect();
    if fragments.is_empty() {
        return Err(format!("No new changelog fragment; add a file in {prefix}"));
    }
    let pattern =
        regex::Regex::new(r"\A---\r?\n(?:bump: (?:patch|minor|major))\r?\n---\r?\n\s*\S").unwrap();
    for file in fragments {
        let text = git_changes::git(&["show", &format!("{head}:{file}")])?;
        if !pattern.is_match(&text) {
            return Err(format!(
                "Invalid fragment {file}: specify bump: patch|minor|major and a description."
            ));
        }
    }
    Ok(())
}

fn main() {
    if let Err(error) = check() {
        eprintln!("::error::{error}");
        exit(1);
    }
    println!("Changelog fragment check passed.");
}
