<<<<<<< HEAD
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/auth/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import Layout from '@/components/layout/Layout';
import Login from '@/pages/Login';
import ChangePassword from '@/pages/ChangePassword';
import Dashboard from '@/pages/Dashboard';
import Rooms from '@/pages/Rooms';
import Allocations from '@/pages/Allocations';
import Users from '@/pages/Users';
import Students from '@/pages/Students';
import AdminDashboard from '@/pages/AdminDashboard';
import StaffDashboard from '@/pages/StaffDashboard';
import StudentDashboard from '@/pages/StudentDashboard';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/auth/ProtectedRoute';
=======
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import Layout from "@/components/layout/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Rooms from "@/pages/Rooms";
import Allocations from "@/pages/Allocations";
import Users from "@/pages/Users";
import Students from "@/pages/Students";
<<<<<<< HEAD
import NotFound from "@/pages/NotFound";import { RoleGuard } from '@/components/RoleGuard';
const App = () => (
  <AuthProvider>
    <DataProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route
                path="/users"
                element={
                  <RoleGuard allowedRoles={['VicePresident']}>
                    <Users />
                  </RoleGuard>
                }
              />
              <Route
                path="/students"
                element={
                  <RoleGuard allowedRoles={['VicePresident', 'TeamLeader', 'Coordinator', 'Proctor']}>
                    <Students />
                  </RoleGuard>
                }
              />
              <Route
                path="/blocks"
                element={
                  <RoleGuard allowedRoles={['VicePresident', 'TeamLeader', 'Coordinator']}>
                    <Rooms />
                  </RoleGuard>
                }
              />
              <Route
                path="/allocations"
                element={
                  <RoleGuard allowedRoles={['VicePresident', 'TeamLeader', 'Coordinator']}>
                    <Allocations />
                  </RoleGuard>
                }
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </DataProvider>
  </AuthProvider>
);
=======
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";
import axios from "axios";
>>>>>>> f9624a099bd7184f2cbf42810d1211d4866e6b7b

const App = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route element={<Layout />}>
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
                <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
                <Route path="/blocks" element={<ProtectedRoute><Rooms /></ProtectedRoute>} />
                <Route path="/allocations" element={<ProtectedRoute><Allocations /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff']}><StaffDashboard /></ProtectedRoute>} />
                <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  );
};
>>>>>>> a5c038688ecc1d223f641054508ce8d7fbbfc5b7

export default App;
