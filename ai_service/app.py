from flask import Flask, request, jsonify
from flask_cors import CORS
from model import GrievanceClassifier, CAMPUS_CATEGORIES

app = Flask(__name__)
CORS(app)

classifier = GrievanceClassifier()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "Campus Grievance AI Microservice",
        "sklearn_ready": classifier.is_sklearn_loaded,
        "supported_categories": len(CAMPUS_CATEGORIES)
    })

@app.route('/categories', methods=['GET'])
def categories():
    return jsonify({
        "categories": CAMPUS_CATEGORIES
    })

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(silent=True) or {}
    title = data.get('title', '')
    description = data.get('description', '')
    text = data.get('text', '')

    combined_text = f"{title}. {description} {text}".strip()
    if not combined_text:
        return jsonify({
            "error": "No grievance text provided"
        }), 400

    prediction = classifier.predict(combined_text)
    return jsonify({
        "success": True,
        "input_length": len(combined_text),
        **prediction
    })

if __name__ == '__main__':
    print("====================================================")
    print("🤖 Campus Grievance AI Microservice running on :5001")
    print("====================================================")
    app.run(host='0.0.0.0', port=5001, debug=False)
