"""Extract with: lino-i18n extract --in sources.py --out catalogs --locale en."""
from gt_flask import t as translate, derive, msg

LABELS = {"cat": "Cat", "dog": "Dog"}


def greeting():
    if is_daytime:
        return "Good morning"
    return "Good evening"


# Extraction parses this file and does not run this statement or imported code.
raise RuntimeError("This example must only be extracted")
translate("Hello {name}", name=user.name, _id="hello", _context="Greeting")
translate(f"{derive(greeting())}, {derive(LABELS[animal])}!")
msg("{count, plural, one {One item} other {# items}}")
