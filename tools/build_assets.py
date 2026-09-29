"""Copy and compress artwork into assets/img as WebP.

Sources live outside this repo (the app's Resources/Images and the cartoon project),
so run this after new art is generated:  python tools/build_assets.py
"""
import os
from collections import deque

from PIL import Image

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPOS = os.path.dirname(HERE)
APP = os.path.join(REPOS, "MauiApp2", "MauiApp2", "Resources", "Images")
CARTOON = os.path.join(REPOS, "shaadi-parrot-cartoon")
OUT = os.path.join(HERE, "assets", "img")


def trim(im, pad=0.04):
    """Crop to the alpha bounding box and add a small transparent margin."""
    box = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    if box:
        im = im.crop(box)
    p = int(max(im.size) * pad)
    canvas = Image.new("RGBA", (im.width + 2 * p, im.height + 2 * p), (0, 0, 0, 0))
    canvas.paste(im, (p, p))
    return canvas


def save(im, name, width, quality=82):
    im = im.convert("RGBA") if im.mode != "RGBA" else im
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    path = os.path.join(OUT, name + ".webp")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    opaque = im.getchannel("A").getextrema()[0] == 255
    (im.convert("RGB") if opaque else im).save(path, "WEBP", quality=quality, method=6)
    return path, im.size


def cut_grey_backdrop(im, tol=26):
    """The 3D character sheets sit on a flat light-grey studio backdrop.
    Flood-fill from the border through low-saturation light pixels and make them transparent."""
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    seen = bytearray(w * h)

    def backdrop(c):
        r, g, b, _ = c
        return max(r, g, b) - min(r, g, b) < tol and min(r, g, b) > 120

    q = deque()
    for x in range(w):
        q.extend([(x, 0), (x, h - 1)])
    for y in range(h):
        q.extend([(0, y), (w - 1, y)])
    while q:
        x, y = q.popleft()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        if not backdrop(px[x, y]):
            continue
        px[x, y] = (0, 0, 0, 0)
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))
    # soften the cut edge a little
    a = im.getchannel("A")
    from PIL import ImageFilter
    a = a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    im.putalpha(a)
    return im


def app(name):
    return Image.open(os.path.join(APP, name)).convert("RGBA")


def main():
    made = []
    # mascot art from the app
    for src, dst, w in [
        ("app_logo.png", "logo", 160),
        ("hello_parrot.png", "mithu_hello", 520),
        ("safe_parrot.png", "mithu_safe", 440),
        ("testparrot.png", "mithu_test", 440),
        ("writeparrot.png", "mithu_write", 360),
        ("phone_parrot.png", "mithu_phone", 360),
        ("happyparrot.png", "mithu_happy", 520),
        ("parrotplus.png", "parrot_plus", 320),
        ("crown_icon.png", "crown", 160),
        ("boost_icon.png", "boost", 160),
        ("likes_icon.png", "likes", 160),
        ("a_nakshatras.png", "a_nakshatras", 200),
        ("astro_icon.png", "astro", 200),
    ]:
        made.append(save(trim(app(src)), dst, w))
    for f in sorted(os.listdir(APP)):
        if f.startswith("t_") and f.endswith(".png"):
            made.append(save(trim(app(f)), "tests/" + f[:-4], 200))
        elif f.startswith("a_") and f.endswith(".png"):
            made.append(save(trim(app(f)), "astro/" + f[:-4], 160))
        elif f.startswith("lib_nakshatras_") and f.endswith(".png"):
            made.append(save(trim(app(f)), "naks/" + f[len("lib_nakshatras_"):-4], 256))

    # Ek Tarfa 3D cast
    for who in ("mithu", "neela", "mor"):
        src = os.path.join(CARTOON, "out", "stage4", f"{who}_ref_front.png")
        made.append(save(trim(cut_grey_backdrop(Image.open(src)), pad=0.02), "cast/" + who, 520))

    # new art generated for the site (out/site in the cartoon project)
    gen = os.path.join(CARTOON, "out", "site")
    if os.path.isdir(gen):
        for f in sorted(os.listdir(gen)):
            if not f.endswith(".png"):
                continue
            im = Image.open(os.path.join(gen, f)).convert("RGBA")
            key = f[:-4]
            if key == "mithu_heart":
                made.append(save(trim(im), "mithu_heart", 760))
            elif key.startswith("p_"):
                made.append(save(im, "people/" + key[2:], 480, quality=80))
            elif key.startswith("bird_"):
                made.append(save(trim(im), "birds/" + key[5:], 520))

    total = 0
    for path, size in made:
        kb = os.path.getsize(path) / 1024
        total += kb
        print(f"{os.path.relpath(path, HERE):40s} {size[0]}x{size[1]}  {kb:6.1f} KB")
    print(f"{len(made)} files, {total / 1024:.2f} MB")


if __name__ == "__main__":
    main()
