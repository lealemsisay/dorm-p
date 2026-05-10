const express = require('express');
const router = express.Router();
const { authenticate, adminOrStaffOnly } = require('../middleware/authMiddleware');
const {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  activateRoom,
  deactivateRoom,
} = require('../controllers/roomController');

router.use(authenticate, adminOrStaffOnly);

router.get('/', getAllRooms);
router.get('/:id', getRoomById);
router.post('/', createRoom);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);
router.patch('/:id/activate', activateRoom);
router.patch('/:id/deactivate', deactivateRoom);

module.exports = router;
