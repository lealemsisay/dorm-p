export interface Block {
  id: string;
  name: string;
  numberOfRooms: number;
}

export interface Room {
  id: string;
  blockId: string;
  roomNumber: string; // within block
  capacity: number;
  occupants: string[]; // student IDs
}

export const initialBlocks: Block[] = [
  { id: '1', name: 'Block A', numberOfRooms: 3 },
  { id: '2', name: 'Block B', numberOfRooms: 3 },
];

export const initialRooms: Room[] = [
  { id: '1', blockId: '1', roomNumber: '101', capacity: 3, occupants: ['1', '7'] },
  { id: '2', blockId: '1', roomNumber: '102', capacity: 2, occupants: ['5'] },
  { id: '3', blockId: '1', roomNumber: '103', capacity: 4, occupants: [] },
  { id: '4', blockId: '2', roomNumber: '201', capacity: 2, occupants: ['2', '4'] },
  { id: '5', blockId: '2', roomNumber: '202', capacity: 3, occupants: [] },
  { id: '6', blockId: '2', roomNumber: '203', capacity: 4, occupants: [] },
];
