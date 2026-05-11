const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    admission_number: {
      type: String,
      trim: true,
    },
    registrar_id: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: true,
    },
    category: {
      type: String,
      enum: ['Freshman', 'Senior', 'Remedial', 'GC'],
      required: true,
    },
    batch: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      default: 'Student',
    },
    blockId: {
      type: String,
    },
    roomId: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
