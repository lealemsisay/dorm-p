import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { DoorOpen, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const Allocations = () => {
  const { blocks, rooms, allocations, students, allocateStudent, deallocateStudent } = useData();
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [expandedRooms, setExpandedRooms] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Record<string, string>>({});

  const getAllocationByRoom = (roomId: string) => allocations.find(a => a.roomId === roomId);
  const getStudent = (userId: string | null) => userId ? students.find(s => s.id === userId) : undefined;

  const getRoomStatus = (roomId: string) => {
    const allocation = getAllocationByRoom(roomId);
    if (allocation) {
      return { status: 'Occupied', userId: allocation.userId, allocation };
    }
    return { status: 'Available', userId: null, allocation: null };
  };

  const toggleBlock = (blockId: string) => {
    setExpandedBlock(prev => (prev === blockId ? null : blockId));
  };

  const toggleRoom = (roomId: string) => {
    setExpandedRooms(prev => prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]);
  };

  const roomMatchesSearch = (room: typeof rooms[number]) => {
    const allocation = getAllocationByRoom(room.id);
    const student = allocation ? getStudent(allocation.userId) : undefined;
    const block = blocks.find(b => b.id === room.blockId);
    const statusText = allocation ? 'occupied' : 'available';
    const query = search.toLowerCase();
    return (
      room.roomNumber.toString().includes(query) ||
      room.capacity.toString().includes(query) ||
      room.occupants.length.toString().includes(query) ||
      (student?.name.toLowerCase().includes(query) ?? false) ||
      (student?.studentId.toLowerCase().includes(query) ?? false) ||
      (student?.phone.toLowerCase().includes(query) ?? false) ||
      (student?.batch?.toLowerCase().includes(query) ?? false) ||
      (student?.category?.toLowerCase().includes(query) ?? false) ||
      (student?.gender.toLowerCase().includes(query) ?? false) ||
      (block?.name.toLowerCase().includes(query) ?? false) ||
      statusText.includes(query)
    );
  };

  const handleAssign = (roomId: string, blockId: string) => {
    const studentId = selectedStudent[roomId];
    if (!studentId) {
      toast.error('Select a student to assign');
      return;
    }
    const error = allocateStudent(studentId, blockId, roomId);
    if (error) {
      toast.error(error);
      return;
    }
    setSelectedStudent(prev => ({ ...prev, [roomId]: '' }));
    toast.success('Student assigned to room successfully');
  };

  const handleDeallocate = (studentId: string) => {
    const error = deallocateStudent(studentId);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Student deallocated successfully');
  };

  const visibleBlocks = blocks.map(block => {
    const blockRooms = rooms.filter(r => r.blockId === block.id);
    const visibleRooms = search.trim() ? blockRooms.filter(roomMatchesSearch) : blockRooms;
    return { block, rooms: visibleRooms };
  }).filter(item => item.rooms.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-card-foreground">Room Allocations</h2>
            <p className="text-sm text-muted-foreground">{allocations.length} active allocations</p>
          </div>
          <div className="relative w-full sm:w-auto sm:max-w-md">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search rooms, blocks, students..."
              className="w-full pl-4 pr-3 py-2 rounded-lg border bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="blocks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="blocks">Blocks & Rooms</TabsTrigger>
          <TabsTrigger value="occupants">Occupants</TabsTrigger>
        </TabsList>

        <TabsContent value="blocks" className="space-y-3">
          {visibleBlocks.length > 0 ? visibleBlocks.map(({ block, rooms: blockRooms }) => {
            const isOpen = expandedBlock === block.id;
            return (
              <div key={block.id} className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleBlock(block.id)}
                  className="w-full flex items-center justify-between p-6 bg-background hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <DoorOpen className="w-5 h-5" />
                    </span>
                    <div className="text-left">
                      <p className="text-lg font-semibold text-card-foreground">{block.name}</p>
                      <p className="text-sm text-muted-foreground">{blockRooms.length} matching rooms</p>
                    </div>
                  </div>
                  <span className="text-muted-foreground">
                    {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t bg-muted/10 p-6 space-y-4">
                    <div className="space-y-3">
                      {blockRooms.map(room => {
                        const { status, userId, allocation } = getRoomStatus(room.id);
                        const student = getStudent(userId);
                        const occupancyRate = (room.occupants.length / room.capacity) * 100;
                        const roomOpen = expandedRooms.includes(room.id);
                        const unassignedStudents = students.filter(s => s.role === 'Student' && !s.roomId);
                        return (
                          <div key={room.id} className="rounded-xl border bg-background overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleRoom(room.id)}
                              className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-muted/10 transition-colors"
                            >
                              <div>
                                <p className="font-medium text-card-foreground">Room {room.roomNumber}</p>
                                <p className="text-sm text-muted-foreground">{room.capacity} beds · {room.occupants.length} occupied</p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${status === 'Occupied' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                                {status}
                              </span>
                            </button>
                            {roomOpen && (
                              <div className="border-t bg-muted/5 p-4 space-y-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="text-sm text-muted-foreground">
                                    Occupancy: <span className="font-medium text-card-foreground">{room.occupants.length} / {room.capacity}</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Fill rate: <span className="font-medium text-card-foreground">{Math.round(occupancyRate)}%</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Block: <span className="font-medium text-card-foreground">{block.name}</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Room ID: <span className="font-medium text-card-foreground">{room.id}</span>
                                  </div>
                                </div>

                                {status === 'Occupied' ? (
                                  student ? (
                                    <div className="rounded-xl border bg-background p-4 space-y-3">
                                      <p className="font-medium text-card-foreground">Assigned student details</p>
                                      <div className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
                                        <div>Name: <span className="font-medium text-card-foreground">{student.name}</span></div>
                                        <div>Student ID: <span className="font-medium text-card-foreground">{student.studentId}</span></div>
                                        <div>Phone: <span className="font-medium text-card-foreground">{student.phone}</span></div>
                                        <div>Gender: <span className="font-medium text-card-foreground">{student.gender}</span></div>
                                        <div>Batch: <span className="font-medium text-card-foreground">{student.batch ?? 'N/A'}</span></div>
                                        <div>Category: <span className="font-medium text-card-foreground">{student.category ?? 'N/A'}</span></div>
                                        <div>Block: <span className="font-medium text-card-foreground">{block.name}</span></div>
                                        <div>Room: <span className="font-medium text-card-foreground">{room.roomNumber}</span></div>
                                      </div>
                                      <div className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
                                        <div>Room capacity: <span className="font-medium text-card-foreground">{room.capacity}</span></div>
                                        <div>Occupants: <span className="font-medium text-card-foreground">{room.occupants.length}</span></div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleDeallocate(student.id)}
                                        className="mt-3 inline-flex items-center justify-center rounded-lg bg-destructive px-3 py-2 text-sm text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Deallocate student
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="rounded-xl border bg-background p-4 space-y-3">
                                      <p className="font-medium text-card-foreground">Allocated user details</p>
                                      <div className="text-sm text-muted-foreground">
                                        <div>User ID: <span className="font-medium text-card-foreground">{allocation?.userId}</span></div>
                                        <div>Room capacity: <span className="font-medium text-card-foreground">{room.capacity}</span></div>
                                        <div>Occupants: <span className="font-medium text-card-foreground">{room.occupants.length}</span></div>
                                        <div>Allocation date: <span className="font-medium text-card-foreground">{allocation?.allocatedAt ?? 'N/A'}</span></div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => allocation?.userId && handleDeallocate(allocation.userId)}
                                        className="mt-3 inline-flex items-center justify-center rounded-lg bg-destructive px-3 py-2 text-sm text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Deallocate user
                                      </button>
                                    </div>
                                  )
                                ) : (
                                  <div className="space-y-3">
                                    <div>
                                      <label className="block text-sm font-medium text-card-foreground mb-2">Assign existing student</label>
                                      <select
                                        value={selectedStudent[room.id] ?? ''}
                                        onChange={e => setSelectedStudent(prev => ({ ...prev, [room.id]: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border bg-background text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                      >
                                        <option value="">Select student</option>
                                        {unassignedStudents.map(studentOption => (
                                          <option key={studentOption.id} value={studentOption.id}>
                                            {studentOption.name} ({studentOption.studentId})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleAssign(room.id, block.id)}
                                      disabled={unassignedStudents.length === 0}
                                      className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/40"
                                    >
                                      Assign to room
                                    </button>
                                    {unassignedStudents.length === 0 && (
                                      <p className="text-sm text-muted-foreground">No unassigned students available.</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          }) : (
            <p className="text-sm text-muted-foreground">No rooms match your search.</p>
          )}
        </TabsContent>

        <TabsContent value="occupants" className="space-y-4">
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student ID</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Phone</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Gender</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Batch</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Block</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Room</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(s => {
                    if (!s.roomId) return false; // Only allocated students
                    if (!search.trim()) return true; // No search filter

                    const block = blocks.find(b => b.id === s.blockId);
                    const room = rooms.find(r => r.id === s.roomId);
                    const query = search.toLowerCase();

                    return (
                      s.name.toLowerCase().includes(query) ||
                      s.studentId.toLowerCase().includes(query) ||
                      s.phone.includes(query) ||
                      s.gender.toLowerCase().includes(query) ||
                      (s.batch?.toLowerCase().includes(query) ?? false) ||
                      (s.category?.toLowerCase().includes(query) ?? false) ||
                      (block?.name.toLowerCase().includes(query) ?? false) ||
                      (room?.roomNumber.toString().includes(query) ?? false)
                    );
                  }).map(s => {
                    const block = blocks.find(b => b.id === s.blockId);
                    const room = rooms.find(r => r.id === s.roomId);
                    return (
                      <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-card-foreground">{s.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{s.studentId}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{s.phone}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${s.gender === 'Male' ? 'bg-primary/10 text-primary' : 'bg-accent text-accent-foreground'}`}>
                            {s.gender}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">
                            {s.category ?? 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {s.batch ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          {block ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-info/10 text-info">{block.name}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {room ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">Room {room.roomNumber}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeallocate(s.id)}
                            className="inline-flex items-center justify-center rounded-lg bg-destructive px-3 py-1.5 text-sm text-destructive-foreground hover:bg-destructive/90"
                          >
                            Deallocate
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {students.filter(s => s.roomId).length === 0 && (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No students are currently allocated to rooms.</p>
                </div>
              )}
              {students.filter(s => s.roomId).length > 0 && students.filter(s => {
                if (!s.roomId) return false;
                if (!search.trim()) return true;

                const block = blocks.find(b => b.id === s.blockId);
                const room = rooms.find(r => r.id === s.roomId);
                const query = search.toLowerCase();

                return (
                  s.name.toLowerCase().includes(query) ||
                  s.studentId.toLowerCase().includes(query) ||
                  s.phone.includes(query) ||
                  s.gender.toLowerCase().includes(query) ||
                  (s.batch?.toLowerCase().includes(query) ?? false) ||
                  (s.category?.toLowerCase().includes(query) ?? false) ||
                  (block?.name.toLowerCase().includes(query) ?? false) ||
                  (room?.roomNumber.toString().includes(query) ?? false)
                );
              }).length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">No occupants match your search.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Allocations;
