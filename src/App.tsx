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

const App = () => {
  useEffect(() => {
    const testAPI = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/test');
        console.log('API Response:', response.data);
      } catch (error) {
        console.error('API Error:', error);
      }
    };
    testAPI();
  }, []);

  return (
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
                <Route path="/students" element={<Students />} />
                <Route path="/blocks" element={<Rooms />} />
                <Route path="/allocations" element={<Allocations />} />
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
