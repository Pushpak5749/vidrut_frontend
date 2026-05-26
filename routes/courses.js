const express = require('express');
const router = express.Router();
const db = require('../database');

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
};

// Catalog Page (Shows only the 4 default courses)
router.get('/catalog', isLoggedIn, async (req, res) => {
    try {
        const { rows: courses } = await db.query("SELECT * FROM courses");
        res.render('catalog', { courses });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Database error");
    }
});
router.get('/catalog.html', (req, res) => res.redirect('/catalog'));

// Specific Course Page (Shows materials for that course)
router.get('/course/:id', isLoggedIn, async (req, res) => {
    const courseId = req.params.id;
    try {
        const courseRes = await db.query("SELECT * FROM courses WHERE id = $1", [courseId]);
        const course = courseRes.rows[0];
        if (!course) {
            return res.status(404).send("Course not found");
        }
        
        const materialsRes = await db.query("SELECT * FROM materials WHERE course_id = $1", [courseId]);
        const materials = materialsRes.rows;
        
        res.render('course', { course, materials });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Database error");
    }
});

module.exports = router;
