const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    staffNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (value) {
          return /^\+251\d{9}$/.test(value);
        },
        message: 'Phone number must start with +251 and include 9 digits after country code.',
      },
    },
    role: {
      type: String,
      default: 'staff',
      trim: true,
    },
    assignedBlock: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Block',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Staff = mongoose.model('Staff', staffSchema);
module.exports = Staff;
