"""Turn Kling loops into web video.

  python tools/animate.py cutout <in.mp4> <out-name> [width]
      mascot drawn on white → transparent VP9 WebM (assets/video/<out-name>.webm) + first-frame poster.
      Chrome, Edge, Firefox and Android play the alpha; Safari keeps the static image (site.js decides).
  python tools/animate.py scene <in.mp4> <out-name> [width]
      full-frame scene → small H.264 MP4 (assets/video/<out-name>.mp4) + WebP poster.

Loops are made with the same first and last frame, so they repeat without a jump.
"""
import os
import shutil
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VID = os.path.join(HERE, "assets", "video")
IMG = os.path.join(HERE, "assets", "img")


def key_white(rgb, tol=22, feather=34):
    """Same idea as tools/cutout.py, per frame: border-connected near-white becomes transparent."""
    im = rgb.astype(np.float32)
    dist = 255.0 - im.min(axis=2)
    chroma = im.max(axis=2) - im.min(axis=2)
    lab, _ = ndimage.label((dist < tol) & (chroma < tol))
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, border[border > 0])
    alpha = np.clip((dist - tol * 0.5) / feather, 0, 1)
    ring = ndimage.binary_dilation(bg, iterations=3) & ~bg
    a = np.where(bg, 0.0, np.where(ring, alpha, 1.0))
    a = ndimage.gaussian_filter(a, 0.7)
    safe = np.maximum(a, 1e-3)[..., None]
    fg = np.clip((im - (1 - a[..., None]) * 255.0) / safe, 0, 255)
    return np.dstack([np.where(a[..., None] > 0.02, fg, im), a * 255]).astype(np.uint8)


def frames(src, width, fps=24):
    tmp = tempfile.mkdtemp()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", f"scale={width}:-2,fps={fps}",
                    os.path.join(tmp, "f%04d.png")], check=True)
    return tmp, sorted(f for f in os.listdir(tmp) if f.endswith(".png"))


def cutout(src, name, width=640):
    tmp, fs = frames(src, width)
    boxes = []
    for f in fs:
        p = os.path.join(tmp, f)
        rgba = key_white(np.asarray(Image.open(p).convert("RGB")))
        Image.fromarray(rgba, "RGBA").save(p)
        boxes.append(Image.fromarray(rgba[..., 3]).getbbox())
    # one crop box for the whole loop, so the character doesn't jump
    x0 = min(b[0] for b in boxes if b); y0 = min(b[1] for b in boxes if b)
    x1 = max(b[2] for b in boxes if b); y1 = max(b[3] for b in boxes if b)
    pad = 6
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    w = (x1 + pad - x0) // 2 * 2
    h = (y1 + pad - y0) // 2 * 2
    os.makedirs(VID, exist_ok=True)
    out = os.path.join(VID, name + ".webm")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "24", "-i", os.path.join(tmp, "f%04d.png"),
                    "-vf", f"crop={w}:{h}:{x0}:{y0}", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
                    "-b:v", "0", "-crf", "36", "-row-mt", "1", "-an", out], check=True)
    Image.open(os.path.join(tmp, fs[0])).crop((x0, y0, x0 + w, y0 + h)).save(
        os.path.join(IMG, name + "-poster.webp"), "WEBP", quality=84, method=6)
    shutil.rmtree(tmp)
    print(f"{out}: {w}x{h}, {os.path.getsize(out) // 1024} KB, {len(fs)} frames")


def scene(src, name, width=1280):
    os.makedirs(VID, exist_ok=True)
    out = os.path.join(VID, name + ".mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", f"scale={width}:-2,fps=24", "-an",
                    "-c:v", "libx264", "-preset", "veryslow", "-crf", "25", "-pix_fmt", "yuv420p",
                    "-movflags", "+faststart", out], check=True)
    tmp = tempfile.mkdtemp()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", out, "-frames:v", "1", os.path.join(tmp, "p.png")], check=True)
    Image.open(os.path.join(tmp, "p.png")).convert("RGB").save(os.path.join(IMG, name + "-poster.webp"), "WEBP", quality=80, method=6)
    shutil.rmtree(tmp)
    print(f"{out}: {os.path.getsize(out) // 1024} KB")


if __name__ == "__main__":
    mode, src, name = sys.argv[1:4]
    width = int(sys.argv[4]) if len(sys.argv) > 4 else (640 if mode == "cutout" else 1280)
    (cutout if mode == "cutout" else scene)(src, name, width)
