const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database');

// Login Page
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect(req.session.user.role === 'admin' ? '/admin' : '/catalog');
    }
    res.render('login', { error: null });
});
router.get('/login.html', (req, res) => res.redirect('/login'));

// Login Logic
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const { rows } = await db.query("SELECT * FROM users WHERE username = $1", [username]);
        const user = rows[0];
        
        if (!user) {
            return res.render('login', { error: 'Invalid username or password' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.user = { id: user.id, username: user.username, role: user.role };
            if (user.role === 'admin') {
                return res.redirect('/admin');
            } else {
                return res.redirect('/catalog');
            }
        } else {
            return res.render('login', { error: 'Invalid username or password' });
        }
    } catch (err) {
        console.error(err);
        return res.render('login', { error: 'Database error occurred' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;
