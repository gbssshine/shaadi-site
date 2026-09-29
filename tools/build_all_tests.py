"""Build a web page for every one of the app's 90 tests, from tools/tests-data.json.

tests-data.json comes from the app's own code: `dotnet run -c Release` in tools/export-tests.

Every test gets tests/<id>.html, so a result link shared from the app always opens
(https://www.shaadiparrot.com/tests/<id>.html?r=vh|h|m|l|vl|u). Only the OPEN tests are
listed on the site; the rest show "in the app" in the catalog but still work from a link.
The web result shows the label, summary, one strength and one real-life line; the other
insights stay in the app (the funnel).

Writes:
  tests/<id>.html                  90 pages
  assets/share/og-test-<id>.jpg    link previews
  src/partials/tests-open.html     cards for the open tests (tests hub)
  src/partials/tests-catalog.html  all 90 by category, open ones linked, others locked
Run:  python tools/build_all_tests.py   (then python tools/build_pages.py)
"""
import html
import json
import os

from PIL import Image, ImageDraw

from og import test_card, result_card

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://www.shaadiparrot.com"

# 2 per category, picked for being relatable and shareable
OPEN = [
    "personality_humor_style", "personality_social_energy",
    "love_style_warmth", "love_style_romance_playfulness",
    "attach_fear_rejection", "attach_reassurance_need",
    "communication_texting_style", "communication_honesty_softness",
    "values_tradition_modern", "values_money_mindset",
    "conflict_apology_style", "conflict_forgiveness",
    "jealousy_social_media", "jealousy_possessiveness",
    "family_focus_in_laws", "family_focus_children_view",
    "long_term_marriage_view", "long_term_adventure_settle",
]
ART = {
    "personality": "t_personality", "love_style": "t_love", "attachment": "t_attachment",
    "communication": "t_talk", "values": "t_values", "conflict": "t_conflict",
    "jealousy": "t_jealousy", "family_focus": "t_family", "long_term": "t_longterm",
}
LEVELS = {"VeryHigh": "vh", "High": "h", "Moderate": "m", "Low": "l", "VeryLow": "vl", "Undecided": "u"}


def e(s):
    return html.escape(s or "", quote=True)


def page_data(t, cats, tests_by_id):
    bands = {}
    for level, code in LEVELS.items():
        b = t["bands"][level]
        bands[code] = {
            "label": b["label"],
            "summary": (b["summaries"] or [""])[0],
            "strength": (b["strengths"] or [""])[0],
            "real": (b["realLife"] or [""])[0],
            "locked": [
                ["How you act in love", len(b["behaviors"])],
                ["Your blind spots", len(b["weaknesses"])],
                ["More real-life moments", max(0, len(b["realLife"]) - 1)],
                ["Tips from Mithu", len(b["tips"])],
            ],
        }
    return {
        "id": t["id"], "title": t["title"], "site": SITE,
        "q": [[q["text"], 1 if q["reverse"] else 0] for q in t["questions"]],
        "bands": bands,
        "low": t["bands"]["VeryLow"]["label"], "high": t["bands"]["VeryHigh"]["label"],
    }


def more_tests(t, tests_by_id):
    same = [i for i in OPEN if i != t["id"] and tests_by_id[i]["category"] == t["category"]]
    other = [i for i in OPEN if i != t["id"] and i not in same]
    # rotate the others so different pages suggest different tests
    k = sum(map(ord, t["id"])) % len(other)
    pick = (same + other[k:] + other[:k])[:4]
    return pick


PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<script>/* Screen height for full-screen blocks. Phone browsers resize the viewport while their toolbars hide and show, so it is measured once (and on rotation) instead of following every resize. iOS can report the 980px desktop layout before the viewport meta applies, so readings wider than the page are ignored and the height never exceeds the screen. */(function(){{var d=document.documentElement,w=0;function s(){{var cw=d.clientWidth||0,h=innerHeight,sh=screen&&screen.height||h;if(!h||!cw||innerWidth>cw*1.25)return;w=innerWidth;d.style.setProperty("--vh1",Math.min(h,sh)/100+"px")}}s();document.addEventListener("DOMContentLoaded",s);addEventListener("load",s);addEventListener("pageshow",s);addEventListener("resize",function(){{if(innerWidth!==w||!matchMedia("(pointer:coarse)").matches)s()}});addEventListener("orientationchange",function(){{setTimeout(s,350)}})}})();</script>
{meta}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/webp" href="../assets/img/logo.webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/site.css">
<link rel="stylesheet" href="../assets/css/tests.css">
</head>
<body class="pt">
<header class="pt-top">
  <a class="pt-back" href="../tests.html"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4 6.5 10l6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>All tests</a>
  <a class="pt-brand" href="love-bird.html"><img src="../assets/img/mithu_pencil.webp" width="640" height="803" alt=""><span>Parrot Tests</span></a>
  <span class="pt-spacer" aria-hidden="true"></span>
</header>

<main class="pt-main pt-split">
  <aside class="pt-side">
    <img class="pt-side-art" src="../assets/img/mithu_pencil.webp" width="640" height="803" alt="">
    <p class="pt-kicker">{cat} test</p>
    <h2>{title}</h2>
    <dl class="pt-facts"><div><dt>What you’ll learn</dt><dd>{learn}</dd></div><div><dt>Why it matters</dt><dd>{why}</dd></div></dl>
    <p class="pt-side-meta"><span>{n} statements</span><span>About 2 minutes</span><span>No sign-up</span></p>
  </aside>
  <div class="pt-flow">
  <p class="friend" data-friend hidden></p>
  <section class="pt-card" data-test aria-live="polite">
    <div class="res-art pt-intro-art"><img src="../assets/img/tests/{art}.webp" width="200" height="200" alt=""></div>
    <p class="pt-kicker">{cat} · {n} statements · 2 min</p>
    <h1>{title}</h1>
    <p class="pt-lead">{description}</p>
    <button class="btn pt-start" type="button" data-start>Start the test</button>
    <p class="pt-note">No sign-up. Nothing to install.</p>
    <noscript><p class="pt-note">This test needs JavaScript turned on.</p></noscript>
  </section>

  </div>
  <section class="pt-section pt-wide" aria-labelledby="more-title">
    <h2 id="more-title">More tests</h2>
    <div class="more-tests">
{more}
    </div>
  </section>

  <aside class="pt-app pt-wide">
    <img src="../assets/img/mithu_heart.webp" width="820" height="1221" alt="">
    <div>
      <b>This test is one of 90</b>
      <p>All of them, with full results, are in the Shaadi Parrot app.</p>
      <a class="text-link" href="https://play.google.com/store/apps/details?id=com.shaadiparrot.app&amp;referrer=utm_source%3Dparrot_tests%26utm_medium%3D{id}" target="_blank" rel="noopener">Get it on Google Play</a>
    </div>
  </aside>
</main>

<footer class="pt-foot">
  <p><b>Parrot Tests</b> by Shaadi Parrot · <a href="../privacy.html">Privacy</a></p>
</footer>

<script>window.TEST = {data};</script>
<script src="../assets/js/test-engine.js"></script>
</body>
</html>
"""

MORE_ITEM = '      <a href="{href}"><img src="../assets/img/{img}" width="200" height="200" alt="" loading="lazy"><div><b>{title}</b><span>{sub}</span></div></a>'


RESULT_CODES = ["vh", "h", "m", "l", "vl", "u"]


def head_meta(t, n, code=None, label=None):
    """<head> tags. A result page (tests/<id>-<code>.html) previews the friend's result in chat apps."""
    tid, title, sub = t["id"], e(t["title"]), e(t["subtitle"])
    if code:
        url, img = f"{SITE}/tests/{tid}-{code}.html", f"{SITE}/assets/share/og-test-{tid}-{code}.jpg"
        og_title = f"A friend got “{e(label)}” in {title}. What will you get?"
        page_title = og_title
        extra = [f'<meta name="robots" content="noindex">', f'<link rel="canonical" href="{SITE}/tests/{tid}.html">']
    else:
        url, img = f"{SITE}/tests/{tid}.html", f"{SITE}/assets/share/og-test-{tid}.jpg"
        og_title = f"{title}: take the 2-minute test"
        page_title = f"{title} test"
        extra = []
    tags = [
        f"<title>{page_title} — Parrot Tests</title>",
        f'<meta name="description" content="{sub}. {n} statements, about 2 minutes. Find out {e(t["measures"])}.">',
        *extra,
        '<meta name="theme-color" content="#F47A85">',
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="Parrot Tests">',
        f'<meta property="og:title" content="{og_title}">',
        f'<meta property="og:description" content="{sub}. {n} statements, 2 minutes. What do you get?">',
        f'<meta property="og:image" content="{img}">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        f'<meta property="og:url" content="{url}">',
    ]
    return "\n".join(tags)


def main():
    data = json.load(open(os.path.join(HERE, "tools", "tests-data.json"), encoding="utf-8"))
    cats = {c["id"]: c for c in data["categories"]}
    tests = data["tests"]
    by_id = {t["id"]: t for t in tests}
    assert all(i in by_id for i in OPEN), [i for i in OPEN if i not in by_id]
    os.makedirs(os.path.join(HERE, "tests"), exist_ok=True)

    for t in tests:
        more = [MORE_ITEM.format(href=f"{i}.html", img="tests/" + ART[by_id[i]["category"]] + ".webp",
                                 title=e(by_id[i]["title"]), sub=e(by_id[i]["subtitle"])) for i in more_tests(t, by_id)]
        more.append(MORE_ITEM.format(href="love-bird.html", img="birds/swan.webp", title="Which love bird are you?",
                                     sub="12 birds · 8 questions"))
        data = page_data(t, cats, by_id)
        cat_title = cats[t["category"]]["title"]
        common = dict(id=t["id"], title=e(t["title"]), subtitle=e(t["subtitle"]), n=len(t["questions"]),
                      description=e(t["description"]), art=ART[t["category"]], cat=e(cat_title),
                      more="\n".join(more), site=SITE, learn=e(t["whatYouLearn"]), why=e(t["howItHelpsMatch"]))
        # the test page, plus one page per result so a shared result previews "A friend got …"
        variants = [(None, None, t["id"])] + [(c, data["bands"][c]["label"], f"{t['id']}-{c}") for c in RESULT_CODES]
        for code, label, fname in variants:
            d2 = dict(data, friend=code) if code else data
            js = json.dumps(d2, ensure_ascii=False).replace("</", "<\\/")
            page = PAGE.format(meta=head_meta(t, len(t["questions"]), code, label), data=js, **common)
            with open(os.path.join(HERE, "tests", fname + ".html"), "w", encoding="utf-8", newline="\n") as f:
                f.write(page)
            card = result_card(t, cat_title, label) if code else test_card(t, cat_title)
            card.save(os.path.join(HERE, "assets", "share", f"og-test-{fname}.jpg"), quality=74, optimize=True, progressive=True)

    # the old hand-made texting page now forwards to the generated one
    with open(os.path.join(HERE, "tests", "texting-style.html"), "w", encoding="utf-8", newline="\n") as f:
        f.write('<!doctype html><meta charset="utf-8"><title>Texting Style — Parrot Tests</title>'
                '<meta http-equiv="refresh" content="0; url=communication_texting_style.html">'
                '<link rel="canonical" href="' + SITE + '/tests/communication_texting_style.html">'
                '<a href="communication_texting_style.html">Open the Texting Style test</a>\n')

    # partials for the main site
    part = os.path.join(HERE, "src", "partials")
    os.makedirs(part, exist_ok=True)
    cards = ['<div class="open-tests">']
    for i in OPEN:
        t = by_id[i]
        cards.append(f'  <a class="open-test" href="tests/{i}.html"><img src="assets/img/tests/{ART[t["category"]]}.webp" width="200" height="200" alt="">'
                     f'<span><small>{e(cats[t["category"]]["title"])}</small><b>{e(t["title"])}</b>{e(t["subtitle"])}</span></a>')
    cards.append("</div>")
    open(os.path.join(part, "tests-open.html"), "w", encoding="utf-8", newline="\n").write("\n".join(cards) + "\n")

    # test browser for tests.html: filter chips + one grid of all 90 (free ones first)
    tb = ['<div class="tb" data-tb>', '  <div class="tb-chips" role="group" aria-label="Filter tests">',
          '    <button class="chip is-on" type="button" data-f="free">Free here <b>19</b></button>',
          '    <button class="chip" type="button" data-f="all">All <b>90</b></button>']
    for cid, c in cats.items():
        tb.append(f'    <button class="chip" type="button" data-f="{cid}"><img src="assets/img/tests/{ART[cid]}.webp" width="200" height="200" alt="">{e(c["title"])}</button>')
    tb.append('  </div>')
    tb.append('  <div class="tb-grid">')
    tb.append('    <a class="tcard tcard-bird" data-cat="love_bird" data-free="1" href="tests/love-bird.html"><img src="assets/img/birds/swan.webp" width="480" height="821" alt="">'
              '<span class="tcard-cat">Most popular</span><b>Which love bird are you?</b><span class="tcard-sub">12 birds, 8 questions</span><em class="go">Start · 2 min</em></a>')
    ordered = [by_id[i] for i in OPEN] + [t for t in tests if t["id"] not in OPEN]
    for t in ordered:
        cat = cats[t["category"]]["title"]
        img = f'<img src="assets/img/tests/{ART[t["category"]]}.webp" width="200" height="200" alt="" loading="lazy">'
        inner = f'{img}<span class="tcard-cat">{e(cat)}</span><b>{e(t["title"])}</b><span class="tcard-sub">{e(t["subtitle"])}</span>'
        if t["id"] in OPEN:
            tb.append(f'    <a class="tcard" data-cat="{t["category"]}" data-free="1" href="tests/{t["id"]}.html">{inner}<em class="go">Start · 2 min</em></a>')
        else:
            tb.append(f'    <button class="tcard is-locked" type="button" data-cat="{t["category"]}" data-app-only="{e(t["title"])}">{inner}<em class="lockd">In the app</em></button>')
    tb += ['  </div>', '</div>']
    with open(os.path.join(part, "tests-browser.html"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(tb) + "\n")

    cat_html = ['<div class="catalog">']
    for cid, c in cats.items():
        rows = [t for t in tests if t["category"] == cid]
        n_open = sum(1 for t in rows if t["id"] in OPEN)
        # <details> so phones get a compact list of categories; site.js opens them all on wider screens
        cat_html.append(f'  <details class="cat" id="cat-{cid}">')
        cat_html.append(f'    <summary class="cat-head"><img src="assets/img/tests/{ART[cid]}.webp" width="200" height="200" alt="" loading="lazy">'
                        f'<span><b>{e(c["title"])}</b><span>{e(c["description"])} · {len(rows)} tests · {n_open} free here</span></span></summary>')
        cat_html.append("    <ul>")
        for t in rows:
            if t["id"] in OPEN:
                cat_html.append(f'      <li><a href="tests/{t["id"]}.html"><b>{e(t["title"])}</b><span>{e(t["subtitle"])}</span><em class="pill-open">Take it</em></a></li>')
            else:
                cat_html.append(f'      <li><button type="button" data-app-only="{e(t["title"])}"><b>{e(t["title"])}</b><span>{e(t["subtitle"])}</span><em class="pill-lock">In the app</em></button></li>')
        cat_html.append("    </ul>")
        cat_html.append("  </details>")
    cat_html.append("</div>")
    open(os.path.join(part, "tests-catalog.html"), "w", encoding="utf-8", newline="\n").write("\n".join(cat_html) + "\n")
    print(f"{len(tests)} test pages, {len(OPEN)} open")


if __name__ == "__main__":
    main()
