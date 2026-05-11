const Student = require('../models/studentModel');
const Room = require('../models/roomModel');
const Block = require('../models/blockModel');
const Allocation = require('../models/allocationModel');

// Get all students
const getAllStudents = async (req, res) => {
    try {
        const students = await Student.find();
        res.json({
            success: true,
            data: students,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get student by ID
const getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found',
            });
        }
        res.json({
            success: true,
            data: student,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Create new student
const createStudent = async (req, res) => {
    try {
        const student = new Student(req.body);
        await student.save();
        res.status(201).json({
            success: true,
            message: 'Student created successfully',
            data: student,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// Update student
const updateStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found',
            });
        }
        res.json({
            success: true,
            message: 'Student updated successfully',
            data: student,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// Delete student
const deleteStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found',
            });
        }
        res.json({
            success: true,
            message: 'Student deleted successfully',
            data: student,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getCurrentStudent = async (req, res) => {
    try {
        const user = req.user;
        const query = {};

        if (user.admission_number) {
            query.admission_number = user.admission_number;
        }

        if (user.registrar_id) {
            query.registrar_id = user.registrar_id;
        }

        if (!query.admission_number && !query.registrar_id && user.id) {
            if (/^\d+$/.test(user.id)) {
                query.admission_number = user.id;
            } else {
                query.registrar_id = user.id;
            }
        }

        const student = await Student.findOne(query).lean();

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student record not found',
            });
        }

        const [room, block] = await Promise.all([
            student.roomId ? Room.findById(student.roomId).lean() : null,
            student.blockId ? Block.findById(student.blockId).lean() : null,
        ]);

        const allocationRecord = await Allocation.findOne({ student: student._id, status: 'active' }).lean();

        const allocation = allocationRecord
            ? {
                  roomId: allocationRecord.room,
                  blockId: allocationRecord.block,
                  allocatedAt: allocationRecord.assignedAt,
              }
            : null;

        let roommates = [];
        if (room?.occupants?.length) {
            const roommateIds = room.occupants.filter((occupant) => String(occupant) !== String(student._id));
            if (roommateIds.length) {
                roommates = await Student.find({ _id: { $in: roommateIds } })
                    .select('name studentId admission_number registrar_id department')
                    .lean();
            }
        }

        res.json({
            success: true,
            data: {
                student,
                room,
                block,
                roommates,
                allocation,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    getCurrentStudent,
};
