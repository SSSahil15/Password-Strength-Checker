document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password-input');
    const usernameInput = document.getElementById('username-input');
    const emailInput = document.getElementById('email-input');
    const birthInput = document.getElementById('birth-input');
    const phoneInput = document.getElementById('phone-input');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    const crackTimeText = document.getElementById('crack-time');
    const warningText = document.getElementById('warning-text');
    const suggestionsContainer = document.getElementById('suggestions-container');
    const suggestionsList = document.getElementById('suggestions-list');
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = themeToggle.querySelector('.sun-icon');
    const moonIcon = themeToggle.querySelector('.moon-icon');
    const themeText = document.getElementById('theme-text');
    const entropyViz = document.getElementById('entropy-viz');
    const entropyValue = document.getElementById('entropy-value');
    const entropyFill = document.getElementById('entropy-fill');
    const metricsDetails = document.getElementById('metrics-details');
    const metricLength = document.getElementById('metric-length');
    const metricDiversity = document.getElementById('metric-diversity');
    const generateBtn = document.getElementById('generate-password');
    const copyBtn = document.getElementById('copy-password');
    const toast = document.getElementById('toast');
    const strengthDisplay = document.getElementById('strength-display');
    const criteriaItems = document.querySelectorAll('.criteria-item');

    // UI Colors
    const colors = {
        empty: '#a0a0ab',
        weak: '#ef4444',
        fair: '#f59e0b',
        good: '#3b82f6',
        strong: '#22c55e'
    };

    // Theme Toggle Logic
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
        themeText.textContent = 'Light';
    }

    themeToggle.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        sunIcon.classList.toggle('hidden');
        moonIcon.classList.toggle('hidden');
        themeText.textContent = isLight ? 'Light' : 'Dark';
    });

    // Toggle Password Visibility
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // Update Icon
        const svg = togglePasswordBtn.querySelector('svg');
        if (type === 'text') {
            svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
        } else {
            svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
        }
    });

    // Strength Analysis
    let debounceTimer;
    let currentRequestId = 0;
    const triggerAnalysis = () => {
        const password = passwordInput.value;
        const username = usernameInput.value;
        const email = emailInput.value;
        const birth = birthInput.value;
        const phone = phoneInput.value;

        // Local logic for immediate feedback (Criteria checks)
        updateCriteria(password);

        // Debounced remote logic for Python backend
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            updateUI(password, { username, email, birth, phone });
        }, 300); // 300ms debounce
    };

    passwordInput.addEventListener('input', triggerAnalysis);
    usernameInput.addEventListener('input', triggerAnalysis);
    emailInput.addEventListener('input', triggerAnalysis);
    birthInput.addEventListener('input', triggerAnalysis);
    phoneInput.addEventListener('input', triggerAnalysis);

    async function updateUI(password, personalInfo) {
        const requestId = ++currentRequestId;
        if (!password) {
            resetUI();
            return;
        }

        const { username, email, birth, phone } = personalInfo;

        // Try to use Python Backend for professional analysis
        try {
            const response = await fetch('http://127.0.0.1:5001/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, username, email, birth, phone })
            });

            if (response.ok) {
                if (requestId !== currentRequestId) return;
                const stats = await response.json();

                // Enforce 'Compromised' state on frontend for all personal info
                const containsPersonalInfo =
                    (username && password.toLowerCase().includes(username.toLowerCase())) ||
                    (email && password.toLowerCase().includes(email.toLowerCase())) ||
                    (birth && password.toLowerCase().includes(birth.toLowerCase())) ||
                    (phone && password.toLowerCase().includes(phone.toLowerCase()));

                if (stats.is_common || containsPersonalInfo) {
                    stats.score = 1; // 1/5 for the bar
                    stats.label = 'Compromised';
                    stats.color = '#ef4444'; // Red

                    if (stats.is_common) {
                        // Keep current common warning, but append if info also found
                        if (containsPersonalInfo) stats.warning += " Contains personal information!";
                    } else {
                        stats.warning = "Password contains your personal information!";
                    }
                }

                applyStats(stats);
                return;
            }
        } catch (error) {
            console.log("Python backend not reachable, using local JS logic.");
        }

        // Fallback to local JS logic if Python backend is offline
        if (requestId !== currentRequestId) return;
        const stats = analyzePassword(password, personalInfo);
        applyStats({
            score: stats.score,
            label: stats.label,
            color: stats.color,
            crack_time: formatTime(stats.crackTimeSeconds),
            warning: stats.warning || '',
            suggestions: [],
            entropy: 0
        });
    }

    function applyStats(stats) {
        // Show container
        strengthDisplay.classList.remove('hidden');

        // Update Bar
        const barWidth = stats.score * 20;
        strengthBar.style.width = `${barWidth}%`;
        strengthBar.style.backgroundColor = stats.color;

        // Animated pulse for weak/compromised passwords
        if (stats.score <= 2) {
            strengthBar.classList.add('pulse');
        } else {
            strengthBar.classList.remove('pulse');
        }

        // Update Text
        strengthText.textContent = stats.label;
        strengthText.style.color = stats.color;

        // Entropy Visualization
        if (stats.entropy) {
            entropyValue.textContent = stats.entropy;
            const entropyPercent = Math.min((stats.entropy / 128) * 100, 100);
            entropyFill.style.width = `${entropyPercent}%`;
            entropyViz.classList.remove('hidden');
        } else {
            entropyViz.classList.add('hidden');
        }

        // Detailed Metrics (Length & Diversity)
        const password = passwordInput.value;
        if (password) {
            metricLength.textContent = password.length;

            // Calculate Diversity
            let types = 0;
            if (/[a-z]/.test(password)) types++;
            if (/[A-Z]/.test(password)) types++;
            if (/[0-9]/.test(password)) types++;
            if (/[^A-Za-z0-9]/.test(password)) types++;

            let divLabel = "None";
            if (types === 1) divLabel = "Low";
            else if (types === 2) divLabel = "Medium";
            else if (types === 3) divLabel = "High";
            else if (types === 4) divLabel = "Excellent";

            metricDiversity.textContent = divLabel;
            metricsDetails.classList.remove('hidden');
        } else {
            metricsDetails.classList.add('hidden');
        }

        // Final cap for crack time at '1 year'
        let crackTime = stats.crack_time || (stats.crackTimeSeconds ? formatTime(stats.crackTimeSeconds) : '0s');
        if (typeof crackTime === 'string' && (crackTime.toLowerCase().includes('year') || crackTime.toLowerCase().includes('centur'))) {
            crackTime = '1 year';
        }

        // Update Crack Time
        crackTimeText.textContent = `Crack time: ${crackTime}`;

        // Update Warning
        if (stats.warning) {
            warningText.textContent = `⚠️ ${stats.warning}`;
            warningText.classList.remove('hidden');
        } else {
            warningText.textContent = '';
            warningText.classList.add('hidden');
        }

        // Update Suggestions
        suggestionsList.innerHTML = '';
        if (stats.suggestions && stats.suggestions.length > 0) {
            stats.suggestions.forEach(suggestion => {
                const li = document.createElement('li');
                li.textContent = suggestion;
                suggestionsList.appendChild(li);
            });
            suggestionsContainer.classList.remove('hidden');
        } else {
            suggestionsContainer.classList.add('hidden');
        }
    }

    function resetUI() {
        strengthDisplay.classList.add('hidden');
        strengthBar.style.width = '0%';
        strengthBar.classList.remove('pulse');
        strengthText.textContent = 'Empty';
        strengthText.style.color = colors.empty;
        crackTimeText.textContent = 'Crack time: 0s';
        warningText.textContent = '';
        warningText.classList.add('hidden');
        suggestionsContainer.classList.add('hidden');
        suggestionsList.innerHTML = '';
        entropyViz.classList.add('hidden');
        entropyValue.textContent = '0';
        entropyFill.style.width = '0%';
        metricsDetails.classList.add('hidden');
        metricLength.textContent = '0';
        metricDiversity.textContent = 'None';
        criteriaItems.forEach(item => {
            item.classList.remove('met');
            item.querySelector('.icon').textContent = '○';
        });
    }

    function analyzePassword(password, personalInfo) {
        let score = 0;
        let warning = '';
        const { username, email, birth, phone } = personalInfo || {};

        const containsInfo = (info) => info && password.toLowerCase().includes(info.toLowerCase());

        const checks = {
            length: password.length >= 8,
            hasUpper: /[A-Z]/.test(password),
            hasLower: /[a-z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSpecial: /[^A-Za-z0-9]/.test(password),
            containsPersonal: containsInfo(username) || containsInfo(email) || containsInfo(birth) || containsInfo(phone),
            isCommon: [
                "123456", "password", "123456789", "12345678", "12345", "qwerty", "password123", "111111", "1234567",
                "dragon", "pussy", "baseball", "football", "shadow", "123123", "654321", "monkey", "sunshine", "letmein",
                "princess", "666666", "master", "1234567890", "superman", "killer", "charlie", "jordan", "michael",
                "computer", "soccer", "secret", "network", "admin", "admin123", "password!", "p@ssword", "welcome",
                "hockey", "hunter2", "batman", "superman", "testing", "pass123", "loveyou", "iloveyou", "mustang",
                "000000", "freedom", "cookie", "cheese", "google", "marina", "jessica", "starlight", "warrior",
                "samsung", "iphone", "account", "login", "access", "denied", "unknown", "qwertyuiop", "asdfghjkl",
                "zxcvbnm", "aaaaaa", "bbbbbb", "cccccc", "121212", "131313", "141414", "151515", "0123456789",
                "987654321", "password12", "password1", "iloveu", "honey", "angel", "bubble", "babygirl", "flower",
                "butterfly", "starwars", "pokemon", "matrix", "godless", "faith", "trust", "believe", "rockyou",
                "hacker", "pentest", "kali", "exploit", "security", "firewall", "router", "modem", "switch"
            ].some(p => p === password.toLowerCase())
        };

        if (password.length > 0) score += 1; // Basic entry
        if (password.length >= 12) score += 1; // Bonus length
        if (checks.hasUpper && checks.hasLower) score += 1;
        if (checks.hasNumber) score += 1;
        if (checks.hasSpecial) score += 1;

        // Cap score at 5
        score = Math.min(score, 5);

        let label = 'Weak';
        let color = colors.weak;

        if (checks.isCommon) {
            score = 0;
            label = 'Compromised';
            color = colors.weak;
            warning = "This password or pattern is already used for exploitation.";
        } else if (checks.containsPersonal) {
            score = 0;
            label = 'Compromised';
            color = colors.weak;
            warning = "Password contains your personal information!";
        } else if (score === 1) { label = 'Weak'; color = colors.weak; }
        else if (score === 2) { label = 'Fair'; color = colors.fair; }
        else if (score === 3) { label = 'Good'; color = colors.good; }
        else if (score >= 4) { label = 'Strong'; color = colors.strong; }

        // Entropy Estimation for Crack Time
        let charsetSize = 0;
        if (checks.hasLower) charsetSize += 26;
        if (checks.hasUpper) charsetSize += 26;
        if (checks.hasNumber) charsetSize += 10;
        if (checks.hasSpecial) charsetSize += 32;
        if (charsetSize === 0) charsetSize = 0;

        const entropy = password.length * Math.log2(charsetSize || 1);
        const combinations = Math.pow(2, entropy);
        // Assuming 10 billion guesses per second (modern high-end GPU)
        const guessesPerSecond = 10000000000;
        const crackTimeSeconds = combinations / guessesPerSecond;

        return { score, label, color, crackTimeSeconds, warning };
    }

    function updateCriteria(password) {
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };

        criteriaItems.forEach(item => {
            const criteria = item.getAttribute('data-criteria');
            if (checks[criteria]) {
                item.classList.add('met');
                item.querySelector('.icon').textContent = '✓';
            } else {
                item.classList.remove('met');
                item.querySelector('.icon').textContent = '○';
            }
        });
    }

    function formatTime(seconds) {
        if (seconds < 1) return '< 1s';
        if (seconds < 60) return `${Math.floor(seconds)}s`;

        const minutes = seconds / 60;
        if (minutes < 60) return `${Math.floor(minutes)}m`;

        const hours = minutes / 60;
        if (hours < 24) return `${Math.floor(hours)}h`;

        const days = hours / 24;
        if (days < 365) return `${Math.floor(days)} days`;

        return '1 year';
    }

    // Generate Password
    generateBtn.addEventListener('click', () => {
        const length = 16;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
        let password = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }
        passwordInput.value = password;
        updateUI(password, usernameInput.value);

        // Add a small animation to show it was generated
        passwordInput.style.transform = 'scale(1.02)';
        setTimeout(() => passwordInput.style.transform = 'scale(1)', 150);
    });

    // Copy to Clipboard
    copyBtn.addEventListener('click', () => {
        if (!passwordInput.value) return;

        passwordInput.select();
        passwordInput.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(passwordInput.value);

        showToast();
    });

    function showToast() {
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 2000);
    }
});
