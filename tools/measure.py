"""Report section heights per page at phone and desktop sizes, to keep each block within one screen.
python tools/measure.py [pages...]"""
import pathlib, sys
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
pages = sys.argv[1:] or ["index.html", "how-it-works.html", "tests.html", "astrology.html", "parrot-plus.html",
                         "safety.html", "about.html", "help.html"]
JS = """() => [...document.querySelectorAll('header.top, main > section, footer')].map(s => {
  const h = s.querySelector('h1, h2'); const r = s.getBoundingClientRect();
  return [(h ? h.textContent.trim().slice(0, 34) : s.className.slice(0, 20)), Math.round(r.height)]; })"""
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, vp in [("mobile", (390, 844, True)), ("desktop", (1440, 900, False))]:
        ctx = b.new_context(viewport={"width": vp[0], "height": vp[1]}, is_mobile=vp[2], device_scale_factor=1)
        pg = ctx.new_page()
        for page in pages:
            pg.goto((ROOT / page).as_uri()); pg.wait_for_timeout(500)
            rows = pg.evaluate(JS)
            over = [f"{t} {h}" for t, h in rows if h > vp[1]]
            print(f"[{name}] {page}: {len(rows)} blocks, over {vp[1]}px: {over}")
        ctx.close()
    b.close()
