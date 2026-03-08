# 🏰 Fortress | Ultimate Password Strength Checker

[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Fortress** is a professional-grade security dashboard designed to analyze password strength using real-world data, mathematical entropy, and personal information detection. Unlike basic length checkers, Fortress simulates how a hacker would actually attack your password.

---

## 🔥 Key Features

### 🛡️ Multi-Layer Analysis
- **zxcvbn Engine**: Industry-standard strength estimation used by Dropbox and GitHub.
- **HIBP Integration**: Real-time checking against over **600 million** known pwned passwords via the Have I Been Pwned API.
- **RockYou Dataset**: Local lookup against the famous **14 million** password dataset for instant security auditing.

### 🧠 Intelligent Detection
- **Personal Info Guard**: Warns if your password contains your name, username, email, birthdate, or phone number.
- **Pattern Recognition**: Detects predictable sequences (`12345`), repeats (`aaaaa`), and keyboard layout paths (`qwerty`).
- **Mathematical Entropy**: Visualizes the password's "chaos level" in bits of entropy.

### ✨ Premium User Experience
- **Dynamic UI**: Animated security meter that **pulses** when a password is weak or compromised.
- **Dual Themes**: Sleek **Dark Mode** and a soft, comfortable **Light Mode**.
- **Actionable Advice**: Provides clear, check-marked suggestions on how to improve your security.
- **Glassmorphism Design**: High-end aesthetic with vibrant gradients and smooth transitions.

---

## 🔧 Installation & Setup

### Prerequisites
- Python 3.9+
- pip (Python package manager)

### 1. Clone the Repository
```bash
git clone https://github.com/SSSahil15/Password-Strength-Checker.git
cd Password-Strength-Checker
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Setup the Dataset (Optional)
The app comes with a high-priority wordlist. For full analysis, the app will automatically download the RockYou dataset on the first run if it's missing.

### 4. Run the Application
```bash
python3 app.py
```
Open your browser and navigate to `http://127.0.0.1:5001`.

---

## 🛠️ Technology Stack

- **Backend**: Python, Flask, zxcvbn-python, Requests.
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+).
- **Security APIs**: Have I Been Pwned (HIBP) K-Anonymity API.
- **Styling**: Custom Glassmorphism System with Dark/Light CSS Variables.

---

## 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

---

Built with ❤️ for a more secure web.
