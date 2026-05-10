import { useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { RoleGuard } from '../RoleGuard';

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'User Management',
  '/students': 'Student Management',
  '/blocks': 'Block Management',
  '/allocations': 'Allocations',
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const title = titles[location.pathname] || 'DormManager';

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
