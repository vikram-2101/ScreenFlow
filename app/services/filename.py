# app/services/filename.py
#
# Builds a human-readable, filesystem-safe filename from Gemini-extracted metadata.
#
# Pattern: YYYY-MM-DD_Category_Title
# Example: 2026-07-04_Resume_Vikram_Kumar
#          2026-03-15_Invoice_Stripe
#          2026-01-20_Marksheet_CBSE_2024
#
# The file extension is NOT included here — the caller (move_to_category)
# preserves the original extension from the uploaded file.

import re
from datetime import datetime


def generate_smart_filename(metadata: dict, extension: str = "") -> str:
    title = _sanitize(metadata.get("title", ""))
    date_str = metadata.get("date")
    category = metadata.get("category", "Other")

    # Categories where date is meaningful as a suffix
    DATE_RELEVANT = {"Invoice", "Receipt", "Medical_Report", "Marksheet", "Certificate"}

    if not title:
        title = _sanitize(category)

    if date_str and category in DATE_RELEVANT:
        resolved = _resolve_date(date_str)
        name = f"{title}_{resolved}"
    else:
        name = title

    return name + extension


def _resolve_date(date_val: str | None) -> str:
    """
    Normalize a date value to YYYY-MM-DD.
    Falls back to today's date if the value is absent or unparseable.
    """
    if not date_val:
        return datetime.now().strftime("%Y-%m-%d")

    # Already correct format
    if re.match(r"^\d{4}-\d{2}-\d{2}$", str(date_val)):
        return date_val

    # Try common alternate formats Gemini might return
    for fmt in ("%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(date_val, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue

    return datetime.now().strftime("%Y-%m-%d")


def _sanitize(value: str) -> str:
    """Replace non-alphanumeric characters with underscores; collapse runs."""
    if not value:
        return ""
    value = re.sub(r"[^\w\-]", "_", value)
    value = re.sub(r"_+", "_", value).strip("_")
    return value