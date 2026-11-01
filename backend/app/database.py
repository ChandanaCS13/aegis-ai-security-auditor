import sqlite3
import json
from datetime import datetime

DB_FILE = "audits.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            language TEXT,
            health_score INTEGER,
            summary TEXT,
            report_json TEXT
        )
    ''')
    conn.commit()
    conn.close()

def save_audit(language: str, health_score: int, summary: str, report_data: dict):
    init_db()
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    timestamp = datetime.now().isoformat()
    report_json = json.dumps(report_data)
    
    cursor.execute('''
        INSERT INTO audits (timestamp, language, health_score, summary, report_json)
        VALUES (?, ?, ?, ?, ?)
    ''', (timestamp, language, health_score, summary, report_json))
    
    conn.commit()
    audit_id = cursor.lastrowid
    conn.close()
    return audit_id

def get_all_audits():
    init_db()
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT id, timestamp, language, health_score, summary FROM audits ORDER BY id DESC LIMIT 20')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]