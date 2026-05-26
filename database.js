const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const setupDatabase = async () => {
    try {
        // Users Table
        await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT
        )`);

        // Courses Table
        await pool.query(`CREATE TABLE IF NOT EXISTS courses (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE
        )`);

        // Materials Table
        await pool.query(`CREATE TABLE IF NOT EXISTS materials (
            id SERIAL PRIMARY KEY,
            course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
            title TEXT,
            type TEXT,
            file_path TEXT
        )`);

        // Certificates Table
        await pool.query(`CREATE TABLE IF NOT EXISTS certificates (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            title TEXT,
            file_path TEXT,
            issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Insert default admin
        const adminRes = await pool.query("SELECT * FROM users WHERE username = $1", ['admin']);
        if (adminRes.rows.length === 0) {
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'admin123', 10);
            await pool.query("INSERT INTO users (username, password, role) VALUES ($1, $2, $3)", ['admin', hashedPassword, 'admin']);
        }

        // Insert the 4 default courses
        const defaultCourses = [
            'CAD/CAM/CAE',
            'Aerodynamics and Mechanics',
            'Electronics and material Selection',
            'Programming'
        ];

        for (const course of defaultCourses) {
            const courseRes = await pool.query("SELECT * FROM courses WHERE name = $1", [course]);
            if (courseRes.rows.length === 0) {
                await pool.query("INSERT INTO courses (name) VALUES ($1)", [course]);
            }
        }
        
        console.log("Database setup complete.");
    } catch (err) {
        console.error("Error setting up database:", err);
    }
};

setupDatabase();

module.exports = pool;
