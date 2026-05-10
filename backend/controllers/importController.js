const multer = require('multer');
const xlsx = require('xlsx');
const Student = require('../models/studentModel');
const Room = require('../models/roomModel');
const Block = require('../models/blockModel');
const Allocation = require('../models/allocationModel');

const upload = multer({ storage: multer.memoryStorage() });

const normalizeRow = (row) => {
  const normalized = {};
  Object.entries(row).forEach(([key, value]) => {
    const normalizedKey = key.toString().trim().toLowerCase();
    normalized[normalizedKey] = value;
  });
  return normalized;
};

const validateRow = (row) => {
  const errors = [];
  const fullName = row.fullname?.toString().trim();
  const admissionNumber = row.admissionnumber?.toString().trim();
  const gender = row.gender?.toString().trim().toLowerCase();
  const department = row.department?.toString().trim();
  const phoneNumber = row.phonenumber?.toString().trim();

  if (!fullName) errors.push('fullName is required');
  if (!admissionNumber) errors.push('admissionNumber is required');
  if (!gender || !['male', 'female'].includes(gender)) {
    errors.push('gender must be male or female');
  }
  if (!department) errors.push('department is required');
  if (!phoneNumber || !/^\+251\d{9}$/.test(phoneNumber)) {
    errors.push('phoneNumber must start with +251 and include 9 digits after country code');
  }

  return {
    isValid: errors.length === 0,
    errors,
    student: {
      fullName,
      admissionNumber,
      gender,
      department,
      phoneNumber,
      role: 'student',
      assignedBlock: null,
      assignedRoom: null,
    },
  };
};

const sortStudents = (students) => {
  return students.sort((a, b) => {
    const departmentCompare = a.department.localeCompare(b.department, undefined, { sensitivity: 'base' });
    if (departmentCompare !== 0) return departmentCompare;
    return a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
  });
};

const buildBlockQueue = (blocks, gender) => {
  const normalized = blocks
    .filter((block) => block.isActive)
    .filter((block) => block.genderType === gender)
    .map((block) => ({
      ...block.toObject(),
      numericBlock: Number(block.blockNumber) || 0,
    }));

  if (gender === 'male') {
    return normalized
      .filter((block) => String(block.blockNumber) !== '518')
      .filter((block) => Number(block.blockNumber) >= 519)
      .sort((a, b) => a.numericBlock - b.numericBlock);
  }

  return normalized.sort((a, b) => a.numericBlock - b.numericBlock);
};

const getAvailableRoom = (rooms) => {
  return rooms.find((room) => room.isActive && !room.reservedForStaff && room.currentOccupants < room.capacity);
};

const assignStudentsToRooms = async (students) => {
  const result = {
    allocatedCount: 0,
    failedAllocations: [],
  };

  const allBlocks = await Block.find({ isActive: true });
  const activeRooms = await Room.find({ isActive: true, reservedForStaff: false }).populate('blockNumber');

  const roomsByBlock = activeRooms.reduce((acc, room) => {
    const blockId = String(room.blockNumber?._id || room.blockNumber);
    if (!acc[blockId]) acc[blockId] = [];
    acc[blockId].push(room);
    return acc;
  }, {});

  Object.values(roomsByBlock).forEach((rooms) => {
    rooms.sort((a, b) => {
      const capacityDiff = a.currentOccupants - b.currentOccupants;
      if (capacityDiff !== 0) return capacityDiff;
      return String(a.roomNumber).localeCompare(String(b.roomNumber), undefined, { numeric: true, sensitivity: 'base' });
    });
  });

  const deptState = {};
  const studentList = sortStudents(students);

  const genderBlocks = {
    male: buildBlockQueue(allBlocks, 'male'),
    female: buildBlockQueue(allBlocks, 'female'),
  };

  for (const student of studentList) {
    const eligibleBlocks = genderBlocks[student.gender] || [];
    if (!eligibleBlocks.length) {
      result.failedAllocations.push({ studentId: student._id, message: 'No eligible active blocks for student gender' });
      continue;
    }

    const departmentKey = student.department.toLowerCase();
    let assigned = false;
    let preferredBlockIndex = 0;

    if (deptState[departmentKey]) {
      preferredBlockIndex = deptState[departmentKey].blockIndex;
    }

    for (let blockIndex = preferredBlockIndex; blockIndex < eligibleBlocks.length && !assigned; blockIndex += 1) {
      const block = eligibleBlocks[blockIndex];
      const blockRooms = roomsByBlock[String(block._id)] || [];

      for (let roomIndex = 0; roomIndex < blockRooms.length && !assigned; roomIndex += 1) {
        const room = blockRooms[roomIndex];
        if (room.currentOccupants >= room.capacity) continue;
        if (room.occupants.map(String).includes(String(student._id))) continue;

        room.occupants.push(student._id);
        room.currentOccupants = room.occupants.length;
        await room.save();

        student.assignedRoom = room._id;
        student.assignedBlock = block._id;
        await student.save();

        deptState[departmentKey] = {
          blockIndex,
          roomIndex,
        };

        await Allocation.create({
          student: student._id,
          room: room._id,
          block: block._id,
          status: 'active',
          notes: 'Automatic allocation after import',
        });

        result.allocatedCount += 1;
        assigned = true;
      }
    }

    if (!assigned) {
      result.failedAllocations.push({ studentId: student._id, message: 'No available room found for this student' });
    }
  }

  return result;
};

const importStudents = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Excel file is required' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({ success: false, message: 'Excel file has no sheets' });
    }

    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'Excel file contains no data rows' });
    }

    const rowDuplicates = new Set();
    const validStudents = [];
    const skippedRows = [];

    for (let index = 0; index < rows.length; index += 1) {
      const raw = normalizeRow(rows[index]);
      const { isValid, errors, student } = validateRow(raw);
      if (!isValid) {
        skippedRows.push({ row: index + 2, errors });
        continue;
      }

      if (rowDuplicates.has(student.admissionNumber)) {
        skippedRows.push({ row: index + 2, errors: ['Duplicate admissionNumber in file'] });
        continue;
      }

      rowDuplicates.add(student.admissionNumber);
      validStudents.push(student);
    }

    const existingStudents = await Student.find({ admissionNumber: { $in: validStudents.map((item) => item.admissionNumber) } }).select('admissionNumber');
    const existingSet = new Set(existingStudents.map((student) => student.admissionNumber));

    const duplicateStudents = [];
    const insertStudents = validStudents.filter((student) => {
      if (existingSet.has(student.admissionNumber)) {
        duplicateStudents.push(student.admissionNumber);
        return false;
      }
      return true;
    });

    const createdStudents = [];
    if (insertStudents.length > 0) {
      const inserted = await Student.insertMany(insertStudents, { ordered: false });
      createdStudents.push(...inserted);
    }

    const allocationResult = await assignStudentsToRooms(createdStudents);

    res.status(200).json({
      success: true,
      message: 'Import completed',
      importedCount: createdStudents.length,
      duplicateCount: duplicateStudents.length,
      duplicateAdmissionNumbers: duplicateStudents,
      skippedRows: skippedRows.length,
      skippedDetails: skippedRows,
      allocatedCount: allocationResult.allocatedCount,
      failedAllocations: allocationResult.failedAllocations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  upload,
  importStudents,
};
