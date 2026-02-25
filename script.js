document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password-input');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    const crackTimeText = document.getElementById('crack-time');
    const generateBtn = document.getElementById('generate-password');
    const copyBtn = document.getElementById('copy-password');
    const toast = document.getElementById('toast');
    const criteriaItems = document.querySelectorAll('.criteria-item');

    // UI Colors
    const colors = {
        empty: '#a0a0ab',
        weak: '#ef4444',
        fair: '#f59e0b',
        good: '#3b82f6',
        strong: '#22c55e'
    };

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
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;

        // Local logic for immediate feedback (Criteria checks)
        updateCriteria(password);

        // Debounced remote logic for Python backend
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            updateUI(password);
        }, 300); // 300ms debounce
    });

    async function updateUI(password) {
        if (!password) {
            resetUI();
            return;
        }

        // Try to use Python Backend for professional analysis
        try {
            const response = await fetch('http://127.0.0.1:5000/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (response.ok) {
                const stats = await response.json();
                applyStats(stats);
                return;
            }
        } catch (error) {
            console.log("Python backend not reachable, using local JS logic.");
        }

        // Fallback to local JS logic if Python backend is offline
        const stats = analyzePassword(password);
        applyStats({
            score: stats.score,
            label: stats.label,
            color: stats.color,
            crack_time: formatTime(stats.crackTimeSeconds)
        });
    }

    function applyStats(stats) {
        // Update Bar
        strengthBar.style.width = `${stats.score * 20}%`;
        strengthBar.style.backgroundColor = stats.color;

        // Update Text
        strengthText.textContent = stats.label;
        strengthText.style.color = stats.color;

        // Update Crack Time
        crackTimeText.textContent = `Crack time: ${stats.crack_time}`;
    }

    function resetUI() {
        strengthBar.style.width = '0%';
        strengthText.textContent = 'Empty';
        strengthText.style.color = colors.empty;
        crackTimeText.textContent = 'Crack time: 0s';
        criteriaItems.forEach(item => {
            item.classList.remove('met');
            item.querySelector('.icon').textContent = '○';
        });
    }

    function analyzePassword(password) {
        let score = 0;

        const checks = {
            length: password.length >= 8,
            hasUpper: /[A-Z]/.test(password),
            hasLower: /[a-z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSpecial: /[^A-Za-z0-9]/.test(password)
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

        if (score === 1) { label = 'Weak'; color = colors.weak; }
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

        return { score, label, color, crackTimeSeconds };
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

        const years = days / 365;
        if (years < 1000) return `${Math.floor(years)} years`;
        if (years < 1000000) return `${Math.floor(years / 1000)}k years`;
        if (years < 1000000000) return `${Math.floor(years / 1000000)}m years`;
        return 'Centuries';
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
        updateUI(password);

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
