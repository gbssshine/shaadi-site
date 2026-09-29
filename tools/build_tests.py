"""Build the "Which love bird are you?" assets from tools/love_bird.py:

  assets/js/love-bird-data.js        quiz data for tests/love-bird.html
  assets/share/love-bird-<id>.jpg    1080x1350 image people save and post
  assets/share/og-love-bird-<id>.jpg 1200x630 link preview (WhatsApp, Instagram DMs)
  assets/share/og-love-bird.jpg      preview for the quiz itself
  tests/love-bird/<id>.html          one static page per result, so a shared link
                                     previews that bird (crawlers don't run JS)
Run:  python tools/build_tests.py
"""
import html
import json
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from love_bird import BIRDS, QUESTIONS

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(HERE, "tools", "fonts")
SITE = "https://www.shaadiparrot.com"
PLUM, ROSE, INK2 = (65, 33, 62), (196, 47, 64), (110, 82, 104)


def font(kind, size):
    if kind == "display":
        f = ImageFont.truetype(os.path.join(FONTS, "Baloo2.ttf"), size)
        f.set_variation_by_name("ExtraBold")
        return f
    return ImageFont.truetype(os.path.join(FONTS, "PlusJakartaSans-Bold.ttf" if kind == "bold" else "PlusJakartaSans-SemiBold.ttf"), size)


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def gradient(w, h, top, bottom):
    g = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        g.putpixel((0, y), tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return g.resize((w, h))


def bird_img(bid, max_w, max_h):
    im = Image.open(os.path.join(HERE, "assets", "img", "birds", bid + ".webp")).convert("RGBA")
    im.thumbnail((max_w, max_h), Image.LANCZOS)
    return im


def shadow(im, blur=18, alpha=70):
    a = im.getchannel("A").point(lambda v: v * alpha // 255)
    sh = Image.new("RGBA", im.size, (122, 38, 60, 0))
    sh.putalpha(a)
    pad = blur * 3
    canvas = Image.new("RGBA", (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
    canvas.paste(sh, (pad, pad))
    return canvas.filter(ImageFilter.GaussianBlur(blur)), pad


def text_center(d, xy, text, f, fill):
    w = d.textlength(text, font=f)
    d.text((xy[0] - w / 2, xy[1]), text, font=f, fill=fill)


def wrap(d, text, f, width):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= width:
            cur = t
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    return lines


def pill(d, x, y, text, f, fill, bg, pad=(26, 14)):
    w = d.textlength(text, font=f)
    box = (x, y, x + w + pad[0] * 2, y + f.size + pad[1] * 2)
    d.rounded_rectangle(box, radius=(box[3] - box[1]) // 2, fill=bg)
    d.text((x + pad[0], y + pad[1] - f.size * 0.12), text, font=f, fill=fill)
    return box


def share_card(bid, b):
    """1080x1350 portrait card for saving to the gallery / posting."""
    W, H = 1080, 1350
    tint = hex_rgb(b["tint"])
    img = gradient(W, H, (255, 214, 204), (255, 240, 230)).convert("RGBA")
    d = ImageDraw.Draw(img)
    # card
    d.rounded_rectangle((60, 170, W - 60, H - 150), radius=56, fill=(255, 251, 249))
    d.rounded_rectangle((60, 170, W - 60, 700), radius=56, fill=tint)
    d.rectangle((60, 640, W - 60, 700), fill=tint)
    # header
    text_center(d, (W / 2, 70), "Which love bird are you?", font("display", 58), PLUM)
    art = bird_img(bid, 520, 470)
    sh, pad = shadow(art)
    img.alpha_composite(sh, (int(W / 2 - art.width / 2 - pad), int(690 - art.height - pad + 14)))
    img.alpha_composite(art, (int(W / 2 - art.width / 2), int(690 - art.height)))
    y = 730
    text_center(d, (W / 2, y), "I’m a", font("bold", 40), INK2)
    text_center(d, (W / 2, y + 36), b["name"], font("display", 128), ROSE)
    text_center(d, (W / 2, y + 176), b["tagline"], font("display", 50), PLUM)
    # traits
    f = font("bold", 28)
    y = y + 262
    for t in b["traits"]:
        w = d.textlength(t, font=f) + 52
        pill(d, W / 2 - w / 2, y, t, f, PLUM, (255, 232, 224))
        y += 64
    # footer
    text_center(d, (W / 2, H - 112), "What are you? Take the test at shaadiparrot.com", font("bold", 34), PLUM)
    text_center(d, (W / 2, H - 62), "Parrot Tests", font("display", 34), ROSE)
    return img.convert("RGB")


def og_card(bid, b):
    """1200x630 link preview."""
    W, H = 1200, 630
    img = gradient(W, H, (253, 196, 184), (255, 233, 220)).convert("RGBA")
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((40, 40, 520, H - 40), radius=44, fill=hex_rgb(b["tint"]))
    art = bird_img(bid, 400, 470)
    img.alpha_composite(art, (int(280 - art.width / 2), int(H / 2 - art.height / 2)))
    x = 580
    d.text((x, 92), "Which love bird are you?", font=font("bold", 34), fill=INK2)
    d.text((x, 138), "I’m a", font=font("display", 60), fill=PLUM)
    d.text((x, 196), b["name"], font=font("display", 124), fill=ROSE)
    fy = 360
    for line in wrap(d, b["tagline"], font("display", 50), 580):
        d.text((x, fy), line, font=font("display", 50), fill=PLUM)
        fy += 58
    d.text((x, H - 110), "What are you? Take the 2-minute test.", font=font("semi", 28), fill=INK2)
    d.text((x, H - 70), "Parrot Tests", font=font("display", 34), fill=ROSE)
    return img.convert("RGB")


def og_quiz():
    W, H = 1200, 630
    img = gradient(W, H, (246, 122, 133), (253, 214, 176)).convert("RGBA")
    d = ImageDraw.Draw(img)
    for i, (bid, x, y, s) in enumerate([("peacock", 40, 250, 330), ("swan", 330, 150, 420), ("owl", 660, 240, 320), ("flamingo", 900, 170, 400)]):
        art = bird_img(bid, s, s)
        img.alpha_composite(art, (x, H - art.height - 20))
    text_center(d, (W / 2, 40), "Which love bird are you?", font("display", 84), PLUM)
    text_center(d, (W / 2, 140), "12 birds · 8 questions · 2 minutes", font("bold", 32), PLUM)
    return img.convert("RGB")


PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>I’m a {name}. Which love bird are you? — Parrot Tests</title>
<meta name="description" content="{tagline} Take the 2-minute test and find your love bird.">
<meta name="theme-color" content="#F47A85">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Parrot Tests">
<meta property="og:title" content="I’m a {name}. Which love bird are you?">
<meta property="og:description" content="{tagline} Take the 2-minute test.">
<meta property="og:image" content="{site}/assets/share/og-love-bird-{id}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="{site}/tests/love-bird/{id}.html">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/webp" href="../../assets/img/logo.webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../assets/css/site.css">
<link rel="stylesheet" href="../../assets/css/tests.css">
</head>
<body class="pt">
<header class="pt-top">
  <a class="pt-back" href="../../tests.html"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4 6.5 10l6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>All tests</a>
  <a class="pt-brand" href="../love-bird.html"><img src="../../assets/img/mithu_pencil.webp" width="640" height="803" alt=""><span>Parrot Tests</span></a>
  <span class="pt-spacer" aria-hidden="true"></span>
</header>
<main class="pt-main">
  <section class="pt-card result" style="--tint:{tint}">
    <p class="pt-kicker">A friend got</p>
    <div class="res-art"><img src="../../assets/img/birds/{id}.webp" width="480" height="480" alt="{name}"></div>
    <h1 class="res-name"><small>The</small> {name}</h1>
    <p class="res-tag">{tagline}</p>
    <ul class="res-traits">{traits}</ul>
    <p class="res-love">{love}</p>
    <a class="btn pt-start" href="../love-bird.html">Which bird are you?</a>
    <p class="pt-note">8 questions · 2 minutes · no sign-up</p>
  </section>
</main>
<footer class="pt-foot">
  <p><b>Parrot Tests</b> by Shaadi Parrot · <a href="../../privacy.html">Privacy</a></p>
</footer>
</body>
</html>
"""


def main():
    # 1. quiz data for the browser
    data = {
        "birds": BIRDS,
        "questions": [{"q": q, "a": [{"t": t, "p": p, "s": s} for t, p, s in opts]} for q, opts in QUESTIONS],
        "site": SITE,
    }
    js = "/* Generated by tools/build_tests.py from tools/love_bird.py — edit there. */\nwindow.LOVE_BIRD = " + \
        json.dumps(data, ensure_ascii=False, indent=1) + ";\n"
    with open(os.path.join(HERE, "assets", "js", "love-bird-data.js"), "w", encoding="utf-8", newline="\n") as f:
        f.write(js)

    share = os.path.join(HERE, "assets", "share")
    pages = os.path.join(HERE, "tests", "love-bird")
    os.makedirs(share, exist_ok=True)
    os.makedirs(pages, exist_ok=True)
    for bid, b in BIRDS.items():
        share_card(bid, b).save(os.path.join(share, f"love-bird-{bid}.jpg"), quality=88, optimize=True)
        og_card(bid, b).save(os.path.join(share, f"og-love-bird-{bid}.jpg"), quality=86, optimize=True)
        e = lambda s: html.escape(s, quote=True)
        page = PAGE.format(id=bid, name=e(b["name"]), tagline=e(b["tagline"]), love=e(b["love"]), tint=b["tint"],
                           traits="".join(f"<li>{e(t)}</li>" for t in b["traits"]), site=SITE)
        with open(os.path.join(pages, f"{bid}.html"), "w", encoding="utf-8", newline="\n") as f:
            f.write(page)
    og_quiz().save(os.path.join(share, "og-love-bird.jpg"), quality=86, optimize=True)
    print(f"built data, {len(BIRDS)} share cards, {len(BIRDS)} result pages")


if __name__ == "__main__":
    main()
