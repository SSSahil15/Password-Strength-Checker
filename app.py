from flask import Flask, request, jsonify
from flask_cors import CORS
import zxcvbn
import time
import os
import requests
import hashlib
from wordlist import ROCKYOU_TOP

import subprocess

import tarfile

# --- CONFIGURATION ---
# The zacheller repo uses a compressed .tar.gz file for the 140MB list
ROCKYOU_URL = "https://raw.githubusercontent.com/zacheller/rockyou/master/rockyou.txt.tar.gz"
ROCKYOU_PATH = os.path.join(os.path.dirname(__file__), "rockyou.txt")
ARCHIVE_PATH = os.path.join(os.path.dirname(__file__), "rockyou.txt.tar.gz")
# ---------------------

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

def sync_rockyou():
    """Dynamically fetches and extracts the RockYou list."""
    if os.path.exists(ROCKYOU_PATH):
        # Basic validation: ensure it's not a tiny 404 file
        if os.path.getsize(ROCKYOU_PATH) > 1000:
            print("[+] RockYou dataset (14M passwords) is ready.")
            return

    print(f"[*] Fetching RockYou archive from {ROCKYOU_URL}...")
    try:
        # Download the compressed archive
        response = requests.get(ROCKYOU_URL, stream=True, timeout=30)
        if response.status_code == 200:
            print("[!] Downloading archive (approx 50MB)...")
            with open(ARCHIVE_PATH, 'wb') as f:
                for chunk in response.iter_content(chunk_size=1024*1024):
                    if chunk: f.write(chunk)
            
            print("[!] Extracting rockyou.txt... This may take a moment.")
            with tarfile.open(ARCHIVE_PATH, "r:gz") as tar:
                tar.extractall(path=os.path.dirname(__file__))
            
            # Cleanup archive
            os.remove(ARCHIVE_PATH)
            print("[+] Successfully synced and extracted RockYou data.")
        else:
            print(f"[-] Failed to sync: Server returned {response.status_code}")
    except Exception as e:
        print(f"[-] Sync Error: {e}")

def check_rockyou_local(password):
    """High-performance search using system grep (Extremely fast for large files)."""
    if not os.path.exists(ROCKYOU_PATH):
        return False
    
    try:
        # Use grep -Fxq to find literal, whole-line matches
        # This is way faster than loading 140MB into Python memory
        result = subprocess.run(
            ['grep', '-Fxq', password, ROCKYOU_PATH],
            capture_output=False,
            timeout=2
        )
        return result.returncode == 0
    except Exception:
        return False

@app.route('/')
def home():
    return app.send_static_file('index.html')

def check_pwned_password(password):
    """Check Have I Been Pwned API for pwned status (K-Anonymity)."""
    sha1_password = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
    first5, tail = sha1_password[:5], sha1_password[5:]
    
    try:
        url = f"https://api.pwnedpasswords.com/range/{first5}"
        response = requests.get(url, timeout=5)
        if response.status_code != 200:
            return False
            
        # The API returns a list of suffix:count\r\n
        hashes = (line.split(':') for line in response.text.splitlines())
        for h, count in hashes:
            if h == tail:
                return int(count) > 0
    except Exception as e:
        print(f"HIBP API error: {e}")
        
    return False

@app.route('/analyze', methods=['POST'])
def analyze_password():
    data = request.json
    password = data.get('password', '')
    username = data.get('username', '')
    email = data.get('email', '')
    birth = data.get('birth', '')
    phone = data.get('phone', '')
    
    if not password:
        return jsonify({"error": "No password provided"}), 400

    # Professional analysis using zxcvbn with personal inputs
    user_inputs = [v for v in [username, email, birth, phone] if v]
    result = zxcvbn.zxcvbn(password, user_inputs=user_inputs)
    
    # Extract useful metrics
    score = result['score']  # 0 to 4
    
    # Explicit Personal Info Check
    is_compromised = False
    for info in user_inputs:
        if info.lower() in password.lower():
            score = 0
            is_compromised = True
            break
    
    # Common Password Detection (HIBP API & Dynamic RockYou)
    is_pwned = check_pwned_password(password)
    # Check both the small 'Top' list and the 'Whole' RockYou file
    is_in_rockyou_top = password.lower() in [p.lower() for p in ROCKYOU_TOP]
    is_in_rockyou_full = check_rockyou_local(password)
    
    is_common = is_pwned or is_in_rockyou_top or is_in_rockyou_full
    
    # Extra logging
    print(f"Check: '{password}' | Breach: {is_pwned} | List: {is_in_rockyou_full}")
    
    if is_common:
        score = 0
        is_compromised = True 

    crack_times = result['crack_times_display']
    crack_time = crack_times['offline_fast_hashing_1e10_per_second']
    
    # Cap crack time at '1 year+'
    crack_time_lower = crack_time.lower()
    if any(word in crack_time_lower for word in ['year', 'century', 'centur']):
        crack_time = '1 year+'
    
    # Map score to labels and colors
    label_map = {
        0: {"label": "Very Weak", "color": "#ef4444"},
        1: {"label": "Weak", "color": "#ef4444"},
        2: {"label": "Fair", "color": "#f59e0b"},
        3: {"label": "Good", "color": "#3b82f6"},
        4: {"label": "Strong", "color": "#22c55e"}
    }
    
    analysis = label_map.get(score, label_map[0])
    
    # Force 'Compromised' label if flagged
    if is_compromised or is_common:
        label = "Compromised"
        score = 0
    else:
        label = analysis["label"]
    
    # Pattern Detection (Advanced zxcvbn analysis)
    pattern_warning = ""
    for match in result.get('sequence', []):
        p = match.get('pattern')
        if p == 'repeat':
            pattern_warning = "Avoid repeated characters like 'aaaaa' or '11111'."
            score = min(score, 1)
        elif p == 'sequence':
            pattern_warning = "Avoid predictable sequences like '12345' or 'abcd'."
            score = min(score, 1)
        elif p == 'spatial':
            pattern_warning = "Avoid common keyboard patterns like 'qwerty' or 'asdfgh'."
            score = min(score, 1)
    
    # Final combined warning
    all_warnings = []
    if is_common:
        all_warnings.append("This password or pattern is already used for exploitation.")
    if is_compromised and not is_common:
        all_warnings.append("Password contains your personal information!")
    if pattern_warning:
        all_warnings.append(pattern_warning)
        
    if all_warnings:
        warning = " ".join(all_warnings)
    else:
        warning = result['feedback']['warning']
    
    # Custom and system suggestions
    suggestions = result['feedback']['suggestions'] if score < 4 else []
    
    if score < 4:
        if len(password) < 12:
            suggestions.append("Increase length to 12+ characters for better security.")
        if not any(c.isupper() for c in password):
            suggestions.append("Add uppercase letters.")
        if not any(c.isdigit() for c in password):
            suggestions.append("Add numbers.")
        if not any(not c.isalnum() for c in password):
            suggestions.append("Add special characters (e.g. !@#$).")
        if is_common or is_compromised:
             suggestions.append("Choose a unique password, not used in any other accounts.")

    # Remove duplicates and empty hints
    suggestions = list(set([s for s in suggestions if s]))
    
    # Calculate Entropy in bits
    import math
    guesses = result.get('guesses', 1)
    entropy = math.log2(guesses) if guesses > 0 else 0
    
    return jsonify({
        "score": score + 1,
        "label": label,
        "is_common": is_common,
        "color": analysis["color"],
        "crack_time": crack_time,
        "suggestions": suggestions,
        "warning": warning,
        "entropy": round(entropy, 2)
    })

if __name__ == '__main__':
    # Initial sync on startup
    sync_rockyou()
    app.run(host='127.0.0.1', port=5001, debug=False)
