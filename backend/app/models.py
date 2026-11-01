from pydantic import BaseModel, Field
from typing import List, Optional

class CodeReviewRequest(BaseModel):
    code: str = Field(..., description="The code snippet or git diff to analyze")
    language: Optional[str] = Field(default="javascript", description="Programming language of the snippet")

class IssueItem(BaseModel):
    file_name: Optional[str] = Field(default="code_snippet", description="File name if applicable")
    line_number: Optional[int] = Field(default=0, description="Estimated line number of issue")
    severity: str = Field(..., description="Critical, High, Medium, or Low")
    category: str = Field(..., description="Security, Performance, Bug, or Code Style")
    title: str = Field(..., description="Short summary of the issue")
    explanation: str = Field(..., description="Detailed description of the issue")
    recommended_fix: str = Field(..., description="Code example showing how to fix it")

class CodeReviewResponse(BaseModel):
    summary: str = Field(..., description="Executive summary of the code audit")
    health_score: int = Field(..., description="Score out of 100 representing code safety and quality")
    issues: List[IssueItem] = Field(default=[], description="List of detected vulnerabilities and bugs")