import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { DoorOpen, ChevronDown, ChevronRight, Users, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Allocations = () => {
  const { blocks, rooms, allocations, students, allocateStudent, deallocateStudent, bulkAssignStudents, bulkAssignToBlock } = useData();
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [expandedRooms, setExpandedRooms] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Record<string, string>>({});

  // For assign from Occupants tab
  const [assignStudentId, setAssignStudentId] = useState('');
  const [assignRoomId, setAssignRoomId] = useState('');
  const [bulkStudentIds, setBulkStudentIds] = useState<string[]>([]);
  const [bulkBlockId, setBulkBlockId] = useState('');

  const getAllocationByRoom = (roomId: string) => allocations.find(a => a.roomId === roomId);
  const getStudent = (userId: string | null) => userId ? students.find(s => s.id === userId) : undefined;

  const getRoomStatus = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return { status: 'Unknown', userId: null, allocation: null };

    if (room.occupants.length >= room.capacity) {
      return { status: 'Full', userId: null, allocation: null };
    }
    if (room.occupants.length > 0) {
      return { status: 'Partially Occupied', userId: null, allocation: null };
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
    const block = blocks.find(b => b.id === room.blockId);
    const statusText = room.occupants.length >= room.capacity ? 'full' :
                      room.occupants.length > 0 ? 'partially occupied' : 'available';
    const query = search.toLowerCase();

    // Check room properties
    if (room.roomNumber.toString().includes(query) ||
        room.capacity.toString().includes(query) ||
        room.occupants.length.toString().includes(query) ||
        statusText.includes(query) ||
        (block?.name.toLowerCase().includes(query) ?? false)) {
      return true;
    }

    // Check all occupants
    return room.occupants.some(occupantId => {
      const student = students.find(s => s.id === occupantId);
      return student && (
        student.name.toLowerCase().includes(query) ||
        student.studentId.toLowerCase().includes(query) ||
        student.phone.includes(query) ||
        student.gender.toLowerCase().includes(query) ||
        (student.batch?.toLowerCase().includes(query) ?? false) ||
        (student.category?.toLowerCase().includes(query) ?? false) ||
        student.role.toLowerCase().includes(query)
      );
    });
  };

  const getRoomCategory = (roomId: string): string | null => {
    const room = rooms.find(r => r.id === roomId);
    if (!room || room.occupants.length === 0) return null;
    const occupant = students.find(s => s.id === room.occupants[0]);
    return occupant?.role || null;
  };

  const executeAssign = (studentId: string, roomId: string, blockId: string): boolean => {
    const error = allocateStudent(studentId, blockId, roomId);
    if (error) {
      toast.error(error);
      return false;
    }
    setSelectedStudent(prev => ({ ...prev, [roomId]: '' }));
    // Clear assign form if in occupants tab
    setAssignStudentId('');
    setAssignRoomId('');
    toast.success('Student assigned to room successfully');
    return true;
  };

  const attemptAssign = (studentId: string, roomId: string, blockId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) {
      toast.error('Student not found');
      return false;
    }
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      toast.error('Room not found');
      return false;
    }
    if (!room.active) {
      toast.error('Room is inactive and cannot be assigned');
      return false;
    }
    if (room.occupants.length >= room.capacity) {
      toast.error('Room is full');
      return false;
    }
    return executeAssign(studentId, roomId, blockId);
  };

  const handleAssign = (roomId: string, blockId: string) => {
    const studentId = selectedStudent[roomId];
    if (!studentId) {
      toast.error('Select a student to assign');
      return;
    }
    attemptAssign(studentId, roomId, blockId);
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

  const unassignedStudents = students.filter(s => !s.roomId);
  const availableRooms = rooms.filter(r => r.occupants.length < r.capacity && r.active);

  // For the "Assign from Occupants tab" button
  const handleAssignFromOccupants = () => {
    if (!assignStudentId) {
      toast.error('Select a student');
      return;
    }
    if (!assignRoomId) {
      toast.error('Select a room');
      return;
    }
    const room = rooms.find(r => r.id === assignRoomId);
    if (!room) return;
    const block = blocks.find(b => b.id === room.blockId);
    if (!block) return;
    attemptAssign(assignStudentId, assignRoomId, block.id);
  };

  const handleBulkStudentToggle = (studentId: string) => {
    setBulkStudentIds(prev => prev.includes(studentId)
      ? prev.filter(id => id !== studentId)
      : [...prev, studentId]);
  };

  const handleBulkAssign = () => {
    if (bulkStudentIds.length === 0) {
      toast.error('Select at least one user to assign.');
      return;
    }
    if (!bulkBlockId) {
      toast.error('Select a block to assign into.');
      return;
    }
    const result = bulkAssignToBlock(bulkStudentIds, bulkBlockId);
    if (result.assigned.length) {
      toast.success(`${result.assigned.length} user(s) assigned successfully.`);
    }
    if (result.skipped.length) {
      result.skipped.forEach(item => toast.error(`${item.id}: ${item.error}`));
    }
    setBulkStudentIds([]);
    setBulkBlockId('');
  };

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
                        const unassignedForBlock = unassignedStudents;
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
                                  {getRoomCategory(room.id) && (
                                    <div className="text-sm text-muted-foreground">
                                      Current category: <span className="font-medium text-card-foreground">{getRoomCategory(room.id)}</span>
                                    </div>
                                  )}
                                </div>

                                {room.occupants.length > 0 ? (
                                  <div className="rounded-xl border bg-background p-4 space-y-4">
                                    <p className="font-medium text-card-foreground">Current occupants ({room.occupants.length}/{room.capacity})</p>
                                    {room.occupants.length > 0 ? (
                                      <div className="space-y-3">
                                        {room.occupants.map(userId => {
                                          const occupant = students.find(s => s.id === userId);
                                          return occupant ? (
                                            <div key={userId} className="rounded-lg border bg-muted/10 p-3">
                                              <div className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
                                                <div>Name: <span className="font-medium text-card-foreground">{occupant.name}</span></div>
                                                <div>ID: <span className="font-medium text-card-foreground">{occupant.studentId}</span></div>
                                                <div>Role: <span className="font-medium text-card-foreground">{occupant.role}</span></div>
                                                <div>Gender: <span className="font-medium text-card-foreground">{occupant.gender}</span></div>
                                                <div>Phone: <span className="font-medium text-card-foreground">{occupant.phone}</span></div>
                                                <div>Block: <span className="font-medium text-card-foreground">{block.name}</span></div>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => handleDeallocate(occupant.id)}
                                                className="mt-3 inline-flex items-center justify-center rounded-lg bg-destructive px-3 py-2 text-sm text-destructive-foreground hover:bg-destructive/90"
                                              >
                                                Deallocate
                                              </button>
                                            </div>
                                          ) : null;
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">No occupants in this room.</p>
                                    )}

                                    {room.occupants.length < room.capacity && (
                                      <div className="border-t pt-4">
                                        <div>
                                          <label className="block text-sm font-medium text-card-foreground mb-2">Add another student</label>
                                          <select
                                            value={selectedStudent[room.id] ?? ''}
                                            onChange={e => setSelectedStudent(prev => ({ ...prev, [room.id]: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border bg-background text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                          >
                                            <option value="">Select student</option>
                                            {unassignedForBlock.map(studentOption => (
                                              <option key={studentOption.id} value={studentOption.id}>
                                                {studentOption.name} ({studentOption.studentId}) - {studentOption.category || 'No category'}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleAssign(room.id, block.id)}
                                          disabled={unassignedForBlock.length === 0}
                                          className="mt-3 inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/40"
                                        >
                                          Add to room
                                        </button>
                                        {unassignedForBlock.length === 0 && (
                                          <p className="text-sm text-muted-foreground">No unassigned students available.</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
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
                                        {unassignedForBlock.map(studentOption => (
                                          <option key={studentOption.id} value={studentOption.id}>
                                                {studentOption.name} ({studentOption.studentId}) - {studentOption.category || 'No category'}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleAssign(room.id, block.id)}
                                          disabled={unassignedForBlock.length === 0}
                                          className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/40"
                                        >
                                          Assign to room
                                        </button>
                                        {unassignedForBlock.length === 0 && (
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
          {/* Visible Assign Student Card */}
          <div className="bg-card rounded-xl border shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-card-foreground">Assign New Student</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 items-end">
              <div>
                <label className="block text-sm font-medium mb-1">Select Student</label>
                <select
                  value={assignStudentId}
                  onChange={e => setAssignStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-background"
                >
                  <option value="">Choose student</option>
                  {unassignedStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.studentId}) - {s.category || 'No category'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Select Room</label>
                <select
                  value={assignRoomId}
                  onChange={e => setAssignRoomId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-background"
                >
                  <option value="">Choose room</option>
                  {availableRooms.map(r => {
                    const block = blocks.find(b => b.id === r.blockId);
                    return (
                      <option key={r.id} value={r.id}>
                        {block?.name} - Room {r.roomNumber} ({r.occupants.length}/{r.capacity} beds)
                      </option>
                    );
                  })}
                </select>
              </div>
              <button
                onClick={handleAssignFromOccupants}
                disabled={!assignStudentId || !assignRoomId}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 font-medium"
              >
                Assign Student
              </button>
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-card-foreground">Bulk Assign Users</h3>
            </div>
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr] mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select users</label>
                <div className="max-h-60 overflow-y-auto rounded-lg border bg-background p-2">
                  {unassignedStudents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No unassigned users available.</p>
                  ) : (
                    unassignedStudents.map(user => (
                      <label key={user.id} className="flex items-center gap-2 mb-2 text-sm">
                        <input
                          type="checkbox"
                          checked={bulkStudentIds.includes(user.id)}
                          onChange={() => handleBulkStudentToggle(user.id)}
                          className="h-4 w-4 rounded border"
                        />
                        <span>{user.name} ({user.studentId}) - {user.role}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Target block</label>
                  <select
                    value={bulkBlockId}
                    onChange={e => setBulkBlockId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background"
                  >
                    <option value="">Choose block</option>
                    {blocks.filter(b => b.active).map(block => {
                      const blockRooms = rooms.filter(r => r.blockId === block.id && r.active);
                      const totalCapacity = blockRooms.reduce((sum, r) => sum + r.capacity, 0);
                      const totalOccupants = blockRooms.reduce((sum, r) => sum + r.occupants.length, 0);
                      return (
                        <option key={block.id} value={block.id}>
                          {block.name} ({totalOccupants}/{totalCapacity} beds available)
                        </option>
                      );
                    })}
                  </select>
                </div>
                <button
                  onClick={handleBulkAssign}
                  disabled={!bulkBlockId || bulkStudentIds.length === 0}
                  className="w-full rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 disabled:opacity-50 font-medium"
                >
                  Bulk Assign to Block
                </button>
              </div>
            </div>
          </div>

          {/* Existing allocated students table */}
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
                        <td className="px-4 py-3 hidden lg:table-cell">{s.batch ?? '—'}</td>
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
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Category mismatch confirmation dialog */}
    </div>
  );
};

export default Allocations;