#!/usr/bin/env python3
"""Runtime truth checks for pure-flon.com deploy pipeline.

This script enforces:
1) required launch routes exist in the repository
2) static runtime mode does not ship launch-surface API claims
3) optional live probes for route status and API health
"""

from __future__ import annotations

import argparse
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable, List, Set, Tuple
from urllib import error, request

REQUIRED_ROUTE_FILES: List[Tuple[str, str]] = [
    ("/", "index.html"),
    ("/products/", "products/index.html"),
    ("/quote/", "quote/index.html"),
    ("/saas/ai-ops-autopilot/", "saas/ai-ops-autopilot/index.html"),
    ("/tools/", "tools/index.html"),
    ("/games/", "games/index.html"),
]

EXTRA_LAUNCH_SCAN_FILES = [
    "quote/request.html",
    "quote/payment.html",
]

API_PATTERNS = [
    re.compile(r"fetch\(\s*['\"](?P<path>/api/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)"),
    re.compile(r"API_ENDPOINT\s*=\s*['\"](?P<path>/api/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)"),
    re.compile(r"baseUrl\s*:\s*['\"](?P<path>/api/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)"),
]

TRUTH_KILL_SWITCH_RULES: List[Tuple[str, List[str], List[str]]] = [
    (
        "index.html",
        [
            "Operational",
            "99.9<span class=\"text-lg text-muted\">%</span>",
            ">24/7<",
        ],
        [
            "Static Lead Capture Live",
            "Runtime Truth",
            "Products and SaaS route into the canonical quote intake.",
        ],
    ),
    (
        "saas/ai-ops-autopilot/index.html",
        [
            "Start free trial",
            "Start 14-Day Free Trial",
            "No credit card required",
            "24/7 anomaly monitoring",
            "&lt;60s",
            "98%",
            "First 14 days free — cancel anytime.",
            "buy.stripe.com/PLACEHOLDER",
            "cta_type=trial",
        ],
        [
            "Join Waitlist",
            "cta_type=waitlist",
            "Self-serve checkout opens after payment links are live.",
        ],
    ),
]


class ScriptSrcParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.script_srcs: List[str] = []

    def handle_starttag(self, tag: str, attrs: Iterable[Tuple[str, str]]) -> None:
        if tag.lower() != "script":
            return
        src = None
        for key, value in attrs:
            if key.lower() == "src":
                src = value
                break
        if src:
            self.script_srcs.append(src)


def load_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def normalize_endpoint(raw: str) -> str:
    # Keep only path/query; strip accidental trailing punctuation.
    endpoint = raw.strip().rstrip(").,;")
    if "?" in endpoint:
        path, query = endpoint.split("?", 1)
        path = path.rstrip("/")
        return f"{path}?{query}" if query else path
    return endpoint.rstrip("/")


def find_api_claims(text: str) -> Set[str]:
    found: Set[str] = set()
    for pattern in API_PATTERNS:
        for match in pattern.finditer(text):
            endpoint = normalize_endpoint(match.group("path"))
            if endpoint.startswith("/api/"):
                found.add(endpoint)
    return found


def resolve_script_path(repo_root: Path, html_file: Path, src: str) -> Path | None:
    clean = src.split("#", 1)[0].split("?", 1)[0].strip()
    if not clean:
        return None
    if clean.startswith(("http://", "https://", "//")):
        return None
    if clean.startswith("/"):
        candidate = repo_root / clean.lstrip("/")
    else:
        candidate = (html_file.parent / clean).resolve()
    if not candidate.exists() or not candidate.is_file():
        return None
    try:
        candidate.resolve().relative_to(repo_root.resolve())
    except ValueError:
        return None
    return candidate


def discover_launch_surface_api_claims(repo_root: Path) -> Tuple[Set[str], List[Path]]:
    launch_files = [Path(path) for _, path in REQUIRED_ROUTE_FILES]
    launch_files.extend(Path(path) for path in EXTRA_LAUNCH_SCAN_FILES)

    claims: Set[str] = set()
    scanned_js_files: Set[Path] = set()

    for rel in launch_files:
        html_path = repo_root / rel
        if not html_path.exists():
            continue
        html_text = load_text(html_path)
        claims |= find_api_claims(html_text)

        parser = ScriptSrcParser()
        parser.feed(html_text)
        for src in parser.script_srcs:
            js_path = resolve_script_path(repo_root, html_path, src)
            if js_path and js_path.suffix.lower() == ".js":
                scanned_js_files.add(js_path)

    for js_path in sorted(scanned_js_files):
        claims |= find_api_claims(load_text(js_path))

    return claims, sorted(scanned_js_files)


def evaluate_truth_kill_switch(repo_root: Path) -> List[str]:
    failures: List[str] = []
    for rel_path, forbidden_markers, required_markers in TRUTH_KILL_SWITCH_RULES:
        file_path = repo_root / rel_path
        if not file_path.exists():
            failures.append(f"Missing kill-switch target file: {rel_path}")
            continue

        text = load_text(file_path)
        lower = text.lower()

        for marker in forbidden_markers:
            if marker.lower() in lower:
                failures.append(f"{rel_path}: contains forbidden marker '{marker}'")

        for marker in required_markers:
            if marker.lower() not in lower:
                failures.append(f"{rel_path}: missing required marker '{marker}'")

    return failures


def fetch_status_and_headers(url: str) -> Tuple[int, dict]:
    req = request.Request(
        url,
        method="GET",
        headers={
            "User-Agent": "pure-flon-runtime-check/1.0",
            "Accept": "text/html,application/json;q=0.9,*/*;q=0.8",
        },
    )
    try:
        with request.urlopen(req, timeout=15) as response:
            return int(response.status), dict(response.headers.items())
    except error.HTTPError as http_err:
        return int(http_err.code), dict(http_err.headers.items())
    except error.URLError as url_err:
        return 0, {"error": str(url_err.reason)}


def runtime_hint_from_headers(headers: dict) -> str:
    lower_headers = {k.lower(): v for k, v in headers.items()}
    server = lower_headers.get("server", "")
    if "github.com" in server.lower():
        return "github_pages"
    if "vercel" in server.lower() or "x-vercel-id" in lower_headers:
        return "vercel"
    return "unknown"


def main() -> int:
    parser = argparse.ArgumentParser(description="Check runtime truth and launch-surface deploy guardrails.")
    parser.add_argument("--repo-root", default=".", help="Repository root path (default: current directory)")
    parser.add_argument(
        "--runtime-profile",
        default="github-pages-static",
        choices=["github-pages-static", "vercel-serverless"],
        help="Expected production runtime profile",
    )
    parser.add_argument("--base-url", default="", help="Optional live base URL for online probes")
    parser.add_argument("--dry-run", action="store_true", help="Preview checks without online probes")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    failures: List[str] = []
    warnings: List[str] = []

    print("=== Runtime Truth Check ===")
    print(f"Repo root: {repo_root}")
    print(f"Runtime profile: {args.runtime_profile}")

    print("\n[1/4] Required launch routes (repo files)")
    for route, rel_path in REQUIRED_ROUTE_FILES:
        path = repo_root / rel_path
        if path.exists():
            print(f"  OK  {route:<30} -> {rel_path}")
        else:
            print(f"  FAIL {route:<30} -> missing {rel_path}")
            failures.append(f"Missing required route file: {rel_path} for {route}")

    print("\n[2/4] Launch-surface API claim scan")
    claims, scanned_js_files = discover_launch_surface_api_claims(repo_root)
    if scanned_js_files:
        print(f"  Scanned JS files: {len(scanned_js_files)}")
    else:
        print("  Scanned JS files: 0")

    if claims:
        for endpoint in sorted(claims):
            print(f"  CLAIM {endpoint}")
    else:
        print("  No launch-surface API claims found.")

    if args.runtime_profile == "github-pages-static" and claims:
        failures.append(
            "Static runtime profile is active, but launch surfaces still claim /api endpoints."
        )

    print("\n[3/4] CTA truth kill-switch")
    truth_failures = evaluate_truth_kill_switch(repo_root)
    if truth_failures:
        for failure in truth_failures:
            print(f"  FAIL {failure}")
            failures.append(f"CTA truth kill-switch: {failure}")
    else:
        print("  Kill-switch checks passed.")

    base_url = args.base_url.strip().rstrip("/")
    if args.dry_run:
        print("\n[4/4] Online probe skipped (--dry-run).")
        if base_url:
            print(f"  Would probe live routes against: {base_url}")
        else:
            print("  No --base-url provided; live probing not requested.")
    elif not base_url:
        print("\n[4/4] Online probe skipped (no --base-url).")
    else:
        print("\n[4/4] Online probe")
        root_status, root_headers = fetch_status_and_headers(f"{base_url}/")
        hint = runtime_hint_from_headers(root_headers)
        server = root_headers.get("Server", root_headers.get("server", "unknown"))
        print(f"  Runtime hint: {hint} (server: {server}, status: {root_status})")

        if args.runtime_profile == "github-pages-static" and hint not in {"github_pages", "unknown"}:
            warnings.append(
                f"Expected github_pages runtime, but live server hint is {hint}."
            )
        if args.runtime_profile == "vercel-serverless" and hint not in {"vercel", "unknown"}:
            warnings.append(
                f"Expected vercel runtime, but live server hint is {hint}."
            )

        print("\n  Route status probe")
        for route, _ in REQUIRED_ROUTE_FILES:
            status, _ = fetch_status_and_headers(f"{base_url}{route}")
            if 200 <= status < 400:
                print(f"    OK   {route:<30} -> {status}")
            else:
                print(f"    FAIL {route:<30} -> {status}")
                failures.append(f"Route check failed: {route} returned {status}")

        print("\n  API endpoint health probe")
        if not claims:
            print("    No claimed API endpoints to probe.")
        else:
            for endpoint in sorted(claims):
                status, _ = fetch_status_and_headers(f"{base_url}{endpoint}")
                if status not in {404, 410}:
                    print(f"    OK   {endpoint:<30} -> {status}")
                else:
                    print(f"    FAIL {endpoint:<30} -> {status}")
                    failures.append(f"Claimed API endpoint unhealthy: {endpoint} returned {status}")

    if warnings:
        print("\nWarnings:")
        for warn in warnings:
            print(f"- {warn}")

    if failures:
        print("\nResult: FAIL")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("\nResult: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
