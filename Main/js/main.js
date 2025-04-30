// API Configuration
const API_BASE_URL = 'http://localhost:5000'; // Backend server URL
const NEWS_API_KEY = 'cad850f01c3841288162559ff80d9282'; // Your NewsAPI key
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

// Debug function to log API calls
function logApiCall(method, url, data = null) {
    console.log(`API Call: ${method} ${url}`);
    if (data) {
        console.log('Request Data:', data);
    }
}

// Debug function to log API response
function logApiResponse(response, data) {
    console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: data
    });
}

// Check authentication status
function checkAuth() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }
    updateProfileInfo();
}

// Update profile information in the header
function updateProfileInfo() {
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    const profileImages = document.querySelectorAll('.profile-image');
    const profileNames = document.querySelectorAll('.profile-name');
    const profileEmail = document.querySelector('.profile-email');

    // Update all profile images
    profileImages.forEach(img => {
        img.src = userData.profileImage || '../assets/images/default-avatar.png';
        img.alt = userData.name || 'Profile';
    });

    // Update all profile names
    profileNames.forEach(name => {
        name.textContent = userData.name || 'User';
    });

    // Update profile email
    if (profileEmail) {
        profileEmail.textContent = userData.email || '';
    }
}

// Handle logout
function handleLogout() {
    try {
        // Clear all user data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        localStorage.removeItem('currentUser');
        
        // Clear the userData object
        userData = {
            lastViewedArticles: [],
            savedArticles: [],
            preferences: {
                categories: [],
                sources: []
            }
        };
        
        // Redirect to login page
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error during logout:', error);
        // Even if there's an error, still try to redirect
        window.location.href = 'login.html';
    }
}

// DOM Elements
const newsGrid = document.querySelector('.news-grid');
const newsList = document.querySelector('.news-list');
const searchInput = document.querySelector('.search-input');
const searchButton = document.querySelector('.search-button');
const categoryLinks = document.querySelectorAll('.category-dropdown-content a');
const subcategoryLinks = document.querySelectorAll('.subcategory-group a');
const trendingLink = document.querySelector('.trending-link');
const popularLink = document.querySelector('.popular-link');
const latestLink = document.querySelector('.latest-link');
const featuredLink = document.querySelector('.featured-link');

// Initialize user data
let userData = JSON.parse(localStorage.getItem('userData')) || {
    lastViewedArticles: [],
    savedArticles: [],
    preferences: {
        categories: [],
        sources: []
    }
};

// Function to update user data in localStorage
function updateUserData(newData) {
    userData = { ...userData, ...newData };
    localStorage.setItem('userData', JSON.stringify(userData));
}

// Update profile display
function updateProfileDisplay() {
    const profileName = document.querySelector('.profile-name');
    if (userData.name) {
        profileName.textContent = userData.name;
    }
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'No date available';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
}

// Fetch news from NewsAPI
async function fetchNews(endpoint, params = {}) {
    try {
        // Add default parameters
        const defaultParams = {
            apiKey: NEWS_API_KEY,
            language: 'en',
            pageSize: 20
        };

        // Merge default and provided parameters
        const queryParams = new URLSearchParams({
            ...defaultParams,
            ...params
        });

        const url = `${NEWS_API_BASE_URL}/${endpoint}?${queryParams}`;
        console.log('Fetching news from URL:', url);

        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('NewsAPI Error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            
            // Handle specific error cases
            if (response.status === 401) {
                throw new Error('Invalid API key. Please check your NewsAPI key.');
            } else if (response.status === 429) {
                throw new Error('API rate limit exceeded. Please try again later.');
            } else {
                throw new Error(`NewsAPI error: ${response.status} - ${errorData.message || response.statusText}`);
            }
        }

        const data = await response.json();
        console.log('NewsAPI Response:', {
            status: data.status,
            totalResults: data.totalResults,
            articlesCount: data.articles?.length,
            endpoint: endpoint,
            params: params
        });

        if (data.status === 'error') {
            throw new Error(data.message || 'Error fetching news');
        }

        if (!data.articles || data.articles.length === 0) {
            console.warn('No articles found for query:', {
                endpoint: endpoint,
                params: params,
                totalResults: data.totalResults
            });
            const newsGrid = document.querySelector('.news-grid');
            if (newsGrid) {
                newsGrid.innerHTML = `
                    <div class="no-articles">
                        <p>No articles found for this category.</p>
                        <p>Please try a different category or check back later.</p>
                    </div>
                `;
            }
            return [];
        }

        return data.articles;
    } catch (error) {
        console.error('Error in fetchNews:', error);
        const newsGrid = document.querySelector('.news-grid');
        if (newsGrid) {
            newsGrid.innerHTML = `
                <div class="error-message">
                    <p>Unable to fetch news at the moment.</p>
                    <p>Error: ${error.message}</p>
                    <p>Please try again later or check your NewsAPI key.</p>
                </div>
            `;
        }
        return [];
    }
}

// Display news in grid format
function displayNewsGrid(articles) {
    const newsGrid = document.querySelector('.news-grid');
    if (!newsGrid) {
        console.error('News grid element not found');
        return;
    }

    if (!articles || articles.length === 0) {
        newsGrid.innerHTML = '<p class="no-articles">No articles found.</p>';
        return;
    }

    newsGrid.innerHTML = '';
    articles.forEach(article => {
        const card = createNewsCard(article);
        newsGrid.appendChild(card);
    });
}

// Display news in list format
function displayNewsList(articles) {
    if (!newsList) {
        console.error('News list element not found');
        return;
    }
    newsList.innerHTML = '';
    articles.forEach(article => {
        const listItem = createNewsListItem(article);
        newsList.appendChild(listItem);
    });
}

// Create news card
function createNewsCard(article) {
    const isBookmarked = userData?.savedArticles?.some(item => item.articleUrl === article.url) || false;
    
    // Use a proper fallback image path
    const fallbackImage = '../assets/images/default-news.jpg';
    
    // Create the card element
    const card = document.createElement('div');
    card.className = 'news-card';
    card.setAttribute('data-id', article.url);
    
    // Store article data in data attributes
    card.setAttribute('data-title', article.title);
    card.setAttribute('data-description', article.description || '');
    card.setAttribute('data-image', article.urlToImage || fallbackImage);
    card.setAttribute('data-source', article.source?.name || 'Unknown Source');
    card.setAttribute('data-published-at', article.publishedAt || new Date().toISOString());
    
    // Create the card content
    card.innerHTML = `
        <div class="news-image-container">
            <img src="${article.urlToImage || fallbackImage}" 
                 alt="${article.title}"
                 onerror="this.onerror=null; this.src='${fallbackImage}';"
                 class="news-image">
        </div>
        <div class="news-content">
            <h3 class="news-title">${article.title}</h3>
            <p class="news-description">${article.description || 'No description available'}</p>
            <div class="news-meta">
                <span class="news-source">${article.source?.name || 'Unknown Source'}</span>
                <span class="news-date">${formatDate(article.publishedAt)}</span>
            </div>
            <div class="news-actions">
                <div class="interaction-buttons">
                    <button class="bookmark-btn ${isBookmarked ? 'active' : ''}" 
                            data-tooltip="${isBookmarked ? 'Saved' : 'Save for later'}">
                        <i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i>
                    </button>
                </div>
                <a href="${article.url}" target="_blank" class="read-more" onclick="addToRecentlyViewed(${JSON.stringify(article)})">Read More</a>
            </div>
        </div>
    `;
    
    // Add event listeners
    const bookmarkBtn = card.querySelector('.bookmark-btn');
    bookmarkBtn.addEventListener('click', () => toggleBookmark(article.url));
    
    return card;
}

// Toggle bookmark status
async function toggleBookmark(articleUrl) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login to bookmark articles');
            return;
        }

        // Find the bookmark button for this article
        const bookmarkButton = document.querySelector(`.news-card[data-id="${articleUrl}"] .bookmark-btn`);
        if (!bookmarkButton) {
            console.error('Bookmark button not found for article:', articleUrl);
            return;
        }

        const isBookmarked = bookmarkButton.classList.contains('active');
        const icon = bookmarkButton.querySelector('i');

        // Get the article data from the card
        const articleCard = document.querySelector(`.news-card[data-id="${articleUrl}"]`);
        if (!articleCard) {
            console.error('Article card not found:', articleUrl);
            return;
        }

        // Get the article data from the card's data attributes
        const articleData = {
            articleUrl: articleUrl,
            articleTitle: articleCard.getAttribute('data-title'),
            articleDescription: articleCard.getAttribute('data-description'),
            articleImage: articleCard.getAttribute('data-image'),
            articleSource: articleCard.getAttribute('data-source'),
            articlePublishedAt: articleCard.getAttribute('data-published-at')
        };

        let response;

        if (isBookmarked) {
            // Remove bookmark
            response = await fetch(`${API_BASE_URL}/api/user/bookmarks/${encodeURIComponent(articleUrl)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                bookmarkButton.classList.remove('active');
                icon.classList.replace('fas', 'far');
                
                // Update local storage
                userData.savedArticles = userData.savedArticles.filter(item => item.articleUrl !== articleUrl);
                localStorage.setItem('userData', JSON.stringify(userData));
                
                // Update saved articles count in dropdown
                updateSavedArticlesCount();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to remove bookmark');
            }
        } else {
            // Add bookmark
            response = await fetch(`${API_BASE_URL}/api/user/bookmarks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(articleData)
            });

            if (response.ok) {
                bookmarkButton.classList.add('active');
                icon.classList.replace('far', 'fas');
                
                // Update local storage
                userData.savedArticles.push(articleData);
                localStorage.setItem('userData', JSON.stringify(userData));
                
                // Update saved articles count in dropdown
                updateSavedArticlesCount();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add bookmark');
            }
        }
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        // Show error in UI
        const newsCard = document.querySelector(`.news-card[data-id="${articleUrl}"]`);
        if (newsCard) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                <p>${error.message}</p>
            `;
            newsCard.appendChild(errorDiv);
            
            // Remove error message after 3 seconds
            setTimeout(() => {
                errorDiv.remove();
            }, 3000);
        }
    }
}

// Function to update saved articles count in dropdown
function updateSavedArticlesCount() {
    const savedArticlesLink = document.getElementById('saved-articles');
    if (savedArticlesLink) {
        const count = userData.savedArticles?.length || 0;
        savedArticlesLink.innerHTML = `
            <i class="fas fa-bookmark"></i> Saved Articles 
            <span class="badge">${count}</span>
        `;
    }
}

// Function to load saved articles
async function loadSavedArticles() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login to view saved articles');
            return;
        }

        // Clear existing news content
        const newsGrid = document.querySelector('.news-grid');
        if (!newsGrid) {
            console.error('News grid element not found');
            return;
        }

        // Show loading state
        newsGrid.innerHTML = '<div class="loading">Loading saved articles...</div>';

        // Fetch saved articles from the backend
        const response = await fetch(`${API_BASE_URL}/api/user/bookmarks`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch saved articles');
        }

        const data = await response.json();
        const savedArticles = data.bookmarks || [];

        if (savedArticles.length === 0) {
            newsGrid.innerHTML = `
                <div class="no-articles">
                    <i class="fas fa-bookmark"></i>
                    <p>No saved articles yet.</p>
                    <p>Bookmark articles to view them here.</p>
                </div>
            `;
            return;
        }

        // Convert saved articles to the format expected by createNewsCard
        const formattedArticles = savedArticles.map(article => ({
            url: article.articleUrl,
            title: article.articleTitle,
            description: article.articleDescription,
            urlToImage: article.articleImage,
            source: { name: article.articleSource },
            publishedAt: article.articlePublishedAt,
            isBookmarked: true // Mark as bookmarked since these are saved articles
        }));

        // Display saved articles
        displayNewsGrid(formattedArticles);
        
        // Update header text
        const headerText = document.querySelector('.header-text');
        if (headerText) {
            headerText.textContent = 'Saved Articles';
        }
    } catch (error) {
        console.error('Error loading saved articles:', error);
        const newsGrid = document.querySelector('.news-grid');
        if (newsGrid) {
            newsGrid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading saved articles</p>
                    <p>${error.message}</p>
                    <button onclick="loadSavedArticles()" class="retry-btn">Try Again</button>
                </div>
            `;
        }
    }
}

// Create news list item
function createNewsListItem(article) {
    const item = document.createElement('div');
    item.className = 'news-item';
    item.innerHTML = `
        <div class="news-item-content">
            <h3>${article.title}</h3>
            <p>${article.description || ''}</p>
            <div class="news-meta">
                <span>${article.source.name}</span>
                <span>${new Date(article.publishedAt).toLocaleDateString()}</span>
            </div>
        </div>
        <a href="${article.url}" target="_blank" class="read-more">Read More</a>
    `;
    return item;
}

// Load trending news
async function loadTrendingNews() {
    try {
        const newsGrid = document.querySelector('.news-grid');
        if (!newsGrid) {
            console.error('News grid element not found');
            return;
        }

        // Show loading state
        newsGrid.innerHTML = '<div class="loading">Loading trending news...</div>';

        // Try multiple endpoints and parameters to ensure we get results
        let articles = await fetchNews('top-headlines', {
            country: 'us',
            category: 'general',
            pageSize: 20
        });

        // If no articles found, try a different approach
        if (articles.length === 0) {
            articles = await fetchNews('everything', {
                q: 'news',
                sortBy: 'popularity',
                language: 'en',
                pageSize: 20
            });
        }

        if (articles.length === 0) {
            newsGrid.innerHTML = `
                <div class="no-articles">
                    <p>No trending articles found at the moment.</p>
                    <p>Please try again later or check your NewsAPI key.</p>
                </div>
            `;
            return;
        }

        displayNewsGrid(articles);
    } catch (error) {
        console.error('Error loading trending news:', error);
        const newsGrid = document.querySelector('.news-grid');
        if (newsGrid) {
            newsGrid.innerHTML = `
                <div class="error-message">
                    <p>Failed to load trending news.</p>
                    <p>Error: ${error.message}</p>
                </div>
            `;
        }
    }
}

// Load popular news
async function loadPopularNews() {
    try {
        // Clear existing news content
        const newsGrid = document.querySelector('.news-grid');
        if (newsGrid) newsGrid.innerHTML = '';
        
        // Update header text
        const headerText = document.querySelector('.header-text');
        if (headerText) {
            headerText.textContent = 'Popular News';
        }
        
        // Hide all subcategories
        hideAllSubcategories();
        
        // Fetch popular news
        const articles = await fetchNews('everything', {
            sortBy: 'popularity',
            pageSize: 20
        });
        
        // Display results
        displayNewsGrid(articles);
        
        // Update page title
        document.title = 'Popular News | News Portal';
        
        // Reset category button to default
        const categoryButton = document.querySelector('.category-button');
        if (categoryButton) {
            categoryButton.innerHTML = '<i class="fas fa-newspaper"></i> Categories <i class="fas fa-chevron-down"></i>';
        }
    } catch (error) {
        console.error('Error loading popular news:', error);
    }
}

// Load latest news
async function loadLatestNews() {
    try {
        // Clear existing news content
        const newsGrid = document.querySelector('.news-grid');
        if (newsGrid) newsGrid.innerHTML = '';
        
        // Update header text
        const headerText = document.querySelector('.header-text');
        if (headerText) {
            headerText.textContent = 'Latest News';
        }
        
        // Hide all subcategories
        hideAllSubcategories();
        
        // Fetch latest news
        const articles = await fetchNews('everything', {
            sortBy: 'publishedAt',
            pageSize: 20
        });
        
        // Display results
        displayNewsGrid(articles);
        
        // Update page title
        document.title = 'Latest News | News Portal';
        
        // Reset category button to default
        const categoryButton = document.querySelector('.category-button');
        if (categoryButton) {
            categoryButton.innerHTML = '<i class="fas fa-newspaper"></i> Categories <i class="fas fa-chevron-down"></i>';
        }
    } catch (error) {
        console.error('Error loading latest news:', error);
    }
}

// Load featured news
async function loadFeaturedNews() {
    try {
        // Clear existing news content
        const newsGrid = document.querySelector('.news-grid');
        if (newsGrid) newsGrid.innerHTML = '';
        
        // Update header text
        const headerText = document.querySelector('.header-text');
        if (headerText) {
            headerText.textContent = 'Featured News';
        }
        
        // Hide all subcategories
        hideAllSubcategories();
        
        // Fetch featured news (using top headlines with specific criteria)
        const articles = await fetchNews('top-headlines', {
            country: 'us',
            category: 'general',
            pageSize: 20
        });
        
        // Display results
        displayNewsGrid(articles);
        
        // Update page title
        document.title = 'Featured News | News Portal';
        
        // Reset category button to default
        const categoryButton = document.querySelector('.category-button');
        if (categoryButton) {
            categoryButton.innerHTML = '<i class="fas fa-newspaper"></i> Categories <i class="fas fa-chevron-down"></i>';
        }
    } catch (error) {
        console.error('Error loading featured news:', error);
    }
}

// Function to update page content for a category
async function updatePageForCategory(category, subcategory = null) {
    console.log('Updating page for category:', category, 'subcategory:', subcategory);
    
    // Update page title
    document.title = `${category}${subcategory ? ` - ${subcategory}` : ''} | News Portal`;
    
    // Update header text
    const headerText = document.querySelector('.header-text');
    if (headerText) {
        headerText.textContent = `${category}${subcategory ? ` - ${subcategory}` : ''}`;
    }
    
    // Load and display news
    let articles = [];
    if (subcategory) {
        articles = await fetchNews('everything', {
            q: `${category} ${subcategory}`,
            sortBy: 'publishedAt',
            pageSize: 20
        });
    } else {
        articles = await fetchNews('everything', {
            q: category,
            sortBy: 'publishedAt',
            pageSize: 20
        });
    }
    
    // Clear existing news content
    const newsGrid = document.querySelector('.news-grid');
    const newsList = document.querySelector('.news-list');
    if (newsGrid) newsGrid.innerHTML = '';
    if (newsList) newsList.innerHTML = '';
    
    // Display news in grid format for the main section
    displayNewsGrid(articles);
    
    // Update active states
    updateActiveStates(category, subcategory);
}

// Display category news in list format
function displayCategoryNewsList(articles) {
    const categoryNewsList = document.querySelector('.category-news-list');
    if (!categoryNewsList) {
        console.error('Category news list element not found');
        return;
    }
    categoryNewsList.innerHTML = '';
    articles.forEach(article => {
        const listItem = createNewsListItem(article);
        categoryNewsList.appendChild(listItem);
    });
}

// Function to update active states
function updateActiveStates(category, subcategory) {
    // Update category dropdown text
    const categoryButton = document.querySelector('.category-button');
    if (categoryButton) {
        // Get the icon for the selected category
        const categoryIcon = document.querySelector(`.category-dropdown-content a[data-category="${category}"] i`).className;
        // Update button content with icon and category name
        categoryButton.innerHTML = `<i class="${categoryIcon}"></i> ${category} <i class="fas fa-chevron-down"></i>`;
    }
    
    // Update subcategories
    hideAllSubcategories();
    const subcategoryGroup = document.querySelector(`.subcategory-group[data-category="${category}"]`);
    if (subcategoryGroup) {
        subcategoryGroup.classList.add('active');
        if (subcategory) {
            const subcategoryLink = subcategoryGroup.querySelector(`a[data-subcategory="${subcategory}"]`);
            if (subcategoryLink) {
                setActiveSubcategory(subcategoryLink);
            }
        }
    }
}

// Function to show subcategories for a category
function showSubcategories(category) {
    console.log('Showing subcategories for category:', category);
    hideAllSubcategories();
    const subcategoryGroup = document.querySelector(`.subcategory-group[data-category="${category}"]`);
    if (subcategoryGroup) {
        subcategoryGroup.classList.add('active');
        // Load initial subcategory news (All news for the category)
        const allSubcategory = subcategoryGroup.querySelector('a[data-subcategory="all"]');
        if (allSubcategory) {
            setActiveSubcategory(allSubcategory);
            loadNewsBySubcategory(category, 'all');
        }
        // Update the category button text
        updateActiveStates(category, 'all');
    } else {
        console.error('Subcategory group not found for category:', category);
    }
}

// Function to hide all subcategories
function hideAllSubcategories() {
    const subcategoryGroups = document.querySelectorAll('.subcategory-group');
    subcategoryGroups.forEach(group => {
        group.classList.remove('active');
    });
    // Remove active class from all subcategory links
    const subcategoryLinks = document.querySelectorAll('.subcategory-group a');
    subcategoryLinks.forEach(link => link.classList.remove('active'));
}

// Function to set active subcategory
function setActiveSubcategory(link) {
    const subcategoryLinks = document.querySelectorAll('.subcategory-group a');
    subcategoryLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
}

// Load news by subcategory
async function loadNewsBySubcategory(category, subcategory) {
    console.log('Loading news for category:', category, 'subcategory:', subcategory);
    try {
        let articles = [];
        if (subcategory === 'all') {
            // Fetch all news for the category
            articles = await fetchNews('everything', {
                q: category,
                sortBy: 'publishedAt',
                pageSize: 20
            });
        } else {
            // Fetch news for specific subcategory
            articles = await fetchNews('everything', {
                q: `${category} ${subcategory}`,
                sortBy: 'publishedAt',
                pageSize: 20
            });
        }
        console.log('Fetched articles:', articles.length);
        displayNewsGrid(articles);
    } catch (error) {
        console.error('Error loading subcategory news:', error);
    }
}

// Search news
async function searchNews(query) {
    if (!query.trim()) return;
    
    try {
        // Clear existing news content
        const newsGrid = document.querySelector('.news-grid');
        if (newsGrid) newsGrid.innerHTML = '';
        
        // Update header text
        const headerText = document.querySelector('.header-text');
        if (headerText) {
            headerText.textContent = `Search Results for: ${query}`;
        }
        
        // Hide all subcategories
        hideAllSubcategories();
        
        // Fetch search results
        const articles = await fetchNews('everything', {
            q: query,
            sortBy: 'publishedAt',
            pageSize: 20
        });
        
        // Display results
        displayNewsGrid(articles);
        
        // Update page title
        document.title = `Search: ${query} | News Portal`;
        
        // Reset category button to default
        const categoryButton = document.querySelector('.category-button');
        if (categoryButton) {
            categoryButton.innerHTML = '<i class="fas fa-newspaper"></i> Categories <i class="fas fa-chevron-down"></i>';
        }
    } catch (error) {
        console.error('Error searching news:', error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check authentication
        checkAuth();
        
        // Update profile info
        updateProfileInfo();
        
        // Load user data from localStorage
        userData = JSON.parse(localStorage.getItem('userData')) || {
            lastViewedArticles: [],
            savedArticles: [],
            preferences: {
                categories: [],
                sources: []
            }
        };

        // If we have a token, fetch the latest saved articles from the backend
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/user/bookmarks`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    userData.savedArticles = data.bookmarks || [];
                    localStorage.setItem('userData', JSON.stringify(userData));
                    
                    // Update bookmark status for all existing articles
                    updateBookmarkStatusForAllArticles();
                }
            } catch (error) {
                console.error('Error fetching saved articles:', error);
            }
        }

        // Update saved articles count
        updateSavedArticlesCount();

        // Check if we're on the saved articles page
        if (window.location.pathname.includes('saved-articles.html')) {
            loadSavedArticles();
        } else {
            // Load initial category news
            loadInitialCategoryNews();
        }
        
        // Setup infinite scroll
        setupInfiniteScroll();

        // Search functionality
        function handleSearch() {
            const query = searchInput.value.trim();
            if (query) {
                searchNews(query);
            }
        }

        if (searchButton) {
            searchButton.addEventListener('click', handleSearch);
        }
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSearch();
                }
            });
        }

        // Category Dropdown Functionality
        const categoryDropdown = document.querySelector('.category-dropdown');
        const categoryButton = document.querySelector('.category-button');
        const categoryDropdownContent = document.querySelector('.category-dropdown-content');

        if (categoryButton && categoryDropdownContent) {
            categoryButton.addEventListener('click', () => {
                categoryDropdownContent.style.display = 
                    categoryDropdownContent.style.display === 'block' ? 'none' : 'block';
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (categoryDropdown && !categoryDropdown.contains(e.target)) {
                categoryDropdownContent.style.display = 'none';
            }
        });

        // Category links
        if (categoryLinks.length > 0) {
            categoryLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const category = link.getAttribute('data-category');
                    showSubcategories(category);
                    if (categoryDropdownContent) {
                        categoryDropdownContent.style.display = 'none';
                    }
                });
            });
        }

        // Subcategory links
        if (subcategoryLinks.length > 0) {
            subcategoryLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const category = link.closest('.subcategory-group').getAttribute('data-category');
                    const subcategory = link.getAttribute('data-subcategory');
                    setActiveSubcategory(link);
                    loadNewsBySubcategory(category, subcategory);
                });
            });
        }

        // Quick links
        if (trendingLink) {
            trendingLink.addEventListener('click', (e) => {
                e.preventDefault();
                loadTrendingNews();
            });
        }

        if (popularLink) {
            popularLink.addEventListener('click', (e) => {
                e.preventDefault();
                loadPopularNews();
            });
        }

        if (latestLink) {
            latestLink.addEventListener('click', (e) => {
                e.preventDefault();
                loadLatestNews();
            });
        }

        if (featuredLink) {
            featuredLink.addEventListener('click', (e) => {
                e.preventDefault();
                loadFeaturedNews();
            });
        }

        // Saved articles link
        const savedArticlesLink = document.getElementById('saved-articles');
        if (savedArticlesLink) {
            savedArticlesLink.addEventListener('click', (e) => {
                e.preventDefault();
                loadSavedArticles();
            });
        }

        // Profile dropdown actions
        document.getElementById('recently-viewed')?.addEventListener('click', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('token');
            
            if (!token) {
                // If not logged in, use localStorage data
                const userData = JSON.parse(localStorage.getItem('userData')) || {};
                if (userData.lastViewedArticles && userData.lastViewedArticles.length > 0) {
                    const articlesWithBookmarkStatus = userData.lastViewedArticles.map(article => ({
                        ...article,
                        isBookmarked: userData.savedArticles?.some(saved => saved.articleUrl === article.url) || false
                    }));
                    
                    displayNewsGrid(articlesWithBookmarkStatus);
                    document.querySelector('.header-text').textContent = 'Recently Viewed Articles';
                } else {
                    showNoArticlesMessage('No recently viewed articles yet.');
                }
                return;
            }

            try {
                // If logged in, fetch from backend
                const response = await fetch(`${API_BASE_URL}/api/user/recently-viewed`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch recently viewed articles');
                }

                const data = await response.json();
                const recentlyViewed = data.recentlyViewed || [];

                if (recentlyViewed.length === 0) {
                    showNoArticlesMessage('No recently viewed articles yet.');
                    return;
                }

                // Convert to format expected by createNewsCard
                const formattedArticles = recentlyViewed.map(article => ({
                    url: article.articleUrl,
                    title: article.articleTitle,
                    description: article.articleDescription,
                    urlToImage: article.articleImage,
                    source: { name: article.articleSource },
                    publishedAt: article.articlePublishedAt,
                    isBookmarked: userData.savedArticles?.some(saved => saved.articleUrl === article.articleUrl) || false
                }));

                displayNewsGrid(formattedArticles);
                document.querySelector('.header-text').textContent = 'Recently Viewed Articles';
            } catch (error) {
                console.error('Error loading recently viewed articles:', error);
                showNoArticlesMessage('Error loading recently viewed articles. Please try again later.');
            }
        });

        document.getElementById('edit-profile')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'profile.html';
        });

        // Logout button event listener
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleLogout();
            });
        }

    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

// Load initial category news
async function loadInitialCategoryNews() {
    const defaultCategory = 'general';
    const defaultSubcategory = 'all';
    updatePageForCategory(defaultCategory, defaultSubcategory);
    // Update the category button text for initial load
    updateActiveStates(defaultCategory, defaultSubcategory);
}

// Add infinite scroll functionality
function setupInfiniteScroll() {
    let isLoading = false;
    
    window.addEventListener('scroll', async () => {
        // Check if we're near the bottom of the page
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000 && !isLoading) {
            isLoading = true;
            try {
                const currentCategory = document.querySelector('.category-button').textContent.trim();
                const currentSubcategory = document.querySelector('.subcategory-group.active a.active')?.getAttribute('data-subcategory') || 'all';
                
                // Get current page number from data attribute or default to 1
                const currentPage = parseInt(newsGrid.getAttribute('data-page')) || 1;
                const nextPage = currentPage + 1;
                
                // Fetch more news based on current category/subcategory
                let articles = [];
                if (currentCategory === 'Categories') {
                    articles = await fetchNews('top-headlines', {
                        country: 'us',
                        pageSize: 20,
                        page: nextPage
                    });
                } else {
                    articles = await fetchNews('everything', {
                        q: `${currentCategory} ${currentSubcategory !== 'all' ? currentSubcategory : ''}`,
                        sortBy: 'publishedAt',
                        pageSize: 20,
                        page: nextPage
                    });
                }
                
                // Display new articles
                articles.forEach(article => {
                    const card = createNewsCard(article);
                    newsGrid.appendChild(card);
                });
                
                // Update page number
                newsGrid.setAttribute('data-page', nextPage);
                
                // If no more articles, remove the scroll listener
                if (articles.length < 20) {
                    window.removeEventListener('scroll', setupInfiniteScroll);
                }
            } catch (error) {
                console.error('Error loading more news:', error);
            } finally {
                isLoading = false;
            }
        }
    });
}

// Update user menu in navigation
function updateUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (currentUser) {
        userMenu.innerHTML = `
            <div class="user-info">
                <img src="${currentUser.profileImage || '../assets/images/default-profile.png'}" alt="Profile" class="profile-image">
                <span class="user-name">${currentUser.name}</span>
            </div>
            <div class="dropdown-content">
                <a href="pages/profile.html">Profile</a>
                <a href="#" onclick="logout()">Logout</a>
            </div>
        `;
    } else {
        userMenu.innerHTML = `
            <a href="pages/login.html" class="login-btn">Login</a>
            <a href="pages/signup.html" class="signup-btn">Sign Up</a>
        `;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Call updateUserMenu when the page loads
document.addEventListener('DOMContentLoaded', () => {
    updateUserMenu();
    updateProfileInfo();
    // ... rest of your existing DOMContentLoaded code ...
});

// Function to update bookmark status for all existing articles
function updateBookmarkStatusForAllArticles() {
    const newsCards = document.querySelectorAll('.news-card');
    newsCards.forEach(card => {
        const articleUrl = card.getAttribute('data-id');
        const isBookmarked = userData.savedArticles?.some(item => item.articleUrl === articleUrl) || false;
        
        const bookmarkBtn = card.querySelector('.bookmark-btn');
        const icon = bookmarkBtn.querySelector('i');
        
        if (isBookmarked) {
            bookmarkBtn.classList.add('active');
            bookmarkBtn.setAttribute('data-tooltip', 'Saved');
            icon.classList.replace('far', 'fas');
        } else {
            bookmarkBtn.classList.remove('active');
            bookmarkBtn.setAttribute('data-tooltip', 'Save for later');
            icon.classList.replace('fas', 'far');
        }
    });
}

// Function to add article to recently viewed
async function addToRecentlyViewed(article) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            // If not logged in, just store in localStorage
            const userData = JSON.parse(localStorage.getItem('userData')) || {
                lastViewedArticles: [],
                savedArticles: [],
                preferences: {
                    categories: [],
                    sources: []
                }
            };

            const viewedArticle = {
                url: article.url,
                title: article.title,
                description: article.description,
                urlToImage: article.urlToImage,
                source: { name: article.source?.name || 'Unknown Source' },
                publishedAt: article.publishedAt,
                viewedAt: new Date().toISOString()
            };

            userData.lastViewedArticles = userData.lastViewedArticles.filter(
                item => item.url !== article.url
            );

            userData.lastViewedArticles.unshift(viewedArticle);
            userData.lastViewedArticles = userData.lastViewedArticles.slice(0, 5);
            localStorage.setItem('userData', JSON.stringify(userData));
            return;
        }

        // If logged in, send to backend
        const response = await fetch(`${API_BASE_URL}/api/user/recently-viewed`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                articleUrl: article.url,
                articleTitle: article.title,
                articleDescription: article.description,
                articleImage: article.urlToImage,
                articleSource: article.source?.name || 'Unknown Source',
                articlePublishedAt: article.publishedAt
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save recently viewed article');
        }
    } catch (error) {
        console.error('Error saving recently viewed article:', error);
    }
}

function showNoArticlesMessage(message) {
    const newsGrid = document.querySelector('.news-grid');
    if (newsGrid) {
        newsGrid.innerHTML = `
            <div class="no-articles">
                <i class="fas fa-history"></i>
                <p>${message}</p>
                <p>Articles you view will appear here.</p>
            </div>
        `;
    }
} 