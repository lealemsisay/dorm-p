import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Role } from '@/types/role';
import { storage } from '@/utils/storage';
import { initialStudents, type Student } from '@/data/students';
import { initialBlocks, initialRooms, type Block, type Room } from '@/data/rooms';
import { initialAllocations, type Allocation } from '@/data/allocations';

interface DataContextType {
  students: Student[];
  blocks: Block[];
  rooms: Room[];
  allocations: Allocation[];
  addStudent: (data: Omit<Student, 'id' | 'blockId' | 'roomId'>) => string;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  addBlock: (block: Omit<Block, 'id'>, role?: Role) => string | null;
  updateBlock: (block: Block, role?: Role) => string | null;
  deleteBlock: (id: string, role?: Role) => string | null;
  addRoom: (room: Omit<Room, 'id' | 'occupants'>, role?: Role) => string | null;
  updateRoom: (room: Room, role?: Role) => string | null;
  ensureBlocks: (blockNames: string[], numberOfRooms: number, role?: Role) => { ids: string[]; rooms: Room[] } | { error: string };
  deleteRoom: (id: string, role?: Role) => string | null;
  addStudents: (data: Omit<Student, 'id' | 'blockId' | 'roomId'>[]) => string[];
  addStudentsAndAutoAssign: (data: Omit<Student, 'id' | 'blockId' | 'roomId'>[], defaultCapacity: 4 | 5 | 6) => { assigned: string[]; errors: string[]; addedIds: string[] };
  bulkAssignStudents: (studentIds: string[], roomId: string, role?: Role) => { assigned: string[]; skipped: { id: string; error: string }[] };
  bulkAssignToMultipleRooms: (studentIds: string[], roomIds: string[], role?: Role) => { assigned: string[]; skipped: { id: string; error: string }[] };
  bulkAssignToBlock: (studentIds: string[], blockId: string, role?: Role) => { assigned: string[]; skipped: { id: string; error: string }[] };
  autoAssignStudents: (studentIds: string[], defaultCapacity: 4 | 5 | 6) => { assigned: string[]; errors: string[] };
  deactivateRoom: (roomId: string, reassignBlock?: string, role?: Role) => { success: boolean; errors: string[] };
  deactivateBlock: (blockId: string, reassignBlock?: string, role?: Role) => { success: boolean; errors: string[] };
  reactivateRoom: (roomId: string, role?: Role) => string | null;
  reactivateBlock: (blockId: string, role?: Role) => string | null;
  allocateStudent: (studentId: string, blockId: string, roomId: string, role?: Role) => string | null;
  deallocateStudent: (studentId: string, role?: Role) => string | null;
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const STORAGE_KEYS = {
    students: 'dorm-students',
    blocks: 'dorm-blocks',
    rooms: 'dorm-rooms',
    allocations: 'dorm-allocations',
  } as const;

  const [students, setStudents] = useState<Student[]>(() =>
    storage.get<Student[]>(STORAGE_KEYS.students, initialStudents)
  );
  const [blocks, setBlocks] = useState<Block[]>(() =>
    storage.get<Block[]>(STORAGE_KEYS.blocks, initialBlocks)
  );
  const [rooms, setRooms] = useState<Room[]>(() => {
    const stored = storage.get<Room[]>(STORAGE_KEYS.rooms, []);
    return stored.length
      ? stored
      : initialRooms.map(r => ({ ...r, capacity: r.capacity ?? 6, active: r.active ?? true }));
  });
  const [allocations, setAllocations] = useState<Allocation[]>(() =>
    storage.get<Allocation[]>(STORAGE_KEYS.allocations, initialAllocations)
  );

  useEffect(() => {
    storage.set(STORAGE_KEYS.students, students);
  }, [students]);

  useEffect(() => {
    storage.set(STORAGE_KEYS.blocks, blocks);
  }, [blocks]);

  useEffect(() => {
    storage.set(STORAGE_KEYS.rooms, rooms);
  }, [rooms]);

  useEffect(() => {
    storage.set(STORAGE_KEYS.allocations, allocations);
  }, [allocations]);

  const requireRole = (role?: Role) =>
    role === 'Coordinator' || role === 'TeamLeader' || role === 'VicePresident';

  const isStaffRole = (role: Role) => role !== 'Student';

  const normalizePhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('09') && digits.length >= 10) {
      return `+251${digits.slice(1, 10)}`;
    }
    if (digits.startsWith('9') && digits.length === 9) {
      return `+251${digits.slice(0, 9)}`;
    }
    if (digits.startsWith('251') && digits.length >= 12) {
      return `+${digits.slice(0, 12)}`;
    }
    if (digits.length === 10 && digits.startsWith('09')) {
      return `+251${digits.slice(1)}`;
    }
    if (digits.length === 9) {
      return `+251${digits}`;
    }
    return phone;
  };

  const isValidEthiopianPhone = (phone: string) => /^\+2519\d{8}$/.test(phone);

  const parseBlockNumber = (name: string) => {
    const match = name.match(/\d+/);
    return match ? Number(match[0]) : NaN;
  };

  const isGenderBlock = (blockName: string, gender: 'Male' | 'Female') => {
    const blockNumber = parseBlockNumber(blockName);
    if (Number.isNaN(blockNumber)) return true;
    if (gender === 'Female') return blockNumber >= 501 && blockNumber <= 517;
    if (gender === 'Male') return blockNumber >= 519;
    return true;
  };

  const isRoomAssignableTo = (room: Room, incomingRole: Role) => {
    if (!room.active) return false;
    if (room.reservedFor === 'Proctor') return incomingRole === 'Proctor';
    if (room.reservedFor === 'Student') return incomingRole === 'Student';
    if (room.reservedFor === 'Staff') return incomingRole !== 'Student';
    return true;
  };

  const isRoomAutoAssignable = (room: Room, gender: 'Male' | 'Female', capacity: 4 | 5 | 6) => (
    room.active &&
    room.capacity === capacity &&
    !room.reservedFor &&
    isGenderBlock(blocks.find(b => b.id === room.blockId)?.name ?? '', gender)
  );

  const compareRoomsForAutoAssign = (a: Room, b: Room) => {
    const blockA = parseBlockNumber(blocks.find(block => block.id === a.blockId)?.name ?? '') || 0;
    const blockB = parseBlockNumber(blocks.find(block => block.id === b.blockId)?.name ?? '') || 0;
    if (blockA !== blockB) return blockA - blockB;
    return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
  };

  const normalizeDepartment = (department?: string) => department?.trim().toLowerCase() || 'zzzz';

  const sortStudentsByAssignment = (a: Student, b: Student) => {
    const departmentA = normalizeDepartment(a.department);
    const departmentB = normalizeDepartment(b.department);
    if (departmentA !== departmentB) return departmentA.localeCompare(departmentB);
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });
  };

  const buildAutoAssignableRooms = (gender: 'Male' | 'Female', defaultCapacity?: 4 | 5 | 6, roomSource: Room[] = rooms) => {
    const genderBlockIds = new Set(
      blocks
        .filter(b => b.active && isGenderBlock(b.name, gender))
        .map(b => b.id)
    );

    return roomSource
      .filter(r => r.active && !r.reservedFor && genderBlockIds.has(r.blockId))
      .sort((a, b) => {
        const priorityA = defaultCapacity && a.capacity === defaultCapacity ? 0 : 1;
        const priorityB = defaultCapacity && b.capacity === defaultCapacity ? 0 : 1;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return compareRoomsForAutoAssign(a, b);
      });
  };

  const assignStudentToRoom = (
    student: Student,
    room: Room,
    nextStudents: Student[],
    nextRooms: Room[],
    nextAllocations: Allocation[]
  ) => {
    const roomIndex = nextRooms.findIndex(r => r.id === room.id);
    if (roomIndex < 0) return false;

    nextRooms[roomIndex].occupants = [...nextRooms[roomIndex].occupants, student.id];

    const studentIndex = nextStudents.findIndex(s => s.id === student.id);
    if (studentIndex < 0) return false;

    nextStudents[studentIndex] = {
      ...nextStudents[studentIndex],
      blockId: nextRooms[roomIndex].blockId,
      roomId: nextRooms[roomIndex].id,
    };

    nextAllocations.push({
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      userId: student.id,
      blockId: nextRooms[roomIndex].blockId,
      roomId: nextRooms[roomIndex].id,
      allocatedAt: new Date().toISOString(),
    });

    return true;
  };

  const assignStudentsByDepartment = (
    studentsToAssign: Student[],
    defaultCapacity: 4 | 5 | 6,
    nextStudents: Student[],
    nextRooms: Room[],
    nextAllocations: Allocation[]
  ) => {
    const errors: string[] = [];
    const assigned: string[] = [];

    const studentsByGender = {
      Female: studentsToAssign.filter(s => s.gender === 'Female').sort(sortStudentsByAssignment),
      Male: studentsToAssign.filter(s => s.gender === 'Male').sort(sortStudentsByAssignment),
    } as const;

    const processGender = (gender: 'Male' | 'Female', incomingStudents: Student[]) => {
      if (incomingStudents.length === 0) return;

      const candidateRooms = buildAutoAssignableRooms(gender, defaultCapacity, nextRooms);
      if (candidateRooms.length === 0) {
        incomingStudents.forEach(student => {
          errors.push(`No available automatic rooms for ${student.name} (${student.gender}).`);
        });
        return;
      }

      const departmentGroups = incomingStudents.reduce<Record<string, Student[]>>((groups, student) => {
        const key = normalizeDepartment(student.department);
        if (!groups[key]) groups[key] = [];
        groups[key].push(student);
        return groups;
      }, {});

      Object.keys(departmentGroups).sort().forEach(departmentKey => {
        const remainingStudents = [...departmentGroups[departmentKey]];
        const blockOrder = Array.from(new Set(candidateRooms.map(r => r.blockId))).sort((a, b) => {
          const numA = parseBlockNumber(blocks.find(block => block.id === a)?.name ?? '') || 0;
          const numB = parseBlockNumber(blocks.find(block => block.id === b)?.name ?? '') || 0;
          return numA - numB;
        });

        for (const blockId of blockOrder) {
          if (remainingStudents.length === 0) break;

          const blockRooms = candidateRooms.filter(r => r.blockId === blockId);
          if (blockRooms.length === 0) continue;

          const sameDepartmentRooms = blockRooms.filter(room => {
            const occupantDepartments = room.occupants
              .map(occupantId => nextStudents.find(s => s.id === occupantId))
              .filter((s): s is Student => Boolean(s))
              .map(s => normalizeDepartment(s.department));
            return occupantDepartments.length > 0 && occupantDepartments.every(dep => dep === departmentKey);
          });

          const orderedRooms = [
            ...sameDepartmentRooms,
            ...blockRooms.filter(room => !sameDepartmentRooms.includes(room)),
          ];

          for (const room of orderedRooms) {
            while (room.occupants.length < room.capacity && remainingStudents.length > 0) {
              const studentToPlace = remainingStudents.shift()!;
              const success = assignStudentToRoom(studentToPlace, room, nextStudents, nextRooms, nextAllocations);
              if (success) {
                assigned.push(studentToPlace.id);
              } else {
                errors.push(`Failed to assign ${studentToPlace.name} to room ${room.roomNumber}.`);
                break;
              }
            }
            if (remainingStudents.length === 0) break;
          }
        }

        if (remainingStudents.length > 0) {
          remainingStudents.forEach(student => {
            errors.push(`No available room for ${student.name} in department ${student.department || 'Unspecified'}.`);
          });
        }
      });
    };

    processGender('Female', studentsByGender.Female);
    processGender('Male', studentsByGender.Male);

    return { assigned, errors };
  };

  const isRoomRoleCompatible = (incomingRole: Role, existingRoles: Role[]) => {
    if (incomingRole === 'Student') {
      return existingRoles.every(role => role === 'Student');
    }
    if (existingRoles.some(role => role === 'Student')) {
      return false;
    }
    return true;
  };

  const sortStudentsByAdmission = (a: Student, b: Student) => {
    if (a.admission_number && b.admission_number) {
      return a.admission_number.localeCompare(b.admission_number, undefined, { numeric: true });
    }
    if (a.admission_number) return -1;
    if (b.admission_number) return 1;
    return a.studentId.localeCompare(b.studentId, undefined, { numeric: true });
  };

  // ========== STUDENT CRUD ==========
  const addStudent = useCallback((data: Omit<Student, 'id' | 'blockId' | 'roomId'>) => {
    const normalizedPhone = normalizePhoneNumber(data.phone);
    const newStudent: Student = {
      id: Date.now().toString(),
      blockId: undefined,
      roomId: undefined,
      ...data,
      phone: normalizedPhone,
    };
    setStudents(prev => [...prev, newStudent]);
    return newStudent.id;
  }, []);

  const addStudents = useCallback((data: Omit<Student, 'id' | 'blockId' | 'roomId'>[]) => {
    const newStudents: Student[] = data.map(newPerson => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      blockId: undefined,
      roomId: undefined,
      ...newPerson,
      phone: normalizePhoneNumber(newPerson.phone),
    }));
    setStudents(prev => [...prev, ...newStudents]);
    return newStudents.map(s => s.id);
  }, []);

  const addStudentsAndAutoAssign = useCallback((data: Omit<Student, 'id' | 'blockId' | 'roomId'>[], defaultCapacity: 4 | 5 | 6) => {
    const importedStudents: Student[] = data.map(newPerson => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      blockId: undefined,
      roomId: undefined,
      ...newPerson,
      phone: normalizePhoneNumber(newPerson.phone),
    }));

    const nextStudents = [...students, ...importedStudents];
    const nextRooms = rooms.map(room => ({ ...room, occupants: [...room.occupants] }));
    const nextAllocations = [...allocations];

    const { assigned, errors } = assignStudentsByDepartment(
      importedStudents.filter(student => student.role === 'Student'),
      defaultCapacity,
      nextStudents,
      nextRooms,
      nextAllocations
    );

    setStudents(nextStudents);
    setRooms(nextRooms);
    setAllocations(nextAllocations);

    return { assigned, errors, addedIds: importedStudents.map(s => s.id) };
  }, [students, rooms, allocations]);

  const updateStudent = useCallback((updated: Student) => {
    setStudents(prev => prev.map(s => (s.id === updated.id ? { ...updated, phone: normalizePhoneNumber(updated.phone) } : s)));
  }, []);

  const deleteStudent = useCallback((id: string) => {
    const student = students.find(s => s.id === id);
    if (student?.roomId) {
      setRooms(prev => prev.map(r => r.id === student.roomId ? { ...r, occupants: r.occupants.filter(o => o !== id) } : r));
      setAllocations(prev => prev.filter(a => a.userId !== id));
    }
    setStudents(prev => prev.filter(s => s.id !== id));
  }, [students]);

  // ========== BLOCK ==========
  const addBlock = useCallback((block: Omit<Block, 'id'>, role?: Role) => {
    if (role && !requireRole(role)) return 'No permission';
    if (block.numberOfRooms < 1 || block.numberOfRooms > 150) return 'Rooms must be 1-150';
    const id = Date.now().toString();
    setBlocks(prev => [...prev, { ...block, id, active: block.active ?? true }]);
    const newRooms: Room[] = Array.from({ length: block.numberOfRooms }).map((_, i) => ({
      id: `${id}-${i + 1}`,
      blockId: id,
      roomNumber: `${i + 1}`,
      capacity: 6,
      occupants: [],
      active: true,
      reservedFor: i === 0 ? 'Proctor' : undefined,
    }));
    setRooms(prev => [...prev, ...newRooms]);
    return null;
  }, []);

  const updateBlock = useCallback((block: Block, role?: Role) => {
    if (role && !requireRole(role)) return 'No permission';
    setBlocks(prev => prev.map(b => b.id === block.id ? block : b));
    return null;
  }, []);

  const deleteBlock = useCallback((id: string, role?: Role) => {
    if (role && !requireRole(role)) return 'No permission';
    if (rooms.some(r => r.blockId === id && r.occupants.length)) return 'Block has occupied rooms';
    setRooms(prev => prev.filter(r => r.blockId !== id));
    setBlocks(prev => prev.filter(b => b.id !== id));
    return null;
  }, [rooms]);

  // ========== ROOM ==========
  const addRoom = useCallback((room: Omit<Room, 'id' | 'occupants'>, role?: Role) => {
    if (role && !requireRole(role)) return 'No permission';
    if (room.capacity > 10) return 'Max capacity 10';
    setRooms(prev => [...prev, { ...room, id: Date.now().toString(), occupants: [], active: true }]);
    return null;
  }, []);

  const ensureBlocks = useCallback((blockNames: string[], numberOfRooms: number, role?: Role) => {
    if (role && !requireRole(role)) return { error: 'No permission' };
    if (numberOfRooms < 1 || numberOfRooms > 150) return { error: 'Rooms must be 1-150' };

    const existingBlocksByName = new Map(blocks.map(b => [b.name, b.id]));
    const createdBlocks: Block[] = [];
    const createdRooms: Room[] = [];
    const ids: string[] = [];

    blockNames.forEach(name => {
      const existingId = existingBlocksByName.get(name);
      if (existingId) {
        ids.push(existingId);
        return;
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${name}`;
      createdBlocks.push({ id, name, numberOfRooms, active: true });
      ids.push(id);
      for (let i = 0; i < numberOfRooms; i += 1) {
        createdRooms.push({
          id: `${id}-${i + 1}`,
          blockId: id,
          roomNumber: `${i + 1}`,
          capacity: 6,
          occupants: [],
          active: true,
          reservedFor: i === 0 ? 'Proctor' : undefined,
        });
      }
    });

    if (createdBlocks.length) {
      setBlocks(prev => [...prev, ...createdBlocks]);
      setRooms(prev => [...prev, ...createdRooms]);
    }

    return { ids, rooms: createdRooms };
  }, [blocks]);

  const updateRoom = useCallback((room: Room, role?: Role) => {
    if (role && !requireRole(role)) return 'No permission';
    setRooms(prev => prev.map(r => r.id === room.id ? {
      ...r,
      capacity: Math.min(10, Math.max(1, room.capacity)),
      active: room.active,
      reservedFor: room.reservedFor,
      roomNumber: room.roomNumber,
      blockId: room.blockId,
    } : r));
    return null;
  }, []);

  const deleteRoom = useCallback((id: string, role?: Role) => {
    if (role && !requireRole(role)) return 'No permission';
    const room = rooms.find(r => r.id === id);
    if (!room) return 'Room not found';
    if (room.occupants.length) return 'Room has occupants';
    setRooms(prev => prev.filter(r => r.id !== id));
    return null;
  }, [rooms]);

  const getRoomAllocationStaffRoles = (room: Room) => room.occupants
    .map(occupantId => students.find(s => s.id === occupantId)?.role)
    .filter((role): role is Role => Boolean(role));

  const allocateStudent = useCallback((studentId: string, blockId: string, roomId: string, role?: Role) => {
    if (role && !requireRole(role)) return 'No permission';
    const student = students.find(s => s.id === studentId);
    if (!student) return 'Student not found';
    const room = rooms.find(r => r.id === roomId);
    if (!room) return 'Room not found';
    if (!room.active) return 'Room inactive';
    if (!isRoomAssignableTo(room, student.role)) {
      if (room.reservedFor === 'Proctor') return 'Only a Proctor may occupy this reserved room.';
      if (room.reservedFor === 'Student') return 'Only students may occupy this room.';
      return 'This room cannot accept this role.';
    }
    if (room.occupants.length >= room.capacity) return 'Room full';

    const occupantRoles = getRoomAllocationStaffRoles(room);
    if (occupantRoles.length > 0 && !isRoomRoleCompatible(student.role, occupantRoles)) {
      if (student.role === 'Student') {
        return 'Students can only share with other students.';
      }
      if (occupantRoles.some(roleItem => roleItem === 'Student')) {
        return 'Staff cannot share rooms with students.';
      }
      return 'Staff may only share rooms with other staff members.';
    }

    const previousRoomId = student.roomId;
    if (previousRoomId === roomId) {
      return 'User already assigned to this room.';
    }

    if (previousRoomId) {
      setRooms(prev => prev.map(r => r.id === previousRoomId ? { ...r, occupants: r.occupants.filter(o => o !== studentId) } : r));
      setAllocations(prev => prev.filter(a => a.userId !== studentId));
    }

    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, blockId, roomId } : s));
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, occupants: [...r.occupants, studentId] } : r));
    setAllocations(prev => [...prev, {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      userId: studentId,
      blockId,
      roomId,
      allocatedAt: new Date().toISOString(),
    }] );
    return null;
  }, [students, rooms]);

  const bulkAssignStudents = useCallback((studentIds: string[], roomId: string, role?: Role) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return { assigned: [], skipped: studentIds.map(id => ({ id, error: 'Room not found' })) };
    const results: { assigned: string[]; skipped: { id: string; error: string }[] } = { assigned: [], skipped: [] };
    let currentOccupancy = room.occupants.length;

    studentIds.forEach(studentId => {
      if (currentOccupancy >= room.capacity) {
        results.skipped.push({ id: studentId, error: 'Room full' });
        return;
      }
      const error = allocateStudent(studentId, room.blockId, roomId, role);
      if (error) {
        results.skipped.push({ id: studentId, error });
      } else {
        results.assigned.push(studentId);
        currentOccupancy += 1;
      }
    });

    return results;
  }, [allocateStudent, rooms]);

  const bulkAssignToMultipleRooms = useCallback((studentIds: string[], roomIds: string[], role?: Role) => {
    const results: { assigned: string[]; skipped: { id: string; error: string }[] } = { assigned: [], skipped: [] };
    const availableRooms = roomIds
      .map(id => rooms.find(r => r.id === id))
      .filter((room): room is Room => Boolean(room) && room.active)
      .sort(compareRoomsForAutoAssign);

    const roomOccupancies = new Map(availableRooms.map(room => [room.id, room.occupants.length]));
    let roomIndex = 0;
    let studentIndex = 0;

    while (studentIndex < studentIds.length && roomIndex < availableRooms.length) {
      const currentRoom = availableRooms[roomIndex];
      const currentOccupancy = roomOccupancies.get(currentRoom.id) ?? currentRoom.occupants.length;

      if (currentOccupancy >= currentRoom.capacity) {
        roomIndex++;
        continue;
      }

      const studentId = studentIds[studentIndex];
      const error = allocateStudent(studentId, currentRoom.blockId, currentRoom.id, role);

      if (error) {
        results.skipped.push({ id: studentId, error });
        studentIndex++;
      } else {
        results.assigned.push(studentId);
        studentIndex++;
        roomOccupancies.set(currentRoom.id, currentOccupancy + 1);
        if (currentOccupancy + 1 >= currentRoom.capacity) {
          roomIndex++;
        }
      }
    }

    while (studentIndex < studentIds.length) {
      results.skipped.push({ id: studentIds[studentIndex], error: 'No available rooms' });
      studentIndex++;
    }

    return results;
  }, [allocateStudent, rooms]);

  const bulkAssignToBlock = useCallback((studentIds: string[], blockId: string, role?: Role) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block || !block.active) {
      return { assigned: [], skipped: studentIds.map(id => ({ id, error: 'Block not found or inactive' })) };
    }

    const blockRooms = rooms
      .filter(r => r.blockId === blockId && r.active)
      .sort(compareRoomsForAutoAssign);

    return bulkAssignToMultipleRooms(studentIds, blockRooms.map(r => r.id), role);
  }, [blocks, rooms, bulkAssignToMultipleRooms]);

  const autoAssignStudents = useCallback((studentIds: string[], defaultCapacity: 4 | 5 | 6) => {
    const studentsToAssign = studentIds
      .map(id => students.find(s => s.id === id))
      .filter((s): s is Student => Boolean(s) && s.role === 'Student' && !s.roomId)
      .sort(sortStudentsByAssignment);

    const nextStudents = students.map(student => ({ ...student }));
    const nextRooms = rooms.map(room => ({ ...room, occupants: [...room.occupants] }));
    const nextAllocations = [...allocations];

    const { assigned, errors } = assignStudentsByDepartment(
      studentsToAssign,
      defaultCapacity,
      nextStudents,
      nextRooms,
      nextAllocations
    );

    setStudents(nextStudents);
    setRooms(nextRooms);
    setAllocations(nextAllocations);

    return { assigned, errors };
  }, [students, rooms, allocations]);

  const deallocateStudent = useCallback((studentId: string, role?: Role) => {
    console.log('deallocateStudent called', { studentId, role });
    if (role && !requireRole(role)) return 'No permission';
    const student = students.find(s => s.id === studentId);
    if (!student?.roomId) {
      console.log('Student has no roomId, cannot deallocate');
      return 'Not assigned';
    }
    const oldRoomId = student.roomId;
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, blockId: undefined, roomId: undefined } : s));
    setRooms(prev => prev.map(r => r.id === oldRoomId ? { ...r, occupants: r.occupants.filter(o => o !== studentId) } : r));
    setAllocations(prev => prev.filter(a => a.userId !== studentId));
    console.log('Deallocation successful');
    return null;
  }, [students]);

  const deactivateRoom = useCallback((roomId: string, reassignBlock?: string, role?: Role) => {
    if (role && !requireRole(role)) return { success: false, errors: ['No permission'] };
    const room = rooms.find(r => r.id === roomId);
    if (!room) return { success: false, errors: ['Room not found'] };
    if (!room.active) return { success: false, errors: ['Room is already inactive'] };

    const errors: string[] = [];
    let updatedStudents = [...students];
    let updatedRooms = [...rooms];
    let updatedAllocations = [...allocations];

    if (room.occupants.length > 0) {
      if (!reassignBlock) {
        return { success: false, errors: [`Cannot deactivate: ${room.occupants.length} occupant(s) need reassignment`] };
      }
      const targetBlock = blocks.find(b => b.id === reassignBlock);
      if (!targetBlock || !targetBlock.active) {
        return { success: false, errors: ['Target block not found or inactive'] };
      }

      room.occupants.forEach(studentId => {
        const targetRoom = updatedRooms.find(r => r.blockId === reassignBlock && r.active && r.occupants.length < r.capacity);
        if (targetRoom) {
          updatedStudents = updatedStudents.map(s => s.id === studentId ? { ...s, blockId: reassignBlock, roomId: targetRoom.id } : s);
          updatedRooms = updatedRooms.map(r => r.id === targetRoom.id ? { ...r, occupants: [...r.occupants, studentId] } : r);
          updatedAllocations = updatedAllocations.map(a => a.userId === studentId ? { ...a, blockId: reassignBlock, roomId: targetRoom.id } : a);
        } else {
          errors.push(`No available room in target block for student ${studentId}`);
        }
      });

      if (errors.length > 0) {
        return { success: false, errors };
      }
    }

    updatedRooms = updatedRooms.map(r => r.id === roomId ? { ...r, active: false } : r);
    setStudents(updatedStudents);
    setRooms(updatedRooms);
    setAllocations(updatedAllocations);
    return { success: true, errors: [] };
  }, [students, rooms, blocks, allocations]);

  const deactivateBlock = useCallback((blockId: string, reassignBlock?: string, role?: Role) => {
    if (role && !requireRole(role)) return { success: false, errors: ['No permission'] };
    const block = blocks.find(b => b.id === blockId);
    if (!block) return { success: false, errors: ['Block not found'] };
    if (!block.active) return { success: false, errors: ['Block is already inactive'] };

    const blockRooms = rooms.filter(r => r.blockId === blockId);
    const totalOccupants = blockRooms.reduce((sum, r) => sum + r.occupants.length, 0);

    if (totalOccupants > 0) {
      if (!reassignBlock) {
        return { success: false, errors: [`Cannot deactivate: ${totalOccupants} occupant(s) need reassignment`] };
      }
      const targetBlock = blocks.find(b => b.id === reassignBlock);
      if (!targetBlock || !targetBlock.active) {
        return { success: false, errors: ['Target block not found or inactive'] };
      }

      let updatedStudents = [...students];
      let updatedRooms = [...rooms];
      let updatedAllocations = [...allocations];
      const errors: string[] = [];

      blockRooms.forEach(room => {
        room.occupants.forEach(studentId => {
          const targetRoom = updatedRooms.find(r => r.blockId === reassignBlock && r.active && r.occupants.length < r.capacity);
          if (targetRoom) {
            updatedStudents = updatedStudents.map(s => s.id === studentId ? { ...s, blockId: reassignBlock, roomId: targetRoom.id } : s);
            updatedRooms = updatedRooms.map(r => r.id === targetRoom.id ? { ...r, occupants: [...r.occupants, studentId] } : r);
            updatedAllocations = updatedAllocations.map(a => a.userId === studentId ? { ...a, blockId: reassignBlock, roomId: targetRoom.id } : a);
          } else {
            errors.push(`No available room for student ${studentId}`);
          }
        });
      });

      if (errors.length > 0) {
        return { success: false, errors };
      }

      updatedRooms = updatedRooms.map(r => r.blockId === blockId ? { ...r, active: false } : r);
      updatedStudents = updatedStudents.map(s => s.blockId === blockId ? { ...s, blockId: undefined, roomId: undefined } : s);
      updatedAllocations = updatedAllocations.filter(a => a.blockId !== blockId);
      setStudents(updatedStudents);
      setRooms(updatedRooms);
      setAllocations(updatedAllocations);
      return { success: true, errors: [] };
    }

    setRooms(prev => prev.map(r => r.blockId === blockId ? { ...r, active: false } : r));
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, active: false } : b));
    return { success: true, errors: [] };
  }, [students, rooms, blocks, allocations]);

  const reactivateRoom = useCallback((roomId: string, role?: Role) => {
    if (role && !requireRole(role)) return 'No permission';
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, active: true } : r));
    return null;
  }, []);

  const reactivateBlock = useCallback((blockId: string, role?: Role) => {
    if (role && !requireRole(role)) return 'No permission';
    setRooms(prev => prev.map(r => r.blockId === blockId ? { ...r, active: true } : r));
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, active: true } : b));
    return null;
  }, []);

  return (
    <DataContext.Provider value={{
      students, blocks, rooms, allocations,
      addStudent, updateStudent, deleteStudent,
      addBlock, updateBlock, deleteBlock,
      addRoom, updateRoom, deleteRoom,
      addStudents, addStudentsAndAutoAssign, bulkAssignStudents, bulkAssignToMultipleRooms, bulkAssignToBlock, autoAssignStudents,
      deactivateRoom, deactivateBlock, reactivateRoom, reactivateBlock,
      allocateStudent, deallocateStudent,
      ensureBlocks,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
