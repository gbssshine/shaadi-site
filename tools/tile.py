"""Tile a tall full-page screenshot into side-by-side columns for quick review.
python tools/tile.py screenshots/index-desktop-full.png out.png [columns] [max_width]"""
import sys

from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 3
maxw = int(sys.argv[4]) if len(sys.argv) > 4 else 1900
im = Image.open(src).convert("RGB")
w, h = im.size
part = -(-h // cols)
sheet = Image.new("RGB", (w * cols + 20 * (cols - 1), part), (40, 40, 40))
for i in range(cols):
    sheet.paste(im.crop((0, i * part, w, min(h, (i + 1) * part))), (i * (w + 20), 0))
sheet.thumbnail((maxw, 8000))
sheet.save(dst)
print(sheet.size)
