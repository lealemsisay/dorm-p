import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './authService';
import { storage } from '@/utils/storage';
import { demoUsers } from '@/types/role';

const AuthContext = createContext(null);

const initialUser = storage.get('user', null);
const initialToken = storage.get('token', null);

const buildInitialUsers = () => {
  const storedUsers = storage.get('users', null);
  if (storedUsers) return storedUsers;

  const initialUsers = Object.entries(demoUsers).map(([username, { password, role }]) => ({
    id: username,
    username,
    role,
    password,
  }));

  storage.set('users', initialUsers);
  return initialUsers;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(initialUser);
  const [token, setToken] = useState(initialToken);
  const [users, setUsers] = useState(buildInitialUsers);
  const [authReady, setAuthReady] = useState(false);

  const isAuthenticated = Boolean(user && token);
  const role = user?.role || null;

  const syncUsers = useCallback((updated) => {
    setUsers(updated);
    storage.set('users', updated);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    storage.remove('token');
    storage.remove('user');
  }, []);

  const initializeAuth = useCallback(async () => {
    if (!initialToken) {
      setAuthReady(true);
      return;
    }

    try {
      const response = await api.get('/api/auth/me', { skipAuthRedirect: true });
      const currentUser = response.data?.data?.user;
      if (currentUser) {
        const sessionUser = {
          id: currentUser.id,
          username: currentUser.username,
          role: currentUser.role,
        };
        setUser(sessionUser);
        setToken(initialToken);
        storage.set('token', initialToken);
        storage.set('user', sessionUser);
      } else {
        logout();
      }
    } catch (error) {
      logout();
    } finally {
      setAuthReady(true);
    }
  }, [initialToken, logout]);

  const login = useCallback(async (id, password) => {
    const response = await api.post('/api/auth/login', { id, password });
    const payload = response.data;

    if (payload.requiresPasswordChange) {
      return {
        requiresPasswordChange: true,
        message: payload.message,
        id,
      };
    }

    const sessionUser = {
      id: payload.user.id,
      username: payload.user.id,
      role: payload.user.role,
    };

    setUser(sessionUser);
    setToken(payload.token);
    storage.set('token', payload.token);
    storage.set('user', sessionUser);

    return {
      success: true,
      user: sessionUser,
    };
  }, []);

  const changePassword = useCallback(async ({ id, oldPassword, newPassword, confirmPassword }) => {
    const response = await api.post('/api/auth/change-password', {
      id,
      oldPassword,
      newPassword,
      confirmPassword,
    });
    return response.data;
  }, []);

  const createUser = useCallback((payload) => {
    if (!user || user.role !== 'admin') return false;
    if (users.some((u) => u.username === payload.username)) return false;

    const newUser = {
      id: payload.username,
      username: payload.username,
      role: payload.role,
      fullName: payload.fullName,
      nationalId: payload.nationalId,
      phoneNumber: payload.phoneNumber,
      address: payload.address,
      email: payload.email,
      password: payload.password,
    };

    const updated = [...users, newUser];
    syncUsers(updated);
    return true;
  }, [user, users, syncUsers]);

  const updateUser = useCallback((updatedUser) => {
    const updated = users.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
    syncUsers(updated);
  }, [users, syncUsers]);

  const deleteUser = useCallback((id) => {
    const updated = users.filter((u) => u.id !== id);
    syncUsers(updated);
  }, [users, syncUsers]);

  const value = useMemo(() => ({
    user,
    token,
    role,
    isAuthenticated,
    authReady,
    login,
    logout,
    changePassword,
    users,
    createUser,
    updateUser,
    deleteUser,
  }), [user, token, role, isAuthenticated, authReady, login, logout, changePassword, users, createUser, updateUser, deleteUser]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
