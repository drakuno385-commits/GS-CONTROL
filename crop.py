from PIL import Image
import os

img_path = 'C:/Users/User/.gemini/antigravity/brain/3219dbd4-04fc-4fa6-ab9b-50e39d10ebe8/executive_login_mockup_gsolimpio_tech_1789065872279.jpg'
public_dir = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/public'

if not os.path.exists(public_dir):
    os.makedirs(public_dir)

img = Image.open(img_path)
w, h = img.size

# Left half
left_crop = img.crop((0, 0, w//2, h))
left_crop.save(os.path.join(public_dir, 'bg-left.jpg'))

# Right half
right_crop = img.crop((w//2, 0, w, h))
right_crop.save(os.path.join(public_dir, 'bg-right.jpg'))

print("Images cropped and saved successfully.")
