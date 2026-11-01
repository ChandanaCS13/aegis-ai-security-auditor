from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, JSONResponse
from pydantic import BaseModel
from app.reviewer import analyze_code_with_gemini
from app.database import init_db, save_audit, get_all_audits, DB_FILE
from app.github import fetch_github_code, detect_language_from_url
from app.exporter import export_to_markdown
import sqlite3
import json

app = FastAPI(title="AI Code Reviewer API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

class CodeRequest(BaseModel):
    code: str
    language: str = "javascript"

class UrlRequest(BaseModel):
    url: str

@app.post("/api/review")
def review_code(req: CodeRequest):
    try:
        result = analyze_code_with_gemini(req.code, req.language)
        save_audit(
            language=req.language,
            health_score=result.get("health_score", 0),
            summary=result.get("summary", ""),
            report_data=result
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/review-url")
def review_github_url(req: UrlRequest):
    try:
        code_text = fetch_github_code(req.url)
        language = detect_language_from_url(req.url)
        result = analyze_code_with_gemini(code_text, language)
        save_audit(
            language=f"{language} (GitHub)",
            health_score=result.get("health_score", 0),
            summary=result.get("summary", ""),
            report_data=result
        )
        return {"language": language, "code": code_text, "report": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/audits")
def list_audits():
    try:
        return {"audits": get_all_audits()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/export/{audit_id}")
def export_audit(audit_id: int, format: str = "markdown"):
    """
    Exports a specific past audit by ID as either Markdown or JSON.
    Example: GET /api/export/1?format=markdown
    """
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audits WHERE id = ?", (audit_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Audit report not found.")

    report_data = json.loads(row["report_json"])
    language = row["language"]

    if format.lower() == "json":
        return JSONResponse(content=report_data)
    else:
        markdown_content = export_to_markdown(report_data, language)
        return PlainTextResponse(
            content=markdown_content,
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename=audit_report_{audit_id}.md"}
        )