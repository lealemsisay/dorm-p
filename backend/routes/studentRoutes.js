const express = require('express');
const router = express.Router();
const { authenticate, adminOrStaffOnly } = require('../middleware/authMiddleware');
const {
    getAllStudents,
    getStudentById,
    getCurrentStudent,
    createStudent,
    updateStudent,
    deleteStudent,
} = require('../controllers/studentController');

router.use(authenticate);

router.get('/me', getCurrentStudent);
router.get('/', adminOrStaffOnly, getAllStudents);
router.get('/:id', adminOrStaffOnly, getStudentById);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router;
