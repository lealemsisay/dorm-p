const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/authMiddleware');
const {
  assignStudent,
  reassignStudent,
  removeStudentAssignment,
} = require('../controllers/allocationController');

router.post('/assign', authenticate, adminOnly, assignStudent);
router.patch('/reassign', authenticate, adminOnly, reassignStudent);
router.patch('/remove/:studentId', authenticate, adminOnly, removeStudentAssignment);

module.exports = router;
