# import re

# def classify_text(text: str) -> str:
#     t = text.lower()

#     # STRONG document indicators
#     document_keywords = [
#         "resume", "curriculum vitae", "experience",
#         "skills", "education", "projects",
#         "developer", "engineer", "email:", "position"
#     ]

#     # Receipt indicators
#     receipt_keywords = [
#         "invoice", "subtotal", "gst", "tax",
#         "total amount", "paid", "₹", "$", "rs."
#     ]

#     # Travel indicators
#     travel_keywords = [
#         "flight", "pnr", "boarding", "gate",
#         "departure", "arrival", "ticket",
#         "hotel", "check-in"
#     ]

#     # Message indicators
#     message_patterns = [
#         r"\b\d{1,2}:\d{2}\b",
#         "seen", "delivered", "typing", "online"
#     ]

#     # ---- ORDER IS CRITICAL ----

#     if any(k in t for k in document_keywords):
#         return "Document"

#     if any(k in t for k in travel_keywords):
#         return "Travel"

#     if any(re.search(p, t) for p in message_patterns):
#         return "Message"

#     if any(k in t for k in receipt_keywords):
#         return "Receipt"

#     return "Other"
from collections import defaultdict

def classify_text(text: str):
    t = text.lower()
    scores = defaultdict(int)

    rules = {
        "Document": [
            ("resume", 5), ("skills", 3), ("experience", 3), ("email:", 4),
            ("cv", 5), ("curriculum vitae", 5), ("education", 3), ("projects", 3),
            ("patient", 5), ("report", 3), ("medical", 4), ("doctor", 4),
            ("hospital", 4), ("clinical", 4), ("test", 3), ("diagnosis", 4),
            ("prescription", 4)
        ],
        "Receipt": [("invoice", 5), ("total", 3), ("gst", 4), ("₹", 4)],
        "Travel": [("flight", 5), ("pnr", 5), ("boarding", 4)],
        "Message": [("seen", 2), ("delivered", 2), ("online", 2)],
    }

    for category, patterns in rules.items():
        for keyword, weight in patterns:
            scores[category] += t.count(keyword) * weight

    if not scores:
        return "Other", 0.0

    best = max(scores, key=scores.get)
    total = sum(scores.values())

    confidence = round(scores[best] / total, 2) if total else 0.0

    if confidence < 0.4:
        return "Other", confidence

    return best, confidence