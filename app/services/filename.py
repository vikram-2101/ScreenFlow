import re
from datetime import datetime


def sanitize(value: str) -> str:
    """Converts a string to a safe filename component."""
    return re.sub(r"[^a-zA-Z0-9_-]", "_", value.strip()).strip("_")


def generate_smart_filename(category: str, data: dict) -> str:
    """
    Generates a smart filename from Gemini-extracted metadata.
    Format: YYYY-MM-DD_<sanitized_title>
    Falls back to category name if title is missing.
    """
    date = data.get("date") or datetime.now().strftime("%Y-%m-%d")
    title = data.get("title") or category or "screenshot"
    return f"{date}_{sanitize(title)}"