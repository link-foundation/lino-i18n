#!/usr/bin/env python3
"""Publish both languages in every Pages artifact, keeping the JS root URL."""
from pathlib import Path
import shutil

root = Path("site")
if root.exists():
    shutil.rmtree(root)
shutil.copytree("js/site", root)
shutil.copytree("rust/site", root / "rust")
assert (root / "index.html").is_file()
assert (root / "rust/index.html").is_file()
assert (root / "rust/rustdoc/lino_i18n/index.html").is_file()
print("Combined JS and Rust documentation is ready in site/")
