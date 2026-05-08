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

export default App;
