// Example: Filtering users by role on the frontend
// This demonstrates the core filtering logic used in the Users component

import { useState } from 'react';
import type { Role, User } from '@/types/role';

// Example user data
const sampleUsers: User[] = [
  { id: '1', username: 'teamleader1', role: 'TeamLeader' },
  { id: '2', username: 'coord1', role: 'Coordinator' },
  { id: '3', username: 'coord2', role: 'Coordinator' },
  { id: '4', username: 'proctor1', role: 'Proctor' },
  { id: '5', username: 'proctor2', role: 'Proctor' },
  { id: '6', username: 'student1', role: 'Student' },
  { id: '7', username: 'student2', role: 'Student' },
  { id: '8', username: 'student3', role: 'Student' },
];

export const UserFilteringExample = () => {
  const [selectedRole, setSelectedRole] = useState<Role>('Coordinator');

  // Core filtering logic: Filter users by selected role
  const filteredUsers = sampleUsers.filter(user => user.role === selectedRole);

  // Alternative: Group users by role (for more complex scenarios)
  const usersByRole = sampleUsers.reduce((acc, user) => {
    if (!acc[user.role]) {
      acc[user.role] = [];
    }
    acc[user.role].push(user);
    return acc;
  }, {} as Record<Role, User[]>);

  // Get user counts by role
  const userCounts = {
    TeamLeader: sampleUsers.filter(u => u.role === 'TeamLeader').length,
    Coordinator: sampleUsers.filter(u => u.role === 'Coordinator').length,
    Proctor: sampleUsers.filter(u => u.role === 'Proctor').length,
    Student: sampleUsers.filter(u => u.role === 'Student').length,
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">User Filtering Example</h2>

      {/* Role Selection Buttons */}
      <div className="flex gap-2 flex-wrap">
        {(['Coordinator', 'Proctor', 'Student', 'TeamLeader'] as Role[]).map(role => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`px-4 py-2 rounded ${
              selectedRole === role
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {role} ({userCounts[role]})
          </button>
        ))}
      </div>

      {/* Filtered Results */}
      <div className="border rounded p-4">
        <h3 className="font-semibold mb-2">Filtered {selectedRole}s:</h3>
        <ul className="space-y-1">
          {filteredUsers.map(user => (
            <li key={user.id} className="text-sm">
              {user.username} - {user.role}
            </li>
          ))}
        </ul>
        {filteredUsers.length === 0 && (
          <p className="text-gray-500">No users found for this role.</p>
        )}
      </div>

      {/* Alternative: Grouped Display */}
      <div className="border rounded p-4">
        <h3 className="font-semibold mb-2">All Users Grouped by Role:</h3>
        {Object.entries(usersByRole).map(([role, users]) => (
          <div key={role} className="mb-4">
            <h4 className="font-medium text-blue-600">{role}s ({users.length}):</h4>
            <ul className="ml-4 space-y-1">
              {users.map(user => (
                <li key={user.id} className="text-sm">
                  {user.username}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

// Utility functions for user filtering
export const filterUsersByRole = (users: User[], role: Role): User[] => {
  return users.filter(user => user.role === role);
};

export const getUserCountsByRole = (users: User[]) => {
  return users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<Role, number>);
};

export const groupUsersByRole = (users: User[]) => {
  return users.reduce((acc, user) => {
    if (!acc[user.role]) {
      acc[user.role] = [];
    }
    acc[user.role].push(user);
    return acc;
  }, {} as Record<Role, User[]>);
};