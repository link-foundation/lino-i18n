#!/usr/bin/env python3
"""Validate product documentation, excluding captured external evidence."""
from pathlib import Path

files = [Path("README.md"), *Path("js").glob("*.md"), *Path("rust").rglob("README.md"), *Path("docs").rglob("*.md")]
for path in files:
    text = path.read_text()
    assert text.strip(), f"{path}: empty documentation"
    assert len(text.splitlines()) <= 2500, f"{path}: exceeds 2500 lines"
    assert text.startswith("#"), f"{path}: missing title"
for name in ("README.md", "js/README.md", "rust/lino-i18n/README.md"):
    text = Path(name).read_text().lower()
    assert ("install" in text or "cargo" in text) and ("usage" in text or "quick start" in text), f"{name}: missing installation or usage"
print(f"Validated {len(files)} product documents.")
