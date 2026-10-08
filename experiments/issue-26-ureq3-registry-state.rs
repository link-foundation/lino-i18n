#!/usr/bin/env rust-script
//! Issue 26: exercise rust/scripts/registry-state.rs after the ureq 3 migration
//! against live crates.io: a published version is visible, an unpublished one
//! maps HTTP 404 (`ureq::Error::StatusCode(404)`) to "absent", not "unknown".
//! ```cargo
//! [dependencies]
//! ureq = "3.4.2"
//! serde_json = "1"
//! ```
#[path = "../rust/scripts/registry-state.rs"]
mod registry_state;

fn main() {
    let published = registry_state::version_exists("lino-i18n", "0.3.0");
    let missing = registry_state::version_exists("lino-i18n", "99.0.0");
    println!("lino-i18n@0.3.0 visible: {published}");
    println!("lino-i18n@99.0.0 visible: {missing}");
    assert!(published && !missing);
}
