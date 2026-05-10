const Block = require('../models/blockModel');

const getAllBlocks = async (req, res) => {
  try {
    const blocks = await Block.find();
    res.json({ success: true, data: blocks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBlockById = async (req, res) => {
  try {
    const block = await Block.findById(req.params.id);
    if (!block) {
      return res.status(404).json({ success: false, message: 'Block not found' });
    }
    res.json({ success: true, data: block });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createBlock = async (req, res) => {
  try {
    const block = new Block(req.body);
    await block.save();
    res.status(201).json({ success: true, message: 'Block created successfully', data: block });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateBlock = async (req, res) => {
  try {
    const block = await Block.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      context: 'query',
    });
    if (!block) {
      return res.status(404).json({ success: false, message: 'Block not found' });
    }
    res.json({ success: true, message: 'Block updated successfully', data: block });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteBlock = async (req, res) => {
  try {
    const block = await Block.findByIdAndDelete(req.params.id);
    if (!block) {
      return res.status(404).json({ success: false, message: 'Block not found' });
    }
    res.json({ success: true, message: 'Block deleted successfully', data: block });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const activateBlock = async (req, res) => {
  try {
    const block = await Block.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true, runValidators: true });
    if (!block) {
      return res.status(404).json({ success: false, message: 'Block not found' });
    }
    res.json({ success: true, message: 'Block activated successfully', data: block });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deactivateBlock = async (req, res) => {
  try {
    const block = await Block.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true, runValidators: true });
    if (!block) {
      return res.status(404).json({ success: false, message: 'Block not found' });
    }
    res.json({ success: true, message: 'Block deactivated successfully', data: block });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllBlocks,
  getBlockById,
  createBlock,
  updateBlock,
  deleteBlock,
  activateBlock,
  deactivateBlock,
};
