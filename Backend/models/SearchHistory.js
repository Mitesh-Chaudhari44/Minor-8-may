const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    query: {
        type: String,
        required: [true, 'Search query is required'],
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    results: {
        type: Number,
        default: 0
    },
    filters: {
        category: String,
        dateRange: String,
        source: String
    },
    metadata: {
        deviceInfo: String,
        location: String,
        searchType: {
            type: String,
            enum: ['text', 'category', 'source', 'advanced'],
            default: 'text'
        }
    }
}, {
    timestamps: true
});

// Create indexes for efficient querying
searchHistorySchema.index({ userId: 1, timestamp: -1 });
searchHistorySchema.index({ query: 'text' });
searchHistorySchema.index({ 'filters.category': 1 });
searchHistorySchema.index({ 'filters.source': 1 });

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);

module.exports = SearchHistory; 