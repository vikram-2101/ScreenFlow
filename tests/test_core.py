import sys
import os
import shutil
import pytest
from datetime import datetime

# Add root folder to path so we can import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.classifier import classify_text
from app.services.content_extractor import extract_content
from app.services.filename import generate_smart_filename
from app.utils.file_ops import move_to_category, BASE_UPLOAD_DIR

# --- Test Data ---
RECEIPT_TEXT = """
Walmart Supercenter
Date: 02/14/2026
Total: $45.20
Items: Milk, Eggs, Bread
"""

TRAVEL_TEXT = """
United Airlines
Flight UA402
Departs: Denver
Date: 03/15/2026
"""

# --- Tests ---

def test_classifier_receipt():
    category, conf = classify_text(RECEIPT_TEXT)
    assert category == "Receipt"
    assert conf > 0.0

def test_classifier_travel():
    category, conf = classify_text(TRAVEL_TEXT)
    assert category == "Travel"
    assert conf > 0.0

def test_content_extraction_receipt():
    data = extract_content("Receipt", RECEIPT_TEXT)
    # The regex in content_extractor.py for amount is: r"(₹|\$|Rs\.?)\s?\d+[.,]?\d*"
    # It should capture $45.20
    assert "amount" in data
    assert data["amount"] == "$45.20"

def test_smart_filename():
    data = {"date": "2026-02-14", "merchant": "Walmart", "amount": "45.20"}
    name = generate_smart_filename("Receipt", data)
    # logic is: f"{date}_{merchant}_{amount}".strip("_")
    # sanitize("45.20") -> "45_20"
    assert name == "2026-02-14_walmart_45_20"

def test_file_ops_date_structure():
    # Setup dummy file
    test_file = "test_upload.png"
    with open(test_file, "w") as f:
        f.write("dummy content")

    try:
        # Test move with date
        target_date = "2025-12-25"
        # We need to ensure we don't mess up real uploads, so checking the path is key
        new_path = move_to_category(test_file, "Receipt", "test_receipt", date_str=target_date)
        
        # Expected path: uploads/2025/12/receipt/test_receipt.png
        # We check if the end of the path matches strict structure
        expected_suffix = os.path.join("2025", "12", "receipt", "test_receipt.png")
        assert new_path.endswith(expected_suffix)
        assert os.path.exists(new_path)

    finally:
        # Cleanup
        if os.path.exists(test_file):
            os.remove(test_file)
        
        # Cleanup the created test directory in uploads
        year_dir = os.path.join(BASE_UPLOAD_DIR, "2025")
        if os.path.exists(year_dir):
            shutil.rmtree(year_dir)
