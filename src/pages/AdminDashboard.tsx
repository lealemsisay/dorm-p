import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Home, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { api } from '@/auth/authService';

interface DashboardStats {
  totalStudents: number;
  totalBlocks: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  allocatedStudents: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalBlocks: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    allocatedStudents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [studentsRes, blocksRes, roomsRes, allocationsRes] = await Promise.all([
          api.get('/api/students'),
          api.get('/api/blocks'),
          api.get('/api/rooms'),
          api.get('/api/allocations'),
        ]);

        const students = studentsRes.data?.data || [];
        const blocks = blocksRes.data?.data || [];
        const rooms = roomsRes.data?.data || [];
        const allocations = allocationsRes.data?.data || [];

        const occupiedRooms = rooms.filter((r: any) => r.occupants && r.occupants.length > 0).length;
        const allocatedStudents = allocations.length;

        setStats({
          totalStudents: students.length,
          totalBlocks: blocks.length,
          totalRooms: rooms.length,
          occupiedRooms,
          availableRooms: rooms.length - occupiedRooms,
          allocatedStudents,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) => (
    <Card className="p-6 flex items-center gap-4 bg-card hover:shadow-lg transition-shadow">
      <div className={`p-3 rounded-lg ${color}`}>
        {Icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-card-foreground">{value}</p>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-card-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of dormitory operations and key metrics</p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={<Users className="w-6 h-6 text-blue-600" />}
              label="Total Students"
              value={stats.totalStudents}
              color="bg-blue-100"
            />
            <StatCard
              icon={<Users className="w-6 h-6 text-green-600" />}
              label="Allocated Students"
              value={stats.allocatedStudents}
              color="bg-green-100"
            />
            <StatCard
              icon={<Building2 className="w-6 h-6 text-purple-600" />}
              label="Total Blocks"
              value={stats.totalBlocks}
              color="bg-purple-100"
            />
            <StatCard
              icon={<Home className="w-6 h-6 text-orange-600" />}
              label="Total Rooms"
              value={stats.totalRooms}
              color="bg-orange-100"
            />
            <StatCard
              icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
              label="Occupied Rooms"
              value={stats.occupiedRooms}
              color="bg-emerald-100"
            />
            <StatCard
              icon={<AlertCircle className="w-6 h-6 text-amber-600" />}
              label="Available Rooms"
              value={stats.availableRooms}
              color="bg-amber-100"
            />
          </div>

          <Card className="p-6 bg-card">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Quick Actions</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <Link
                to="/students"
                className="p-4 rounded-lg border bg-background hover:bg-muted transition-colors text-sm font-medium text-card-foreground"
              >
                👥 Manage Students
              </Link>
              <Link
                to="/blocks"
                className="p-4 rounded-lg border bg-background hover:bg-muted transition-colors text-sm font-medium text-card-foreground"
              >
                🏠 Manage Rooms
              </Link>
              <Link
                to="/blocks"
                className="p-4 rounded-lg border bg-background hover:bg-muted transition-colors text-sm font-medium text-card-foreground"
              >
                🏢 Manage Blocks
              </Link>
              <Link
                to="/allocations"
                className="p-4 rounded-lg border bg-background hover:bg-muted transition-colors text-sm font-medium text-card-foreground"
              >
                📋 Manage Allocations
              </Link>
            </div>
          </Card>

          <Card className="p-6 bg-card border-amber-200 bg-amber-50">
            <h2 className="text-lg font-semibold text-card-foreground mb-2">📊 System Status</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Occupancy Rate:</span>
                <span className="font-semibold ml-2">
                  {stats.totalRooms > 0 ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0}%
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Allocation Status:</span>
                <span className="font-semibold ml-2">
                  {stats.totalStudents > 0 ? Math.round((stats.allocatedStudents / stats.totalStudents) * 100) : 0}% allocated
                </span>
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
