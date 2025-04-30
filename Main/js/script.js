// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const NEWS_API_KEY = 'cad850f01c3841288162559ff80d9282';
const NEWS_API_URL = 'https://newsapi.org/v2/top-headlines';

// DOM Elements
const cardsContainer = document.getElementById('cards-container');
const searchInput = document.getElementById('search-text');
const searchButton = document.getElementById('search-button');
const authSection = document.getElementById('auth-section');
const profileSection = document.getElementById('profile-section');
const profileUsername = document.getElementById('profile-username');
const userInfoName = document.getElementById('user-info-name');

// Initialize user data
let currentUser = null;
let userPreferences = {};
let likedNews = [];

// Check authentication state
async function checkAuthState() {
    const token = localStorage.getItem('token');
    currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (token && currentUser) {
        try {
            // Get user preferences from backend
            const response = await fetch(`${API_BASE_URL}/preferences/${currentUser.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                userPreferences = data.preferences;
            }

            // Get liked news from backend
            const likedResponse = await fetch(`${API_BASE_URL}/liked-news/${currentUser.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (likedResponse.ok) {
                const data = await likedResponse.json();
                likedNews = data.likedNews;
            }

            // Update UI
            authSection.style.display = 'none';
            profileSection.style.display = 'flex';
            profileUsername.textContent = currentUser.name;
            userInfoName.textContent = currentUser.name;

            // Update profile image
            const profileImage = document.querySelector('.user-pic');
            if (currentUser.profileImage) {
                profileImage.src = currentUser.profileImage;
            }

        } catch (error) {
            console.error('Error loading user data:', error);
            logout();
        }
    } else {
        authSection.style.display = 'flex';
        profileSection.style.display = 'none';
        window.location.href = 'login.html';
    }
}

// Setup event listeners
function setupEventListeners() {
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Logout functionality
    document.getElementById('logout-button').addEventListener('click', logout);
}

// Handle search functionality
function handleSearch() {
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
        loadNews(searchTerm);
    }
}

// Load news based on user preferences or search term
async function loadNews(searchTerm = '') {
    try {
        let url = `${NEWS_API_URL}?apiKey=${NEWS_API_KEY}`;
        
        if (searchTerm) {
            url += `&q=${searchTerm}`;
        } else if (Object.keys(userPreferences).length > 0) {
            const categories = Object.values(userPreferences).flat();
            if (categories.length > 0) {
                url += `&q=${categories.join(' OR ')}`;
            }
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.articles) {
            displayNews(data.articles);
        }
    } catch (error) {
        console.error('Error fetching news:', error);
        displayError('Failed to load news. Please try again later.');
    }
}

// Display news articles
function displayNews(articles) {
    cardsContainer.innerHTML = '';
    
    articles.forEach(article => {
        const card = createNewsCard(article);
        cardsContainer.appendChild(card);
    });
}

// Create a news card element
function createNewsCard(article) {
    const card = document.createElement('div');
    card.className = 'news-card';
    
    const isLiked = likedNews.some(item => item.article_url === article.url);
    
    card.innerHTML = `
        <img src="${article.urlToImage || 'https://via.placeholder.com/400x200'}" alt="${article.title}">
        <div class="card-content">
            <h3>${article.title}</h3>
            <p>${article.description || 'No description available'}</p>
            <div class="card-meta">
                <span class="source">${article.source.name}</span>
                <span class="date">${new Date(article.publishedAt).toLocaleDateString()}</span>
            </div>
            <div class="card-actions">
                <button class="like-button ${isLiked ? 'liked' : ''}" onclick="toggleLike(${JSON.stringify(article).replace(/"/g, '&quot;')})">
                    <i class="fas fa-heart"></i>
                </button>
                <a href="${article.url}" target="_blank" class="read-more" onclick="addToReadingHistory(${JSON.stringify(article).replace(/"/g, '&quot;')})">
                    Read More
                </a>
            </div>
        </div>
    `;
    
    return card;
}

// Toggle like status for a news article
async function toggleLike(article) {
    if (!currentUser) return;

    try {
        const token = localStorage.getItem('token');
        const isLiked = likedNews.some(item => item.article_url === article.url);

        if (isLiked) {
            // Unlike article
            const response = await fetch(`${API_BASE_URL}/liked-news/${currentUser.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ articleUrl: article.url })
            });

            if (response.ok) {
                likedNews = likedNews.filter(item => item.article_url !== article.url);
            }
        } else {
            // Like article
            const response = await fetch(`${API_BASE_URL}/liked-news`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: currentUser.id,
                    article
                })
            });

            if (response.ok) {
                likedNews.push({
                    article_url: article.url,
                    article_title: article.title,
                    article_source: article.source.name,
                    date: new Date()
                });
            }
        }

        // Update UI
        const likeButton = event.currentTarget;
        likeButton.classList.toggle('liked');
        const icon = likeButton.querySelector('i');
        icon.classList.toggle('far');
        icon.classList.toggle('fas');

    } catch (error) {
        console.error('Error toggling like:', error);
        alert('Error updating like status. Please try again.');
    }
}

// Add article to reading history
async function addToReadingHistory(article) {
    if (!currentUser) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/reading-history`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUser.id,
                article
            })
        });

        if (!response.ok) {
            throw new Error('Error saving reading history');
        }

    } catch (error) {
        console.error('Error saving reading history:', error);
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthState();
    setupEventListeners();
    loadNews();
});

// Get category from source name
function getCategoryFromSource(sourceName) {
    const categories = {
        'sports': ['espn', 'sports', 'nba', 'nfl', 'mlb'],
        'technology': ['tech', 'wired', 'theverge', 'techcrunch'],
        'health': ['health', 'medical', 'wellness'],
        'finance': ['finance', 'business', 'market', 'economy'],
        'education': ['education', 'school', 'university', 'college']
    };
    
    const source = sourceName.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => source.includes(keyword))) {
            return category.charAt(0).toUpperCase() + category.slice(1);
        }
    }
    
    return 'General';
}

// Display error message
function displayError(message) {
    cardsContainer.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Handle navigation item clicks
function onNavItemClick(category) {
    loadNews(category);
}

// Reload the page
function reload() {
    window.location.reload();
}
