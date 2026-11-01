/**
 * AI Service Client
 * Calls the Flask microservice at http://localhost:5001/predict
 * Includes an intelligent built-in heuristic classifier fallback
 * so backend functionality remains 100% operational even when
 * the Python service is offline or starting.
 */

// Category keyword dictionary for heuristic fallback
const CATEGORY_RULES = [
  {
    category: 'IT & Network Services',
    keywords: ['wifi', 'wi-fi', 'internet', 'network', 'login', 'portal', 'password', 'server', 'laptop', 'canvas', 'moodle', 'vpn', 'lan', 'ethernet', 'printer']
  },
  {
    category: 'Maintenance & Facilities',
    keywords: ['water', 'pipe', 'leak', 'toilet', 'flush', 'plumbing', 'electric', 'power', 'fan', 'ac', 'air conditioning', 'switch', 'light', 'elevator', 'lift', 'bench', 'blackboard', 'door', 'window', 'ceiling']
  },
  {
    category: 'Hostel & Housing',
    keywords: ['hostel', 'room', 'dorm', 'warden', 'roommate', 'bed', 'mattress', 'curfew', 'laundry', 'hot water', 'geyser', 'block a', 'block b', 'mess food']
  },
  {
    category: 'Academic Affairs',
    keywords: ['exam', 'grade', 'marks', 'professor', 'attendance', 'transcript', 'registration', 'course', 'credit', 'schedule', 'faculty', 'assignment', 'syllabus', 'hall ticket']
  },
  {
    category: 'Finance & Accounts',
    keywords: ['fee', 'fees', 'tuition', 'scholarship', 'refund', 'payment', 'receipt', 'dues', 'fine', 'bank', 'challan', 'installment']
  },
  {
    category: 'Library & Learning Resources',
    keywords: ['library', 'book', 'books', 'borrow', 'journal', 'reading room', 'librarian', 'digital library', 'fine']
  },
  {
    category: 'Campus Security',
    keywords: ['security', 'guard', 'theft', 'stolen', 'lost', 'harassment', 'id card', 'gate', 'parking', 'threat', 'cctv']
  },
  {
    category: 'Cafeteria & Dining',
    keywords: ['canteen', 'cafeteria', 'mess', 'food', 'hygiene', 'cockroach', 'meal', 'lunch', 'dinner', 'breakfast', 'diet']
  }
];

// Priority keyword sets
const URGENT_TRIGGERS = ['shock', 'fire', 'spark', 'smoke', 'bleed', 'injury', 'assault', 'harassment', 'theft', 'emergency', 'flood', 'ceiling collapse', 'immediate'];
const HIGH_TRIGGERS = ['broken', 'exam tomorrow', 'hall ticket', 'admit card', 'deadlock', 'stolen', 'cannot submit', 'deadline', 'no power', 'no water', 'urgent'];
const LOW_TRIGGERS = ['suggestion', 'query', 'feedback', 'request for info', 'future', 'minor', 'cosmetic'];

function fallbackPredict(title, description) {
  const fullText = `${title || ''} ${description || ''}`.toLowerCase();
  
  // Category score
  let bestCategory = 'General Administration';
  let maxMatches = 0;
  let matchedKeywords = [];

  for (const rule of CATEGORY_RULES) {
    let matches = 0;
    const ruleMatches = [];
    for (const kw of rule.keywords) {
      if (fullText.includes(kw)) {
        matches++;
        ruleMatches.push(kw);
      }
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = rule.category;
      matchedKeywords = ruleMatches;
    }
  }

  // Priority score
  let priority = 'Medium';
  if (URGENT_TRIGGERS.some(kw => fullText.includes(kw))) {
    priority = 'Urgent';
  } else if (HIGH_TRIGGERS.some(kw => fullText.includes(kw))) {
    priority = 'High';
  } else if (LOW_TRIGGERS.some(kw => fullText.includes(kw))) {
    priority = 'Low';
  }

  const confidence = maxMatches > 0 ? Math.min(0.70 + (maxMatches * 0.08), 0.96) : 0.65;

  return {
    category: bestCategory,
    priority: priority,
    confidence: Number(confidence.toFixed(2)),
    keywords: matchedKeywords.slice(0, 5),
    engine: 'internal_heuristic_engine'
  };
}

async function predictGrievanceCategoryAndPriority(title, description) {
  const serviceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5001/predict';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
    
    const response = await fetch(serviceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, text: `${title}. ${description}` }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        category: data.category || 'General Administration',
        priority: data.priority || 'Medium',
        confidence: data.confidence || 0.90,
        keywords: data.keywords || [],
        engine: 'python_flask_scikit_learn'
      };
    }
  } catch (err) {
    // Expected when Flask is starting or offline; seamlessly use fallback
  }

  return fallbackPredict(title, description);
}

module.exports = {
  predictGrievanceCategoryAndPriority,
  fallbackPredict
};
