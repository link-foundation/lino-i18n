//! Shared, fail-closed Git comparisons for CI guards.
use std::env;
use std::process::Command;

pub fn git(args: &[&str]) -> Result<String, String> {
    let output = Command::new("git")
        .args(args)
        .output()
        .map_err(|e| e.to_string())?;
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_owned());
    }
    Ok(String::from_utf8_lossy(&output.stdout)
        .trim_end_matches('\n')
        .to_owned())
}

fn resolve(reference: &str) -> Result<String, String> {
    git(&[
        "rev-parse",
        "--verify",
        "--end-of-options",
        &format!("{reference}^{{commit}}"),
    ])
}

pub fn comparison() -> Result<(String, String), String> {
    let base_ref = env::var("GITHUB_BASE_SHA")
        .ok()
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| {
            format!(
                "origin/{}",
                env::var("GITHUB_BASE_REF").unwrap_or_else(|_| "main".into())
            )
        });
    let head_ref = env::var("GITHUB_HEAD_SHA")
        .ok()
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| "HEAD".into());
    let base = resolve(&base_ref)?;
    let head = resolve(&head_ref)?;
    let merge_base = git(&["merge-base", &base, &head])?;
    if env::var("DEBUG").as_deref() == Ok("1") {
        eprintln!("Comparing {merge_base}..{head} (PR base {base})");
    }
    Ok((merge_base, head))
}

pub fn changes(base: &str, head: &str, filter: &str) -> Result<Vec<String>, String> {
    Ok(git(&[
        "diff",
        "--name-only",
        "-z",
        "--no-renames",
        &format!("--diff-filter={filter}"),
        base,
        head,
        "--",
    ])?
    .split('\0')
    .filter(|v| !v.is_empty())
    .map(str::to_owned)
    .collect())
}

/// Exact renames of an existing fragment do not constitute a new fragment.
pub fn additions(base: &str, head: &str) -> Result<Vec<String>, String> {
    Ok(git(&[
        "diff",
        "--name-only",
        "-z",
        "--find-renames=100%",
        "--diff-filter=A",
        base,
        head,
        "--",
    ])?
    .split('\0')
    .filter(|v| !v.is_empty())
    .map(str::to_owned)
    .collect())
}

pub fn changed_files() -> Result<Vec<String>, String> {
    if env::var("GITHUB_EVENT_NAME").as_deref() == Ok("pull_request") {
        let (base, head) = comparison()?;
        return changes(&base, &head, "ACDMRT");
    }
    let head = resolve("HEAD")?;
    let before = env::var("GITHUB_BEFORE_SHA").ok().filter(|v| !v.is_empty());
    let parents = git(&["rev-list", "--parents", "-n", "1", &head])?;
    if before.as_ref().is_some_and(|v| v.chars().all(|c| c == '0'))
        || (before.is_none() && parents.split_whitespace().count() == 1)
    {
        return Ok(git(&["ls-tree", "-r", "--name-only", "-z", &head])?
            .split('\0')
            .filter(|v| !v.is_empty())
            .map(str::to_owned)
            .collect());
    }
    let base = resolve(&before.unwrap_or_else(|| format!("{head}^1")))?;
    changes(&base, &head, "ACDMRT")
}

pub fn rust_root() -> &'static str {
    if std::path::Path::new("rust/Cargo.toml").exists() {
        "rust/"
    } else {
        ""
    }
}

pub fn release_source(path: &str) -> bool {
    let Some(path) = path.strip_prefix(rust_root()) else {
        return false;
    };
    path == "Cargo.toml"
        || path == "Cargo.lock"
        || path.starts_with("src/")
        || (path.split('/').count() == 2 && path.ends_with("/Cargo.toml"))
        || path.contains("/src/")
}
