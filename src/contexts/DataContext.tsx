import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Role } from '@/types/role';
import { initialStudents, type Student } from '@/data/students';
import { initialBlocks, initialRooms, type Block, type Room } from '@/data/rooms';
import { initialAllocations, type Allocation } from '@/data/allocations';

interface DataContextType {
  students: Student[];
  blocks: Block[];
  rooms: Room[];
  allocations: Allocation[];
  addStudent: (data: Omit<Student, 'id' | 'blockId' | 'roomId'>) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  addBlock: (block: Omit<Block, 'id'>, role?: Role) => string | null;
  updateBlock: (block: Block, role?: Role) => string | null;
  deleteBlock: (id: string, role?: Role) => string | null;
  addRoom: (room: Omit<Room, 'id' | 'occupants'>, role?: Role) => string | null;
  updateRoom: (room: Room, role?: Role) => string | null;
  deleteRoom: (id: string, role?: Role) => string | null;
  allocateStudent: (studentId: string, blockId: string, roomId: string, role?: Role) => string | null;
  deallocateStudent: (studentId: string, role?: Role) => string | null;
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [rooms, setRooms] = useState<Room[]>(() =>
    initialRooms.map(r => ({ ...r, capacity: r.capacity ?? 6, active: r.active ?? true }))
  );
  const [allocations, setAllocations] = useState<Allocation[]>(initialAllocations);

  const requireRole = (role?: Role) =>
    role === 'Coordinator' || role === 'TeamLeader' || role === 'VicePresident';

  // ========== STUDENT CRUD ==========
  const addStudent = useCallback((data: Omit<Student, 'id' | 'blockId' | 'roomId'>) => {
    const newStudent: Student = { id: Date.now().toString(), blockId: undefined, roomId: undefined, ...data };
    setStudents(prev => [...prev, newStudent]);
  }, []);

  const updateStudent = useCallback((updated: Student) => {
    setStudents(prev => prev.map(s => (s.id === updated.id ? updated : s)));
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
    if (block.numberOfRooms < 20 || block.numberOfRooms > 50) return 'Rooms must be 20-50';
    const id = Date.now().toString();
    setBlocks(prev => [...prev, { ...block, id }]);
    const newRooms: Room[] = Array.from({ length: block.numberOfRooms }).map((_, i) => ({
      id: `${id}-${i + 1}`, blockId: id, roomNumber: `${i + 1}`, capacity: 6, occupants: [], active: true,
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

  const updateRoom = useCallback((room: Room, role?: Role) => {
    if (role && !requireRole(role)) return 'No permission';
    setRooms(prev => prev.map(r => r.id === room.id ? { ...room, capacity: Math.min(10, Math.max(1, room.capacity)) } : r));
    return null;
  }, []);

  const deleteRoom = useCallback((id: string, role?: Role) => {
    if (role && !requireRole(role)) return 'No permission';
    if (rooms.find(r => r.id === id)?.occupants.length) return 'Room not empty';
    setRooms(prev => prev.filter(r => r.id !== id));
    return null;
  }, [rooms]);

  // ========== ALLOCATION ==========
  const allocateStudent = useCallback((studentId: string, blockId: string, roomId: string, role?: Role) => {
    console.log('allocateStudent called', { studentId, blockId, roomId, role });
    if (role && !requireRole(role)) return 'No permission';
    const student = students.find(s => s.id === studentId);
    if (!student) return 'Student not found';
    if (student.roomId) return 'Already assigned';
    const room = rooms.find(r => r.id === roomId);
    if (!room) return 'Room not found';
    if (!room.active) return 'Room inactive';
    if (room.occupants.length >= room.capacity) return 'Room full';

    // Update student
    setStudents(prev => {
      const updated = prev.map(s => s.id === studentId ? { ...s, blockId, roomId } : s);
      console.log('Students after assign:', updated);
      return updated;
    });
    // Update room occupants
    setRooms(prev => {
      const updated = prev.map(r => r.id === roomId ? { ...r, occupants: [...r.occupants, studentId] } : r);
      console.log('Rooms after assign:', updated);
      return updated;
    });
    // Add allocation record
    setAllocations(prev => {
      const newAlloc = { id: Date.now().toString(), userId: studentId, blockId, roomId, allocatedAt: new Date().toISOString() };
      console.log('New allocation:', newAlloc);
      return [...prev, newAlloc];
    });
    return null;
  }, [students, rooms]);

  const deallocateStudent = useCallback((studentId: string, role?: Role) => {
    console.log('deallocateStudent called', { studentId, role });
    if (role && !requireRole(role)) return 'No permission';
    const student = students.find(s => s.id === studentId);
    if (!student?.roomId) {
      console.log('Student has no roomId, cannot deallocate');
      return 'Not assigned';
    }
    const oldRoomId = student.roomId;
    // Remove from student
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, blockId: undefined, roomId: undefined } : s));
    // Remove from room occupants
    setRooms(prev => prev.map(r => r.id === oldRoomId ? { ...r, occupants: r.occupants.filter(o => o !== studentId) } : r));
    // Remove allocation record
    setAllocations(prev => prev.filter(a => a.userId !== studentId));
    console.log('Deallocation successful');
    return null;
  }, [students]);

  return (
    <DataContext.Provider value={{
      students, blocks, rooms, allocations,
      addStudent, updateStudent, deleteStudent,
      addBlock, updateBlock, deleteBlock,
      addRoom, updateRoom, deleteRoom,
      allocateStudent, deallocateStudent,
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