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

const createBlocks = (start: number, counts: number[]): Block[] => {
  return counts.map((count, index) => ({
    id: `block-${start + index}`,
    name: `Block ${start + index}`,
    numberOfRooms: count,
    active: true,
  }));
};

const createRoomsForBlock = (blockId: string, roomCount: number, capacity: number = 6): Room[] => {
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
  ...createBlocks(501, [6, 6, 5, 5, 5]),
  ...createBlocks(506, Array(12).fill(4)),
  { id: 'block-518', name: 'Block 518', numberOfRooms: 2, active: true },
  ...createBlocks(519, Array(43).fill(27)),
];

export const initialRooms: Room[] = [
  // Female blocks 501-505 (27 rooms total)
  ...createRoomsForBlock('block-501', 6),
  ...createRoomsForBlock('block-502', 6),
  ...createRoomsForBlock('block-503', 5),
  ...createRoomsForBlock('block-504', 5),
  ...createRoomsForBlock('block-505', 5),

  // Female blocks 506-517 (48 rooms total)
  ...createRoomsForBlock('block-506', 4),
  ...createRoomsForBlock('block-507', 4),
  ...createRoomsForBlock('block-508', 4),
  ...createRoomsForBlock('block-509', 4),
  ...createRoomsForBlock('block-510', 4),
  ...createRoomsForBlock('block-511', 4),
  ...createRoomsForBlock('block-512', 4),
  ...createRoomsForBlock('block-513', 4),
  ...createRoomsForBlock('block-514', 4),
  ...createRoomsForBlock('block-515', 4),
  ...createRoomsForBlock('block-516', 4),
  ...createRoomsForBlock('block-517', 4),

  // Manual block 518 (reserved for special assignment)
  ...createRoomsForBlock('block-518', 2, 4),

  // Male blocks 519-561 (27 rooms each)
  ...createRoomsForBlock('block-519', 27),
  ...createRoomsForBlock('block-520', 27),
  ...createRoomsForBlock('block-521', 27),
  ...createRoomsForBlock('block-522', 27),
  ...createRoomsForBlock('block-523', 27),
  ...createRoomsForBlock('block-524', 27),
  ...createRoomsForBlock('block-525', 27),
  ...createRoomsForBlock('block-526', 27),
  ...createRoomsForBlock('block-527', 27),
  ...createRoomsForBlock('block-528', 27),
  ...createRoomsForBlock('block-529', 27),
  ...createRoomsForBlock('block-530', 27),
  ...createRoomsForBlock('block-531', 27),
  ...createRoomsForBlock('block-532', 27),
  ...createRoomsForBlock('block-533', 27),
  ...createRoomsForBlock('block-534', 27),
  ...createRoomsForBlock('block-535', 27),
  ...createRoomsForBlock('block-536', 27),
  ...createRoomsForBlock('block-537', 27),
  ...createRoomsForBlock('block-538', 27),
  ...createRoomsForBlock('block-539', 27),
  ...createRoomsForBlock('block-540', 27),
  ...createRoomsForBlock('block-541', 27),
  ...createRoomsForBlock('block-542', 27),
  ...createRoomsForBlock('block-543', 27),
  ...createRoomsForBlock('block-544', 27),
  ...createRoomsForBlock('block-545', 27),
  ...createRoomsForBlock('block-546', 27),
  ...createRoomsForBlock('block-547', 27),
  ...createRoomsForBlock('block-548', 27),
  ...createRoomsForBlock('block-549', 27),
  ...createRoomsForBlock('block-550', 27),
  ...createRoomsForBlock('block-551', 27),
  ...createRoomsForBlock('block-552', 27),
  ...createRoomsForBlock('block-553', 27),
  ...createRoomsForBlock('block-554', 27),
  ...createRoomsForBlock('block-555', 27),
  ...createRoomsForBlock('block-556', 27),
  ...createRoomsForBlock('block-557', 27),
  ...createRoomsForBlock('block-558', 27),
  ...createRoomsForBlock('block-559', 27),
  ...createRoomsForBlock('block-560', 27),
  ...createRoomsForBlock('block-561', 27),
];
