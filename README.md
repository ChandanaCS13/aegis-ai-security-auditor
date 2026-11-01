# 🛡️ AegisAI Enterprise Security Auditor

**Automated Code Security Audit & Compliance Engine**

AegisAI Enterprise is a production-ready AI security platform designed to audit code snippets and public GitHub repositories for security vulnerabilities, software bugs, and compliance risks. Powered by a Next.js frontend, FastAPI backend, SQLite database, and Google Gemini AI, it provides actionable code remediations, vulnerability metrics, health scores, and automated CI/CD pull request scanning.

---

## 🏛️ System Architecture

AegisAI Enterprise follows a modern microservice-inspired modular architecture that decouples the frontend user interface, backend processing engine, local persistence storage, and AI analysis core.

┌────────────────────────────────────────────────────────────────────────┐
│                          NEXT.JS FRONTEND (UI)                         │
│  ┌───────────────────────┬──────────────────────┬───────────────────┐  │
│  │   Snippet Auditor     │   GitHub Repo Scan   │  Audit Analytics  │  │
│  └───────────────────────┴──────────────────────┴───────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
│ HTTP / REST API (Port 8000)
┌───────────────────────────────────▼────────────────────────────────────┐
│                           FASTAPI BACKEND                              │
│  ┌─────────────────────────┬───────────────────┬────────────────────┐  │
│  │    APIs & Controllers   │  SQLite (app.db)  │  GitHub Scanner    │  │
│  │ (/api/review, /audits)  │   Audit History   │  Raw URL Fetcher   │  │
│  └─────────────────────────┴─────────┬─────────┴────────────────────┘  │
└──────────────────────────────────────┼─────────────────────────────────┘
│ Async Prompt / Analysis Engine
▼
┌──────────────────────────┐
│   Gemini AI API Engine   │
└──────────────────────────┘


---

### 🔍 System Components & Responsibilities

#### 1. Frontend Layer (`Next.js + Tailwind CSS`)
* **Interactive Security Audit Dashboard**: Built with Next.js App Router and styled using Tailwind CSS for real-time security reporting.
* **Code Editor & Snippet Scanner**: Supports pasting snippets with auto-detected line counts, programming languages, and direct AI analysis.
* **Vulnerability & Diff Viewer**: Displays calculated security health scores (0–100), categorized threat findings (Critical, High, Medium, Low), and proposed code diff remediation blocks with copy-to-clipboard actions.
* **Audit History & Compliance Dashboard**: Fetches audit records stored in SQLite with full Markdown and JSON report export capabilities.

#### 2. Backend API Engine (`FastAPI`)
* **`POST /api/review`**: Accepts code snippets and target language, orchestrates the Gemini AI prompt chain, parses structured vulnerability output, and persists audit logs.
* **`POST /api/review-url`**: Parses public GitHub repository URLs, downloads raw code files remotely, and executes full security reviews without requiring local clones.
* **`GET /api/audits` & `GET /api/audits/{id}`**: Exposes history logs and detailed vulnerability metadata for client-side analytics.
* **`GET /api/export/{id}`**: Generates formatted downloadable compliance reports in Markdown and JSON formats.

#### 3. AI Security Core (`Google Gemini API`)
* Analyzes source code against standard cybersecurity frameworks (OWASP Top 10, CWE).
* Generates structured output containing:
  * Overall repository/file health score.
  * Line-by-line vulnerability mappings.
  * Executive summaries and actionable diff remedies.

#### 4. Persistence Storage (`SQLite`)
* Lightweight relational persistence storing complete historical records of performed audits, code diffs, vulnerability severities, and timestamps (`app.db`).

#### 5. CI/CD & Automation (`audit_cli.py`)
* Command-line utility for automated file scanning during continuous integration (e.g., GitHub Actions PR checks), enforcing non-zero exit codes when critical security threats are found.

---

### 🔄 Data Flow Summary

1. **User Action / CI Event**: Code snippet or GitHub file URL submitted via the Next.js Dashboard or `audit_cli.py`.
2. **Backend Processing**: FastAPI processes the payload, cleans parameters, and constructs the auditing prompt schema.
3. **AI Analysis**: Payload is transmitted to Gemini AI; structured JSON containing scores, vulnerabilities, and code fixes is returned.
4. **Persistence**: FastAPI writes audit metadata, vulnerability findings, and code diff fixes into SQLite (`app.db`).
5. **UI Rendering**: Next.js updates the dashboard asynchronously with gauges, vulnerability badges, diff blocks, and export buttons.

---

## ⚡ Quickstart Guide

### Prerequisites
* **Python**: `v3.10+`
* **Node.js**: `v18+`
* **Gemini API Key**: Obtainable from Google AI Studio.

---

### 1. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv

# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment configuration file (.env)
echo "GEMINI_API_KEY=your_actual_api_key_here" > .env

# Start FastAPI server
python -m uvicorn app.main:app --reload --port 8000
2. Frontend Setup (Next.js)
Bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install Node modules
npm install

# Run dev server
npm run dev
Open http://localhost:3000 in your browser to access the dashboard.

🤖 GitHub Actions CI/CD Integration
To run automated AI security checks on Pull Requests, add .github/workflows/audit.yml to your repository:

YAML
name: AegisAI Automated Security Check

on:
  pull_request:
    branches: [ main ]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install Dependencies
        run: |
          python -m pip install --upgrade pip
          pip install requests google-genai pydantic

      - name: Run AegisAI CLI Audit
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: |
          python audit_cli.py --path ./src --fail-on critical