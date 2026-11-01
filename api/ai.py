from http.server import BaseHTTPRequestHandler
import json
import re

CATEGORY_KEYWORDS = {
    "IT & Network Services": ["wifi", "wi-fi", "internet", "network", "login", "portal", "password", "server", "canvas", "moodle", "lan", "ethernet", "printer", "computer", "eduroam"],
    "Maintenance & Facilities": ["water", "leak", "pipe", "toilet", "washroom", "plumbing", "electric", "power", "fan", "ac", "cooling", "switch", "light", "lift", "elevator", "broken", "window", "door", "bench"],
    "Hostel & Housing": ["hostel", "room", "dorm", "warden", "roommate", "bed", "mattress", "curfew", "laundry", "hot water", "geyser", "cooler"],
    "Academic Affairs": ["exam", "grade", "marks", "professor", "attendance", "transcript", "registration", "course", "credit", "hall ticket", "admit card", "faculty", "syllabus", "mid-term"],
    "Finance & Accounts": ["fee", "fees", "tuition", "scholarship", "refund", "payment", "receipt", "dues", "fine", "bank", "challan"],
    "Library & Learning Resources": ["library", "book", "books", "borrow", "journal", "reading room", "librarian", "ieee", "database"],
    "Campus Security": ["security", "guard", "theft", "stolen", "lost", "harassment", "id card", "gate", "parking", "cctv", "threat", "emergency exit"],
    "Cafeteria & Dining": ["canteen", "cafeteria", "mess", "food", "hygiene", "meal", "lunch", "dinner", "cockroach", "insects", "dining"]
}

URGENT_INDICATORS = ["shock", "fire", "spark", "burning", "smoke", "injury", "assault", "harassment", "theft", "flood", "emergency", "collapse", "burst", "leak"]
HIGH_INDICATORS = ["exam tomorrow", "hall ticket", "admit card", "broken", "stolen", "no power", "no water", "deadline", "urgent", "blocked", "timeout"]
LOW_INDICATORS = ["suggestion", "feedback", "minor", "inquiry", "query", "future", "request for"]

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        try:
            data = json.loads(body)
        except:
            data = {}

        title = data.get('title', '')
        description = data.get('description', '')
        clean_text = f"{title} {description} {data.get('text', '')}".lower()

        best_cat = "General Administration"
        max_hits = 0
        found = []

        for cat, keywords in CATEGORY_KEYWORDS.items():
            hits = 0
            for kw in keywords:
                if re.search(r'\b' + re.escape(kw) + r'\b', clean_text):
                    hits += 1
                    found.append(kw)
            if hits > max_hits:
                max_hits = hits
                best_cat = cat

        priority = "Medium"
        if any(w in clean_text for w in URGENT_INDICATORS):
            priority = "Urgent"
        elif any(w in clean_text for w in HIGH_INDICATORS):
            priority = "High"
        elif any(w in clean_text for w in LOW_INDICATORS):
            priority = "Low"

        confidence = min(0.70 + (max_hits * 0.08), 0.96) if max_hits > 0 else 0.75

        res = {
            "success": True,
            "category": best_cat,
            "priority": priority,
            "confidence": round(confidence, 2),
            "keywords": found[:5],
            "engine": "python_vercel_serverless"
        }

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(res).encode('utf-8'))

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "healthy", "service": "Python AI Serverless Microservice"}).encode('utf-8'))
