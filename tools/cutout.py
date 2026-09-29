"""Cut a character drawn on a flat white background into a transparent PNG.

Kling's gpt-image2 cannot return transparency, so art is generated on pure white:
  python tools/cutout.py in.png out.png [--tol 22]

Background = near-white pixels connected to the image border (so white feathers
inside the outline stay). Edge pixels get partial alpha and are un-mixed from white,
which avoids a white halo on the pink page.
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage


def cutout(src, dst, tol=22, feather=34, holes=()):
    im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    dist = 255.0 - im.min(axis=2)            # 0 = pure white
    chroma = im.max(axis=2) - im.min(axis=2)
    near_white = (dist < tol) & (chroma < tol)
    lab, _ = ndimage.label(near_white)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, border[border > 0])
    # background pockets enclosed by the drawing (e.g. between a raised wing and the head):
    # flood-fill failed to reach them, so they are listed by hand as (x, y) seeds
    if holes:
        pocket = (dist < tol + 10) & (chroma < tol)
        plab, _ = ndimage.label(pocket)
        for x, y in holes:
            if plab[y, x]:
                bg |= plab == plab[y, x]

    # alpha ramps up over `feather` levels of darkness next to the background
    alpha = np.clip((dist - tol * 0.5) / feather, 0, 1)
    ring = ndimage.binary_dilation(bg, iterations=3) & ~bg
    a = np.where(bg, 0.0, np.where(ring, alpha, 1.0))
    a = ndimage.gaussian_filter(a, 0.6)
    a[bg & ~ndimage.binary_dilation(~bg, iterations=1)] = 0

    # un-mix white from semi-transparent edge pixels: c = a*fg + (1-a)*255
    safe = np.maximum(a, 1e-3)[..., None]
    fg = np.clip((im - (1 - a[..., None]) * 255.0) / safe, 0, 255)
    out = np.dstack([np.where(a[..., None] > 0.02, fg, im), a * 255]).astype(np.uint8)
    img = Image.fromarray(out, "RGBA")
    box = img.getchannel("A").point(lambda v: 255 if v > 10 else 0).getbbox()
    if box:
        pad = int(max(img.size) * 0.03)
        box = (max(0, box[0] - pad), max(0, box[1] - pad), min(img.width, box[2] + pad), min(img.height, box[3] + pad))
        img = img.crop(box)
    img.save(dst)
    return img.size


if __name__ == "__main__":
    tol = 22
    if "--tol" in sys.argv:
        tol = int(sys.argv[sys.argv.index("--tol") + 1])
    print(cutout(sys.argv[1], sys.argv[2], tol=tol))
