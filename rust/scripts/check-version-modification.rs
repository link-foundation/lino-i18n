#!/usr/bin/env rust-script
//! Compare package/workspace versions semantically, including member manifests.
//! ```cargo
//! [dependencies]
//! toml = "1.1.7"
//! ```
use std::{env, process::exit};
#[path = "git-changes.rs"]
#[allow(dead_code)]
mod git_changes;

fn versions(text: &str) -> Result<(Option<toml::Value>, Option<toml::Value>), String> {
    let document = text.parse::<toml::Table>().map_err(|e| e.to_string())?;
    let package = document
        .get("package")
        .and_then(|v| v.get("version"))
        .cloned();
    let workspace = document
        .get("workspace")
        .and_then(|v| v.get("package"))
        .and_then(|v| v.get("version"))
        .cloned();
    Ok((package, workspace))
}

fn check() -> Result<(), String> {
    let (base, head) = git_changes::comparison()?;
    for file in git_changes::changes(&base, &head, "M")? {
        if !file.starts_with(git_changes::rust_root()) || !file.ends_with("Cargo.toml") {
            continue;
        }
        let old = versions(&git_changes::git(&["show", &format!("{base}:{file}")])?)?;
        let new = versions(&git_changes::git(&["show", &format!("{head}:{file}")])?)?;
        if old != new {
            return Err(format!(
                "Manual package version change in {file}; add a changelog fragment instead."
            ));
        }
    }
    Ok(())
}

fn main() {
    if env::var("GITHUB_EVENT_NAME").as_deref() != Ok("pull_request") {
        return;
    }
    if let Err(error) = check() {
        eprintln!("::error::{error}");
        exit(1);
    }
    println!("Package and workspace versions are unchanged.");
}

#[cfg(test)]
mod tests {
    use super::versions;

    #[test]
    fn reads_package_and_workspace_versions_from_whole_manifests() {
        let package = versions("[package]\nname = \"a\"\nversion = \"1.2.3\"\n").unwrap();
        assert_eq!(package.0, Some(toml::Value::String("1.2.3".into())));
        assert_eq!(package.1, None);
        let workspace =
            versions("[workspace]\nmembers = []\n[workspace.package]\nversion = \"2.0.0\"\n")
                .unwrap();
        assert_eq!(workspace.0, None);
        assert_eq!(workspace.1, Some(toml::Value::String("2.0.0".into())));
        assert!(versions("[package\n").is_err());
    }
}
