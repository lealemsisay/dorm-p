export interface Allocation {
  id: string;
  userId: string;
  blockId: string;
  roomId: string;
  allocatedAt: string;
}

export const initialAllocations: Allocation[] = [
  { id: '1', userId: 'proctor', blockId: '1', roomId: '1', allocatedAt: '2024-01-15' },
  { id: '2', userId: 'coord1', blockId: '1', roomId: '2', allocatedAt: '2024-01-16' },
  { id: '3', userId: 'teamleader', blockId: '2', roomId: '4', allocatedAt: '2024-01-17' },
];
