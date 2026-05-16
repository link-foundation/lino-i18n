# Online References

Retrieved on 2026-05-16 while preparing issue 5.

- npm trusted publishing: https://docs.npmjs.com/trusted-publishers
  - Trusted publishing uses OIDC between npm and supported CI/CD providers.
  - For GitHub Actions trusted publishing, npm can automatically generate provenance attestations for public packages.
- npm provenance statements: https://docs.npmjs.com/generating-provenance-statements
  - npm provenance links a package publication to its source repository and build instructions.
- Cargo publishing reference: https://doc.rust-lang.org/cargo/reference/publishing.html
  - Cargo recommends `cargo publish --dry-run` or `cargo package` before publishing, and `cargo package --list` for inspecting archive contents.
  - A crates.io version cannot be overwritten after publication.
- Cargo publish command: https://doc.rust-lang.org/cargo/commands/cargo-publish.html
  - `cargo publish` uploads a `.crate` archive to the registry and waits for the package to appear in the index.
  - Authentication can be supplied through Cargo credentials or token environment variables.
- GitHub Pages custom workflows: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
  - Custom Pages workflows use `configure-pages`, `upload-pages-artifact`, and `deploy-pages` to publish generated static artifacts.
- GitHub Releases REST API: https://docs.github.com/rest/reference/releases
  - The releases API supports creating releases and looking them up by tag name.
