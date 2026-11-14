#!/usr/bin/env python3
"""
build_offline.py - turn the presentation into ONE self-contained HTML file.

    python3 tools/build.py            # first, so presentations/winding-road/index.html is current
    python3 tools/build_offline.py    # writes dist/winding-road-offline.html

The file has the scripts, styles, fonts and photographs packed inside it, so it opens by double-clicking
(file://) with no server and no internet. Use it on the day as the safety net if the venue Wi-Fi or the
site is down. It is a snapshot: rebuild it after any change to the deck.

Needs Pillow (pip install pillow) to shrink the photographs. No other dependencies.
"""
import base64, io, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = ROOT / "presentations" / "winding-road" / "index.html"
OUT = ROOT / "dist" / "winding-road-offline.html"
MAX_PX = 1600


def data_uri(path, mime):
    return "data:%s;base64,%s" % (mime, base64.b64encode(path.read_bytes()).decode())


def image_uri(path):
    from PIL import Image
    im = Image.open(path)
    if path.suffix.lower() == ".png":
        buf = io.BytesIO(); im.thumbnail((MAX_PX, MAX_PX)); im.save(buf, "PNG", optimize=True)
        return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    im = im.convert("RGB"); im.thumbnail((MAX_PX, MAX_PX))
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=84, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def local(ref):
    return ROOT / ref.split("?")[0].lstrip("/")


def main():
    if not PAGE.is_file():
        print("Build the site first: python3 tools/build.py", file=sys.stderr); return 1
    html = PAGE.read_text(encoding="utf-8")

    def inline_css(m):
        css = local(m.group(1)).read_text(encoding="utf-8")
        css = re.sub(r"url\((/assets/fonts/[^)]+\.woff2)\)", lambda f: "url(%s)" % data_uri(local(f.group(1)), "font/woff2"), css)
        return "<style>\n%s\n</style>" % css
    html = re.sub(r'<link rel="stylesheet" href="(/assets/css/presentation\.css[^"]*)">', inline_css, html)

    def inline_js(m):
        js = local(m.group(1)).read_text(encoding="utf-8")
        if local(m.group(1)).name == "deck.js":
            js = re.sub(r"(['\"])(/assets/img/[^'\"]+\.(?:jpe?g|png))\1",
                        lambda i: "'%s'" % image_uri(local(i.group(2))), js)
        if local(m.group(1)).name == "deck.js":
            # Private speaker notes (gitignored) go ONLY into this offline file, never into the public site or public PDF.
            pn = ROOT / "tools" / "private-notes.json"
            if pn.is_file():
                js = "window.DECK_PRIVATE = %s;\n%s" % (json.dumps(json.loads(pn.read_text(encoding="utf-8"))), js)
        return "<script>\n%s\n</script>" % js.replace("</script", "<\\/script")
    html = re.sub(r'<script src="(/assets/js/[^"]+)"></script>', inline_js, html)

    html = re.sub(r'<link rel="icon"[^>]*>\n?', "", html)
    left = re.findall(r'(?:src|href)="/assets/[^"]+"', html)
    if left:
        print("warning: still references the site:", left, file=sys.stderr)
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print("wrote %s (%.1f MB)" % (OUT.relative_to(ROOT), OUT.stat().st_size / 1e6))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
