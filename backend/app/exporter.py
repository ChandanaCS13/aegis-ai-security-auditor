import json

def export_to_markdown(report_data: dict, language: str = "Unknown") -> str:
    """
    Converts a JSON audit report into a clean, professional Markdown document.
    """
    health_score = report_data.get("health_score", 0)
    summary = report_data.get("summary", "No summary provided.")
    issues = report_data.get("issues", [])

    md = f"# 🛡️ AI Security Audit Report\n\n"
    md += f"- **Target Language:** {language}\n"
    md += f"- **Health Score:** `{health_score}/100`\n\n"
    md += f"## Executive Summary\n{summary}\n\n"
    md += f"---\n\n## 🔍 Vulnerabilities & Issues Found ({len(issues)})\n\n"

    if not issues:
        md += "✅ No major security or code quality issues found!\n"
    else:
        for idx, issue in enumerate(issues, 1):
            severity = issue.get("severity", "Medium")
            title = issue.get("title", "Issue")
            category = issue.get("category", "General")
            line = issue.get("line_number", "N/A")
            file_name = issue.get("file_name", "snippet")
            explanation = issue.get("explanation", "")
            fix = issue.get("recommended_fix", "")

            # Badge styling based on severity
            emoji = "🔴" if severity.lower() == "critical" else "🟠" if severity.lower() == "high" else "🟡"

            md += f"### {idx}. {emoji} [{severity.upper()}] {title}\n"
            md += f"- **Category:** {category}\n"
            md += f"- **Location:** File: `{file_name}`, Line: `{line}`\n\n"
            md += f"**Explanation:**\n{explanation}\n\n"
            md += f"**Recommended Fix:**\n```python\n{fix}\n```\n\n"
            md += "---\n\n"

    return md