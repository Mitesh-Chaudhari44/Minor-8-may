const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Content is required']
    },
    url: {
        type: String,
        required: [true, 'URL is required'],
        unique: true
    },
    urlToImage: {
        type: String,
        default: 'default-article.jpg'
    },
    source: {
        name: {
            type: String,
            required: [true, 'Source name is required']
        },
        id: String
    },
    publishedAt: {
        type: Date,
        required: [true, 'Publication date is required']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['sports', 'tech', 'health', 'finance', 'education']
    },
    subcategory: {
        type: String,
        required: [true, 'Subcategory is required']
    },
    tags: [String],
    metadata: {
        readTime: Number,
        wordCount: Number,
        language: {
            type: String,
            default: 'en'
        }
    },
    stats: {
        views: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        },
        bookmarks: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Create indexes
articleSchema.index({ title: 'text', description: 'text', content: 'text' });
articleSchema.index({ category: 1, subcategory: 1 });
articleSchema.index({ publishedAt: -1 });
articleSchema.index({ 'stats.views': -1 });
articleSchema.index({ 'stats.likes': -1 });

const Article = mongoose.model('Article', articleSchema);

module.exports = Article; 