//! Shared fail-closed GitHub Actions output writing for every Rust CI helper.
use std::env;
use std::fs::OpenOptions;
use std::io::Write;

pub fn set_output(key: &str, value: &str) {
    if let Some(path) = env::var("GITHUB_OUTPUT")
        .ok()
        .filter(|path| !path.is_empty())
    {
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(path)
            .expect("GITHUB_OUTPUT must be writable");
        writeln!(file, "{key}={value}").expect("GITHUB_OUTPUT write failed");
    }
    println!("Output: {key}={value}");
}
