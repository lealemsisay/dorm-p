const Student = require('../models/studentModel');
const Room = require('../models/roomModel');
const Block = require('../models/blockModel');
const Allocation = require('../models/allocationModel');

const assignStudent = async (req, res) => {
  try {
    const { studentId, roomId } = req.body;
    if (!studentId || !roomId) {
      return res.status(400).json({ success: false, message: 'studentId and roomId are required' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    if (student.assignedRoom) {
      return res.status(400).json({ success: false, message: 'Student is already assigned to a room' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    if (!room.isActive) {
      return res.status(400).json({ success: false, message: 'Room is not active' });
    }
    if (room.reservedForStaff) {
      return res.status(400).json({ success: false, message: 'Room is reserved for staff and cannot accept students' });
    }
    if (room.currentOccupants >= room.capacity) {
      return res.status(400).json({ success: false, message: 'Room capacity has been reached' });
    }
    if (room.occupants.map(String).includes(String(student._id))) {
      return res.status(400).json({ success: false, message: 'Student is already assigned to this room' });
    }

    const block = await Block.findById(room.blockNumber);
    if (!block) {
      return res.status(404).json({ success: false, message: 'Room block not found' });
    }
    if (!block.isActive) {
      return res.status(400).json({ success: false, message: 'Block is not active' });
    }
    if (student.gender !== block.genderType) {
      return res.status(400).json({ success: false, message: 'Student gender does not match block gender type' });
    }

    room.occupants.push(student._id);
    room.currentOccupants = room.occupants.length;
    await room.save();

    student.assignedRoom = room._id;
    student.assignedBlock = block._id;
    await student.save();

    const allocation = await Allocation.create({
      student: student._id,
      room: room._id,
      block: block._id,
      status: 'active',
    });

    res.status(200).json({
      success: true,
      message: 'Student assigned successfully',
      data: {
        student,
        room,
        allocation,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const reassignStudent = async (req, res) => {
  try {
    const { studentId, roomId } = req.body;
    if (!studentId || !roomId) {
      return res.status(400).json({ success: false, message: 'studentId and roomId are required' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    if (!student.assignedRoom) {
      return res.status(400).json({ success: false, message: 'Student is not currently assigned to any room' });
    }

    const currentRoom = await Room.findById(student.assignedRoom);
    if (!currentRoom) {
      return res.status(404).json({ success: false, message: 'Current room not found' });
    }

    const newRoom = await Room.findById(roomId);
    if (!newRoom) {
      return res.status(404).json({ success: false, message: 'New room not found' });
    }
    if (!newRoom.isActive) {
      return res.status(400).json({ success: false, message: 'New room is not active' });
    }
    if (newRoom.reservedForStaff) {
      return res.status(400).json({ success: false, message: 'New room is reserved for staff and cannot accept students' });
    }
    if (newRoom.currentOccupants >= newRoom.capacity) {
      return res.status(400).json({ success: false, message: 'New room capacity has been reached' });
    }
    if (String(currentRoom._id) === String(newRoom._id)) {
      return res.status(400).json({ success: false, message: 'Student is already assigned to this room' });
    }

    const newBlock = await Block.findById(newRoom.blockNumber);
    if (!newBlock) {
      return res.status(404).json({ success: false, message: 'New room block not found' });
    }
    if (!newBlock.isActive) {
      return res.status(400).json({ success: false, message: 'New room block is not active' });
    }
    if (student.gender !== newBlock.genderType) {
      return res.status(400).json({ success: false, message: 'Student gender does not match new block gender type' });
    }

    currentRoom.occupants = currentRoom.occupants.filter(
      (occupantId) => String(occupantId) !== String(student._id)
    );
    currentRoom.currentOccupants = currentRoom.occupants.length;
    await currentRoom.save();

    newRoom.occupants.push(student._id);
    newRoom.currentOccupants = newRoom.occupants.length;
    await newRoom.save();

    student.assignedRoom = newRoom._id;
    student.assignedBlock = newBlock._id;
    await student.save();

    await Allocation.create({
      student: student._id,
      room: newRoom._id,
      block: newBlock._id,
      status: 'active',
      notes: 'Reassigned room',
    });

    res.status(200).json({
      success: true,
      message: 'Student reassigned successfully',
      data: {
        student,
        previousRoom: currentRoom,
        newRoom,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const removeStudentAssignment = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    if (!student.assignedRoom) {
      return res.status(400).json({ success: false, message: 'Student has no assigned room' });
    }

    const room = await Room.findById(student.assignedRoom);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Assigned room not found' });
    }

    room.occupants = room.occupants.filter(
      (occupantId) => String(occupantId) !== String(student._id)
    );
    room.currentOccupants = room.occupants.length;
    await room.save();

    student.assignedRoom = null;
    student.assignedBlock = null;
    await student.save();

    await Allocation.create({
      student: student._id,
      room: room._id,
      block: room.blockNumber,
      status: 'released',
      notes: 'Student deallocated from room',
    });

    res.status(200).json({
      success: true,
      message: 'Student removed from room successfully',
      data: { student, room },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  assignStudent,
  reassignStudent,
  removeStudentAssignment,
};
