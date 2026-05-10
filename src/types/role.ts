export type Role = 
  | 'VicePresident' 
  | 'TeamLeader' 
  | 'Coordinator' 
  | 'Proctor' 
  | 'Student'
  | 'admin'
  | 'staff';

export interface User {
  id: string;
  username: string;
  role: Role;
  studentRecordId?: string;
  // Extended profile fields
  fullName?: string;
  nationalId?: string;
  phoneNumber?: string;
  address?: string;
  email?: string;
}

export const demoUsers: Record<string, { password: string; role: Role; studentRecordId?: string }> = {
  'vp_admin': { password: 'vp123', role: 'VicePresident' },
  'teamleader': { password: 'team123', role: 'TeamLeader' },
  'coord1': { password: 'coord123', role: 'Coordinator' },
  'proctor': { password: 'proctor123', role: 'Proctor' },
  'student1': { password: 'student123', role: 'Student', studentRecordId: '1' },
} as const;

