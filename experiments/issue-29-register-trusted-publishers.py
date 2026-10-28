#!/usr/bin/env python3
"""Inspect, or with --execute register, the two issue #29 trusted publishers.

Requires a crate owner's CARGO_REGISTRY_TOKEN or CARGO_TOKEN with the
`trusted-publishing` endpoint scope. Never removes publishers or secrets.
"""
import argparse
import json
import os
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

API = "https://crates.io/api/v1/trusted_publishing/github_configs"
IDENTITY = {"repository_owner": "link-foundation", "repository_name": "lino-i18n",
            "workflow_filename": "rust.yml", "environment": "crates.io"}


def configure(crate, execute, request):
    query = "?" + urlencode({"crate": crate})
    while query:
        response = request("GET", query, None)
        for config in response["github_configs"]:
            if all(config.get(key) == value for key, value in IDENTITY.items()):
                print(f"{crate}: trusted publisher verified (configuration {config['id']})")
                return
        query = response["meta"].get("next_page")
        if query and not query.startswith("?"):
            raise ValueError("Unexpected pagination link; refusing to forward credentials")
    if not execute:
        raise ValueError(f"{crate}: matching trusted publisher absent; rerun with --execute to register")
    config = request("POST", "", {"github_config": {"crate": crate, **IDENTITY}})["github_config"]
    if not all(config.get(key) == value for key, value in {"crate": crate, **IDENTITY}.items()):
        raise ValueError("Registration response did not match the requested identity")
    # Read back configuration rather than treating an accepted write as verification.
    configure(crate, False, request)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    token = os.environ.get("CARGO_REGISTRY_TOKEN") or os.environ.get("CARGO_TOKEN")
    if not token:
        print("Registration blocked: no crate-owner credential is available.", file=sys.stderr)
        return 1

    def request(method, query, body):
        data = json.dumps(body).encode() if body else None
        headers = {"Authorization": token, "Content-Type": "application/json",
                   "User-Agent": "lino-i18n trusted publisher setup (https://github.com/link-foundation/lino-i18n/pull/34)"}
        with urlopen(Request(API + query, data=data, headers=headers, method=method), timeout=20) as response:
            return json.load(response)

    failed = False
    for crate in ("lino-i18n-macros", "lino-i18n"):
        try:
            configure(crate, args.execute, request)
        except HTTPError as error:
            # Never print remote bodies, which can contain credential details.
            print(f"{crate}: registration blocked by crates.io HTTP {error.code}; requires an owner token with trusted-publishing scope.", file=sys.stderr)
            failed = True
        except (URLError, ValueError, KeyError):
            print(f"{crate}: registry request failed or matching configuration could not be verified.", file=sys.stderr)
            failed = True
    return int(failed)


if __name__ == "__main__":
    sys.exit(main())
