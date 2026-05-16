//! Loads `locales/` at compile time and exercises the runtime.
//!
//! Run with `cargo run --example basic`.

use std::sync::OnceLock;

use lino_i18n::{i18n, I18n, TOptions};

fn catalog() -> &'static I18n {
    static C: OnceLock<I18n> = OnceLock::new();
    C.get_or_init(|| i18n!("locales", default = "en", fallback = "en"))
}

fn main() {
    let c = catalog();
    println!("{}", c.t("greeting", &[("name", "Alice")]));
    println!("{}", c.t_count("cart.items", 0, &[("count", "0")]));
    println!("{}", c.t_count("cart.items", 1, &[("count", "1")]));
    println!("{}", c.t_count("cart.items", 5, &[("count", "5")]));
    println!("{}", c.t("hero.description", &[]));

    println!(
        "{}",
        c.t_with(
            "greeting",
            &[("name", "Алиса")],
            &TOptions::new().locale("ru"),
        )
    );
    println!(
        "{}",
        c.t_with(
            "cart.items",
            &[("count", "3")],
            &TOptions::new().locale("ru").count(3),
        )
    );
    println!("{}", c.t("navigation.home", &[]));
    println!(
        "{}",
        c.t_with("role", &[], &TOptions::new().context("female"))
    );
}
