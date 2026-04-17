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

  // ✅ PATCH EXISTING ROOMS (add active if missing)
  const [rooms, setRooms] = useState<Room[]>(() =>
    initialRooms.map((r: any) => ({
      ...r,
      capacity: r.capacity ?? 6,
      active: r.active ?? true,
    }))
  );

  const [allocations, setAllocations] = useState<Allocation[]>(initialAllocations);

  const requireRole = (role: Role | undefined) =>
    role === 'Coordinator' || role === 'TeamLeader' || role === 'VicePresident';

  // =========================
  // BLOCK
  // =========================
  const addBlock = useCallback((block: Omit<Block, 'id'>, role?: Role) => {
    if (role && !requireRole(role)) return 'No permission';

    if (block.numberOfRooms < 20 || block.numberOfRooms > 50)
      return 'Rooms must be between 20 and 50';

    const id = Date.now().toString();

    const newBlock: Block = { ...block, id };

    setBlocks(prev => [...prev, newBlock]);

    // 🔥 AUTO CREATE ROOMS
    const generatedRooms: Room[] = Array.from({ length: block.numberOfRooms }).map((_, i) => ({
      id: `${id}-${i + 1}`,
      blockId: id,
      roomNumber: `${i + 1}`,
      capacity: 6,
      occupants: [],
      active: true,
    }));

    setRooms(prev => [...prev, ...generatedRooms]);

    return null;
  }, []);

  const updateBlock = useCallback((block: Block, role?: Role) => {
    if (role && !requireRole(role)) return 'No permission';

    setBlocks(prev => prev.map(b => (b.id === block.id ? block : b)));
    return null;
  }, []);

  const deleteBlock = useCallback((id: string, role?: Role) => {
    if (role && !requireRole(role)) return 'No permission';

    const blockRooms = rooms.filter(r => r.blockId === id);

    if (blockRooms.some(r => r.occupants.length > 0))
      return 'Block has occupied rooms';

    setRooms(prev => prev.filter(r => r.blockId !== id));
    setBlocks(prev => prev.filter(b => b.id !== id));

    return null;
  }, [rooms]);

  // =========================
  // ROOM
  // =========================
  const addRoom = useCallback((room: Omit<Room, 'id' | 'occupants'>, role?: Role) => {
    if (role && !requireRole(role)) return 'No permission';

    if (room.capacity > 10) return 'Max capacity is 10';

    const newRoom: Room = {
      ...room,
      id: Date.now().toString(),
      occupants: [],
      active: true,
    };

    setRooms(prev => [...prev, newRoom]);
    return null;
  }, []);

  const updateRoom = useCallback((room: Room, role?: Role) => {
    if (role && !requireRole(role)) return 'No permission';

    if (room.capacity > 10) room.capacity = 10;
    if (room.capacity < 1) room.capacity = 1;

    setRooms(prev => prev.map(r => (r.id === room.id ? room : r)));
    return null;
  }, []);

  const deleteRoom = useCallback((id: string, role?: Role) => {
    if (role && !requireRole(role)) return 'No permission';

    const room = rooms.find(r => r.id === id);
    if (room?.occupants.length) return 'Room not empty';

    setRooms(prev => prev.filter(r => r.id !== id));
    return null;
  }, [rooms]);

  // =========================
  // ALLOCATION
  // =========================
  const allocateStudent = useCallback((studentId: string, blockId: string, roomId: string, role?: Role) => {
    if (role && !requireRole(role)) return 'No permission';

    const student = students.find(s => s.id === studentId);
    if (!student) return 'Student not found';

    if (student.roomId) return 'Already assigned';

    const room = rooms.find(r => r.id === roomId);
    if (!room) return 'Room not found';

    if (!room.active) return 'Room inactive';

    if (room.occupants.length >= room.capacity)
      return 'Room full';

    setStudents(prev =>
      prev.map(s =>
        s.id === studentId ? { ...s, blockId, roomId } : s
      )
    );

    setRooms(prev =>
      prev.map(r =>
        r.id === roomId
          ? { ...r, occupants: [...r.occupants, studentId] }
          : r
      )
    );

    setAllocations(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        userId: studentId,
        blockId,
        roomId,
        allocatedAt: new Date().toISOString(),
      },
    ]);

    return null;
  }, [students, rooms]);

  const deallocateStudent = useCallback((studentId: string, role?: Role) => {
    if (role && !requireRole(role)) return 'No permission';

    const student = students.find(s => s.id === studentId);
    if (!student?.roomId) return 'Not assigned';

    setStudents(prev =>
      prev.map(s =>
        s.id === studentId ? { ...s, roomId: undefined, blockId: undefined } : s
      )
    );

    setRooms(prev =>
      prev.map(r =>
        r.id === student.roomId
          ? { ...r, occupants: r.occupants.filter(o => o !== studentId) }
          : r
      )
    );

    setAllocations(prev => prev.filter(a => a.userId !== studentId));

    return null;
  }, [students]);

  return (
    <DataContext.Provider value={{
      students,
      blocks,
      rooms,
      allocations,
      addBlock,
      updateBlock,
      deleteBlock,
      addRoom,
      updateRoom,
      deleteRoom,
      allocateStudent,
      deallocateStudent,
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