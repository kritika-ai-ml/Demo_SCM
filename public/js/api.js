// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Get auth token from localStorage
function getAuthToken() {
    return localStorage.getItem('token');
}

// API request wrapper with authentication
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();

    const config = {
        ...options,
        headers: {
            ...(options.headers || {}),
        }
    };

    // Add auth token if available and not FormData
    if (token && !(options.body instanceof FormData)) {
        config.headers['Authorization'] = `Bearer ${token}`;
    } else if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add Content-Type for JSON if not FormData
    if (options.body && !(options.body instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth API calls
const authAPI = {
    register: (userData) => apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    }),

    login: (credentials) => apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    }),

    getCurrentUser: () => apiRequest('/auth/me')
};

// Complaints API calls
const complaintsAPI = {
    create: (formData) => apiRequest('/complaints', {
        method: 'POST',
        body: formData // FormData instance
    }),

    getAll: (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        return apiRequest(`/complaints${params ? '?' + params : ''}`);
    },

    getById: (id) => apiRequest(`/complaints/${id}`),

    update: (id, updates) => apiRequest(`/complaints/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    }),

    addComment: (id, comment) => apiRequest(`/complaints/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text: comment })
    }),

    delete: (id) => apiRequest(`/complaints/${id}`, {
        method: 'DELETE'
    }),

    getStats: () => apiRequest('/complaints/stats/overview')
};

// Helper functions
function saveAuthData(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function isAuthenticated() {
    return !!getAuthToken();
}

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/auth.html';
        return false;
    }
    return true;
}

function requireRole(role) {
    const user = getCurrentUser();
    if (!user || user.role !== role) {
        window.location.href = '/';
        return false;
    }
    return true;
}

// Date formatting
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } else if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
        return 'Just now';
    }
}

// Show alert message
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';
    alertDiv.style.animation = 'slideInRight 0.3s ease-out';

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}
