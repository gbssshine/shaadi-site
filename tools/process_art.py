"""Turn the generated art (white backgrounds, from Kling gpt-image2) into site-ready WebP.

Sources: ../shaadi-parrot-cartoon/out/site_kling/*.png
  bird_*    -> assets/img/birds/<name>.webp   (cut out, 480 px)
  mithu_*   -> assets/img/<name>.webp         (cut out, 640 px; mithu_heart 820 px)
  p_*       -> assets/img/people/<name>.webp  (opaque portrait, 480 px wide)
  hero_sky_wide / hero_sky_tall / couple_chai -> opaque backgrounds
Run:  python tools/process_art.py
"""
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cutout import cutout  # noqa: E402

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(os.path.dirname(HERE), "shaadi-parrot-cartoon", "out", "site_kling")
IMG = os.path.join(HERE, "assets", "img")
TMP = os.path.join(SRC, "_cut")
# enclosed white background pockets, as (x, y) in source pixels, checked by eye.
# Pure-white eye highlights look the same to a detector, so this stays a hand-made list.
HOLES = {
    "mithu_crown": [(389, 335), (638, 330), (358, 461)],
    "mithu_pencil": [(358, 521), (667, 542), (643, 700)],
    "bird_crow": [(260, 325)],
    "bird_flamingo": [(552, 669)],
    "bird_lovebird": [(514, 699)],
}


def webp(im, path, width, quality=82):
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if im.mode == "RGBA" and im.getchannel("A").getextrema()[0] == 255:
        im = im.convert("RGB")
    im.save(path, "WEBP", quality=quality, method=6)
    return im.size, os.path.getsize(path) // 1024


def crop_above_gap(im):
    """Cut at the first empty horizontal band in the lower half that has more art below it (drops the card row)."""
    import numpy as np
    rows = (np.asarray(im.getchannel("A")) > 20).sum(1)
    for y in range(im.height // 2, im.height):
        if rows[y] == 0 and rows[y:].any():
            im = im.crop((0, 0, im.width, y))
            return im.crop(im.getchannel("A").getbbox())
    return im


def main(only=None):
    os.makedirs(TMP, exist_ok=True)
    for f in sorted(os.listdir(SRC)):
        if not f.endswith(".png") or f.endswith("_clean.png"):
            continue
        key = f[:-4]
        if only and key not in only:
            continue
        src = os.path.join(SRC, f)
        if key.startswith(("bird_", "mithu_")):
            cut = os.path.join(TMP, f)
            cutout(src, cut, tol=14 if key in ("bird_swan", "bird_dove") else 22, holes=HOLES.get(key, ()))
            im = Image.open(cut)
            if key == "mithu_cards":
                im = crop_above_gap(im)
            if key.startswith("bird_"):
                out = os.path.join(IMG, "birds", key[5:] + ".webp")
                res = webp(im, out, 480)
            else:
                out = os.path.join(IMG, key + ".webp")
                res = webp(im, out, 820 if key == "mithu_heart" else 640)
        elif key.startswith("p_"):
            out = os.path.join(IMG, "people", key[2:] + ".webp")
            res = webp(Image.open(src).convert("RGB"), out, 480, quality=80)
        elif key in ("hero_sky_wide", "hero_sky_tall"):
            # the *_clean.png versions have the painted hearts removed (hearts are drawn in HTML)
            clean = src.replace(".png", "_clean.png")
            wide = key == "hero_sky_wide"
            out = os.path.join(IMG, "hero-sky.webp" if wide else "hero-sky-m.webp")
            res = webp(Image.open(clean if os.path.exists(clean) else src).convert("RGB"), out, 2400 if wide else 1080, quality=74)
        elif key == "couple_chai":
            out = os.path.join(IMG, "couple-chai.webp")
            res = webp(Image.open(src).convert("RGB"), out, 1600, quality=78)
        else:
            continue
        print(f"{os.path.relpath(out, HERE):36s} {res[0][0]}x{res[0][1]}  {res[1]} KB")


if __name__ == "__main__":
    main(set(sys.argv[1:]) or None)
