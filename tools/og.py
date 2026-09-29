"""Link-preview images (1200x630) in the banner's style, for WhatsApp / Instagram / Telegram.

  test_card(test, cat_title)            -> preview of a test ("Forgiveness · take the 2-minute test")
  result_card(test, cat_title, label)   -> preview of a shared result ("A friend got <label>. What will you get?")
  bird_card(bird_id, bird)              -> preview of a love bird result
"""
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(HERE, "tools", "fonts")
IMG = os.path.join(HERE, "assets", "img")
W, H = 1200, 630
PLUM, ROSE_TOP, ROSE_BOT, INK2 = (65, 33, 62), (255, 110, 125), (196, 47, 64), (110, 82, 104)
ART = {
    "personality": "t_personality", "love_style": "t_love", "attachment": "t_attachment",
    "communication": "t_talk", "values": "t_values", "conflict": "t_conflict",
    "jealousy": "t_jealousy", "family_focus": "t_family", "long_term": "t_longterm",
}
_cache = {}


def font(kind, size):
    key = (kind, size)
    if key not in _cache:
        if kind == "brand":
            f = ImageFont.truetype(os.path.join(FONTS, "Baloo2.ttf"), size)
            f.set_variation_by_name("ExtraBold")
        else:
            f = ImageFont.truetype(os.path.join(FONTS, "PlusJakartaSans-Bold.ttf" if kind == "bold" else "PlusJakartaSans-SemiBold.ttf"), size)
        _cache[key] = f
    return _cache[key]


def _img(path, box):
    im = Image.open(path).convert("RGBA")
    im.thumbnail(box, Image.LANCZOS)
    return im


def _sky():
    if "sky" not in _cache:
        sky = Image.open(os.path.join(IMG, "hero-sky.webp")).convert("RGB")
        # keep the clouds at the bottom, like the banner
        r = W / sky.width
        sky = sky.resize((W, round(sky.height * r)), Image.LANCZOS)
        if sky.height < H:
            sky = sky.resize((round(sky.width * H / sky.height), H), Image.LANCZOS)
        x = (sky.width - W) // 2
        sky = sky.crop((x, sky.height - H, x + W, sky.height))
        _cache["sky"] = sky
    return _cache["sky"].copy().convert("RGBA")


def _shadow(im, blur=16, alpha=90, offset=(0, 14)):
    a = im.getchannel("A").point(lambda v: v * alpha // 255)
    sh = Image.new("RGBA", im.size, (150, 40, 60, 0))
    sh.putalpha(a)
    pad = blur * 3
    c = Image.new("RGBA", (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0))
    c.paste(sh, (pad, pad))
    return c.filter(ImageFilter.GaussianBlur(blur)), pad, offset


def _paste(canvas, im, xy, shadow=True):
    if shadow:
        sh, pad, (dx, dy) = _shadow(im)
        canvas.alpha_composite(sh, (xy[0] - pad + dx, xy[1] - pad + dy))
    canvas.alpha_composite(im, xy)


def _wrap(d, text, f, width, max_lines):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= width:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    if len(lines) > max_lines or any(f.getbbox(l)[2] > width for l in lines):
        return None
    return lines


def _fit(d, text, kind, width, sizes, max_lines):
    for s in sizes:
        lines = _wrap(d, text, font(kind, s), width, max_lines)
        if lines:
            return s, lines
    s = sizes[-1]
    return s, _wrap(d, text, font(kind, s), width, 99)[:max_lines]


def _lines(canvas, x, y, lines, f, fill=None, gap=8):
    """Draw lines by their visual top (fonts like Baloo have tall built-in ascent); return the y under the last line."""
    d = ImageDraw.Draw(canvas)
    for line in lines:
        l, t, r, b = f.getbbox(line)
        if fill is None:
            _gradient_text(canvas, (x, y - t), line, f)
        else:
            d.text((x, y - t), line, font=f, fill=fill)
        y += (b - t) + gap
    return y


def _gradient_text(canvas, xy, text, f):
    """Two-tone rose text like the banner's 'Destiny'."""
    d = ImageDraw.Draw(canvas)
    l, t, r, b = d.textbbox(xy, text, font=f)
    mask = Image.new("L", canvas.size, 0)
    ImageDraw.Draw(mask).text(xy, text, font=f, fill=255)
    grad = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for y in range(t, b + 1):
        k = (y - t) / max(1, b - t)
        gd.line([(l, y), (r, y)], fill=tuple(round(ROSE_TOP[i] + (ROSE_BOT[i] - ROSE_TOP[i]) * k) for i in range(3)) + (255,))
    canvas.alpha_composite(Image.composite(grad, Image.new("RGBA", canvas.size, (0, 0, 0, 0)), mask))


def _chip(d, xy, text, f, bg=(255, 250, 247), fg=PLUM, pad=(18, 9)):
    w = d.textlength(text, font=f)
    box = (xy[0], xy[1], xy[0] + w + 2 * pad[0], xy[1] + f.size + 2 * pad[1])
    d.rounded_rectangle(box, radius=(box[3] - box[1]) // 2, fill=bg)
    d.text((xy[0] + pad[0], xy[1] + pad[1] - f.size * .12), text, font=f, fill=fg)
    return box


def _button(canvas, xy, text):
    d = ImageDraw.Draw(canvas)
    f = font("bold", 32)
    w = d.textlength(text, font=f)
    box = (xy[0], xy[1], int(xy[0] + w + 64), xy[1] + 70)
    btn = Image.new("RGBA", (box[2] - box[0], box[3] - box[1]), (0, 0, 0, 0))
    bd = ImageDraw.Draw(btn)
    for y in range(btn.height):
        k = y / btn.height
        bd.line([(0, y), (btn.width, y)], fill=(round(240 - 44 * k), round(86 - 39 * k), round(106 - 42 * k), 255))
    m = Image.new("L", btn.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, btn.width - 1, btn.height - 1), radius=35, fill=255)
    btn.putalpha(m)
    _paste(canvas, btn, (box[0], box[1]))
    ImageDraw.Draw(canvas).text((box[0] + 32, box[1] + 15), text, font=f, fill=(255, 255, 255))


def _hearts(canvas):
    heart = Image.new("RGBA", (64, 58), (0, 0, 0, 0))
    hd = ImageDraw.Draw(heart)
    hd.ellipse((0, 0, 36, 34), fill=(238, 86, 112))
    hd.ellipse((28, 0, 64, 34), fill=(238, 86, 112))
    hd.polygon([(3, 24), (61, 24), (32, 57)], fill=(238, 86, 112))
    hd.ellipse((10, 7, 24, 16), fill=(255, 190, 200))
    for (x, y, s) in [(1080, 54, 50), (705, 470, 30), (1138, 300, 34)]:
        h = heart.resize((s, round(s * 58 / 64)), Image.LANCZOS)
        canvas.alpha_composite(h, (x, y))


def _right_art(canvas, sticker):
    # white "polaroid" holding the test sticker, tilted, with Mithu in front
    card = Image.new("RGBA", (300, 330), (0, 0, 0, 0))
    ImageDraw.Draw(card).rounded_rectangle((0, 0, 299, 329), radius=34, fill=(255, 251, 249))
    st = _img(sticker, (230, 230))
    card.alpha_composite(st, ((300 - st.width) // 2, 34))
    card = card.rotate(6, resample=Image.BICUBIC, expand=True)
    _paste(canvas, card, (760, 52))
    mithu = _img(os.path.join(IMG, "mithu_pencil.webp"), (330, 380))
    _paste(canvas, mithu, (W - mithu.width - 18, H - mithu.height - 8))
    _hearts(canvas)


def _wordmark(canvas, y):
    d = ImageDraw.Draw(canvas)
    logo = _img(os.path.join(IMG, "logo.webp"), (44, 44))
    m = Image.new("L", logo.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, logo.width - 1, logo.height - 1), radius=12, fill=255)
    logo.putalpha(m)
    canvas.alpha_composite(logo, (70, y))
    d.text((126, y + 2), "Parrot Tests", font=font("brand", 36), fill=PLUM)


COL = 650  # text column width: x 70..720, the art starts at 760


def test_card(t, cat_title):
    c = _sky()
    d = ImageDraw.Draw(c)
    _right_art(c, os.path.join(IMG, "tests", ART[t["category"]] + ".webp"))
    _chip(d, (70, 64), f"{cat_title} test", font("bold", 26))
    size, lines = _fit(d, t["title"], "brand", COL, [118, 104, 92, 80, 70], 2)
    y = _lines(c, 66, 138, lines, font("brand", size), gap=14)
    size2, lines2 = _fit(d, t["subtitle"], "bold", COL, [40, 36, 32], 2)
    y = _lines(c, 70, y + 16, lines2, font("bold", size2), fill=PLUM, gap=12)
    _button(c, (70, max(y + 34, 400)), "Take the 2-minute test")
    _wordmark(c, H - 78)
    return c.convert("RGB")


def result_card(t, cat_title, label):
    c = _sky()
    d = ImageDraw.Draw(c)
    _right_art(c, os.path.join(IMG, "tests", ART[t["category"]] + ".webp"))
    _, chip = _fit(d, f"{t['title']} · {cat_title} test", "bold", COL - 40, [24, 22, 20], 1)
    _chip(d, (70, 58), chip[0], font("bold", 24 if len(chip[0]) < 40 else 20))
    y = _lines(c, 70, 128, ["A friend got"], font("bold", 38), fill=PLUM)
    size, lines = _fit(d, f"“{label}”", "brand", COL, [100, 90, 80, 70, 62, 56], 2)
    y = _lines(c, 64, y + 10, lines, font("brand", size), gap=12)
    y = _lines(c, 70, y + 12, ["What will you get?"], font("brand", 52), fill=PLUM)
    _button(c, (70, max(y + 24, 430)), "Take the 2-minute test")
    _wordmark(c, H - 72)
    return c.convert("RGB")


def bird_card(bid, b):
    c = _sky()
    d = ImageDraw.Draw(c)
    bird = _img(os.path.join(IMG, "birds", bid + ".webp"), (420, 470))
    _paste(c, bird, (W - bird.width - 70, (H - bird.height) // 2 - 10))
    _hearts(c)
    _chip(d, (70, 60), "Which love bird are you?", font("bold", 26))
    y = _lines(c, 70, 128, ["A friend is a"], font("bold", 40), fill=PLUM)
    y = _lines(c, 64, y + 14, [b["name"]], font("brand", 124 if len(b["name"]) < 9 else 100))
    size, lines = _fit(d, b["tagline"], "bold", W - bird.width - 150, [42, 38, 34], 2)
    y = _lines(c, 70, y + 18, lines, font("bold", size), fill=PLUM, gap=12)
    _button(c, (70, max(y + 30, 430)), "Which bird are you?")
    _wordmark(c, H - 72)
    return c.convert("RGB")


def quiz_card():
    c = _sky()
    d = ImageDraw.Draw(c)
    for bid, x, h in [("peacock", 690, 220), ("swan", 800, 360), ("owl", 960, 230), ("flamingo", 1050, 320)]:
        im = _img(os.path.join(IMG, "birds", bid + ".webp"), (300, h))
        _paste(c, im, (x, H - im.height - 60))
    _hearts(c)
    _chip(d, (70, 66), "12 birds · 8 questions · 2 minutes", font("bold", 26))
    y = _lines(c, 64, 140, ["Which love", "bird are you?"], font("brand", 92), gap=14)
    _button(c, (70, y + 30), "Find your bird")
    _wordmark(c, H - 78)
    return c.convert("RGB")
