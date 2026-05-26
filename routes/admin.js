const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).send('Forbidden: Admin access only.');
};

router.use(isAdmin);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vidrut_uploads',
    resource_type: 'auto'
  },
});
const upload = multer({ storage: storage });

// Admin Dashboard
router.get('/', async (req, res) => {
    try {
        const usersRes = await db.query("SELECT * FROM users");
        const coursesRes = await db.query("SELECT * FROM courses");
        const materialsRes = await db.query("SELECT materials.*, courses.name as course_name FROM materials JOIN courses ON materials.course_id = courses.id");
        const certsRes = await db.query("SELECT certificates.*, users.username FROM certificates JOIN users ON certificates.user_id = users.id");
        
        res.render('admin', { 
            users: usersRes.rows, 
            courses: coursesRes.rows, 
            materials: materialsRes.rows, 
            certificates: certsRes.rows, 
            error: null, 
            success: null 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error loading dashboard");
    }
});

// Add User
router.post('/users/add', async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query("INSERT INTO users (username, password, role) VALUES ($1, $2, $3)", [username, hashedPassword, role]);
        res.redirect('/admin?success=User added successfully');
    } catch (error) {
        console.error(error);
        res.redirect('/admin?error=Failed to add user (maybe username already exists)');
    }
});

// Delete User
router.post('/users/delete/:id', async (req, res) => {
    const id = req.params.id;
    if (id == req.session.user.id) {
        return res.redirect('/admin?error=You cannot delete yourself');
    }
    try {
        await db.query("DELETE FROM users WHERE id = $1", [id]);
        res.redirect('/admin?success=User deleted');
    } catch (err) {
        console.error(err);
        res.redirect('/admin?error=Failed to delete user');
    }
});

// Upload Material
router.post('/materials/add', upload.single('file'), async (req, res) => {
    const { course_id, title, type } = req.body;
    const file = req.file;
    if (!file) {
        return res.redirect('/admin?error=File upload failed');
    }
    const file_path = file.path; // Cloudinary URL
    
    try {
        await db.query("INSERT INTO materials (course_id, title, type, file_path) VALUES ($1, $2, $3, $4)", [course_id, title, type, file_path]);
        res.redirect('/admin?success=Material uploaded successfully');
    } catch (err) {
        console.error(err);
        res.redirect('/admin?error=Database error saving material');
    }
});

// Delete Material
router.post('/materials/delete/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const matRes = await db.query("SELECT file_path FROM materials WHERE id = $1", [id]);
        if (matRes.rows.length > 0) {
            const row = matRes.rows[0];
            // Cloudinary deletion can be complex (needs public_id). For simplicity, we just remove from DB.
            await db.query("DELETE FROM materials WHERE id = $1", [id]);
            res.redirect('/admin?success=Material deleted');
        } else {
            res.redirect('/admin?error=Material not found');
        }
    } catch (err) {
        console.error(err);
        res.redirect('/admin?error=Database error deleting material');
    }
});

// Upload Certificate
router.post('/certificates/add', upload.single('file'), async (req, res) => {
    const { user_id, title } = req.body;
    const file = req.file;
    if (!file) {
        return res.redirect('/admin?error=Certificate file upload failed');
    }
    const file_path = file.path; // Cloudinary URL
    
    try {
        await db.query("INSERT INTO certificates (user_id, title, file_path) VALUES ($1, $2, $3)", [user_id, title, file_path]);
        res.redirect('/admin?success=Certificate uploaded successfully');
    } catch (err) {
        console.error(err);
        res.redirect('/admin?error=Database error saving certificate');
    }
});

// Delete Certificate
router.post('/certificates/delete/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const certRes = await db.query("SELECT file_path FROM certificates WHERE id = $1", [id]);
        if (certRes.rows.length > 0) {
            await db.query("DELETE FROM certificates WHERE id = $1", [id]);
            res.redirect('/admin?success=Certificate deleted');
        } else {
            res.redirect('/admin?error=Certificate not found');
        }
    } catch (err) {
        console.error(err);
        res.redirect('/admin?error=Database error deleting certificate');
    }
});

module.exports = router;
