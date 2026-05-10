const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema(
  {
    blockNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    genderType: {
      type: String,
      required: true,
      enum: ['male', 'female'],
      lowercase: true,
      trim: true,
    },
    totalRooms: {
      type: Number,
      required: true,
      min: [0, 'Total rooms cannot be negative'],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Block = mongoose.model('Block', blockSchema);
module.exports = Block;
