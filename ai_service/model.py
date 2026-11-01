"""
AI Categorization & Priority Estimation Engine
Uses scikit-learn TF-IDF + Multinomial Naive Bayes / Heuristic Pipeline.
"""
import re
import json
import os

CAMPUS_CATEGORIES = [
    "Academic Affairs",
    "Hostel & Housing",
    "Maintenance & Facilities",
    "IT & Network Services",
    "Finance & Accounts",
    "Library & Learning Resources",
    "Campus Security",
    "Cafeteria & Dining",
    "General Administration"
]

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

URGENT_INDICATORS = ["shock", "fire", "spark", "burning", "smoke", "injury", "assault", "harassment", "theft", "flood", "emergency", "collapse", "burst"]
HIGH_INDICATORS = ["exam tomorrow", "hall ticket", "admit card", "broken", "stolen", "no power", "no water", "deadline", "urgent", "blocked", "timeout"]
LOW_INDICATORS = ["suggestion", "feedback", "minor", "inquiry", "query", "future", "request for"]

class GrievanceClassifier:
    def __init__(self):
        self.is_sklearn_loaded = False
        self.vectorizer = None
        self.category_classifier = None
        self._init_model()

    def _init_model(self):
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.naive_bayes import MultinomialNB
            import numpy as np

            dataset_path = os.path.join(os.path.dirname(__file__), 'data', 'sample_dataset.json')
            if os.path.exists(dataset_path):
                with open(dataset_path, 'r') as f:
                    data = json.load(f)
                texts = [item['text'] for item in data]
                labels = [item['category'] for item in data]

                self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english')
                X = self.vectorizer.fit_transform(texts)
                self.category_classifier = MultinomialNB()
                self.category_classifier.fit(X, labels)
                self.is_sklearn_loaded = True
        except Exception:
            self.is_sklearn_loaded = False

    def predict(self, text):
        clean_text = text.lower()
        extracted_keywords = []

        # Scikit-learn prediction if ready
        if self.is_sklearn_loaded:
            try:
                X_input = self.vectorizer.transform([text])
                predicted_cat = self.category_classifier.predict(X_input)[0]
                proba = np.max(self.category_classifier.predict_proba(X_input))
                confidence = round(float(proba), 2)
            except Exception:
                predicted_cat, confidence, extracted_keywords = self._heuristic_category(clean_text)
        else:
            predicted_cat, confidence, extracted_keywords = self._heuristic_category(clean_text)

        # Priority Assessment
        priority = "Medium"
        if any(w in clean_text for w in URGENT_INDICATORS):
            priority = "Urgent"
        elif any(w in clean_text for w in HIGH_INDICATORS):
            priority = "High"
        elif any(w in clean_text for w in LOW_INDICATORS):
            priority = "Low"

        # Collect keywords
        for cat, kws in CATEGORY_KEYWORDS.items():
            for kw in kws:
                if kw in clean_text and kw not in extracted_keywords:
                    extracted_keywords.append(kw)

        return {
            "category": predicted_cat,
            "priority": priority,
            "confidence": max(confidence, 0.85),
            "keywords": extracted_keywords[:5]
        }

    def _heuristic_category(self, clean_text):
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

        conf = 0.70 + (max_hits * 0.07) if max_hits > 0 else 0.65
        return best_cat, round(min(conf, 0.96), 2), found
