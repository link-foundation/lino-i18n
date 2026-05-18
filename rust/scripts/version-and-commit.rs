#!/usr/bin/env rust-script
//! Bump version in Cargo.toml and commit changes
//! Used by the CI/CD pipeline for releases
//!
//! IMPORTANT: This script checks crates.io (the source of truth for Rust packages),
//! NOT git tags. This is critical because:
//! - Git tags can exist without the package being published
//! - GitHub releases create tags but don't publish to crates.io
//! - Only crates.io publication means users can actually install the package
//!
//! Supports both single-language and multi-language repository structures:
//! - Single-language: Cargo.toml and changelog.d/ in repository root
//! - Multi-language: Cargo.toml and changelog.d/ in rust/ subfolder
//!
//! Usage: rust-script scripts/version-and-commit.rs --bump-type <major|minor|patch> [--description <desc>] [--rust-root <path>] [--tag-prefix <prefix>] [--release-label <label>]
//!
//! ```cargo
//! [dependencies]
//! regex = "1"
//! chrono = "0.4"
//! ureq = "2"
//! serde = { version = "1", features = ["derive"] }
//! serde_json = "1"
//! ```

use chrono::Utc;
use regex::Regex;
use serde::Deserialize;
use std::collections::HashSet;
use std::env;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{exit, Command};

#[path = "rust-paths.rs"]
mod rust_paths;

fn get_arg(name: &str) -> Option<String> {
    let args: Vec<String> = env::args().collect();
    let flag = format!("--{}", name);

    if let Some(idx) = args.iter().position(|a| a == &flag) {
        return args.get(idx + 1).cloned();
    }

    let env_name = name.to_uppercase().replace('-', "_");
    env::var(&env_name).ok().filter(|s| !s.is_empty())
}

fn get_changelog_dir(rust_root: &str) -> String {
    if rust_root == "." {
        "./changelog.d".to_string()
    } else {
        format!("{}/changelog.d", rust_root)
    }
}

fn get_changelog_path(rust_root: &str) -> String {
    if rust_root == "." {
        "./CHANGELOG.md".to_string()
    } else {
        format!("{}/CHANGELOG.md", rust_root)
    }
}

fn set_output(key: &str, value: &str) {
    if let Ok(output_file) = env::var("GITHUB_OUTPUT") {
        if let Err(e) = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&output_file)
            .and_then(|mut f| writeln!(f, "{}={}", key, value))
        {
            eprintln!("Warning: Could not write to GITHUB_OUTPUT: {}", e);
        }
    }
    println!("Output: {}={}", key, value);
}

fn exec(command: &str, args: &[&str]) -> Result<String, String> {
    match Command::new(command).args(args).output() {
        Ok(output) => {
            if output.status.success() {
                Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                Err(format!("Command failed: {}", stderr))
            }
        }
        Err(e) => Err(format!("Failed to execute: {}", e)),
    }
}

fn exec_check(command: &str, args: &[&str]) -> bool {
    Command::new(command)
        .args(args)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

struct Version {
    major: u32,
    minor: u32,
    patch: u32,
    #[allow(dead_code)]
    pre_release: Option<String>,
}

impl Version {
    fn parse(content: &str) -> Option<Version> {
        let re = Regex::new(r#"(?m)^version\s*=\s*"(\d+)\.(\d+)\.(\d+)(?:-([^"]+))?""#).ok()?;
        let caps = re.captures(content)?;
        Some(Version {
            major: caps.get(1)?.as_str().parse().ok()?,
            minor: caps.get(2)?.as_str().parse().ok()?,
            patch: caps.get(3)?.as_str().parse().ok()?,
            pre_release: caps.get(4).map(|m| m.as_str().to_string()),
        })
    }

    fn bump(&self, bump_type: &str) -> String {
        match bump_type {
            "major" => format!("{}.0.0", self.major + 1),
            "minor" => format!("{}.{}.0", self.major, self.minor + 1),
            _ => format!("{}.{}.{}", self.major, self.minor, self.patch + 1),
        }
    }
}

fn update_cargo_toml(cargo_toml_path: &str, new_version: &str) -> Result<(), String> {
    let content = fs::read_to_string(cargo_toml_path)
        .map_err(|e| format!("Failed to read {}: {}", cargo_toml_path, e))?;

    let re = Regex::new(r#"(?m)^(version\s*=\s*")[^"]+(")"#).unwrap();
    let new_content = re.replace(&content, format!("${{1}}{}${{2}}", new_version).as_str());

    fs::write(cargo_toml_path, new_content.as_ref())
        .map_err(|e| format!("Failed to write {}: {}", cargo_toml_path, e))?;

    println!("Updated {} to version {}", cargo_toml_path, new_version);
    Ok(())
}

fn read_publishable_package_names(manifests: &[PathBuf]) -> Result<Vec<String>, String> {
    let mut package_names = Vec::new();
    for manifest in manifests {
        package_names.push(rust_paths::read_package_info(manifest)?.name);
    }
    Ok(package_names)
}

fn update_workspace_path_dependency_versions(
    manifests: &[PathBuf],
    package_names: &[String],
    new_version: &str,
) -> Result<Vec<PathBuf>, String> {
    let version_re = Regex::new(r#"(version\s*=\s*")[^"]+(")"#).unwrap();
    let mut updated_manifests = Vec::new();

    for manifest in manifests {
        let content = fs::read_to_string(manifest)
            .map_err(|e| format!("Failed to read {}: {}", manifest.display(), e))?;
        let mut changed = false;
        let mut updated_lines = Vec::new();

        for line in content.lines() {
            let trimmed = line.trim_start();
            let mut updated_line = line.to_string();

            for package_name in package_names {
                if trimmed.starts_with(&format!("{package_name} ="))
                    && trimmed.contains("path =")
                    && trimmed.contains("version =")
                {
                    let replaced = version_re
                        .replace(&updated_line, format!("${{1}}{new_version}${{2}}").as_str())
                        .to_string();

                    if replaced != updated_line {
                        updated_line = replaced;
                        changed = true;
                    }
                }
            }

            updated_lines.push(updated_line);
        }

        if changed {
            let mut updated_content = updated_lines.join("\n");
            if content.ends_with('\n') {
                updated_content.push('\n');
            }
            fs::write(manifest, updated_content)
                .map_err(|e| format!("Failed to write {}: {}", manifest.display(), e))?;
            println!(
                "Updated local path dependency versions in {} to {}",
                manifest.display(),
                new_version
            );
            updated_manifests.push(manifest.clone());
        }
    }

    Ok(updated_manifests)
}

fn update_cargo_lock_package_versions(
    cargo_lock_path: &Path,
    package_names: &[String],
    new_version: &str,
) -> Result<Option<PathBuf>, String> {
    if !cargo_lock_path.exists() {
        return Ok(None);
    }

    let package_names: HashSet<&str> = package_names.iter().map(String::as_str).collect();
    let content = fs::read_to_string(cargo_lock_path)
        .map_err(|e| format!("Failed to read {}: {}", cargo_lock_path.display(), e))?;
    let name_re = Regex::new(r#"^name\s*=\s*"([^"]+)""#).unwrap();
    let version_re = Regex::new(r#"(version\s*=\s*")[^"]+(")"#).unwrap();

    let mut current_package: Option<String> = None;
    let mut changed = false;
    let mut updated_lines = Vec::new();

    for line in content.lines() {
        let trimmed = line.trim_start();
        let mut updated_line = line.to_string();

        if trimmed == "[[package]]" {
            current_package = None;
        } else if let Some(captures) = name_re.captures(trimmed) {
            current_package = captures.get(1).map(|name| name.as_str().to_string());
        } else if trimmed.starts_with("version =") {
            if current_package
                .as_deref()
                .is_some_and(|package_name| package_names.contains(package_name))
            {
                let replaced = version_re
                    .replace(&updated_line, format!("${{1}}{new_version}${{2}}").as_str())
                    .to_string();

                if replaced != updated_line {
                    updated_line = replaced;
                    changed = true;
                }
            }
        }

        updated_lines.push(updated_line);
    }

    if changed {
        let mut updated_content = updated_lines.join("\n");
        if content.ends_with('\n') {
            updated_content.push('\n');
        }
        fs::write(cargo_lock_path, updated_content)
            .map_err(|e| format!("Failed to write {}: {}", cargo_lock_path.display(), e))?;
        println!(
            "Updated workspace package versions in {} to {}",
            cargo_lock_path.display(),
            new_version
        );
        return Ok(Some(cargo_lock_path.to_path_buf()));
    }

    Ok(None)
}

#[derive(Deserialize)]
struct CratesIoCrate {
    versions: Option<Vec<CratesIoVersionEntry>>,
}

#[derive(Deserialize)]
struct CratesIoVersionEntry {
    num: String,
    yanked: bool,
}

fn check_tag_exists(tag_prefix: &str, version: &str) -> bool {
    exec_check("git", &["rev-parse", &format!("{}{}", tag_prefix, version)])
}

fn check_version_on_crates_io(crate_name: &str, version: &str) -> bool {
    let url = format!("https://crates.io/api/v1/crates/{}/{}", crate_name, version);
    match ureq::get(&url)
        .set("User-Agent", "rust-script-version-and-commit")
        .call()
    {
        Ok(response) => response.status() == 200,
        Err(_) => false,
    }
}

fn get_max_published_version(crate_name: &str) -> Option<(u32, u32, u32)> {
    let url = format!("https://crates.io/api/v1/crates/{}", crate_name);
    match ureq::get(&url)
        .set("User-Agent", "rust-script-version-and-commit")
        .call()
    {
        Ok(response) => {
            if response.status() == 200 {
                if let Ok(body) = response.into_string() {
                    if let Ok(data) = serde_json::from_str::<CratesIoCrate>(&body) {
                        if let Some(versions) = data.versions {
                            let mut max: Option<(u32, u32, u32)> = None;
                            for v in &versions {
                                if v.yanked {
                                    continue;
                                }
                                let base = match v.num.split('-').next() {
                                    Some(b) => b,
                                    None => continue,
                                };
                                let parts: Vec<&str> = base.split('.').collect();
                                if parts.len() == 3 {
                                    if let (Ok(a), Ok(b), Ok(c)) = (
                                        parts[0].parse::<u32>(),
                                        parts[1].parse::<u32>(),
                                        parts[2].parse::<u32>(),
                                    ) {
                                        let tuple = (a, b, c);
                                        if max.map_or(true, |m| tuple > m) {
                                            max = Some(tuple);
                                        }
                                    }
                                }
                            }
                            return max;
                        }
                    }
                }
            }
            None
        }
        Err(_) => None,
    }
}

fn ensure_version_exceeds_published(
    version_str: &str,
    crate_name: &str,
    tag_prefix: &str,
    max_published: Option<(u32, u32, u32)>,
) -> String {
    let parts: Vec<&str> = version_str
        .split('-')
        .next()
        .unwrap_or(version_str)
        .split('.')
        .collect();
    if parts.len() != 3 {
        return version_str.to_string();
    }

    let mut major: u32 = parts[0].parse().unwrap_or(0);
    let mut minor: u32 = parts[1].parse().unwrap_or(0);
    let mut patch: u32 = parts[2].parse().unwrap_or(0);

    if let Some((pub_major, pub_minor, pub_patch)) = max_published {
        if (major, minor, patch) <= (pub_major, pub_minor, pub_patch) {
            println!(
                "Version {}.{}.{} is not greater than max published {}.{}.{}, adjusting to {}.{}.{}",
                major, minor, patch,
                pub_major, pub_minor, pub_patch,
                pub_major, pub_minor, pub_patch + 1
            );
            major = pub_major;
            minor = pub_minor;
            patch = pub_patch + 1;
        }
    }

    let mut candidate = format!("{}.{}.{}", major, minor, patch);
    let mut safety_counter = 0;
    while (check_tag_exists(tag_prefix, &candidate)
        || check_version_on_crates_io(crate_name, &candidate))
        && safety_counter < 100
    {
        println!(
            "Version {} already has a git tag or is published on crates.io, bumping patch",
            candidate
        );
        patch += 1;
        candidate = format!("{}.{}.{}", major, minor, patch);
        safety_counter += 1;
    }

    if safety_counter >= 100 {
        eprintln!("Error: Could not find an unpublished version after 100 attempts");
        exit(1);
    }

    candidate
}

fn strip_frontmatter(content: &str) -> String {
    let re = Regex::new(r"(?s)^---\s*\n.*?\n---\s*\n(.*)$").unwrap();
    if let Some(caps) = re.captures(content) {
        caps.get(1).unwrap().as_str().trim().to_string()
    } else {
        content.trim().to_string()
    }
}

fn collect_changelog(changelog_dir: &str, changelog_file: &str, version: &str) {
    let dir_path = Path::new(changelog_dir);
    if !dir_path.exists() {
        return;
    }

    let mut files: Vec<_> = match fs::read_dir(dir_path) {
        Ok(entries) => entries
            .filter_map(|e| e.ok())
            .map(|e| e.path())
            .filter(|p| {
                p.extension().map_or(false, |ext| ext == "md")
                    && p.file_name().map_or(false, |name| name != "README.md")
            })
            .collect(),
        Err(_) => return,
    };

    if files.is_empty() {
        return;
    }

    files.sort();

    let fragments: Vec<String> = files
        .iter()
        .filter_map(|f| fs::read_to_string(f).ok())
        .map(|c| strip_frontmatter(&c))
        .filter(|c| !c.is_empty())
        .collect();

    if fragments.is_empty() {
        return;
    }

    let date_str = Utc::now().format("%Y-%m-%d").to_string();
    let new_entry = format!(
        "\n## [{}] - {}\n\n{}\n",
        version,
        date_str,
        fragments.join("\n\n")
    );

    if Path::new(changelog_file).exists() {
        let mut content = fs::read_to_string(changelog_file).unwrap_or_default();
        let lines: Vec<&str> = content.lines().collect();
        let mut insert_index = None;

        for (i, line) in lines.iter().enumerate() {
            if line.starts_with("## [") {
                insert_index = Some(i);
                break;
            }
        }

        if let Some(idx) = insert_index {
            let mut new_lines: Vec<String> = lines[..idx].iter().map(|s| s.to_string()).collect();
            new_lines.push(new_entry.clone());
            new_lines.extend(lines[idx..].iter().map(|s| s.to_string()));
            content = new_lines.join("\n");
        } else {
            content.push_str(&new_entry);
        }

        fs::write(changelog_file, content).expect("Failed to write changelog");
    }

    println!("Collected {} changelog fragment(s)", files.len());
}

fn main() {
    let bump_type = match get_arg("bump-type") {
        Some(bt) => bt,
        None => {
            eprintln!("Usage: rust-script scripts/version-and-commit.rs --bump-type <major|minor|patch> [--description <desc>] [--rust-root <path>] [--tag-prefix <prefix>] [--release-label <label>]");
            exit(1);
        }
    };

    if !["major", "minor", "patch"].contains(&bump_type.as_str()) {
        eprintln!(
            "Invalid bump type: {}. Must be major, minor, or patch.",
            bump_type
        );
        exit(1);
    }

    let description = get_arg("description");
    let tag_prefix = get_arg("tag-prefix").unwrap_or_else(|| "v".to_string());
    let release_label = get_arg("release-label");
    let rust_root = match rust_paths::get_rust_root(None, true) {
        Ok(root) => root,
        Err(e) => {
            eprintln!("Error: {}", e);
            exit(1);
        }
    };
    let cargo_toml = rust_paths::get_cargo_toml_path(&rust_root);
    let package_manifest = match rust_paths::get_package_manifest_path(&cargo_toml) {
        Ok(path) => path,
        Err(e) => {
            eprintln!("Error: {}", e);
            exit(1);
        }
    };
    let package_manifests = match rust_paths::get_publishable_member_manifests(&cargo_toml) {
        Ok(paths) => paths,
        Err(e) => {
            eprintln!("Error: {}", e);
            exit(1);
        }
    };
    let package_names = match read_publishable_package_names(&package_manifests) {
        Ok(names) => names,
        Err(e) => {
            eprintln!("Error: {}", e);
            exit(1);
        }
    };
    let changelog_dir = get_changelog_dir(&rust_root);
    let changelog_file = get_changelog_path(&rust_root);

    // Configure git
    let _ = exec("git", &["config", "user.name", "github-actions[bot]"]);
    let _ = exec(
        "git",
        &[
            "config",
            "user.email",
            "github-actions[bot]@users.noreply.github.com",
        ],
    );

    let package_info = match rust_paths::read_package_info(&package_manifest) {
        Ok(info) => info,
        Err(e) => {
            eprintln!("Error: {}", e);
            exit(1);
        }
    };
    let version_manifest = rust_paths::get_version_manifest_path(&package_manifest);
    let version_content = format!("version = \"{}\"", package_info.version);

    let current = match Version::parse(&version_content) {
        Some(v) => v,
        None => {
            eprintln!(
                "Error: Could not parse version from {}",
                version_manifest.display()
            );
            exit(1);
        }
    };

    let initial_bump = current.bump(&bump_type);
    let crate_name = package_info.name;

    let max_published = get_max_published_version(&crate_name);
    if let Some((ma, mi, pa)) = max_published {
        println!("Max published version on crates.io: {}.{}.{}", ma, mi, pa);
    } else {
        println!("No versions published on crates.io yet (or crate not found)");
    }

    println!(
        "Initial bump ({}) from {}.{}.{}: {}",
        bump_type, current.major, current.minor, current.patch, initial_bump
    );

    let new_version =
        ensure_version_exceeds_published(&initial_bump, &crate_name, &tag_prefix, max_published);

    if new_version != initial_bump {
        println!(
            "Adjusted version from {} to {} to exceed published versions",
            initial_bump, new_version
        );
    }

    println!("Final release version: {}", new_version);

    // Update the manifest that owns the version. Workspace crates use
    // [workspace.package], while single-crate projects use their package
    // manifest directly.
    if let Err(e) = update_cargo_toml(version_manifest.to_string_lossy().as_ref(), &new_version) {
        eprintln!("Error: {}", e);
        exit(1);
    }

    let updated_dependency_manifests =
        match update_workspace_path_dependency_versions(
            &package_manifests,
            &package_names,
            &new_version,
        ) {
            Ok(manifests) => manifests,
            Err(e) => {
                eprintln!("Error: {}", e);
                exit(1);
            }
        };
    let cargo_lock_path = rust_paths::get_cargo_lock_path(&rust_root);
    let updated_cargo_lock =
        match update_cargo_lock_package_versions(&cargo_lock_path, &package_names, &new_version) {
            Ok(path) => path,
            Err(e) => {
                eprintln!("Error: {}", e);
                exit(1);
            }
        };

    // Collect changelog fragments
    collect_changelog(&changelog_dir, &changelog_file, &new_version);

    // Stage Cargo.toml and CHANGELOG.md
    let version_manifest_str = version_manifest.to_string_lossy().to_string();
    let _ = exec("git", &["add", &version_manifest_str, &changelog_file]);
    for manifest in &updated_dependency_manifests {
        let manifest_str = manifest.to_string_lossy().to_string();
        let _ = exec("git", &["add", &manifest_str]);
    }
    if let Some(cargo_lock) = &updated_cargo_lock {
        let cargo_lock_str = cargo_lock.to_string_lossy().to_string();
        let _ = exec("git", &["add", &cargo_lock_str]);
    }

    // Check if there are changes to commit
    if exec_check("git", &["diff", "--cached", "--quiet"]) {
        println!("No changes to commit");
        set_output("version_committed", "false");
        set_output("new_version", &new_version);
        return;
    }

    // Fetch latest remote state before committing (supports concurrent release workflows)
    let current_branch =
        exec("git", &["rev-parse", "--abbrev-ref", "HEAD"]).unwrap_or_else(|_| "main".to_string());
    if let Err(e) = exec("git", &["fetch", "origin", &current_branch]) {
        eprintln!("Warning: Could not fetch origin/{}: {}", current_branch, e);
    } else {
        let local = exec("git", &["rev-parse", "HEAD"]).unwrap_or_default();
        let remote =
            exec("git", &["rev-parse", &format!("origin/{}", current_branch)]).unwrap_or_default();
        if !local.is_empty() && !remote.is_empty() && local != remote {
            println!("Local branch is behind remote, rebasing...");
            if let Err(e) = exec("git", &["rebase", &format!("origin/{}", current_branch)]) {
                eprintln!("Error rebasing onto origin/{}: {}", current_branch, e);
                let _ = exec("git", &["rebase", "--abort"]);
                exit(1);
            }
        }
    }

    // Commit changes
    let label_suffix = release_label
        .as_ref()
        .map(|l| format!(" ({})", l))
        .unwrap_or_default();
    let commit_msg = match &description {
        Some(desc) => format!(
            "chore: release {}{}{}\n\n{}",
            tag_prefix, new_version, label_suffix, desc
        ),
        None => format!(
            "chore: release {}{}{}",
            tag_prefix, new_version, label_suffix
        ),
    };

    if let Err(e) = exec("git", &["commit", "-m", &commit_msg]) {
        eprintln!("Error committing: {}", e);
        exit(1);
    }
    println!("Committed version {}", new_version);

    // Create tag
    let tag_name = format!("{}{}", tag_prefix, new_version);
    let tag_msg = match &description {
        Some(desc) => format!("Release {}{}\n\n{}", tag_name, label_suffix, desc),
        None => format!("Release {}{}", tag_name, label_suffix),
    };

    if let Err(e) = exec("git", &["tag", "-a", &tag_name, "-m", &tag_msg]) {
        eprintln!("Error creating tag: {}", e);
        exit(1);
    }
    println!("Created tag {}", tag_name);

    // Push changes and tag with retry (handles concurrent pushes in multi-workflow repos)
    let max_push_attempts = 3;
    for attempt in 1..=max_push_attempts {
        match exec("git", &["push"]) {
            Ok(_) => break,
            Err(e) => {
                if attempt < max_push_attempts {
                    eprintln!(
                        "Push failed (attempt {}/{}): {}",
                        attempt, max_push_attempts, e
                    );
                    eprintln!("Pulling with rebase and retrying...");
                    if let Err(rebase_err) =
                        exec("git", &["pull", "--rebase", "origin", &current_branch])
                    {
                        eprintln!("Error during pull --rebase: {}", rebase_err);
                        let _ = exec("git", &["rebase", "--abort"]);
                        exit(1);
                    }
                } else {
                    eprintln!("Error pushing after {} attempts: {}", max_push_attempts, e);
                    exit(1);
                }
            }
        }
    }

    if let Err(e) = exec("git", &["push", "--tags"]) {
        eprintln!("Error pushing tags: {}", e);
        exit(1);
    }
    println!("Pushed changes and tags");

    set_output("version_committed", "true");
    set_output("new_version", &new_version);
}
