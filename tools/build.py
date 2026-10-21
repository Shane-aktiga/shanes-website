#!/usr/bin/env python3
"""
build.py - assemble the static site from templates + components.

    python3 tools/build.py

Each file in templates/ may declare variables at the top:

    <!-- @var out: flying/index.html -->
    <!-- @var title: Flying - Shane Parreco -->

and may pull in shared markup:

    <!-- @include components/header.html -->

Includes are expanded first (recursively), then {{variables}} are replaced
everywhere, including inside the included markup. That is how one
components/head.html serves every page with its own title and description.

`out` decides where the page is written, relative to the project root.
Missing folders are created. A template with no `out` is written to its own
name at the root.

No dependencies. Python 3.8+.
"""

import datetime
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TEMPLATES = ROOT / "templates"

VAR_DECL = re.compile(r'^[ \t]*<!--\s*@var\s+([A-Za-z0-9_]+)\s*:\s*(.*?)\s*-->[ \t]*\n?',
                      re.MULTILINE)
INCLUDE = re.compile(r'^([ \t]*)<!--\s*@include\s+(\S+?)\s*-->[ \t]*$', re.MULTILINE)
PLACEHOLDER = re.compile(r'\{\{\s*([A-Za-z0-9_]+)\s*\}\}')
MAX_DEPTH = 10

# Applied to every page unless the template overrides them.
DEFAULTS = {
    "site_name": "Shane Parreco",
    "site_url": "https://shaneparreco.com",
    "ga4_id": "G-JKXQ06D3LQ",
    "og_image": "/assets/img/og-default.png",
    "og_type": "website",
    "body_class": "sp-page",
    "nav_current": "",
}


def read_vars(text):
    """Pull @var declarations off the top of a template."""
    found = {}
    for key, value in VAR_DECL.findall(text):
        found[key] = value
    return found, VAR_DECL.sub("", text)


def expand_includes(text, depth=0):
    if depth > MAX_DEPTH:
        raise RecursionError("@include nested more than %d deep" % MAX_DEPTH)

    def swap(match):
        indent, rel = match.group(1), match.group(2)
        path = (ROOT / rel).resolve()
        if ROOT not in path.parents:
            raise ValueError("include escapes the project: %s" % rel)
        if not path.is_file():
            raise FileNotFoundError("included file not found: %s" % rel)
        body = expand_includes(path.read_text(encoding="utf-8").rstrip("\n"), depth + 1)
        return "\n".join(indent + line if line.strip() else line
                         for line in body.split("\n"))

    return INCLUDE.sub(swap, text)


def fill(text, values, page_name):
    missing = set()

    def swap(match):
        key = match.group(1)
        if key in values:
            return values[key]
        missing.add(key)
        return ""

    out = PLACEHOLDER.sub(swap, text)
    if missing:
        print("  warning: %s has no value for %s"
              % (page_name, ", ".join(sorted(missing))), file=sys.stderr)
    return out


def build_one(template):
    raw = template.read_text(encoding="utf-8")
    values, raw = read_vars(raw)

    merged = dict(DEFAULTS)
    merged.update(values)

    html = expand_includes(raw)
    html = fill(html, merged, template.name)

    out_rel = merged.get("out", template.name)
    out_path = ROOT / out_rel
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html.lstrip("\n"), encoding="utf-8")
    return out_rel, merged


def write_sitemap(entries):
    """sitemap.xml + robots.txt, generated from the pages we just built so
    they can never drift out of sync with reality."""
    today = datetime.date.today().isoformat()
    base = DEFAULTS["site_url"].rstrip("/")
    rows = []
    for path in sorted(entries):
        rows.append("  <url>\n    <loc>%s%s</loc>\n    <lastmod>%s</lastmod>\n  </url>"
                    % (base, path, today))
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(rows) + "\n</urlset>\n", encoding="utf-8")
    (ROOT / "robots.txt").write_text(
        "User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n" % base,
        encoding="utf-8")
    print("  sitemap.xml (%d urls) + robots.txt" % len(rows))


def main():
    if not TEMPLATES.is_dir():
        print("No templates/ directory found.", file=sys.stderr)
        return 1

    pages = sorted(TEMPLATES.rglob("*.html"))
    if not pages:
        print("No templates to build.", file=sys.stderr)
        return 1

    count = 0
    indexed = []
    for page in pages:
        try:
            out_rel, values = build_one(page)
            if values.get("noindex") != "true" and not out_rel.endswith("404.html"):
                indexed.append(values.get("path", "/" + out_rel))
        except (FileNotFoundError, ValueError, RecursionError) as err:
            print("%s: %s" % (page.name, err), file=sys.stderr)
            return 1
        print("  %-34s -> %s" % (page.relative_to(TEMPLATES), out_rel))
        count += 1

    write_sitemap(indexed)
    print("built %d pages" % count)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
