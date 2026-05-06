import type { Role } from '../types/role';

export interface Student {
  id: string;
  name: string;
  studentId: string;
  admission_number?: string;
  registrar_id?: string;
  phone: string;
  gender: 'Male' | 'Female';
  category?: 'Freshman' | 'Senior' | 'Remedial' | 'GC';
  batch?: string;
  blockId?: string;
  roomId?: string;
  role: Role;
}

export const initialStudents: Student[] = [
  { id: '1', name: 'John Smith', studentId: 'STU001', admission_number: 'STU001', phone: '555-0101', gender: 'Male', category: 'Freshman', batch: '2026', blockId: '1', roomId: '1', role: 'Student' },
  { id: '2', name: 'Jane Doe', studentId: 'STU002', admission_number: 'STU002', phone: '555-0102', gender: 'Female', category: 'Senior', batch: '2024', blockId: '2', roomId: '4', role: 'Student' },
  { id: '3', name: 'Alex Johnson', studentId: 'STU003', admission_number: 'STU003', phone: '555-0103', gender: 'Male', category: 'Remedial', batch: '2025', role: 'Student' },
  { id: '4', name: 'Emily Davis', studentId: 'STU004', admission_number: 'STU004', phone: '555-0104', gender: 'Female', category: 'GC', batch: '2023', blockId: '2', roomId: '4', role: 'Student' },
  { id: '5', name: 'Michael Brown', studentId: 'STU005', admission_number: 'STU005', phone: '555-0105', gender: 'Male', category: 'Freshman', batch: '2026', blockId: '1', roomId: '2', role: 'Student' },
  { id: '6', name: 'Sarah Wilson', studentId: 'STU006', admission_number: 'STU006', phone: '555-0106', gender: 'Female', category: 'Senior', batch: '2024', role: 'Student' },
  { id: '7', name: 'David Lee', studentId: 'STU007', admission_number: 'STU007', phone: '555-0107', gender: 'Male', category: 'Remedial', batch: '2025', blockId: '1', roomId: '1', role: 'Student' },
  { id: '8', name: 'Lisa Anderson', studentId: 'STU008', admission_number: 'STU008', phone: '555-0108', gender: 'Female', category: 'GC', batch: '2023', role: 'Student' },
  { id: '9', name: 'Proctor Test', studentId: 'PROC001', phone: '555-0901', gender: 'Male', role: 'Proctor' },
  { id: '10', name: 'Coord Test', studentId: 'COORD001', phone: '555-0902', gender: 'Female', role: 'Coordinator' },
];
