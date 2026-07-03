import os
import re
import json
import urllib.request
from datetime import datetime
from app.services.classifier import classify_text


def extract_content(category: str, text: str, user_categories: list[str] = None) -> dict:
    """
    Primary entry point. Tries Gemini first for full metadata extraction,
    falls back to smart regex+classifier on failure.
    """
    if not text:
        return {}

    gemini_key = os.getenv("GEMINI_API_KEY")

    if gemini_key:
        try:
            llm_result = gemini_extract_full(text, gemini_key, user_categories)
            if llm_result:
                return llm_result
        except Exception as e:
            print(f"[LLM Extraction Error] {e}. Falling back to classifier + regex.")

    # Fallback: run rule-based classifier first, then extract with regex
    detected_category, confidence = classify_text(text)
    return _regex_fallback(detected_category.lower(), text, confidence)


def gemini_extract_full(text: str, api_key: str, user_categories: list[str] = None) -> dict:
    """
    Single Gemini call that returns complete, structured metadata:
    category, subcategory, title, summary, tags, confidence, date.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

    # Trim text to keep the prompt tight and avoid timeouts
    trimmed = text[:1500]

    categories_prompt = ""
    if user_categories:
        categories_prompt = f"Choose the most appropriate category from this list: {json.dumps(user_categories)}. If none of them fit perfectly, you may suggest a concise new category name.\n\n"
    else:
        categories_prompt = "Assign a concise category name (e.g., document, receipt, travel, message, code, social).\n\n"

    prompt = (
        "You are a structured metadata extractor for screenshots.\n"
        "Analyse the following OCR text and return ONLY a raw JSON object (no markdown, no fences).\n\n"
        f"{categories_prompt}"
        "JSON format:\n"
        '{"category":"category name",'
        '"subcategory":"e.g. resume/invoice/flight/whatsapp",'
        '"title":"concise title max 6 words",'
        '"summary":"one sentence",'
        '"tags":["tag1","tag2"],'
        '"confidence":0.95,'
        '"date":"YYYY-MM-DD or null"}\n\n'
        f"OCR Text:\n{trimmed}"
    )

    headers = {"Content-Type": "application/json"}
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.0}
    }

    req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"), headers=headers)
    with urllib.request.urlopen(req, timeout=20) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        result_text = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
        result_text = re.sub(r"^```(?:json)?\s*", "", result_text)
        result_text = re.sub(r"\s*```$", "", result_text)
        return json.loads(result_text)


def _regex_fallback(category: str, text: str, confidence: float = 0.0) -> dict:
    """
    Smart fallback when Gemini is unavailable.
    Uses the rule-based classifier result passed in, then extracts
    category-appropriate fields with regex.
    """
    result = {
        "category": category,
        "subcategory": category,
        "confidence": confidence,
        "tags": [],
        "summary": "",
        "date": _extract_date(text),
    }

    if category == "receipt":
        result["subcategory"] = "receipt"
        merchant = _extract_merchant(text)
        amount = _extract_amount(text)
        result["title"] = f"Receipt {merchant}" if merchant else "receipt"
        if amount:
            result["title"] += f" {amount}"
        result["tags"] = ["receipt", "payment"]

    elif category == "travel":
        result["subcategory"] = "travel"
        location = _extract_location(text)
        result["title"] = f"Travel {location}" if location else "travel booking"
        result["tags"] = ["travel"]

    elif category == "document":
        result["subcategory"] = "document"
        # Try to find a meaningful heading — skip short/empty lines
        title = _extract_meaningful_line(text)
        result["title"] = title or "document"
        result["tags"] = ["document"]

    elif category == "message":
        result["subcategory"] = "message"
        sender = _extract_sender(text)
        result["title"] = f"Message from {sender}" if sender else "message"
        result["tags"] = ["message", "chat"]

    else:
        result["title"] = _extract_meaningful_line(text) or "screenshot"

    return result


# --- Regex helpers ---

def _extract_date(text: str):
    # Try multiple date formats
    patterns = [
        r"\b(\d{1,2}\s+\w+\s+\d{4})\b",   # "13 January 2026"
        r"\b(\d{4}-\d{2}-\d{2})\b",         # "2026-01-13"
        r"\b(\d{2}/\d{2}/\d{4})\b",         # "13/01/2026"
    ]
    for p in patterns:
        m = re.search(p, text)
        if m:
            raw = m.group(1)
            # Parse "13 January 2026" → "2026-01-13"
            try:
                for fmt in ("%d %B %Y", "%d %b %Y", "%Y-%m-%d", "%d/%m/%Y"):
                    try:
                        return datetime.strptime(raw, fmt).strftime("%Y-%m-%d")
                    except ValueError:
                        continue
            except Exception:
                return raw
    return None

def _extract_amount(text: str):
    match = re.search(r"(₹|\$|Rs\.?)\s?\d[\d,]*", text)
    return match.group(0).replace(" ", "") if match else None

def _extract_merchant(text: str):
    # Look for common receipt identifiers - university/company name in first few lines
    lines = [l.strip() for l in text.splitlines() if len(l.strip()) > 3]
    return lines[0][:40] if lines else None

def _extract_meaningful_line(text: str) -> str:
    """Return the first non-trivial line (length > 5, not just numbers/symbols)."""
    for line in text.splitlines():
        line = line.strip()
        if len(line) > 5 and re.search(r"[a-zA-Z]", line):
            return line[:50]
    return ""

def _extract_location(text: str):
    match = re.search(
        r"\b(Delhi|Mumbai|Bangalore|Bengaluru|Chennai|Pune|Hyderabad|Kolkata|Jaipur)\b",
        text, re.I
    )
    return match.group(0) if match else None

def _extract_sender(text: str):
    match = re.search(r"From:\s*(.*)", text)
    return match.group(1).strip() if match else None