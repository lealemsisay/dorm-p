export interface Block {
  id: string;
  name: string;
  numberOfRooms: number;
  active?: boolean;
}

export interface Room {
  id: string;
  blockId: string;
  roomNumber: string; // within block
  capacity: number;
  occupants: string[]; // student IDs
  active: boolean;
  reservedFor?: 'Proctor' | 'Student' | 'Staff';
}

const createBlock = (num: number, count: number): Block[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `block-${num + i}`,
    name: `Block ${num + i}`,
    numberOfRooms: 0,
    active: true,
  }));
};

const createRoomsForBlock = (blockId: string, blockNum: number, roomCount: number, capacity: number = 6): Room[] => {
  return Array.from({ length: roomCount }, (_, i) => ({
    id: `${blockId}-${i + 1}`,
    blockId,
    roomNumber: `${i + 1}`,
    capacity,
    occupants: [],
    active: true,
    reservedFor: i === 0 ? 'Proctor' : undefined,
  }));
};

export const initialBlocks: Block[] = [
  ...createBlock(501, 5),
  ...createBlock(506, 12),
  { id: 'block-518', name: 'Block 518', numberOfRooms: 2, active: true },
  ...createBlock(519, 43),
];

export const initialRooms: Room[] = [
  // Female blocks 501-505 (~27 rooms total)
  ...createRoomsForBlock('block-501', 501, 6),
  ...createRoomsForBlock('block-502', 502, 6),
  ...createRoomsForBlock('block-503', 503, 5),
  ...createRoomsForBlock('block-504', 504, 5),
  ...createRoomsForBlock('block-505', 505, 5),

  // Female blocks 506-517 (~46 rooms total, expandable)
  ...createRoomsForBlock('block-506', 506, 4),
  ...createRoomsForBlock('block-507', 507, 4),
  ...createRoomsForBlock('block-508', 508, 4),
  ...createRoomsForBlock('block-509', 509, 4),
  ...createRoomsForBlock('block-510', 510, 4),
  ...createRoomsForBlock('block-511', 511, 4),
  ...createRoomsForBlock('block-512', 512, 4),
  ...createRoomsForBlock('block-513', 513, 4),
  ...createRoomsForBlock('block-514', 514, 4),
  ...createRoomsForBlock('block-515', 515, 4),
  ...createRoomsForBlock('block-516', 516, 2),
  ...createRoomsForBlock('block-517', 517, 2),

  // Manual block 518 (reserved for special assignment)
  ...createRoomsForBlock('block-518', 518, 2, 4),

  // Male blocks 519-561 (~dynamic, starting with base)
  ...createRoomsForBlock('block-519', 519, 6),
  ...createRoomsForBlock('block-520', 520, 6),
  ...createRoomsForBlock('block-521', 521, 6),
  ...createRoomsForBlock('block-522', 522, 6),
  ...createRoomsForBlock('block-523', 523, 6),
  ...createRoomsForBlock('block-524', 524, 6),
  ...createRoomsForBlock('block-525', 525, 6),
  ...createRoomsForBlock('block-526', 526, 6),
  ...createRoomsForBlock('block-527', 527, 6),
  ...createRoomsForBlock('block-528', 528, 6),
];
