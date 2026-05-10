const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    blockNumber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Block',
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: [1, 'Capacity must be at least 1'],
    },
    currentOccupants: {
      type: Number,
      default: 0,
      min: 0,
    },
    occupants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    reservedForStaff: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

roomSchema.pre('save', function (next) {
  this.currentOccupants = this.occupants ? this.occupants.length : 0;
  if (this.currentOccupants > this.capacity) {
    return next(new Error('Occupants exceed room capacity'));
  }
  next();
});

roomSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (!update) {
    return next();
  }

  const occupants = update.occupants || (update.$set && update.$set.occupants);
  const capacity = update.capacity || (update.$set && update.$set.capacity);

  if (occupants) {
    const length = occupants.length;
    let room = await this.model.findOne(this.getQuery());
    const maxCapacity = capacity || room?.capacity;

    if (maxCapacity != null && length > maxCapacity) {
      return next(new Error('Occupants exceed room capacity'));
    }

    if (!update.currentOccupants && !update.$set?.currentOccupants) {
      this.set({ currentOccupants: length });
    }
  }
  next();
});

const Room = mongoose.model('Room', roomSchema);
module.exports = Room;
