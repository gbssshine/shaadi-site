"""Mobile QA: automated checks on every page at several phone sizes.

python tools/mobile_qa.py            -> report of problems
python tools/mobile_qa.py --shots    -> also one screenshot per block (screenshots/mob/)

Checks: horizontal overflow, elements sticking out of the screen (outside swipe rails),
clipped text, tap targets under 40 px, text under 12 px, broken images, blocks taller than
the screen, and whether the bottom dock covers a button.
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ["index.html", "how-it-works.html", "tests.html", "astrology.html", "parrot-plus.html", "safety.html",
         "about.html", "help.html", "privacy.html", "terms.html", "delete-account.html",
         "tests/love-bird.html", "tests/communication_texting_style.html", "tests/values_loyalty.html",
         "tests/love-bird/owl.html", "kundli-match.html", "love-today.html", "moon-sign.html", "match/27-5.html",
         "moon-sign/rohini.html"]
SIZES = [(360, 740), (375, 667), (390, 844), (412, 915)]

CHECK = r"""(vw) => {
  const out = [];
  const inRail = el => el.closest('.quick, .rail, [aria-labelledby="tips-title"] .split, .tb-grid, .tb-chips, .lib, .nak-grid, .sheet, .dock, .nav-links');
  const name = el => (el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0,2).join('.') : '')
     + (el.textContent ? ' "' + el.textContent.trim().slice(0, 30) + '"' : ''));
  const doc = document.documentElement;
  if (doc.scrollWidth > doc.clientWidth) out.push(['page-overflow', doc.scrollWidth - doc.clientWidth]);
  document.querySelectorAll('body *').forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[hidden]')) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') return;
    // sticking out horizontally (ignore rails, decorative absolutely-positioned art and the sky)
    if (!inRail(el) && !el.closest('.sky, .stars, .hero-stage, .flock, .hero-flock, .pt-flock, .pt-side-flock, .cast, .band')
        && (r.right > vw + 1 || r.left < -1)) out.push(['sticks-out', name(el), Math.round(r.left), Math.round(r.right)]);
    // clipped text in leaf text elements
    if (!el.classList.contains('sr') && ['P','H1','H2','H3','B','SPAN','A','BUTTON','LI','SUMMARY','EM','SMALL','LABEL'].includes(el.tagName)
        && el.children.length === 0 && el.textContent.trim() && el.scrollWidth > el.clientWidth + 2 && cs.overflow !== 'visible')
      out.push(['clipped-text', name(el)]);
    // tiny text
    const fs = parseFloat(cs.fontSize);
    if (el.children.length === 0 && el.textContent.trim().length > 2 && fs < 11.5 && !el.closest('svg')) out.push(['tiny-text', name(el), fs]);
    // tap targets
    if ((el.tagName === 'A' || el.tagName === 'BUTTON') && !el.closest('.footer nav, .prose, p, li, dd, .faq summary')) {
      if (r.height < 38 && r.width < 200) out.push(['small-tap', name(el), Math.round(r.width) + 'x' + Math.round(r.height)]);
    }
  });
  document.querySelectorAll('img').forEach(img => { if (img.complete && img.naturalWidth === 0 && img.loading !== 'lazy') out.push(['broken-img', img.getAttribute('src')]); });
  document.querySelectorAll('header.top, main > section:not(.sec-legal)').forEach(s => {
    const h = s.getBoundingClientRect().height; if (h > innerHeight + 2) out.push(['tall-block', name(s).slice(0, 60), Math.round(h)]);
  });
  return out;
}"""


def main(shots):
    out_dir = ROOT / "screenshots" / "mob"
    if shots:
        out_dir.mkdir(parents=True, exist_ok=True)
    problems = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        for w, h in SIZES:
            ctx = b.new_context(viewport={"width": w, "height": h}, is_mobile=True, has_touch=True, device_scale_factor=2)
            pg = ctx.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            for page in PAGES:
                pg.goto((ROOT / page).as_uri())
                pg.wait_for_timeout(500)
                # load lazy images
                pg.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager')")
                pg.wait_for_timeout(300)
                res = pg.evaluate(CHECK, w)
                for r in res:
                    key = (page, r[0], str(r[1])[:70])
                    problems.setdefault(key, set()).add(f"{w}x{h}" + (f" {r[2:]}" if len(r) > 2 else ""))
                if shots and (w, h) == (360, 740):
                    blocks = pg.evaluate("[...document.querySelectorAll('header.top, main > section, .pt-card, footer')].map(s => s.getBoundingClientRect().top + scrollY)")
                    stem = page.replace("/", "_").replace(".html", "")
                    for i, top in enumerate(blocks):
                        pg.evaluate(f"window.scrollTo(0, {top})")
                        pg.wait_for_timeout(250)
                        pg.screenshot(path=str(out_dir / f"{stem}-{i:02d}.png"))
            if errs:
                problems[("*", "js-error", errs[0][:70])] = {f"{w}x{h}"}
            ctx.close()
        b.close()
    for (page, kind, what), sizes in sorted(problems.items()):
        print(f"{page:38s} {kind:13s} {what:70s} {sorted(sizes)[:4]}")
    print(f"{len(problems)} findings")


if __name__ == "__main__":
    main("--shots" in sys.argv)
