import sqlite3
import os
from datetime import datetime

DB_PATH = "scans.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            repo_url  TEXT,
            repo_name TEXT,
            status    TEXT DEFAULT 'pending',
            critical  INTEGER DEFAULT 0,
            high      INTEGER DEFAULT 0,
            medium    INTEGER DEFAULT 0,
            low       INTEGER DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()
    print("Database ready.")

def save_scan(data):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO scans (repo_url, repo_name, status, critical, high, medium, low)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get("repo_url", ""),
        data.get("repo_name", ""),
        data.get("status", "pending"),
        data.get("critical", 0),
        data.get("high", 0),
        data.get("medium", 0),
        data.get("low", 0),
    ))
    scan_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return scan_id

def get_all_scans():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM scans ORDER BY timestamp DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_scan_by_id(scan_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM scans WHERE id = ?", (scan_id,)).fetchone()
    conn.close()
    return dict(row) if row else None