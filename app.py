from flask import Flask, request, jsonify
from flask_cors import CORS
import zxcvbn
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for the frontend to communicate with the Python backend

@app.route('/')
def home():
    return "Fortress Backend is running! Use /analyze (POST) for password checking."

@app.route('/analyze', methods=['POST'])
def analyze_password():
    data = request.json
    password = data.get('password', '')
    
    if not password:
        return jsonify({"error": "No password provided"}), 400

    # Professional analysis using zxcvbn
    result = zxcvbn.zxcvbn(password)
    
    # Extract useful metrics
    score = result['score']  # 0 to 4
    crack_times = result['crack_times_display']
    
    # Map score to labels and colors (aligned with our frontend)
    label_map = {
        0: {"label": "Very Weak", "color": "#ef4444"},
        1: {"label": "Weak", "color": "#ef4444"},
        2: {"label": "Fair", "color": "#f59e0b"},
        3: {"label": "Good", "color": "#3b82f6"},
        4: {"label": "Strong", "color": "#22c55e"}
    }
    
    analysis = label_map.get(score, label_map[0])
    
    return jsonify({
        "score": score + 1,  # Converting 0-4 to 1-5 for our existing bar logic
        "label": analysis["label"],
        "color": analysis["color"],
        "crack_time": crack_times['offline_fast_hashing_1e10_per_second'],
        "suggestions": result['feedback']['suggestions'],
        "warning": result['feedback']['warning']
    })

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)
