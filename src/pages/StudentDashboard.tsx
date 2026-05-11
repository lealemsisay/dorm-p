import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { MapPin, Users, Building2, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { api } from '@/auth/authService';

interface StudentInfo {
  id: string;
  name: string;
  admissionNumber?: string;
  registrarId?: string;
  department?: string;
  level?: string;
}

interface RoomInfo {
  id: string;
  roomNumber: string;
  blockId: string;
  occupants: string[];
  capacity: number;
}

interface BlockInfo {
  id: string;
  name: string;
  numberOfRooms: number;
}

interface AllocationInfo {
  roomId: string;
  blockId: string;
  allocatedAt: string;
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [blockInfo, setBlockInfo] = useState<BlockInfo | null>(null);
  const [allocation, setAllocation] = useState<AllocationInfo | null>(null);
  const [roommates, setRoommates] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/students/me');
        const payload = response.data?.data;

        if (!payload || !payload.student) {
          return;
        }

        const student = payload.student;
        setStudentInfo({
          id: student._id,
          name: student.name || 'Unknown',
          admissionNumber: student.admission_number,
          registrarId: student.registrar_id,
          department: student.department,
          level: student.year,
        });

        if (payload.room) {
          setRoomInfo({
            id: payload.room._id,
            roomNumber: payload.room.roomNumber,
            blockId: payload.room.blockId,
            occupants: payload.room.occupants || [],
            capacity: payload.room.capacity || 6,
          });
        }

        if (payload.block) {
          setBlockInfo({
            id: payload.block._id,
            name: payload.block.name,
            numberOfRooms: payload.block.numberOfRooms,
          });
        }

        if (payload.allocation) {
          setAllocation({
            roomId: payload.allocation.roomId,
            blockId: payload.allocation.blockId,
            allocatedAt: payload.allocation.allocatedAt,
          });
        } else {
          setAllocation(null);
        }

        if (Array.isArray(payload.roommates)) {
          setRoommates(
            payload.roommates.map((roommate: any) => ({
              id: roommate._id,
              name: roommate.name,
              admissionNumber: roommate.admission_number,
              registrarId: roommate.registrar_id,
              department: roommate.department,
              level: roommate.year,
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.username) {
      fetchStudentData();
    }
  }, [user?.username]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-muted animate-pulse rounded-lg"></div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-card-foreground">Student Dashboard</h1>
        <p className="text-muted-foreground mt-2">Your dormitory allocation and room information</p>
      </div>

      {!studentInfo ? (
        <Card className="p-8 bg-card text-center">
          <p className="text-muted-foreground">Your student record could not be found. Please contact the administration.</p>
        </Card>
      ) : (
        <>
          {/* Student Info */}
          <Card className="p-6 bg-card">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">📋 Your Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg border bg-background">
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-semibold text-card-foreground">{studentInfo.name}</p>
              </div>
              <div className="p-4 rounded-lg border bg-background">
                <p className="text-sm text-muted-foreground">Admission Number</p>
                <p className="font-semibold text-card-foreground">{studentInfo.admissionNumber || 'N/A'}</p>
              </div>
              <div className="p-4 rounded-lg border bg-background">
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-semibold text-card-foreground">{studentInfo.department || 'N/A'}</p>
              </div>
              <div className="p-4 rounded-lg border bg-background">
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="font-semibold text-card-foreground">{studentInfo.level || 'N/A'}</p>
              </div>
            </div>
          </Card>

          {/* Allocation Status */}
          {allocation && blockInfo && roomInfo ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-6 bg-emerald-50 border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Allocation Status</p>
                      <p className="font-semibold text-emerald-700">Allocated</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned Block</p>
                      <p className="font-semibold text-blue-700">{blockInfo.name}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-purple-50 border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <MapPin className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned Room</p>
                      <p className="font-semibold text-purple-700">Room {roomInfo.roomNumber}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Room Details */}
              <Card className="p-6 bg-card">
                <h2 className="text-xl font-semibold text-card-foreground mb-4">🏠 Room Details</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg border bg-background">
                    <p className="text-sm text-muted-foreground">Room Number</p>
                    <p className="font-semibold text-card-foreground text-lg">{roomInfo.roomNumber}</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-background">
                    <p className="text-sm text-muted-foreground">Capacity</p>
                    <p className="font-semibold text-card-foreground text-lg">{roomInfo.occupants.length}/{roomInfo.capacity}</p>
                  </div>
                </div>
              </Card>

              {/* Roommates */}
              <Card className="p-6 bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5" />
                  <h2 className="text-xl font-semibold text-card-foreground">Your Roommates</h2>
                </div>
                {roommates.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {roommates.map((roommate) => (
                      <div key={roommate.id} className="p-4 rounded-lg border bg-background hover:shadow-md transition-shadow">
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-semibold text-card-foreground">{roommate.name}</p>
                        <p className="text-sm text-muted-foreground mt-2">Admission Number</p>
                        <p className="text-card-foreground text-sm">{roommate.admissionNumber || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No roommates assigned yet</p>
                )}
              </Card>

              {/* Allocation Date */}
              <Card className="p-6 bg-amber-50 border-amber-200">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Allocation Date</p>
                    <p className="font-semibold text-amber-700">
                      {new Date(allocation.allocatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-8 bg-amber-50 border-amber-200 text-center">
              <p className="text-amber-700 font-medium">You have not been allocated a room yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Please contact the administration for your room allocation.</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
