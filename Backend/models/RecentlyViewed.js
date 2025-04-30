const mongoose = require('mongoose');

const recentlyViewedSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    articleUrl: {
        type: String,
        required: [true, 'Article URL is required']
    },
    articleTitle: {
        type: String,
        required: [true, 'Article title is required']
    },
    articleDescription: {
        type: String,
        required: false
    },
    articleImage: {
        type: String,
        required: false
    },
    articleSource: {
        type: String,
        required: false
    },
    articlePublishedAt: {
        type: Date,
        required: false
    },
    viewedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create compound index for efficient querying
recentlyViewedSchema.index({ userId: 1, viewedAt: -1 });
recentlyViewedSchema.index({ userId: 1, articleUrl: 1 });

// Prevent duplicate entries for the same user and article
recentlyViewedSchema.index(
    { userId: 1, articleUrl: 1 },
    { unique: true }
);

const RecentlyViewed = mongoose.model('RecentlyViewed', recentlyViewedSchema);

module.exports = RecentlyViewed; 