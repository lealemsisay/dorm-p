const express = require('express');
const router = express.Router();
const { authenticate, adminOrStaffOnly } = require('../middleware/authMiddleware');
const {
  getAllBlocks,
  getBlockById,
  createBlock,
  updateBlock,
  deleteBlock,
  activateBlock,
  deactivateBlock,
} = require('../controllers/blockController');

router.use(authenticate, adminOrStaffOnly);

router.get('/', getAllBlocks);
router.get('/:id', getBlockById);
router.post('/', createBlock);
router.put('/:id', updateBlock);
router.delete('/:id', deleteBlock);
router.patch('/:id/activate', activateBlock);
router.patch('/:id/deactivate', deactivateBlock);

module.exports = router;
