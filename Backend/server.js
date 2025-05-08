const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/database');
require('dotenv').config();
const fetch = require('node-fetch');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Import models
const User = require('./models/User');
const Article = require('./models/Article');
const UserInteraction = require('./models/UserInteraction');
const SearchHistory = require('./models/SearchHistory');
const RecentlyViewed = require('./models/RecentlyViewed');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Create new user
        const user = new User({
            name,
            email,
            password
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Error creating user' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await user.comparePassword(password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage,
                preferences: user.preferences
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Error fetching profile' });
    }
});

// Update user profile
app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
        const { name, profileImage, preferences } = req.body;
        const userId = req.user.userId;

        const updateFields = {};
        if (name) updateFields.name = name;
        if (profileImage) updateFields.profileImage = profileImage;
        if (preferences) updateFields.preferences = preferences;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Error updating profile' });
    }
});

// Save article interaction
app.post('/api/interactions', authenticateToken, async (req, res) => {
    try {
        const { articleId, interactionType, metadata } = req.body;

        const interaction = new UserInteraction({
            userId: req.user.userId,
            articleId,
            interactionType,
            metadata
        });

        await interaction.save();

        // Update article stats
        await Article.findByIdAndUpdate(articleId, {
            $inc: {
                [`stats.${interactionType}s`]: 1
            }
        });

        res.json({ message: 'Interaction saved successfully' });
    } catch (error) {
        console.error('Save interaction error:', error);
        res.status(500).json({ error: 'Error saving interaction' });
    }
});

// Get user interactions
app.get('/api/interactions', authenticateToken, async (req, res) => {
    try {
        const { type, limit = 10, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        const query = { userId: req.user.userId };
        if (type) query.interactionType = type;

        const interactions = await UserInteraction.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('articleId', 'title url urlToImage source publishedAt');

        res.json(interactions);
    } catch (error) {
        console.error('Get interactions error:', error);
        res.status(500).json({ error: 'Error fetching interactions' });
    }
});

// Save search history
app.post('/api/search-history', authenticateToken, async (req, res) => {
    try {
        const { query, results, filters, metadata } = req.body;

        const searchHistory = new SearchHistory({
            userId: req.user.userId,
            query,
            results,
            filters,
            metadata
        });

        await searchHistory.save();

        res.json({ message: 'Search history saved successfully' });
    } catch (error) {
        console.error('Save search history error:', error);
        res.status(500).json({ error: 'Error saving search history' });
    }
});

// Get search history
app.get('/api/search-history', authenticateToken, async (req, res) => {
    try {
        const { limit = 10, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        const searchHistory = await SearchHistory.find({ userId: req.user.userId })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json(searchHistory);
    } catch (error) {
        console.error('Get search history error:', error);
        res.status(500).json({ error: 'Error fetching search history' });
    }
});

// Save article as bookmark
app.post('/api/user/bookmarks', authenticateToken, async (req, res) => {
    try {
        const { articleUrl, articleTitle, articleDescription, articleImage, articleSource, articlePublishedAt } = req.body;
        const userId = req.user.userId;

        // Check if article is already bookmarked
        const existingBookmark = await UserInteraction.findOne({
            userId,
            articleUrl,
            interactionType: 'bookmark'
        });

        if (existingBookmark) {
            return res.status(400).json({ error: 'Article already bookmarked' });
        }

        // Create new bookmark
        const bookmark = new UserInteraction({
            userId,
            articleUrl,
            articleTitle,
            articleDescription,
            articleImage,
            articleSource,
            articlePublishedAt,
            interactionType: 'bookmark'
        });

        await bookmark.save();

        res.status(201).json({
            message: 'Article bookmarked successfully',
            bookmark
        });
    } catch (error) {
        console.error('Bookmark error:', error);
        res.status(500).json({ error: 'Error saving bookmark' });
    }
});

// Remove bookmark
app.delete('/api/user/bookmarks/:articleUrl', authenticateToken, async (req, res) => {
    try {
        const { articleUrl } = req.params;
        const userId = req.user.userId;

        const result = await UserInteraction.findOneAndDelete({
            userId,
            articleUrl,
            interactionType: 'bookmark'
        });

        if (!result) {
            return res.status(404).json({ error: 'Bookmark not found' });
        }

        res.json({ message: 'Bookmark removed successfully' });
    } catch (error) {
        console.error('Remove bookmark error:', error);
        res.status(500).json({ error: 'Error removing bookmark' });
    }
});

// Get user's bookmarks
app.get('/api/user/bookmarks', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const bookmarks = await UserInteraction.find({
            userId,
            interactionType: 'bookmark'
        }).sort({ timestamp: -1 });

        res.json({ bookmarks });
    } catch (error) {
        console.error('Get bookmarks error:', error);
        res.status(500).json({ error: 'Error fetching bookmarks' });
    }
});

// Save article to likes
app.post('/api/user/likes', authenticateToken, async (req, res) => {
    try {
        const { url, title, description, urlToImage, source, publishedAt } = req.body;
        const userId = req.user.userId;

        // Check if article is already liked
        const existingLike = await UserInteraction.findOne({
            userId,
            articleUrl: url,
            interactionType: 'like'
        });

        if (existingLike) {
            return res.status(400).json({ error: 'Article already liked' });
        }

        // Create new like
        const like = new UserInteraction({
            userId,
            articleUrl: url,
            articleTitle: title,
            articleDescription: description,
            articleImage: urlToImage,
            articleSource: source,
            articlePublishedAt: publishedAt,
            interactionType: 'like'
        });

        await like.save();

        res.status(201).json({
            message: 'Article liked successfully',
            like
        });
    } catch (error) {
        console.error('Like error:', error);
        res.status(500).json({ error: 'Error saving like' });
    }
});

// Remove article from likes
app.delete('/api/user/likes/:articleUrl', authenticateToken, async (req, res) => {
    try {
        const { articleUrl } = req.params;
        const userId = req.user.userId;

        const like = await UserInteraction.findOneAndDelete({
            userId,
            articleUrl,
            interactionType: 'like'
        });

        if (!like) {
            return res.status(404).json({ error: 'Like not found' });
        }

        res.json({ message: 'Like removed successfully' });
    } catch (error) {
        console.error('Remove like error:', error);
        res.status(500).json({ error: 'Error removing like' });
    }
});

// Get user's likes
app.get('/api/user/likes', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = 20, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        const likes = await UserInteraction.find({
            userId,
            interactionType: 'like'
        })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit));

        res.json(likes);
    } catch (error) {
        console.error('Get likes error:', error);
        res.status(500).json({ error: 'Error fetching likes' });
    }
});

// Add article to recently viewed
app.post('/api/user/recently-viewed', authenticateToken, async (req, res) => {
    try {
        const { articleUrl, articleTitle, articleDescription, articleImage, articleSource, articlePublishedAt } = req.body;
        const userId = req.user.userId;

        // Check if article is already in recently viewed
        const existingView = await RecentlyViewed.findOne({
            userId,
            articleUrl
        });

        if (existingView) {
            // Update the viewedAt timestamp
            existingView.viewedAt = new Date();
            await existingView.save();
            return res.json({ message: 'Recently viewed updated successfully' });
        }

        // Create new recently viewed entry
        const recentlyViewed = new RecentlyViewed({
            userId,
            articleUrl,
            articleTitle,
            articleDescription,
            articleImage,
            articleSource,
            articlePublishedAt
        });

        await recentlyViewed.save();

        res.status(201).json({
            message: 'Article added to recently viewed',
            recentlyViewed
        });
    } catch (error) {
        console.error('Error adding to recently viewed:', error);
        res.status(500).json({ error: 'Error adding to recently viewed' });
    }
});

// Get user's recently viewed articles
app.get('/api/user/recently-viewed', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = 5 } = req.query;

        const recentlyViewed = await RecentlyViewed.find({ userId })
            .sort({ viewedAt: -1 })
            .limit(parseInt(limit));

        res.json({ recentlyViewed });
    } catch (error) {
        console.error('Error fetching recently viewed:', error);
        res.status(500).json({ error: 'Error fetching recently viewed' });
    }
});

const NEWS_API_KEY = process.env.NEWS_API_KEY || 'cad850f01c3841288162559ff80d9282';
const NEWS_API_URL = `https://newsapi.org/v2/top-headlines?country=us&pageSize=50&apiKey=${NEWS_API_KEY}`;
const CSV_PATH = process.env.CSV_PATH || 'latest_news.csv';

async function fetchAndStoreNewsCSV() {
    try {
        const response = await fetch(NEWS_API_URL);
        const data = await response.json();
        if (!data.articles) {
            console.error('No articles found in API response:', data);
            return;
        }

        const now = new Date().toISOString();
        const articles = data.articles.slice(0, 50).map(article => ({
            title: (article.title || '').replace(/"/g, '""'),
            description: (article.description || '').replace(/"/g, '""'),
            fetched_at: now
        }));

        const csvWriter = createCsvWriter({
            path: CSV_PATH,
            header: [
                {id: 'title', title: 'Title'},
                {id: 'description', title: 'Description'},
                {id: 'fetched_at', title: 'FetchedAt'}
            ]
        });

        await csvWriter.writeRecords(articles);
        console.log('CSV file written with latest 50 news articles.');
    } catch (err) {
        console.error('Error fetching or writing news CSV:', err);
    }
}

// Call this function when the server starts
fetchAndStoreNewsCSV();

// Add this endpoint to allow downloading the latest news CSV file
app.get('/download-latest-news', (req, res) => {
    res.download(CSV_PATH, err => {
        if (err) {
            res.status(500).send('Could not download the file.');
        }
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 