// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Test server connection
async function testServerConnection() {
    try {
        console.log('Testing server connection...');
        const response = await fetch(`${API_BASE_URL}/test`);
        console.log('Server response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Server returned status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Server connection test successful:', data);
        return true;
    } catch (error) {
        console.error('Server connection test failed:', error);
        showError('Unable to connect to the server. Please make sure the server is running at http://localhost:5000');
        return false;
    }
}

// Form validation
function validateForm(name, email, password, confirmPassword) {
    console.log('Validating form inputs...');
    
    // Name validation
    if (!name || name.length < 3) {
        throw new Error('Name must be at least 3 characters long');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
    }

    // Password validation
    if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
    }

    // Password match validation
    if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
    }

    console.log('Form validation successful');
    return true;
}

// Show error message
function showError(message) {
    console.error('Showing error message:', message);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Remove any existing error message
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Insert error message after the form
    const form = document.getElementById('signupForm');
    if (form) {
        form.parentNode.insertBefore(errorDiv, form.nextSibling);
    } else {
        console.error('Signup form not found');
    }
}

// Show success message
function showSuccess(message) {
    console.log('Showing success message:', message);
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // Remove any existing success message
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    // Insert success message after the form
    const form = document.getElementById('signupForm');
    if (form) {
        form.parentNode.insertBefore(successDiv, form.nextSibling);
    } else {
        console.error('Signup form not found');
    }
}

// Save user preferences
async function savePreferences() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('User not logged in');
        }

        const preferences = {
            sports: Array.from(document.querySelectorAll('input[name="sports"]:checked')).map(cb => cb.value),
            tech: Array.from(document.querySelectorAll('input[name="tech"]:checked')).map(cb => cb.value),
            health: Array.from(document.querySelectorAll('input[name="health"]:checked')).map(cb => cb.value),
            finance: Array.from(document.querySelectorAll('input[name="finance"]:checked')).map(cb => cb.value),
            education: Array.from(document.querySelectorAll('input[name="education"]:checked')).map(cb => cb.value)
        };

        // Show loading state
        const saveButton = document.querySelector('.save-preferences-button');
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';

        // Send preferences to backend
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ preferences })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error saving preferences');
        }

        // Show success message
        showSuccess('Preferences saved successfully! Redirecting to login page...');

        // Redirect to login page after a short delay
        setTimeout(() => {
            console.log('Redirecting to login page...');
            window.location.href = 'login.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error saving preferences:', error);
        showError(error.message || 'Error saving preferences. Please try again.');
    } finally {
        // Reset button state
        const saveButton = document.querySelector('.save-preferences-button');
        saveButton.disabled = false;
        saveButton.textContent = 'Save Preferences';
    }
}

// Handle form submission
async function handleSignup(e) {
    e.preventDefault();
    console.log('Form submitted');
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    console.log('Form data:', { name, email, password: '***' });
    
    try {
        // Test server connection first
        const isServerRunning = await testServerConnection();
        if (!isServerRunning) {
            return;
        }

        // Validate form inputs
        validateForm(name, email, password, confirmPassword);
        
        // Show loading state
        const submitButton = document.querySelector('.signup-button');
        submitButton.disabled = true;
        submitButton.textContent = 'Creating Account...';
        
        console.log('Sending signup request to server...');
        // Send signup request to backend
        const response = await fetch(`${API_BASE_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        console.log('Server response status:', response.status);
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
            console.log('Server response data:', data);
        } else {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            throw new Error('Server returned an invalid response');
        }

        if (!response.ok) {
            throw new Error(data.error || `Error during signup: ${response.status}`);
        }

        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        console.log('User data stored in localStorage');
        
        // Hide signup form and show preferences form
        document.getElementById('signupForm').style.display = 'none';
        document.getElementById('preferencesForm').style.display = 'block';
        
    } catch (error) {
        console.error('Error during signup:', error);
        showError(error.message || 'An error occurred during signup. Please try again.');
    } finally {
        // Reset button state
        const submitButton = document.querySelector('.signup-button');
        submitButton.disabled = false;
        submitButton.textContent = 'Create Account';
    }
}

// Initialize the page
function initializePage() {
    console.log('Initializing page...');
    
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    console.log('Current auth state:', { token: !!token, currentUser: !!currentUser });
    
   

    // Set up form submission handler
    const form = document.getElementById('signupForm');
    if (!form) {
        console.error('Signup form not found');
        return;
    }

    form.addEventListener('submit', handleSignup);
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);
