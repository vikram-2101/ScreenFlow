from openai import OpenAI
import os
import urllib.request
import json

def gemini_classify(text: str, api_key: str) -> str:
    """Classify text using Gemini 3.5 Flash via standard HTTP request."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={api_key}"
    prompt = (
        "You are a screenshot content classifier. Read the following text extracted from a screenshot "
        "and reply with ONLY one word from these categories: Document, Receipt, Travel, Message, or Other.\n\n"
        f"Extracted Text:\n{text[:1500]}"
    )
    
    headers = {"Content-Type": "application/json"}
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.0}
    }
    
    req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"), headers=headers)
    with urllib.request.urlopen(req, timeout=10) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        result = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
        # Clean any markdown or whitespace from response
        return result.replace("`", "").strip()

def openai_classify(text: str, api_key: str) -> str:
    """Classify text using OpenAI GPT-4o-mini."""
    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a classifier. Reply with ONLY one word: "
                    "Document, Receipt, Travel, Message, or Other."
                )
            },
            {
                "role": "user",
                "content": text[:1500]
            }
        ],
        temperature=0
    )
    return response.choices[0].message.content.strip()

def llm_fallback(text: str) -> str | None:
    """
    Safe LLM fallback supporting both Gemini and OpenAI API keys.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    try:
        if gemini_key:
            return gemini_classify(text, gemini_key)
        elif openai_key:
            return openai_classify(text, openai_key)
        else:
            print("[LLM FALLBACK SKIPPED] No API keys configured in .env")
            return None
    except Exception as e:
        print(f"[LLM FALLBACK SKIPPED] Error: {e}")
        return None