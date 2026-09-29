"""Screenshots for self-review: python tools/shoot.py index.html [more pages...]
Writes screenshots/<page>-<viewport>-first.png and -full.png (full page scaled to 50%).
Also reports console errors and horizontal overflow."""
import pathlib
import sys

from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = pathlib.Path(__file__).resolve().parent.parent
VIEWPORTS = {
    "desktop": dict(width=1440, height=900, is_mobile=False, scale=1),
    "mobile": dict(width=390, height=844, is_mobile=True, scale=2),
}


def main(pages, only=None):
    out = ROOT / "screenshots"
    out.mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for page_name in pages:
            url = (ROOT / page_name).resolve().as_uri()
            stem = page_name.replace("/", "_").replace(".html", "")
            for vp_name, vp in VIEWPORTS.items():
                if only and vp_name != only:
                    continue
                ctx = browser.new_context(viewport={"width": vp["width"], "height": vp["height"]},
                                          is_mobile=vp["is_mobile"], device_scale_factor=vp["scale"])
                pg = ctx.new_page()
                errors = []
                pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
                pg.on("pageerror", lambda e: errors.append(str(e)))
                pg.goto(url, wait_until="networkidle")
                pg.wait_for_timeout(1800)
                pg.screenshot(path=out / f"{stem}-{vp_name}-first.png")
                h = pg.evaluate("document.documentElement.scrollHeight")
                for y in range(0, h, vp["height"] // 2):
                    pg.evaluate(f"window.scrollTo(0,{y})")
                    pg.wait_for_timeout(120)
                pg.evaluate("window.scrollTo(0,0)")
                pg.wait_for_timeout(400)
                full = out / f"{stem}-{vp_name}-full.png"
                pg.screenshot(path=full, full_page=True, scale="css")
                over = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                print(f"{page_name} [{vp_name}] height={h} overflow={over} errors={errors[:3]}")
                ctx.close()
        browser.close()


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    only = next((a[2:] for a in sys.argv[1:] if a in ("--desktop", "--mobile")), None)
    main(args or ["index.html"], only)
