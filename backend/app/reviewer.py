import os
import json
import time
from google import genai
from google.genai import types
from dotenv import load_dotenv
from app.models import CodeReviewResponse

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

SYSTEM_INSTRUCTION = """
You are an expert Principal Software Security Engineer and Code Reviewer.
Your role is to strictly analyze code snippets or git diffs for:
1. Security vulnerabilities (OWASP Top 10, XSS, SQL Injection, Hardcoded Secrets, etc.)
2. Performance bottlenecks and memory leaks
3. Bugs, logic errors, and edge-case failures
4. Modern clean code practices

Always respond with valid JSON adhering strictly to the requested schema.
Be constructive, concise, and provide realistic fix suggestions.
"""

def analyze_code_with_gemini(code_text: str, language: str = "javascript") -> dict:
    if not client:
        raise ValueError("GEMINI_API_KEY is missing. Check your backend .env file.")

    prompt = f"""
    Perform a complete security and code quality review on the following {language} code snippet:

    ```{language}
    {code_text}
    ```
    """

    # List of stable production models to try in sequence
    models_to_try = [
        "gemini-3.8-flash",
        "gemini-2.5-flash",
        "gemini-1.5-flash"
    ]

    last_error = None

    for model_name in models_to_try:
        # Retry up to 2 times per model if a temporary 503 traffic spike occurs
        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_INSTRUCTION,
                        response_mime_type="application/json",
                        response_schema=CodeReviewResponse,
                        temperature=0.2,
                    ),
                )
                return json.loads(response.text)
            except Exception as e:
                last_error = e
                err_str = str(e)
                print(f"⚠️ Model '{model_name}' attempt {attempt+1} encountered an issue: {e}")
                
                # If Google reports high demand (503), wait 2 seconds and retry
                if "503" in err_str or "UNAVAILABLE" in err_str:
                    time.sleep(2)
                    continue
                else:
                    # For other types of errors, skip immediately to the next fallback model
                    break

    raise RuntimeError(f"All Gemini models are temporarily overloaded or unavailable. Last error: {last_error}")