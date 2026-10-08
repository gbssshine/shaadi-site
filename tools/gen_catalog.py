"""Generate the tests catalog and the astrology library list from the app's C# sources.

Writes src/partials/tests-catalog.html and src/partials/astro-library.html, which
build_pages.py includes via <!--include:tests-catalog--> / <!--include:astro-library-->.
Run after the app's tests or library change:  python tools/gen_catalog.py
"""
import html
import os
import re

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(os.path.dirname(HERE), "MauiApp2", "MauiApp2", "Services")
OUT = os.path.join(HERE, "src", "partials")

CAT_ART = {
    "personality": "t_personality", "love_style": "t_love", "attachment": "t_attachment",
    "communication": "t_talk", "values": "t_values", "conflict": "t_conflict",
    "jealousy": "t_jealousy", "family_focus": "t_family", "long_term": "t_longterm",
}
LIB_ART = {
    "start": "a_foundations", "stories": "a_spirituality",   # beginners' section and the myths (app: Mithu art)
    "foundations": "a_foundations", "planets": "a_planets", "zodiac": "a_zodiac", "houses": "a_houses",
    "nakshatras": "a_nakshatras", "love": "a_love", "matching": "a_kundli", "doshas": "a_doshas",
    "dasha": "a_dasha", "career": "a_career", "spirituality": "a_spirituality", "remedies": "a_remedies",
    "gemstones": "a_gemstones", "psychology": "a_psychology", "modern": "a_modern",
}


def e(s):
    return html.escape(s, quote=True)


def tests():
    src = open(os.path.join(APP, "TestsCatalog.cs"), encoding="utf-8-sig").read()
    cats = re.findall(r'new TestCategory \{ Id="(\w+)",\s*Title="([^"]+)",\s*Description="([^"]+)"', src)
    items = re.findall(r'new TestSummary \{ Id="\w+", CategoryId="(\w+)", Title="([^"]+)", Subtitle="([^"]+)"', src)
    out = ['<div class="catalog">']
    total = 0
    for cid, title, desc in cats:
        rows = [(t, s) for c, t, s in items if c == cid]
        total += len(rows)
        out.append(f'  <article class="cat" id="cat-{cid}">')
        out.append(f'    <div class="cat-head"><img src="assets/img/tests/{CAT_ART[cid]}.webp" width="200" height="200" alt="" loading="lazy">'
                   f'<div><h3>{e(title)}</h3><p>{e(desc)} · {len(rows)} tests</p></div></div>')
        out.append("    <ul>")
        for t, s in rows:
            out.append(f"      <li><b>{e(t)}</b><span>{e(s)}</span></li>")
        out.append("    </ul>")
        out.append("  </article>")
    out.append("</div>")
    write("tests-catalog.html", out)
    print(f"tests: {len(cats)} categories, {total} tests")


def library():
    src = open(os.path.join(APP, "AstrologyLibraryContent.cs"), encoding="utf-8-sig").read()
    titles = dict(re.findall(r'"(\w+)" => "([^"]+)"', src))
    order = re.search(r"SectionIds \{ get; \} =\s*\[(.*?)\];", src, re.S).group(1)
    order = re.findall(r'"(\w+)"', order)
    out = ['<div class="lib-sections">']
    total = 0
    for sid in order:
        block = re.search(r'\["' + sid + r'"\]\s*=\s*\[(.*?)\]\s*,?\s*(?=\["|\};)', src, re.S)
        topics = re.findall(r'\("\w+",\s*"([^"]+)"\)', block.group(1)) if block else []
        total += len(topics)
        sample = ", ".join(topics[:4]) + (f" and {len(topics) - 4} more" if len(topics) > 4 else "")
        out.append(f'  <button class="lib-sec" type="button" data-lib="{sid}"><img src="assets/img/astro/{LIB_ART[sid]}.webp" width="160" height="160" alt="" loading="lazy">'
                   f'<span><b>{e(titles.get(sid, sid))}</b><span>{e(sample)}.</span><em>{len(topics)} articles</em></span></button>')
    out.append("</div>")
    write("astro-library.html", out)
    print(f"library: {len(order)} sections, {total} topics")


def write(name, lines):
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, name), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    # the tests catalog is built by build_all_tests.py now (open vs app-only tests)
    library()
