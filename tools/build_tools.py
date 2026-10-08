"""Link previews and shared-result pages for the free tools (Kundli match, Find your rashi, Love luck today).

  assets/share/og-kundli-match.jpg, og-moon-sign.jpg, og-love-today.jpg   previews of the tool pages
  assets/share/og-match-<score>.jpg + match/<score>.html                  one per Guna Milan score, 0 to 36 in halves
  assets/share/og-nak-<key>.jpg + moon-sign/<key>.html                     one per nakshatra
Crawlers don't run JavaScript, so a shared link needs a static page whose og:image already shows the result.
Run:  python tools/build_tools.py
"""
import html
import json
import os

from PIL import Image, ImageDraw

from og import font, _img, _sky, _paste, _fit, _lines, _chip, _button, _hearts, IMG, W, H, PLUM

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHARE = os.path.join(HERE, "assets", "share")
SITE = "https://www.shaadiparrot.com"
ROSE, INK2, GOLD = (196, 47, 64), (110, 82, 104), (183, 121, 31)
PLAY = "https://play.google.com/store/apps/details?id=com.shaadiparrot.app"

NAKS = ["ashwini", "bharani", "krittika", "rohini", "mrigashira", "ardra", "punarvasu", "pushya", "ashlesha", "magha",
        "purva_phalguni", "uttara_phalguni", "hasta", "chitra", "swati", "vishakha", "anuradha", "jyeshtha", "mula",
        "purva_ashadha", "uttara_ashadha", "shravana", "dhanishta", "shatabhisha", "purva_bhadrapada", "uttara_bhadrapada", "revati"]
NAK_NAMES = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha",
             "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula",
             "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"]
RASHIS = [("Mesha", "Aries"), ("Vrishabha", "Taurus"), ("Mithuna", "Gemini"), ("Karka", "Cancer"), ("Simha", "Leo"), ("Kanya", "Virgo"),
          ("Tula", "Libra"), ("Vrishchika", "Scorpio"), ("Dhanu", "Sagittarius"), ("Makara", "Capricorn"), ("Kumbha", "Aquarius"), ("Meena", "Pisces")]


def band(s):   # the same bands as assets/js/kundli-match.js
    if s > 32:
        return "Made in the stars"
    if s >= 25:
        return "A very good match"
    if s >= 18:
        return "A good match"
    return "Opposites attract?"


def num(s):
    t = f"{s:g}"
    return t.replace(".5", "½") if t != "0.5" else "½"


def slug(s):
    return f"{s:g}".replace(".", "-")


def ring(c, cx, cy, r, frac, width=34, label=None, sub=None):
    """Score ring like the site's: rose arc on a pale track, the number inside."""
    big = Image.new("RGBA", (r * 2 + width + 8, r * 2 + width + 8), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    o = width // 2 + 4
    box = (o, o, o + 2 * r, o + 2 * r)
    d.ellipse((o - width // 2, o - width // 2, o + 2 * r + width // 2, o + 2 * r + width // 2), fill=(255, 251, 249))
    d.arc(box, 0, 360, fill=(247, 213, 207), width=width)
    if frac > 0:
        d.arc(box, -90, -90 + 360 * max(frac, .02), fill=(214, 58, 76), width=width)
    c.alpha_composite(big, (cx - big.width // 2, cy - big.height // 2))
    dd = ImageDraw.Draw(c)
    if label:
        f = font("brand", 132 if len(label) <= 3 else 112)
        l, t, rr, b = f.getbbox(label)
        dd.text((cx - (rr - l) / 2 - l, cy - (b - t) / 2 - t - 18), label, font=f, fill=PLUM)
    if sub:
        f = font("bold", 26)
        dd.text((cx - dd.textlength(sub, font=f) / 2, cy + 50), sub, font=f, fill=INK2)


def og_match(score):
    c = _sky()
    d = ImageDraw.Draw(c)
    mithu = _img(os.path.join(IMG, "mithu_heart.webp"), (240, 300))
    ring(c, 905, 300, 165, score / 36, label=num(score), sub="of 36 gunas")
    _paste(c, mithu, (W - mithu.width - 6, H - mithu.height + 10))
    _hearts(c)
    _chip(d, (70, 64), "Kundli match", font("bold", 26))
    y = _lines(c, 70, 138, ["Our score:"], font("bold", 44), fill=PLUM, gap=10)
    size, lines = _fit(d, band(score), "brand", 600, [104, 92, 80, 70], 2)
    y = _lines(c, 66, y + 14, lines, font("brand", size), gap=12)
    _lines(c, 70, y + 14, [f"{num(score)} of 36 gunas in Guna Milan"], font("bold", 32), fill=PLUM)
    _button(c, (70, 470), "Check yours with your crush")
    return c.convert("RGB")


def og_tool(title, sub, button, art, mithu_file, extra=None):
    c = _sky()
    d = ImageDraw.Draw(c)
    if extra:
        extra(c)
    m = _img(os.path.join(IMG, mithu_file), (330, 400))
    _paste(c, m, (W - m.width - 20, H - m.height - 6))
    if art:
        a = _img(os.path.join(IMG, art), (220, 220))
        _paste(c, a, (760, 70))
    _hearts(c)
    _chip(d, (70, 64), "Free · by Mithu, the parrot astrologer", font("bold", 26))
    size, lines = _fit(d, title, "brand", 640, [124, 110, 96, 84], 2)
    y = _lines(c, 66, 140, lines, font("brand", size), gap=12)
    size2, lines2 = _fit(d, sub, "bold", 600, [38, 34, 30], 3)
    y = _lines(c, 70, y + 18, lines2, font("bold", size2), fill=PLUM, gap=10)
    _button(c, (70, max(y + 30, 440)), button)
    return c.convert("RGB")


def og_nak(i):
    key, name = NAKS[i], NAK_NAMES[i]
    span = 360 / 27
    signs = sorted({int(i * span // 30), int(((i + 1) * span - 1e-9) // 30)})
    rashi = " / ".join(RASHIS[s][0] for s in signs)
    c = _sky()
    d = ImageDraw.Draw(c)
    card = Image.new("RGBA", (330, 360), (0, 0, 0, 0))
    ImageDraw.Draw(card).rounded_rectangle((0, 0, 329, 359), radius=36, fill=(255, 251, 249))
    st = _img(os.path.join(IMG, "naks", key + ".webp"), (250, 250))
    card.alpha_composite(st, ((330 - st.width) // 2, 40))
    card = card.rotate(-5, resample=Image.BICUBIC, expand=True)
    _paste(c, card, (740, 70))
    m = _img(os.path.join(IMG, "mithu_telescope.webp"), (250, 270))
    _paste(c, m, (W - m.width - 10, H - m.height - 4))
    _hearts(c)
    _chip(d, (70, 64), "My Moon sign", font("bold", 26))
    y = _lines(c, 70, 138, ["My nakshatra is"], font("bold", 42), fill=PLUM)
    size, lines = _fit(d, name, "brand", 620, [124, 108, 94, 80], 2)
    y = _lines(c, 66, y + 12, lines, font("brand", size), gap=10)
    _lines(c, 70, y + 12, [f"{rashi} rashi"], font("bold", 34), fill=PLUM)
    _button(c, (70, 470), "Find your rashi, free")
    return c.convert("RGB"), rashi


PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#F47A85">
<link rel="canonical" href="{site}/{path}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Shaadi Parrot">
<meta property="og:title" content="{ogtitle}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{site}/assets/share/{og}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="{site}/{path}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="../favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="../apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/site.css">
<link rel="stylesheet" href="../assets/css/tools.css">
</head>
<body class="shared">
<header class="shared-top">
  <a class="brand" href="../index.html" aria-label="Shaadi Parrot home"><img src="../assets/img/logo.webp" width="46" height="46" alt=""><span>Shaadi<br>Parrot</span></a>
</header>
<main class="shared-main">
{body}
</main>
<footer class="shared-foot"><p>Free tools by <a href="../index.html">Shaadi Parrot</a>, the Indian dating app with a parrot astrologer · <a href="../privacy.html">Privacy</a></p></footer>
</body>
</html>
"""

MATCH_BODY = """  <section class="score-card band-{key}">
    <p class="kicker">Their kundli match</p>
    <div class="ring" style="--p:{p}"><div><b>{num}</b><small>of 36 gunas</small></div></div>
    <h1 class="score-band">{band}</h1>
    <p class="range-note">18 is the usual minimum for a match, 25 and up is very good.</p>
    <a class="btn btn-big" href="../kundli-match.html">Check your own match</a>
    <p class="tool-note">Two birth dates · 2 seconds · nothing leaves your phone</p>
  </section>
  <nav class="next-tools" aria-label="More free tools">
    <a class="next-tool" href="../love-today.html"><img src="../assets/img/astro/a_love.webp" width="160" height="160" alt=""><span><b>Love luck today</b><small>Hearts for all 12 rashis</small></span></a>
    <a class="next-tool" href="../moon-sign.html"><img src="../assets/img/astro/a_zodiac.webp" width="160" height="160" alt=""><span><b>Find your rashi</b><small>Moon sign and nakshatra</small></span></a>
  </nav>
  <aside class="app-cta"><img src="../assets/img/mithu_cards.webp" width="510" height="635" alt="">
    <div><b>Want people whose stars already fit?</b><p>Every morning in Shaadi Parrot, Mithu picks three people for you and shows your Guna Milan with each one.</p>
    <a class="btn btn-small" href="{play}" target="_blank" rel="noopener">Get the app, free</a></div></aside>"""

NAK_BODY = """  <section class="score-card rashi-card">
    <p class="kicker">Their nakshatra</p>
    <img class="nak-sticker" src="../assets/img/naks/{key}.webp" width="256" height="256" alt="">
    <h1 class="score-band">{name}</h1>
    <p class="rashi-en">{rashi} rashi</p>
    {hook}
    <a class="btn btn-big" href="../moon-sign.html">Find your rashi</a>
    <p class="tool-note">Your birth date · 10 seconds · nothing leaves your phone</p>
  </section>
  <nav class="next-tools" aria-label="More free tools">
    <a class="next-tool" href="../kundli-match.html"><img src="../assets/img/astro/a_kundli.webp" width="160" height="160" alt=""><span><b>Kundli match</b><small>Your gunas with your crush</small></span></a>
    <a class="next-tool" href="../love-today.html"><img src="../assets/img/astro/a_love.webp" width="160" height="160" alt=""><span><b>Love luck today</b><small>Hearts for all 12 rashis</small></span></a>
  </nav>"""


def nak_data():
    raw = open(os.path.join(HERE, "assets", "js", "nak-data.js"), encoding="utf-8").read()
    return json.loads(raw[raw.index("{"):raw.rindex("}") + 1])


def main():
    os.makedirs(SHARE, exist_ok=True)
    e = lambda s: html.escape(s, quote=True)
    og_tool("Kundli match", "Your birth date and your crush’s. Your score out of 36 gunas.", "Check yours in 2 seconds",
            "astro/a_kundli.webp", "mithu_heart.webp").save(os.path.join(SHARE, "og-kundli-match.jpg"), quality=86, optimize=True)
    og_tool("Find your rashi", "Your Moon sign and nakshatra from your birth date.", "Find my rashi, free",
            "astro/a_zodiac.webp", "mithu_telescope.webp").save(os.path.join(SHARE, "og-moon-sign.jpg"), quality=86, optimize=True)
    og_tool("Love luck today", "Hearts for all 12 rashis from today’s Moon. New every morning.", "See your love luck",
            "astro/a_love.webp", "mithu_crown.webp").save(os.path.join(SHARE, "og-love-today.jpg"), quality=86, optimize=True)

    os.makedirs(os.path.join(HERE, "match"), exist_ok=True)
    scores = [k / 2 for k in range(0, 73)]
    for s in scores:
        og_match(s).save(os.path.join(SHARE, f"og-match-{slug(s)}.jpg"), quality=84, optimize=True)
        key = "rare" if s > 32 else "great" if s >= 25 else "good" if s >= 18 else "low"
        body = MATCH_BODY.format(key=key, p=f"{s / 36:.4f}", num=num(s), band=band(s),
                                 play=PLAY + "&amp;referrer=utm_source%3Dwebsite%26utm_medium%3Dshared_match")
        page = PAGE.format(title=f"{num(s)} of 36 gunas: {band(s)} — Kundli match", ogtitle=f"Our kundli match: {num(s)} of 36 gunas 💞",
                           desc=f"{band(s)}: {num(s)} of 36 gunas in Guna Milan. Check your own kundli match with your crush, free.",
                           site=SITE, path=f"match/{slug(s)}.html", og=f"og-match-{slug(s)}.jpg", body=body)
        with open(os.path.join(HERE, "match", f"{slug(s)}.html"), "w", encoding="utf-8", newline="\n") as f:
            f.write(page)

    os.makedirs(os.path.join(HERE, "moon-sign"), exist_ok=True)
    data = nak_data()
    for i, key in enumerate(NAKS):
        img, rashi = og_nak(i)
        img.save(os.path.join(SHARE, f"og-nak-{key}.jpg"), quality=84, optimize=True)
        hook = data.get(key, {}).get("hook", "")
        body = NAK_BODY.format(key=key, name=NAK_NAMES[i], rashi=e(rashi), hook=f'<p class="nak-hook">{e(hook)}</p>' if hook else "")
        page = PAGE.format(title=f"{NAK_NAMES[i]} nakshatra, {rashi} rashi — Find your rashi", ogtitle=f"My nakshatra is {NAK_NAMES[i]} 🌙 What’s yours?",
                           desc=f"{NAK_NAMES[i]} nakshatra in {rashi} rashi. Find your own Moon sign and nakshatra from your birth date, free.",
                           site=SITE, path=f"moon-sign/{key}.html", og=f"og-nak-{key}.jpg", body=body)
        with open(os.path.join(HERE, "moon-sign", f"{key}.html"), "w", encoding="utf-8", newline="\n") as f:
            f.write(page)
    print(f"built 3 tool previews, {len(scores)} match pages and {len(NAKS)} nakshatra pages")


if __name__ == "__main__":
    main()
