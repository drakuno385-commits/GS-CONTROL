from PIL import Image, ImageFilter
import os

public_dir = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/public'
right_bg_path = os.path.join(public_dir, 'bg-right.jpg')

img = Image.open(right_bg_path)
w, h = img.size

# We want to keep the building at the top (y=0 to y=int(h*0.22))
# We want to keep the left edge (x=0 to x=int(w*0.1))
# The fake form is roughly from x=int(w*0.1) to x=w, and y=int(h*0.22) to y=int(h*0.9)

# Create a clean version
clean = img.copy()

# Take a patch from the left side of the image (city buildings)
patch = clean.crop((0, int(h*0.3), int(w*0.15), int(h*0.8)))
# Resize it to cover the fake form
patch = patch.resize((int(w*0.9), int(h*0.75)))

# Paste it over the fake form
clean.paste(patch, (int(w*0.1), int(h*0.22)))

# Now blur the pasted area heavily so it looks like an out-of-focus background
mask = Image.new('L', clean.size, 0)
from PIL import ImageDraw
draw = ImageDraw.Draw(mask)
# draw a rectangle with soft edges (we'll just blur the mask)
draw.rectangle((int(w*0.1), int(h*0.22), w, int(h*0.95)), fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(30))

# Blur the entire clean image
blurred_clean = clean.filter(ImageFilter.GaussianBlur(20))

# Composite them
final = Image.composite(blurred_clean, img, mask)

# Save
final.save(os.path.join(public_dir, 'bg-right-clean.jpg'))
print("Cleaned right background created.")
