import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { storage } from '@/utils/storage';
import type { Role, User } from '@/types/role';
import { demoUsers } from '@/types/role';

export interface CreateUserPayload {
  username: string;
  password: string;
  role: Role;
  fullName: string;
  nationalId: string;
  phoneNumber: string;
  address: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  createUser: (payload: CreateUserPayload) => boolean;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => storage.get('user', null));

  const [users, setUsers] = useState<User[]>(() => {
    const storedUsers = storage.get('users', null);
    if (storedUsers) return storedUsers;

    const initialUsers = Object.entries(demoUsers).map(([username, { password, role, studentRecordId }]) => ({
      id: username,
      username,
      role,
      password,
      studentRecordId,
    }));

    storage.set('users', initialUsers);
    return initialUsers;
  });

  const sync = (updated: User[]) => {
    setUsers(updated);
    storage.set('users', updated);
  };

  const login = useCallback((username: string, password: string) => {
    const userData = users.find(u => u.username === username);

    if (userData && demoUsers[username as keyof typeof demoUsers]?.password === password) {
      setUser(userData);
      storage.set('user', userData);
      return true;
    }
    return false;
  }, [users]);

  const logout = useCallback(() => {
    setUser(null);
    storage.remove('user');
  }, []);

  const createUser = useCallback((payload: CreateUserPayload) => {
    if (user?.role !== 'VicePresident') return false;
    if (users.some(u => u.username === payload.username)) return false;

    const newUser: User = {
      id: payload.username,
      username: payload.username,
      role: payload.role,
      fullName: payload.fullName,
      nationalId: payload.nationalId,
      phoneNumber: payload.phoneNumber,
      address: payload.address,
      email: payload.email,
    };

    const updated = [...users, newUser];
    sync(updated);
    return true;
  }, [user, users]);

  // ✅ FIXED UPDATE USER
  const updateUser = useCallback((updatedUser: User) => {
    const updated = users.map(u =>
      u.id === updatedUser.id ? { ...u, ...updatedUser } : u
    );
    sync(updated);
  }, [users]);

  // ✅ FIXED DELETE USER
  const deleteUser = useCallback((id: string) => {
    const updated = users.filter(u => u.id !== id);
    sync(updated);
  }, [users]);

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isAuthenticated: !!user,
        login,
        logout,
        createUser,
        updateUser,
        deleteUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};