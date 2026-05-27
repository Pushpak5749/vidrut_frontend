require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./database');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Sessions
app.use(session({
    secret: process.env.SESSION_SECRET || 'vidrut_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' } // In production, set to true and use HTTPS
}));

// Pass user to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Import Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const courseRoutes = require('./routes/courses');

// Use Routes
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/', courseRoutes);

// Home / Dashboard
app.get('/', (req, res) => {
    res.render('index');
});
app.get('/index.html', (req, res) => {
    res.redirect('/');
});

app.get('/about.html', (req, res) => res.render('about'));

app.get('/verify.html', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    try {
        const { rows: certificates } = await db.query("SELECT * FROM certificates WHERE user_id = $1", [req.session.user.id]);
        res.render('verify', { certificates });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Database error");
    }
});

// 404 Handler
app.use((req, res) => {
    res.status(404).send('Page not found');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
