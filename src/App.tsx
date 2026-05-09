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

export default App;
