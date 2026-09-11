from PIL import Image, ImageFilter
import os

public_dir = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/public'
right_bg_path = os.path.join(public_dir, 'bg-right.jpg')

img = Image.open(right_bg_path)
w, h = img.size

clean = img.copy()

patch = clean.crop((0, int(h*0.6), int(w*0.3), h))
patch = patch.resize((int(w*0.7), int(h*0.7)))

clean.paste(patch, (int(w*0.15), int(h*0.15)))

mask = Image.new('L', clean.size, 0)
from PIL import ImageDraw
draw = ImageDraw.Draw(mask)
draw.rectangle((int(w*0.15), int(h*0.15), int(w*0.85), int(h*0.85)), fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(30))

blurred_clean = clean.filter(ImageFilter.GaussianBlur(20))

final = Image.composite(blurred_clean, img, mask)

final.save(os.path.join(public_dir, 'bg-right-clean.jpg'))
print("Cleaned new right background created.")
