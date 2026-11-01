import sys
import os
import argparse
import requests
import json

API_URL = "http://localhost:8000/api/review"

def main():
    parser = argparse.ArgumentParser(description="AI Code Reviewer CLI Security Auditor")
    parser.add_argument("file", help="Path to the source code file to audit")
    parser.add_argument("--lang", default="python", help="Programming language (default: python)")
    parser.add_argument("--fail-score", type=int, default=50, help="Exit with error code if health score falls below this threshold")
    
    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"❌ Error: File '{args.file}' not found.")
        sys.exit(1)

    with open(args.file, "r", encoding="utf-8") as f:
        code_content = f.read()

    print(f"🛡️ Auditing '{args.file}' using AI Code Reviewer API...")

    payload = {
        "code": code_content,
        "language": args.lang
    }

    try:
        response = requests.post(API_URL, json=payload)
        if response.status_code != 200:
            print(f"❌ API Error ({response.status_code}): {response.text}")
            sys.exit(1)

        result = response.json()
        score = result.get("health_score", 0)
        summary = result.get("summary", "")
        issues = result.get("issues", [])

        print(f"\n==========================================")
        print(f" 📊 AUDIT RESULTS FOR: {args.file}")
        print(f" Health Score: {score}/100")
        print(f"==========================================")
        print(f"Summary: {summary}\n")
        print(f"Issues Detected: {len(issues)}")
        for idx, issue in enumerate(issues, 1):
            print(f"  {idx}. [{issue.get('severity', 'Medium').upper()}] {issue.get('title')} (Line {issue.get('line_number')})")

        # CI/CD enforcement check
        if score < args.fail_score:
            print(f"\n❌ BUILD FAILED: Health score ({score}) is below the minimum threshold ({args.fail_score}).")
            sys.exit(1)
        else:
            print(f"\n✅ BUILD PASSED: Code passed security checks.")
            sys.exit(0)

    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the FastAPI backend. Make sure your server is running on port 8000.")
        sys.exit(1)

if __name__ == "__main__":
    main()