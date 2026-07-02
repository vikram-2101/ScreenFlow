import pytesseract
from PIL import Image
import sys
import os

# Automatically configure Tesseract command path on Windows if present at standard location
if sys.platform.startswith("win"):
    default_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(default_path):
        pytesseract.pytesseract.tesseract_cmd = default_path

def extract_text(image_path: str) -> str:
    try:
        text = pytesseract.image_to_string(Image.open(image_path))
        return text.strip()
    except Exception as e:
        print(f"[OCR ERROR] Failed to extract text: {e}")
        return ""