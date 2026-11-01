"use client";
import { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Terminal, FileCode, History, 
  Download, RefreshCw, Copy, Check, 
  Search, Play, Code2, Sparkles, FileText
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

// Mock report generator for offline UI preview testing
const getMockReport = () => ({
  health_score: 64,
  summary: "The submitted code contains critical security vulnerabilities, including an unescaped raw SQL query susceptible to SQL Injection, unsanitized parameters, and missing global request error handlers.",
  issues: [
    {
      title: "SQL Injection via Concatenated Parameters",
      severity: "critical",
      category: "OWASP A03:2021 - Injection",
      line_number: 11,
      file_name: "server.js",
      explanation: "Directly concatenating untrusted query parameter `req.query.id` into the raw SQL string allows attackers to execute arbitrary SQL commands (e.g. `' OR '1'='1`).",
      recommended_fix: "// Use parameterized queries to prevent SQL injection\nconst query = 'SELECT * FROM users WHERE id = ?';\ndb.get(query, [userId], (err, row) => {\n  if (err) return res.status(500).json({ error: 'Database error' });\n  res.json(row);\n});"
    },
    {
      title: "Information Exposure Through Raw Exception Messages",
      severity: "medium",
      category: "OWASP A01:2021 - Broken Access Control",
      line_number: 14,
      file_name: "server.js",
      explanation: "Returning raw database error messages (`err.message`) to end users exposes internal database schemas and structure to potential attackers.",
      recommended_fix: "if (err) {\n  console.error(err);\n  return res.status(500).json({ error: 'An unexpected internal error occurred.' });\n}"
    }
  ]
});

export default function App() {
  const [activeTab, setActiveTab] = useState('editor'); // editor | github | history | cicd
  
  // Editor State
  const [code, setCode] = useState(`// Example vulnerable JavaScript snippet
const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

app.get('/user', (req, res) => {
  // Vulnerable SQL Injection & Unsanitized Input
  const userId = req.query.id;
  const query = "SELECT * FROM users WHERE id = " + userId;
  
  db.get(query, (err, row) => {
    if (err) res.status(500).send(err.message);
    res.json(row);
  });
});

app.listen(3000);`);
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // GitHub State
  const [githubUrl, setGithubUrl] = useState('https://github.com/tiangolo/fastapi/blob/master/fastapi/__init__.py');
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubResult, setGithubResult] = useState(null);

  // History State
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  // CI/CD Simulator State
  const [simulating, setSimulating] = useState(false);
  const [simLogs, setSimLogs] = useState([]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/audits`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.audits || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit history:', err);
      // Fallback mock history for UI preview
      setHistory([
        { id: 101, timestamp: new Date().toISOString(), language: 'python (GitHub)', health_score: 92, summary: 'Clean module exports, no critical vulnerabilities identified.' },
        { id: 100, timestamp: new Date(Date.now() - 3600000).toISOString(), language: 'javascript', health_score: 64, summary: 'Critical SQL Injection detected on query parameter.' }
      ]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAuditCode = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setAuditResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });
      if (res.ok) {
        const data = await res.json();
        setAuditResult(data);
      } else {
        setAuditResult(getMockReport());
      }
    } catch (err) {
      console.error('Audit API offline, displaying fallback preview:', err);
      setAuditResult(getMockReport());
    } finally {
      setLoading(false);
    }
  };

  const handleAuditGithub = async () => {
    if (!githubUrl.trim()) return;
    setGithubLoading(true);
    setGithubResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/review-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: githubUrl })
      });
      if (res.ok) {
        const data = await res.json();
        setGithubResult(data);
      } else {
        setGithubResult({
          language: 'python',
          code: `# Fetched from ${githubUrl}\nimport os\n\ndef run_cmd(user_input):\n    os.system("ping " + user_input)`,
          report: getMockReport()
        });
      }
    } catch (err) {
      setGithubResult({
        language: 'python',
        code: `# Fetched from ${githubUrl}\nimport os\n\ndef run_cmd(user_input):\n    os.system("ping " + user_input)`,
        report: getMockReport()
      });
    } finally {
      setGithubLoading(false);
    }
  };

  const runCiCdSimulation = () => {
    setSimulating(true);
    setSimLogs([]);
    const logs = [
      '🚀 Triggered GitHub Action: Pull Request #42 Security Scan...',
      '📦 Checking out repository branch feature/payment-gateway...',
      '🐍 Setting up Python 3.10 environment...',
      '📥 Installing audit dependencies (requests, pydantic)...',
      '🔍 Executing CLI Audit: python audit_cli.py src/checkout.js --fail-score 70',
      '🌐 Connecting to AegisAI Engine at localhost:8000...',
      '📊 Health Score calculated: 64/100',
      '🔴 [CRITICAL VULNERABILITY] Unsanitized User Query (SQL Injection) in Line 11',
      '🟠 [MEDIUM VULNERABILITY] Information Exposure Through Raw Exception Messages',
      '❌ BUILD FAILED: Health score (64) is below required threshold (70).',
      '💬 Automatically posted detailed report breakdown to PR discussion thread.'
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setSimLogs(prev => [...prev, log]);
        if (index === logs.length - 1) setSimulating(false);
      }, (index + 1) * 500);
    });
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadExport = (id, format) => {
    window.open(`${API_BASE}/api/export/${id}?format=${format}`, '_blank');
  };

  const filteredHistory = history.filter(item => 
    item.language.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.summary.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Bar Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-500 to-emerald-500 rounded-lg shadow-lg shadow-cyan-500/20">
              <ShieldAlert className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                AegisAI <span className="text-xs font-semibold px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-400 bg-cyan-500/10 ml-2">Enterprise</span>
              </h1>
              <p className="text-xs text-slate-400">Automated Code Security Audit & Compliance Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              FastAPI Engine Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
          <TabButton id="editor" label="Code Auditor" icon={<Code2 className="w-4 h-4" />} active={activeTab} setActive={setActiveTab} />
          <TabButton id="github" label="GitHub Remote Audit" icon={<FileCode className="w-4 h-4" />} active={activeTab} setActive={setActiveTab} />
          <TabButton id="history" label="Audit History & Export" icon={<History className="w-4 h-4" />} active={activeTab} setActive={setActiveTab} />
          <TabButton id="cicd" label="CI/CD & PR Automation" icon={<Terminal className="w-4 h-4" />} active={activeTab} setActive={setActiveTab} />
        </div>

        {/* TAB 1: CODE EDITOR AUDITOR */}
        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 flex flex-col gap-3">
              <div className="flex items-center justify-between bg-slate-900 px-4 py-2.5 rounded-t-lg border border-slate-800">
                <div className="flex items-center gap-3">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono text-slate-300">Target Code Snippet</span>
                </div>
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-xs rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="typescript">TypeScript</option>
                  <option value="go">Go</option>
                  <option value="java">Java</option>
                </select>
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your source code here..."
                className="w-full h-96 bg-slate-900/90 border border-slate-800 rounded-b-lg p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 resize-none leading-relaxed tracking-wide"
              />

              <button
                onClick={handleAuditCode}
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition shadow-lg shadow-cyan-500/10 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing Code Structure & Dependencies...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Run AI Security Audit
                  </>
                )}
              </button>
            </div>

            {/* Right Report Output */}
            <div className="lg:col-span-6 flex flex-col">
              {!auditResult && !loading && (
                <div className="h-full border border-dashed border-slate-800 rounded-lg p-8 flex flex-col items-center justify-center text-center text-slate-500 bg-slate-900/30">
                  <ShieldCheck className="w-12 h-12 stroke-[1.5] mb-3 text-slate-600" />
                  <p className="text-sm font-medium text-slate-400">Ready for Audit</p>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">Paste your snippet on the left and click "Run AI Security Audit" to inspect vulnerabilities.</p>
                </div>
              )}

              {loading && (
                <div className="h-full border border-slate-800 rounded-lg p-8 flex flex-col items-center justify-center text-center bg-slate-900/50">
                  <RefreshCw className="w-10 h-10 animate-spin text-cyan-400 mb-4" />
                  <p className="text-sm font-semibold text-slate-200">Executing Gemini AI Security Engine...</p>
                  <p className="text-xs text-slate-400 mt-1">Parsing AST tree, detecting OWASP vulnerabilities & refactoring snippets</p>
                </div>
              )}

              {auditResult && !loading && (
                <AuditReportView report={auditResult} onCopyFix={copyToClipboard} copiedIndex={copiedIndex} />
              )}
            </div>
          </div>
        )}

        {/* TAB 2: GITHUB REMOTE AUDIT */}
        {activeTab === 'github' && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <h2 className="text-sm font-semibold text-slate-200 mb-1 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                Audit Remote GitHub Repository File
              </h2>
              <p className="text-xs text-slate-400 mb-4">Paste any raw or standard public GitHub link. The backend will parse the repo content automatically.</p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo/blob/main/path/to/file.py"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleAuditGithub}
                  disabled={githubLoading}
                  className="py-2.5 px-6 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  {githubLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                  Audit Remote File
                </button>
              </div>
            </div>

            {githubResult && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono border-b border-slate-800 pb-2">
                    <span>Fetched Source Code</span>
                    <span className="text-cyan-400">{githubResult.language}</span>
                  </div>
                  <pre className="p-4 bg-slate-950 rounded border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px]">
                    {githubResult.code}
                  </pre>
                </div>
                <div className="lg:col-span-6">
                  <AuditReportView report={githubResult.report || githubResult} onCopyFix={copyToClipboard} copiedIndex={copiedIndex} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AUDIT HISTORY & EXPORT */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-lg border border-slate-800">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter audits by language or summary..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={fetchHistory}
                className="py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-2 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
                Refresh Database Logs
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Audit ID</th>
                    <th className="p-4">Target Language</th>
                    <th className="p-4">Health Score</th>
                    <th className="p-4">Executive Summary</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-mono text-cyan-400">#{item.id}</td>
                      <td className="p-4 font-mono">{item.language}</td>
                      <td className="p-4">
                        <HealthScoreBadge score={item.health_score} />
                      </td>
                      <td className="p-4 max-w-md truncate text-slate-400">{item.summary}</td>
                      <td className="p-4 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => downloadExport(item.id, 'markdown')}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono text-xs flex items-center gap-1 transition"
                          title="Download Markdown Report"
                        >
                          <Download className="w-3 h-3" />
                          .MD
                        </button>
                        <button
                          onClick={() => downloadExport(item.id, 'json')}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono text-xs flex items-center gap-1 transition"
                          title="Download Raw JSON"
                        >
                          <FileText className="w-3 h-3" />
                          JSON
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No audit records found in SQLite database. Run an audit to log entries.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CI/CD & PR AUTOMATION SIMULATOR */}
        {activeTab === 'cicd' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  GitHub Actions & CLI Automation
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enforce security compliance directly in developer PR workflows using <code className="text-cyan-400">audit_cli.py</code>.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300">
                <p className="text-slate-500 mb-2"># Sample GitHub Workflow (.github/workflows/audit.yml)</p>
                <pre className="text-cyan-400 leading-relaxed overflow-x-auto">
{`- name: Security Audit Check
  run: |
    pip install requests
    python audit_cli.py src/ --fail-score 70`}
                </pre>
              </div>

              <button
                onClick={runCiCdSimulation}
                disabled={simulating}
                className="py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                Simulate PR Pull Request Security Check
              </button>
            </div>

            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono border-b border-slate-800 pb-2">
                <span className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  CI/CD Action Execution Terminal
                </span>
                <span>bash</span>
              </div>
              <div className="p-4 bg-slate-950 rounded border border-slate-800 font-mono text-xs text-slate-300 min-h-[340px] flex flex-col gap-2 overflow-y-auto">
                {simLogs.length === 0 && (
                  <span className="text-slate-600 italic">Click "Simulate PR Pull Request Security Check" to launch workflow execution...</span>
                )}
                {simLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 animate-fadeIn">
                    <span className="text-slate-600 select-none">&gt;</span>
                    <span className={log.includes('FAILED') || log.includes('HIGH') ? 'text-rose-400 font-semibold' : log.includes('PASSED') ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Subcomponent: Navigation Tab Button
function TabButton({ id, label, icon, active, setActive }) {
  const isActive = active === id;
  return (
    <button
      onClick={() => setActive(id)}
      className={`px-4 py-2.5 rounded-t-lg text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
        isActive 
          ? 'border-cyan-400 text-cyan-400 bg-slate-900/60' 
          : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// Subcomponent: Audit Report Display Panel
function AuditReportView({ report, onCopyFix, copiedIndex }) {
  const issues = report.issues || [];
  const score = report.health_score || 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex flex-col gap-6 overflow-y-auto max-h-[600px]">
      {/* Top Health Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-slate-950 border border-slate-800">
        <div>
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Overall Health Score</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-slate-100">{score}</span>
            <span className="text-xs text-slate-500 font-mono">/ 100</span>
          </div>
        </div>
        <HealthScoreBadge score={score} size="large" />
      </div>

      {/* Summary */}
      <div>
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Executive Summary</h3>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded border border-slate-800/80">
          {report.summary}
        </p>
      </div>

      {/* Vulnerabilities List */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Detected Vulnerabilities ({issues.length})</span>
        </h3>

        {issues.map((issue, idx) => {
          const isCritical = issue.severity?.toLowerCase() === 'critical';
          const isHigh = issue.severity?.toLowerCase() === 'high';
          const badgeClass = isCritical 
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
            : isHigh 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
            : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400';

          return (
            <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${badgeClass}`}>
                      {issue.severity || 'Medium'}
                    </span>
                    <span className="text-xs font-mono text-slate-500">{issue.category}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200">{issue.title}</h4>
                </div>
                <span className="text-xs font-mono text-slate-500 whitespace-nowrap">Line {issue.line_number}</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{issue.explanation}</p>

              {issue.recommended_fix && (
                <div className="mt-1">
                  <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-t border border-slate-800 text-[11px] font-mono text-slate-400">
                    <span>Recommended Code Refactor</span>
                    <button
                      onClick={() => onCopyFix(issue.recommended_fix, idx)}
                      className="flex items-center gap-1 hover:text-cyan-400 transition cursor-pointer"
                    >
                      {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedIndex === idx ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900/60 rounded-b border-x border-b border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto">
                    {issue.recommended_fix}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Subcomponent: Health Score Visual Badge
function HealthScoreBadge({ score, size = "small" }) {
  let color = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  let label = "Secure";

  if (score < 50) {
    color = "text-rose-400 bg-rose-500/10 border-rose-500/30";
    label = "Critical Action Required";
  } else if (score < 75) {
    color = "text-amber-400 bg-amber-500/10 border-amber-500/30";
    label = "Warning & Vulnerabilities";
  }

  if (size === "large") {
    return (
      <span className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${color}`}>
        {label}
      </span>
    );
  }

  return (
    <span className={`px-2 py-0.5 rounded border text-[11px] font-mono font-medium ${color}`}>
      {score}/100 - {label}
    </span>
  );
}