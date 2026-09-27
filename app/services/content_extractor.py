# app/services/content_extractor.py

import json
import re
from datetime import datetime
from typing import Literal
from pydantic import BaseModel

from google import genai
from google.genai import types
from PIL import Image
import io

from app.core.config import settings
from app.services.classifier import classify_text

GEMINI_MODEL = "gemini-2.5-flash"

_client: genai.Client | None = None

def _get_client() -> genai.Client:
    global _client
    if _client is None:
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY not set")
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


# ── Schema — only what the filename pipeline actually needs ──────────────────
# Summary, tags, subcategory are excluded deliberately — they're open-ended
# text that bloats the response unpredictably. Generate them lazily if needed.

class ScreenshotMetadata(BaseModel):
    title: str        # filesystem-safe, underscores only
    category: Literal[
        "Resume", "Marksheet", "Invoice", "Receipt",
        "Medical_Report", "Landing_Page", "Article",
        "Code", "Chat", "Certificate", "Other","Web_Page"
    ]
    date: str | None  # YYYY-MM-DD or null


# ── Prompt — short and unambiguous ───────────────────────────────────────────

VISION_PROMPT = """Analyze this screenshot. Return title, category, and date.

title rules (follow strictly):
- 2-5 words, underscores only, no spaces, no special characters
- NEVER use generic words: Screenshot, Image, Document, File, Capture
- Resume        → candidate full name + Resume (e.g. Vikram_Kumar_Resume)
- Marksheet     → board + year (e.g. CBSE_2020_Marksheet)
- Invoice       → vendor + Invoice (e.g. Stripe_Invoice)
- Receipt       → merchant + amount if visible (e.g. Swiggy_Receipt_349)
- Medical_Report → hospital + report type (e.g. Apollo_Blood_Test)
 
- Landing_Page  → brand name (e.g. Notion_Landing_Page)
- Certificate   → issuer + type (e.g. Coursera_Python_Certificate)
- Other         → most identifying words visible (e.g. OryxT_Task_List)

date: exact date visible in the document as YYYY-MM-DD, or null if none found."""


# ── Public entry point ───────────────────────────────────────────────────────

def extract_content(
    file_path: str,
    ocr_text: str = "",
    user_categories: list[str] | None = None,
) -> dict:
    result = _extract_with_vision(file_path)

    if not result and ocr_text:
        result = _extract_with_text(ocr_text)

    if not result:
        result = _regex_fallback(ocr_text, file_path)

    return result


# ── Gemini Vision (primary) ──────────────────────────────────────────────────

def _extract_with_vision(file_path: str) -> dict | None:
    try:
        client = _get_client()
        img = _prepare_image(file_path)
        if img is None:
            return None

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        image_bytes = buf.getvalue()

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                types.Part.from_text(text=VISION_PROMPT),
            ],
            config=types.GenerateContentConfig(
                temperature=0.0,
                response_mime_type="application/json",
                response_schema=ScreenshotMetadata,
            ),
        )

        data = json.loads(response.text)
        data["extraction_method"] = "gemini_vision"
        return _normalize(data)

    except Exception as e:
        if "429" in str(e) or "quota" in str(e).lower():
            raise
        print(f"[content_extractor] Vision extraction failed: {e}")
        return None


# ── Gemini Text (fallback) ───────────────────────────────────────────────────

def _extract_with_text(ocr_text: str) -> dict | None:
    try:
        client = _get_client()
        prompt = f"{VISION_PROMPT}\n\nOCR TEXT (image unavailable):\n{ocr_text[:3000]}"

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.0,
                response_mime_type="application/json",
                response_schema=ScreenshotMetadata,
            ),
        )

        data = json.loads(response.text)
        data["extraction_method"] = "gemini_text"
        return _normalize(data)

    except Exception as e:
        if "429" in str(e) or "quota" in str(e).lower():
            raise
        print(f"[content_extractor] Text extraction failed: {e}")
        return None


# ── Regex fallback ───────────────────────────────────────────────────────────

def _regex_fallback(ocr_text: str, file_path: str) -> dict:
    detected_category, confidence = classify_text(ocr_text)
    date_str = _extract_date(ocr_text)
    title = _extract_meaningful_line(ocr_text) or detected_category or "Screenshot"

    return {
        "title": _sanitize_title(title[:50]),
        "category": detected_category,
        "date": date_str,
        "confidence": round(confidence, 2),
        "extraction_method": "regex_fallback",
    }


# ── Image preparation ────────────────────────────────────────────────────────

def _prepare_image(file_path: str) -> Image.Image | None:
    try:
        img = Image.open(file_path).convert("RGB")
        if img.width > 1000:
            ratio = 1000 / img.width
            img = img.resize((1000, int(img.height * ratio)), Image.LANCZOS)
        return img
    except Exception as e:
        print(f"[content_extractor] Could not load image {file_path}: {e}")
        return None


# ── Normalization ────────────────────────────────────────────────────────────

def _normalize(data: dict) -> dict:
    data.setdefault("title", "Screenshot")
    data.setdefault("category", "Other")
    data.setdefault("date", None)
    data["title"] = _sanitize_title(data["title"])
    return data


def _sanitize_title(title: str) -> str:
    title = re.sub(r"[^\w\-]", "_", title)
    title = re.sub(r"_+", "_", title).strip("_")
    return title or "Screenshot"


# ── Date helpers ─────────────────────────────────────────────────────────────

def _extract_date(text: str) -> str | None:
    patterns = [
        r"\b(\d{4}-\d{2}-\d{2})\b",
        r"\b(\d{2}/\d{2}/\d{4})\b",
        r"\b(\d{1,2}\s+\w+\s+\d{4})\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            raw = match.group(1)
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d %B %Y", "%d %b %Y"):
                try:
                    return datetime.strptime(raw, fmt).strftime("%Y-%m-%d")
                except ValueError:
                    continue
    return None


def _extract_meaningful_line(text: str) -> str:
    for line in text.splitlines():
        line = line.strip()
        if len(line) > 5 and re.search(r"[a-zA-Z]", line):
            return line[:50]
    return ""