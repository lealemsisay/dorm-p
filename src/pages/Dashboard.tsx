import { useData } from '@/contexts/DataContext';
import { Users, DoorOpen, CheckCircle, AlertCircle, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';

interface ChartDataPoint {
  time: string;
  Freshman: number;
  Senior: number;
  Remedial: number;
  GC: number;
}

const Dashboard = () => {
  const { students, blocks, rooms, allocations } = useData();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  const totalStudents = students.length;
  const totalBlocks = blocks.length;
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.occupants.length > 0).length;
  const availableRooms = totalRooms - occupiedRooms;

  const stats = [
    { label: 'Total Blocks', value: totalBlocks, icon: DoorOpen, color: 'bg-info/10 text-info' },
    { label: 'Total Rooms', value: totalRooms, icon: DoorOpen, color: 'bg-primary/10 text-primary' },
    { label: 'Occupied Rooms', value: occupiedRooms, icon: AlertCircle, color: 'bg-warning/10 text-warning' },
    { label: 'Available Rooms', value: availableRooms, icon: CheckCircle, color: 'bg-success/10 text-success' },
  ];

  // Generate recent activity from allocations
  const recentActivity = allocations
    .sort((a, b) => new Date(b.allocatedAt).getTime() - new Date(a.allocatedAt).getTime())
    .slice(0, 5)
    .map(allocation => {
      const block = blocks.find(b => b.id === allocation.blockId);
      const room = rooms.find(r => r.id === allocation.roomId);
      return {
        id: allocation.id,
        action: 'Room Allocated',
        details: `Room allocated in ${block?.name} - Room ${room?.roomNumber}`,
        timestamp: allocation.allocatedAt,
      };
    });

  // Generate chart data for real-time updates
  useEffect(() => {
    const generateChartData = () => {
      const now = new Date();
      const counts = {
        Freshman: students.filter(s => s.category === 'Freshman').length,
        Senior: students.filter(s => s.category === 'Senior').length,
        Remedial: students.filter(s => s.category === 'Remedial').length,
        GC: students.filter(s => s.category === 'GC').length,
      };

      const data: ChartDataPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 1000);
        data.push({
          time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          Freshman: counts.Freshman,
          Senior: counts.Senior,
          Remedial: counts.Remedial,
          GC: counts.GC,
        });
      }
      setChartData(data);
    };

    generateChartData();
    const interval = setInterval(generateChartData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [students]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-3xl font-bold text-card-foreground mt-1">{value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? recentActivity.map(activity => (
              <div key={activity.id} className="flex items-start justify-between py-2 border-b last:border-0">
                <div className="flex-1">
                  <p className="font-medium text-card-foreground text-sm">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.details}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Real-time Student Category Chart</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="Freshman" stroke="#4f46e5" strokeWidth={2} />
                <Line type="monotone" dataKey="Senior" stroke="#ec4899" strokeWidth={2} />
                <Line type="monotone" dataKey="Remedial" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="GC" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
