const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/authMiddleware');
const { upload, importStudents } = require('../controllers/importController');

router.post('/students', authenticate, adminOnly, upload.single('file'), importStudents);

module.exports = router;
