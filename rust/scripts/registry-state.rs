//! Anonymous exact-version reads: absence, visibility and unknown are distinct.
use serde_json::Value;

pub fn parse_version(body: &str, expected: &str) -> Result<bool, String> {
    let data: Value = serde_json::from_str(body).map_err(|error| error.to_string())?;
    match data
        .get("version")
        .and_then(|value| value.get("num"))
        .and_then(Value::as_str)
    {
        Some(version) if version == expected => Ok(true),
        _ => Err("Unexpected crates.io version metadata".into()),
    }
}

pub fn version_exists(crate_name: &str, version: &str) -> bool {
    let url = format!("https://crates.io/api/v1/crates/{crate_name}/{version}");
    if std::env::var("DEBUG").as_deref() == Ok("1") {
        eprintln!("Reading anonymous version metadata: {url}");
    }
    let state = match ureq::get(&url)
        .config()
        .timeout_global(Some(std::time::Duration::from_secs(15)))
        .build()
        .header("User-Agent", "lino-i18n-release")
        .call()
    {
        Ok(mut response) if response.status() == 200 => response
            .body_mut()
            .read_to_string()
            .map_err(|error| error.to_string())
            .and_then(|body| parse_version(&body, version)),
        Ok(response) => Err(format!("Unexpected HTTP {}", response.status())),
        Err(ureq::Error::StatusCode(404)) => Ok(false),
        Err(error) => Err(error.to_string()),
    };
    state.unwrap_or_else(|error| {
        eprintln!("::error::Crates.io state is unknown for {crate_name}@{version}: {error}");
        std::process::exit(1);
    })
}

#[cfg(test)]
mod tests {
    use super::parse_version;
    #[test]
    fn only_matching_valid_version_metadata_proves_visibility() {
        assert_eq!(
            parse_version(r#"{"version":{"num":"1.0.0"}}"#, "1.0.0"),
            Ok(true)
        );
        for body in ["not JSON", "{}", r#"{"version":{"num":"2.0.0"}}"#] {
            assert!(parse_version(body, "1.0.0").is_err());
        }
    }
}
