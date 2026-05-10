import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/auth/AuthContext";
import { DataProvider } from "@/contexts/DataContext";

import Layout from "@/components/layout/Layout";

import Login from "@/pages/Login";
import ChangePassword from "@/pages/ChangePassword";

import Dashboard from "@/pages/Dashboard";
import Rooms from "@/pages/Rooms";
import Allocations from "@/pages/Allocations";
import Users from "@/pages/Users";
import Students from "@/pages/Students";

import AdminDashboard from "@/pages/AdminDashboard";
import StaffDashboard from "@/pages/StaffDashboard";
import StudentDashboard from "@/pages/StudentDashboard";

import NotFound from "@/pages/NotFound";

import ProtectedRoute from "@/auth/ProtectedRoute";

const App = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Sonner />

          <BrowserRouter>
            <Routes>

              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/change-password" element={<ChangePassword />} />

              {/* Protected Routes */}
              <Route element={<Layout />}>

                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/users"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <Users />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/students"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "staff"]}>
                      <Students />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/blocks"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "staff"]}>
                      <Rooms />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/allocations"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "staff"]}>
                      <Allocations />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute allowedRoles={["staff"]}>
                      <StaffDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/student"
                  element={
                    <ProtectedRoute allowedRoles={["student"]}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />

              </Route>

              {/* Not Found */}
              <Route path="*" element={<NotFound />} />

            </Routes>
          </BrowserRouter>

        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;