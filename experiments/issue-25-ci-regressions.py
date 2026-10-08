#!/usr/bin/env python3
"""Reproduce moved-document links and implicit-success CI skips from issue 25."""
import importlib.util
from pathlib import Path
import re
import tempfile
import unittest

import yaml

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("policy", ROOT / "scripts/check-ci-policy.py")
policy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(policy)


class CiRegressions(unittest.TestCase):
    def test_inherited_case_study_links_resolve(self):
        document = ROOT / "docs/BEST-PRACTICES.md"
        links = re.findall(r"\]\((\./case-studies/issue-25/[^)]+)\)", document.read_text())
        self.assertEqual(len(links), 3)
        for link in links:
            with self.subTest(link=link):
                self.assertTrue((document.parent / link).is_file(), link)

    def test_workflow_checks_survive_skipped_release_preflight(self):
        for name in ("js", "rust"):
            with self.subTest(workflow=name):
                policy.check(ROOT / f".github/workflows/{name}.yml")

    def test_policy_rejects_implicit_success(self):
        workflow = yaml.safe_load((ROOT / ".github/workflows/js.yml").read_text())
        for condition in (None, "needs.lint.result == 'success'"):
            with self.subTest(condition=condition), tempfile.TemporaryDirectory() as temporary:
                job = workflow["jobs"]["browser-test"]
                if condition is None:
                    job.pop("if", None)
                else:
                    job["if"] = condition
                path = Path(temporary) / "workflow.yml"
                path.write_text(yaml.safe_dump(workflow))
                with self.assertRaisesRegex(AssertionError, "implicit success"):
                    policy.check(path)


if __name__ == "__main__":
    unittest.main()
