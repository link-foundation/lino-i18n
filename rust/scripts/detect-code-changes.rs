#!/usr/bin/env rust-script
//! Detect all changed package files, with full PR and push comparisons.
use std::{env, fs, io::Write, process::exit};
#[path = "git-changes.rs"]
#[allow(dead_code)]
mod git_changes;

fn main() {
    let files = git_changes::changed_files().unwrap_or_else(|error| {
        eprintln!("::error::Change detection failed: {error}");
        exit(1);
    });
    println!("Changed files: {files:?}");
    let rust_files: Vec<_> = files
        .iter()
        .filter(|f| f.starts_with(git_changes::rust_root()))
        .collect();
    let flags = [
        ("rs-changed", rust_files.iter().any(|f| f.ends_with(".rs"))),
        (
            "toml-changed",
            rust_files
                .iter()
                .any(|f| f.ends_with(".toml") || f.ends_with("Cargo.lock")),
        ),
        (
            "docs-changed",
            files
                .iter()
                .any(|f| (f.starts_with("docs/") || f.starts_with("rust/")) && f.ends_with(".md")),
        ),
        (
            "workflow-changed",
            files.iter().any(|f| {
                f.starts_with(".github/")
                    || f.starts_with(".githooks/")
                    || f.starts_with("scripts/")
                    || f.starts_with("experiments/issue-23-")
            }),
        ),
        (
            "any-code-changed",
            files.iter().any(|f| git_changes::release_source(f)),
        ),
    ];
    for (name, value) in flags {
        println!("{name}={value}");
        if let Some(path) = env::var("GITHUB_OUTPUT").ok().filter(|v| !v.is_empty()) {
            let mut file = fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(path)
                .expect("GITHUB_OUTPUT must be writable");
            writeln!(file, "{name}={value}").expect("GITHUB_OUTPUT write failed");
        }
    }
}
