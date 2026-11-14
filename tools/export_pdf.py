#!/usr/bin/env python3
"""
export_pdf.py - a PDF backup of the presentation, one 16:9 page per slide.

    python3 tools/build.py                       # first
    python3 tools/export_pdf.py [base_url]       # default http://localhost:8899

Serve the site first, for example:  python3 -m http.server 8899   (from the repo root)
Writes dist/winding-road.pdf. Each page is a screenshot of the real slide over the real mountain, with the
controls hidden. DRAFT tags stay on, so the PDF is honest about what is unfinished.

Needs: pip install playwright pillow  and  playwright install chromium
"""
import asyncio, pathlib, sys
from PIL import Image
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "dist" / "winding-road.pdf"
BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8899").rstrip("/")


async def main():
    pages = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width": 1920, "height": 1080})
        await pg.goto(BASE + "/presentations/winding-road/?motion=off#/1/1")
        await pg.wait_for_function("document.getElementById('loader').classList.contains('is-done')")
        await pg.add_style_tag(content=".hud,.notes{display:none!important}")
        n = await pg.evaluate("window.__presentation.steps.length")
        for i in range(n):
            await pg.wait_for_function("!window.__presentation.busy"); await pg.wait_for_timeout(500)
            tmp = ROOT / "dist" / ("_p%02d.png" % i); tmp.parent.mkdir(exist_ok=True)
            await pg.screenshot(path=str(tmp)); pages.append(tmp)
            await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(150)
        await b.close()
    ims = [Image.open(f).convert("RGB") for f in pages]
    ims[0].save(OUT, "PDF", resolution=144.0, save_all=True, append_images=ims[1:], quality=88)
    for f in pages: f.unlink()
    print("wrote %s: %d pages, %.1f MB" % (OUT.relative_to(ROOT), len(ims), OUT.stat().st_size / 1e6))


asyncio.run(main())
