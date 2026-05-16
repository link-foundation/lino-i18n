#!/usr/bin/env rust-script
//! Publish package to crates.io
//!
//! This script publishes the Rust package to crates.io and handles
//! the case where the version already exists.
//!
//! Supports both single-language and multi-language repository structures:
//! - Single-language: Cargo.toml in repository root
//! - Multi-language: Cargo.toml in rust/ subfolder
//!
//! Usage: rust-script scripts/publish-crate.rs [--token <token>] [--rust-root <path>]
//!
//! Environment variables (checked in order of priority):
//!   - CARGO_REGISTRY_TOKEN: Cargo's native crates.io token (preferred)
//!   - CARGO_TOKEN: Alternative token name for backwards compatibility
//!
//! Outputs (written to GITHUB_OUTPUT):
//!   - publish_result: 'success', 'already_exists', or 'failed'
//!
//! ```cargo
//! [dependencies]
//! regex = "1"
//! ureq = "2"
//! ```

use std::env;
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::process::{exit, Command};
use std::thread;
use std::time::Duration;

#[path = "rust-paths.rs"]
mod rust_paths;

fn get_arg(name: &str) -> Option<String> {
    let args: Vec<String> = env::args().collect();
    let flag = format!("--{}", name);

    if let Some(idx) = args.iter().position(|a| a == &flag) {
        return args.get(idx + 1).cloned();
    }

    None
}

fn needs_cd(rust_root: &str) -> bool {
    rust_root != "."
}

fn set_output(key: &str, value: &str) {
    if let Ok(output_file) = env::var("GITHUB_OUTPUT") {
        if let Ok(mut file) = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&output_file)
        {
            let _ = writeln!(file, "{}={}", key, value);
        }
    }
    println!("Output: {}={}", key, value);
}

fn publish_order_key(manifest: &PathBuf) -> String {
    let package = rust_paths::read_package_info(manifest).ok();
    let name = package.map_or_else(String::new, |info| info.name);

    if name.ends_with("-macros") {
        format!("0-{name}")
    } else {
        format!("1-{name}")
    }
}

fn crate_version_exists(crate_name: &str, version: &str) -> bool {
    let url = format!("https://crates.io/api/v1/crates/{}/{}", crate_name, version);

    match ureq::get(&url)
        .set("User-Agent", "rust-script-publish-crate")
        .call()
    {
        Ok(response) => response.status() == 200,
        Err(ureq::Error::Status(404, _)) => false,
        Err(e) => {
            eprintln!("Warning: Could not check crates.io: {}", e);
            false
        }
    }
}

fn wait_for_crate_version(crate_name: &str, version: &str) -> Result<(), i32> {
    const MAX_ATTEMPTS: u64 = 30;
    const SLEEP_SECONDS: u64 = 10;

    for attempt in 1..=MAX_ATTEMPTS {
        if crate_version_exists(crate_name, version) {
            println!(
                "{}@{} is visible on crates.io after attempt {}",
                crate_name, version, attempt
            );
            return Ok(());
        }

        if attempt < MAX_ATTEMPTS {
            println!(
                "{}@{} is not visible on crates.io yet (attempt {}/{}); waiting {}s",
                crate_name, version, attempt, MAX_ATTEMPTS, SLEEP_SECONDS
            );
            thread::sleep(Duration::from_secs(SLEEP_SECONDS));
        }
    }

    eprintln!(
        "Error: {}@{} was not visible on crates.io after {} attempts",
        crate_name, version, MAX_ATTEMPTS
    );
    Err(1)
}

fn publish_one(manifest: &PathBuf, rust_root: &str, token: Option<&String>) -> Result<String, i32> {
    let package_info = match rust_paths::read_package_info(manifest) {
        Ok(info) => info,
        Err(e) => {
            eprintln!("Error: {}", e);
            return Err(1);
        }
    };
    let name = package_info.name;
    let version = package_info.version;

    println!("Package: {}@{}", name, version);

    if name == "example-sum-package-name" {
        println!(
            "Skipping publish: package name is the template default 'example-sum-package-name'"
        );
        return Ok(name);
    }

    if crate_version_exists(&name, &version) {
        println!(
            "Skipping publish: {}@{} already exists on crates.io",
            name, version
        );
        return Ok(name);
    }

    let mut cmd = Command::new("cargo");
    cmd.arg("publish").arg("--allow-dirty").arg("-p").arg(&name);

    if let Some(t) = token {
        cmd.arg("--token").arg(t);
    }

    if needs_cd(rust_root) {
        cmd.current_dir(rust_root);
    }

    let output = cmd.output().expect("Failed to execute cargo publish");

    if output.status.success() {
        println!("Successfully published {}@{} to crates.io", name, version);
        if name.ends_with("-macros") {
            wait_for_crate_version(&name, &version)?;
        }
        return Ok(name);
    }

    let stderr = String::from_utf8_lossy(&output.stderr);
    let stdout = String::from_utf8_lossy(&output.stdout);
    let combined = format!("{}\n{}", stdout, stderr);

    if combined.contains("already uploaded") || combined.contains("already exists") {
        eprintln!();
        eprintln!("=== VERSION ALREADY PUBLISHED ===");
        eprintln!(
            "Version {} of {} already exists on crates.io.",
            version, name
        );
        return Ok(name);
    }

    if combined.contains("non-empty token")
        || combined.contains("please provide a")
        || combined.contains("unauthorized")
        || combined.contains("authentication")
    {
        eprintln!();
        eprintln!("=== AUTHENTICATION FAILURE ===");
        eprintln!("Configure CARGO_REGISTRY_TOKEN or CARGO_TOKEN for crates.io publishing.");
        return Err(1);
    }

    eprintln!("Failed to publish {name} for unknown reason");
    eprintln!("{combined}");
    Err(1)
}

fn main() {
    let rust_root = match rust_paths::get_rust_root(None, true) {
        Ok(root) => root,
        Err(e) => {
            eprintln!("Error: {}", e);
            exit(1);
        }
    };
    let cargo_toml = rust_paths::get_cargo_toml_path(&rust_root);
    let mut package_manifests = match rust_paths::get_publishable_member_manifests(&cargo_toml) {
        Ok(paths) => paths,
        Err(e) => {
            eprintln!("Error: {}", e);
            exit(1);
        }
    };
    package_manifests.sort_by_key(publish_order_key);

    // Get token from CLI arg, then env vars
    let token = get_arg("token")
        .or_else(|| {
            env::var("CARGO_REGISTRY_TOKEN")
                .ok()
                .filter(|s| !s.is_empty())
        })
        .or_else(|| env::var("CARGO_TOKEN").ok().filter(|s| !s.is_empty()));

    println!();
    println!("=== Attempting to publish to crates.io ===");

    if token.is_none() {
        println!("::warning::Neither CARGO_REGISTRY_TOKEN nor CARGO_TOKEN is set, attempting publish without explicit token");
        println!();
        println!("To fix this, ensure one of the following secrets is configured:");
        println!("  - CARGO_REGISTRY_TOKEN (Cargo's native env var, preferred)");
        println!("  - CARGO_TOKEN (alternative for backwards compatibility)");
        println!();
        println!("For organization secrets, you may need to map the secret name in your workflow:");
        println!("  env:");
        println!("    CARGO_REGISTRY_TOKEN: ${{{{ secrets.CARGO_TOKEN }}}}");
        println!();
    } else {
        println!("Using provided authentication token");
    }

    let mut published = Vec::new();
    for manifest in &package_manifests {
        match publish_one(manifest, &rust_root, token.as_ref()) {
            Ok(name) => published.push(name),
            Err(code) => {
                set_output("publish_result", "failed");
                exit(code);
            }
        }
    }

    set_output("publish_result", "success");
    set_output("published_crates", &published.join(","));
}
