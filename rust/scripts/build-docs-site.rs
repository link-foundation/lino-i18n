#!/usr/bin/env rust-script
//! Build a small static documentation site for GitHub Pages.

use std::fs;
use std::path::{Path, PathBuf};

fn escape_html(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

fn read_markdown(path: &Path) -> String {
    escape_html(
        &fs::read_to_string(path)
            .unwrap_or_else(|_| panic!("failed to read markdown source {}", path.display())),
    )
}

fn page(title: &str, sections: &[(&str, &str, String)]) -> String {
    let nav = sections
        .iter()
        .map(|(id, label, _)| format!(r##"<a href="#{id}">{}</a>"##, escape_html(label)))
        .collect::<Vec<_>>()
        .join("");

    let body = sections
        .iter()
        .map(|(id, label, markdown)| {
            format!(
                r#"<section id="{id}"><h2>{}</h2><pre>{markdown}</pre></section>"#,
                escape_html(label)
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    format!(
        r#"<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{}</title>
    <style>
      :root {{
        color-scheme: light dark;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.55;
      }}
      body {{
        margin: 0;
        color: #1d2430;
        background: #f7f8fb;
      }}
      header {{
        padding: 32px clamp(20px, 5vw, 64px);
        background: #ffffff;
        border-bottom: 1px solid #d9dee8;
      }}
      main {{
        max-width: 1120px;
        margin: 0 auto;
        padding: 24px clamp(16px, 4vw, 40px) 56px;
      }}
      nav {{
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 16px;
      }}
      nav a {{
        color: #175ca8;
        text-decoration: none;
        font-weight: 650;
      }}
      section {{
        margin-top: 28px;
      }}
      pre {{
        overflow-x: auto;
        white-space: pre-wrap;
        padding: 20px;
        background: #ffffff;
        border: 1px solid #d9dee8;
        border-radius: 8px;
      }}
      @media (prefers-color-scheme: dark) {{
        body {{
          color: #edf1f7;
          background: #10141b;
        }}
        header,
        pre {{
          background: #171d26;
          border-color: #313a48;
        }}
        nav a {{
          color: #8bc3ff;
        }}
      }}
    </style>
  </head>
  <body>
    <header>
      <h1>{}</h1>
      <p>Generated Rust crate documentation and repository docs.</p>
      <nav>{nav}</nav>
    </header>
    <main>{body}</main>
  </body>
</html>
"#,
        escape_html(title),
        escape_html(title)
    )
}

fn copy_dir_recursive(from: &Path, to: &Path) -> std::io::Result<()> {
    if !from.exists() {
        return Ok(());
    }

    fs::create_dir_all(to)?;
    for entry in fs::read_dir(from)? {
        let entry = entry?;
        let source = entry.path();
        let destination = to.join(entry.file_name());
        if source.is_dir() {
            copy_dir_recursive(&source, &destination)?;
        } else {
            fs::copy(&source, &destination)?;
        }
    }
    Ok(())
}

fn main() {
    let repo_root = PathBuf::from(".");
    let rust_root = repo_root.join("rust");
    let site_root = rust_root.join("site");

    fs::create_dir_all(&site_root).expect("failed to create site directory");
    fs::write(
        site_root.join("index.html"),
        page(
            "lino-i18n Rust Docs",
            &[
                (
                    "crate",
                    "Rust Runtime Crate",
                    read_markdown(&rust_root.join("lino-i18n/README.md")),
                ),
                (
                    "macros",
                    "Rust Macro Crate",
                    read_markdown(&rust_root.join("lino-i18n-macros/README.md")),
                ),
                (
                    "repository",
                    "Repository Overview",
                    read_markdown(&repo_root.join("README.md")),
                ),
                (
                    "changelog",
                    "Changelog",
                    read_markdown(&rust_root.join("CHANGELOG.md")),
                ),
            ],
        ),
    )
    .expect("failed to write docs index");

    copy_dir_recursive(&rust_root.join("target/doc"), &site_root.join("rustdoc"))
        .expect("failed to copy rustdoc output");

    println!("Generated Rust docs site at {}", site_root.display());
}
