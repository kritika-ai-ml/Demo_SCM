// Check if already logged in
if (isAuthenticated()) {
    const user = getCurrentUser();
    window.location.href = user.role === 'admin' ? '/admin-dashboard.html' : '/resident-dashboard.html';
}

// Get DOM elements
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const alertMessage = document.getElementById('alertMessage');

// Tab switching
loginTab.addEventListener('click', () => {
    loginTab.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
    loginTab.style.color = 'white';
    registerTab.style.background = '';
    registerTab.style.color = 'var(--text-primary)';

    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    clearAlert();
});

registerTab.addEventListener('click', () => {
    registerTab.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
    registerTab.style.color = 'white';
    loginTab.style.background = '';
    loginTab.style.color = 'var(--text-primary)';

    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    clearAlert();
});

// Initialize - check URL for mode
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('mode') === 'register') {
    registerTab.click();
} else {
    loginTab.click();
}

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showAlertMessage('Please fill in all fields', 'error');
        return;
    }

    setLoading(true, 'login');

    try {
        const response = await authAPI.login({ email, password });

        if (response.success) {
            saveAuthData(response.token, response.user);
            showAlert('Login successful! Redirecting...', 'success');

            // Redirect based on role
            setTimeout(() => {
                window.location.href = response.user.role === 'admin'
                    ? '/admin-dashboard.html'
                    : '/resident-dashboard.html';
            }, 1000);
        }
    } catch (error) {
        showAlertMessage(error.message || 'Login failed. Please try again.', 'error');
        setLoading(false, 'login');
    }
});

// Register form submission
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    const flatNumber = document.getElementById('registerFlat').value.trim();
    const phoneNumber = document.getElementById('registerPhone').value.trim();

    if (!name || !email || !password) {
        showAlertMessage('Please fill in all required fields', 'error');
        return;
    }

    if (password.length < 6) {
        showAlertMessage('Password must be at least 6 characters', 'error');
        return;
    }

    setLoading(true, 'register');

    try {
        const userData = { name, email, password, role };
        if (flatNumber) userData.flatNumber = flatNumber;
        if (phoneNumber) userData.phoneNumber = phoneNumber;

        const response = await authAPI.register(userData);

        if (response.success) {
            saveAuthData(response.token, response.user);
            showAlert('Registration successful! Redirecting...', 'success');

            // Redirect based on role
            setTimeout(() => {
                window.location.href = response.user.role === 'admin'
                    ? '/admin-dashboard.html'
                    : '/resident-dashboard.html';
            }, 1000);
        }
    } catch (error) {
        showAlertMessage(error.message || 'Registration failed. Please try again.', 'error');
        setLoading(false, 'register');
    }
});

// Helper functions
function showAlertMessage(message, type) {
    alertMessage.className = `alert alert-${type}`;
    alertMessage.textContent = message;
    alertMessage.classList.remove('hidden');
}

function clearAlert() {
    alertMessage.classList.add('hidden');
}

function setLoading(isLoading, formType) {
    if (formType === 'login') {
        const btn = document.getElementById('loginBtnText');
        const spinner = document.getElementById('loginSpinner');
        const form = loginForm.querySelector('button[type="submit"]');

        form.disabled = isLoading;
        if (isLoading) {
            btn.textContent = 'Signing In...';
            spinner.classList.remove('hidden');
        } else {
            btn.textContent = 'Sign In';
            spinner.classList.add('hidden');
        }
    } else {
        const btn = document.getElementById('registerBtnText');
        const spinner = document.getElementById('registerSpinner');
        const form = registerForm.querySelector('button[type="submit"]');

        form.disabled = isLoading;
        if (isLoading) {
            btn.textContent = 'Creating Account...';
            spinner.classList.remove('hidden');
        } else {
            btn.textContent = 'Create Account';
            spinner.classList.add('hidden');
        }
    }
}
