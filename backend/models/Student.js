const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
    {
        registrarId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        admissionNumber: {
            type: String,
            required: true,
            unique: true,
        },
        dateOfBirth: {
            type: Date,
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
        },
        program: {
            type: String,
            required: true,
        },
        year: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive', 'Graduated'],
            default: 'Active',
        },
    },
    { timestamps: true }
);

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
