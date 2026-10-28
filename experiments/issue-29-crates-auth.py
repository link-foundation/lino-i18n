#!/usr/bin/env python3
"""Exercise Rust release authentication wiring and the real preflight offline."""
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import subprocess
from threading import Thread
import unittest

import yaml

ROOT = Path(__file__).resolve().parents[1]
AUTH_ACTION = "rust-lang/crates-io-auth-action@c6f97d42243bad5fab37ca0427f495c86d5b1a18"
TOKEN_EXPRESSION = "${{ steps.crates_auth.outputs.token || secrets.CARGO_REGISTRY_TOKEN || secrets.CARGO_TOKEN }}"
CRATES = ["lino-i18n-macros", "lino-i18n"]


@contextmanager
def registry(denied_crate=None):
    requests = []

    class Handler(BaseHTTPRequestHandler):
        def do_PUT(self):
            body = self.rfile.read(int(self.headers["Content-Length"]))
            metadata_length = int.from_bytes(body[:4], "little")
            metadata = json.loads(body[4:])
            requests.append((self.path, self.headers["Authorization"], metadata["name"], len(body) == 4 + metadata_length))
            self.send_response(403 if metadata["name"] == denied_crate else 400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"errors": [{"detail": "invalid tarball length"}]}).encode())

        def log_message(self, *_args):
            pass

    with ThreadingHTTPServer(("127.0.0.1", 0), Handler) as server:
        thread = Thread(target=server.serve_forever)
        thread.start()
        try:
            yield f"http://127.0.0.1:{server.server_port}", requests
        finally:
            server.shutdown()
            thread.join()


class CratesAuthenticationTests(unittest.TestCase):
    def setUp(self):
        self.workflow = yaml.safe_load((ROOT / ".github/workflows/rust.yml").read_text())

    def test_authentication_precedes_every_credential_consumer(self):
        self.assertNotIn("workflow_call", self.workflow["on"], "Declare optional token secrets if making this workflow reusable")
        self.assertEqual(self.workflow["permissions"], {"contents": "read"})
        for name in ("auto-release", "manual-release", "release-preflight"):
            with self.subTest(job=name):
                job = self.workflow["jobs"][name]
                self.assertEqual(job.get("permissions", {}).get("id-token"), "write")
                self.assertEqual(job["environment"]["name"], "crates.io")
                steps = job["steps"]
                authentication = [step for step in steps if step.get("id") == "crates_auth"]
                self.assertEqual(len(authentication), 1)
                auth = authentication[0]
                self.assertEqual(auth["uses"], AUTH_ACTION)
                self.assertIs(auth["continue-on-error"], True)
                consumers = [step for step in steps if "preflight-publish.sh crates" in step.get("run", "")
                             or "publish-crate.rs" in step.get("run", "")]
                self.assertEqual(len(consumers), 1 if name == "release-preflight" else 2)
                for consumer in consumers:
                    self.assertLess(steps.index(auth), steps.index(consumer))
                    self.assertEqual(auth.get("if"), consumer.get("if"))
                    self.assertEqual(consumer["env"]["CARGO_REGISTRY_TOKEN"], TOKEN_EXPRESSION)
                if name != "release-preflight":
                    versioning = next(step for step in steps if step.get("name") == "Version and commit")
                    self.assertLess(steps.index(consumers[0]), steps.index(versioning))

    def preflight(self, api, token="", legacy=""):
        env = {**os.environ, "CRATES_API": api, "CARGO_REGISTRY_TOKEN": token, "CARGO_TOKEN": legacy,
               "PREFLIGHT_CURL_TIMEOUT": "2", "ACTIONS_ID_TOKEN_REQUEST_URL": "mock-oidc-url",
               "ACTIONS_ID_TOKEN_REQUEST_TOKEN": "mock-oidc-request"}
        return subprocess.run(["bash", "scripts/preflight-publish.sh", "crates"], cwd=ROOT,
                              env=env, capture_output=True, text=True, timeout=10)

    def test_selected_credentials_reach_both_crates_without_logging_tokens(self):
        cases = [("mock-oidc", "mock-primary", "mock-legacy", "mock-oidc"),
                 ("mock-oidc", "", "", "mock-oidc"),
                 ("", "mock-primary", "mock-legacy", "mock-primary"),
                 ("", "", "mock-legacy", "mock-legacy")]
        for oidc, primary, legacy, expected in cases:
            with self.subTest(oidc=bool(oidc), primary=bool(primary), legacy=bool(legacy)):
                values = {"steps.crates_auth.outputs.token": oidc,
                          "secrets.CARGO_REGISTRY_TOKEN": primary, "secrets.CARGO_TOKEN": legacy}
                # Evaluate the workflow's actual ordered || expression using string outputs/secrets.
                expression = self.workflow["jobs"]["release-preflight"]["steps"][-1]["env"]["CARGO_REGISTRY_TOKEN"]
                selected = next((values[key.strip()] for key in expression[3:-2].split("||") if values[key.strip()]), "")
                self.assertEqual(selected, expected)
                with registry() as (api, requests):
                    result = self.preflight(api, selected)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertEqual(requests, [("/api/v1/crates/new", expected, crate, True) for crate in CRATES])
                self.assertNotIn(expected, result.stdout + result.stderr)

    def test_oidc_request_variables_alone_cannot_pass_without_a_credential(self):
        with registry() as (api, requests):
            result = self.preflight(api)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(requests, [])

    def test_legacy_token_still_works_when_running_preflight_directly(self):
        with registry() as (api, requests):
            result = self.preflight(api, legacy="mock-legacy")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual([entry[1] for entry in requests], ["mock-legacy"] * 2)

    def test_rejection_of_either_crate_fails_preflight_and_checks_both(self):
        for denied in CRATES:
            with self.subTest(crate=denied), registry(denied) as (api, requests):
                result = self.preflight(api, "mock-credential")
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual([entry[2] for entry in requests], CRATES)
                self.assertNotIn("mock-credential", result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main(verbosity=2)
