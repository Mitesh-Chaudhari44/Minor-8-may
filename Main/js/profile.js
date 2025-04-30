// Check authentication
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserProfile();
});

// Check if user is authenticated
function checkAuth() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }
}

// Load user profile data
async function loadUserProfile() {
    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData) return;

        // Update profile information
        document.getElementById('userName').textContent = userData.name;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('displayName').textContent = userData.name;
        document.getElementById('displayEmail').textContent = userData.email;
        document.getElementById('memberSince').textContent = new Date(userData.createdAt).toLocaleDateString();

        // Update profile image
        const profileImage = document.getElementById('profileImage');
        if (userData.profileImage) {
            profileImage.src = userData.profileImage;
        }

        // Load news preferences
        if (userData.preferences) {
            displayPreferences(userData.preferences);
            // Set initial checkbox states
            setPreferenceCheckboxes(userData.preferences);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Display news preferences
function displayPreferences(preferences) {
    const preferencesList = document.getElementById('preferencesList');
    preferencesList.innerHTML = '';

    if (preferences && Object.keys(preferences).length > 0) {
    for (const category in preferences) {
        if (preferences[category] && preferences[category].length > 0) {
            preferences[category].forEach(pref => {
                const tag = document.createElement('span');
                tag.className = 'preference-tag';
                tag.textContent = pref;
                preferencesList.appendChild(tag);
            });
        }
    }
    } else {
        preferencesList.innerHTML = '<p>No preferences set</p>';
    }
}

// Set preference checkboxes based on user preferences
function setPreferenceCheckboxes(preferences) {
    if (!preferences) return;

    for (const category in preferences) {
        if (preferences[category] && preferences[category].length > 0) {
            preferences[category].forEach(pref => {
                const checkbox = document.querySelector(`input[name="${category}"][value="${pref}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
    }
}

// Open preferences modal
function openPreferencesModal() {
    const modal = document.getElementById('preferencesModal');
    modal.style.display = 'block';
}

// Close preferences modal
function closePreferencesModal() {
    const modal = document.getElementById('preferencesModal');
    modal.style.display = 'none';
}

// Handle preferences form submission
document.getElementById('preferencesForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const preferences = {
        sports: [],
        tech: [],
        health: [],
        finance: [],
        education: []
    };

    // Get selected preferences for each category
    for (const category of Object.keys(preferences)) {
        preferences[category] = formData.getAll(category);
    }

    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        const response = await fetch('http://localhost:5000/api/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                preferences: preferences
            })
        });

        if (response.ok) {
            // Update local storage
            userData.preferences = preferences;
            localStorage.setItem('userData', JSON.stringify(userData));

            // Update UI
            displayPreferences(preferences);
            closePreferencesModal();

            // Show success message
            alert('Preferences updated successfully!');
        } else {
            throw new Error('Failed to update preferences');
        }
    } catch (error) {
        console.error('Error updating preferences:', error);
        alert('Failed to update preferences. Please try again.');
    }
});

// Handle profile image upload
function openImageUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const formData = new FormData();
                formData.append('profileImage', file);

                const response = await fetch('http://localhost:5000/api/profile/image', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    const profileImage = document.getElementById('profileImage');
                    profileImage.src = data.imageUrl;

                    // Update local storage
                    const userData = JSON.parse(localStorage.getItem('userData'));
                    userData.profileImage = data.imageUrl;
                    localStorage.setItem('userData', JSON.stringify(userData));
                } else {
                    throw new Error('Failed to upload image');
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                alert('Failed to upload image. Please try again.');
            }
        }
    };
    input.click();
}

// Handle edit personal info
function editPersonalInfo() {
    // Implementation for editing personal information
    alert('Personal information editing feature coming soon!');
}

// Handle change password
function changePassword() {
    // Implementation for changing password
    alert('Password change feature coming soon!');
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('preferencesModal');
    if (e.target === modal) {
        closePreferencesModal();
    }
});
