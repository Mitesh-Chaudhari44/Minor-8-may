const mongoose = require('mongoose');

const userInteractionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    articleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article',
        required: false // Make this optional since we might not have the article in our database
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
    interactionType: {
        type: String,
        required: [true, 'Interaction type is required'],
        enum: ['view', 'like', 'bookmark']
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    metadata: {
        readTime: Number,
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        notes: String,
        deviceInfo: {
            type: String,
            trim: true
        },
        location: {
            type: String,
            trim: true
        }
    }
}, {
    timestamps: true
});

// Create compound index for efficient querying
userInteractionSchema.index({ userId: 1, articleUrl: 1, interactionType: 1 });
userInteractionSchema.index({ userId: 1, timestamp: -1 });
userInteractionSchema.index({ articleUrl: 1, interactionType: 1 });

// Prevent duplicate interactions
userInteractionSchema.index(
    { userId: 1, articleUrl: 1, interactionType: 1 },
    { unique: true }
);

const UserInteraction = mongoose.model('UserInteraction', userInteractionSchema);

module.exports = UserInteraction; 