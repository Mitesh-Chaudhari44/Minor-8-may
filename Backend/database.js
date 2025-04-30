const mysql = require('mysql2');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'SNK@#SNK123', // Your MySQL password
    database: 'user_auth1',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Create promise wrapper
const promisePool = pool.promise();

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1); // Exit if database connection fails
    }
    console.log('Successfully connected to MySQL database');
    connection.release();
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('MySQL Pool Error:', err);
});

// Initialize database tables
const initializeDatabase = async () => {
    try {
        // Create users table
        await promisePool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                profile_image VARCHAR(255) DEFAULT 'https://via.placeholder.com/150',
                preferences JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create liked_news table
        await promisePool.execute(`
            CREATE TABLE IF NOT EXISTS liked_news (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                article_url VARCHAR(255) NOT NULL,
                article_title VARCHAR(255) NOT NULL,
                article_source VARCHAR(255) NOT NULL,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create reading_history table
        await promisePool.execute(`
            CREATE TABLE IF NOT EXISTS reading_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                article_url VARCHAR(255) NOT NULL,
                article_title VARCHAR(255) NOT NULL,
                article_source VARCHAR(255) NOT NULL,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

// Initialize database on startup
initializeDatabase();

module.exports = promisePool; 