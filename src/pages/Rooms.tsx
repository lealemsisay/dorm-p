import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { Plus, Trash2, Building, Edit, Eye, Search, Power, PowerOff } from 'lucide-react';
import DormModal from '@/components/dorm/DormModal';
import type { Block, Room } from '@/data/rooms';
import type { Student } from '@/data/students';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Rooms = () => {
  const { blocks, rooms, students, addBlock, updateBlock, deleteBlock, addRoom, updateRoom, deleteRoom, deactivateRoom, deactivateBlock, reactivateRoom, reactivateBlock } = useData();
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [blockForm, setBlockForm] = useState({ name: '', numberOfRooms: 3 });
  const [roomForm, setRoomForm] = useState({ blockId: '', roomNumber: '', capacity: 2, active: true });
  const [blockSearch, setBlockSearch] = useState('');
  
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [studentModalOpen, setStudentModalOpen] = useState(false);

  // Deactivation dialogs
  const [deactivateBlockDialog, setDeactivateBlockDialog] = useState(false);
  const [deactivateRoomDialog, setDeactivateRoomDialog] = useState(false);
  const [blockToDeactivate, setBlockToDeactivate] = useState<Block | null>(null);
  const [roomToDeactivate, setRoomToDeactivate] = useState<Room | null>(null);
  const [reassignBlockId, setReassignBlockId] = useState('');

  const filteredBlocks = blocks.filter(b =>
    b.name.toLowerCase().includes(blockSearch.toLowerCase())
  );

  const handleBlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockForm.name) { toast.error('Block name is required'); return; }
    if (!editingBlock && blocks.some(b => b.name === blockForm.name)) { toast.error('Block name already exists'); return; }
    if (editingBlock && editingBlock.name !== blockForm.name && blocks.some(b => b.name === blockForm.name)) { toast.error('Block name already exists'); return; }

    if (editingBlock) {
      updateBlock({ ...editingBlock, ...blockForm });
      toast.success('Block updated');
    } else {
      addBlock(blockForm);
      toast.success(`Block ${blockForm.name} added with ${blockForm.numberOfRooms} rooms`);
    }
    setBlockModalOpen(false);
    setEditingBlock(null);
    setBlockForm({ name: '', numberOfRooms: 3 });
  };

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.blockId || !roomForm.roomNumber) { toast.error('All fields are required'); return; }
    const existingRooms = rooms.filter(r => r.blockId === roomForm.blockId && r.id !== (editingRoom?.id || ''));
    if (existingRooms.some(r => r.roomNumber === roomForm.roomNumber)) {
      toast.error('Room number already exists in this block'); return;
    }

    if (editingRoom) {
      updateRoom({ ...editingRoom, ...roomForm });
      toast.success('Room updated');
    } else {
      addRoom(roomForm);
      toast.success(`Room ${roomForm.roomNumber} added`);
    }
    setRoomModalOpen(false);
    setEditingRoom(null);
    setRoomForm({ blockId: '', roomNumber: '', capacity: 2, active: true });
  };

  const openBlockEdit = (block: Block) => {
    setEditingBlock(block);
    setBlockForm({ name: block.name, numberOfRooms: block.numberOfRooms });
    setBlockModalOpen(true);
  };

  const openRoomEdit = (room: Room) => {
    setEditingRoom(room);
    setRoomForm({ blockId: room.blockId, roomNumber: room.roomNumber, capacity: room.capacity, active: room.active });
    setRoomModalOpen(true);
  };

  const handleBlockDelete = (id: string, name: string) => {
    if (deleteBlock(id)) {
      toast.success(`Block ${name} deleted`);
    } else {
      toast.error('Cannot delete block with occupied rooms');
    }
  };

  const handleBlockReactivate = (block: Block) => {
    const error = reactivateBlock(block.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success(`Block ${block.name} reactivated`);
    }
  };

  const handleBlockDeactivate = (block: Block) => {
    setBlockToDeactivate(block);
    setReassignBlockId('');
    setDeactivateBlockDialog(true);
  };

  const handleRoomDeactivate = (room: Room) => {
    setRoomToDeactivate(room);
    setReassignBlockId('');
    setDeactivateRoomDialog(true);
  };

  const handleRoomReactivate = (room: Room) => {
    const error = reactivateRoom(room.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success(`Room ${room.roomNumber} reactivated`);
    }
  };

  const confirmBlockDeactivate = () => {
    if (!blockToDeactivate) return;
    const result = deactivateBlock(blockToDeactivate.id, reassignBlockId || undefined);
    if (result.success) {
      toast.success(`Block ${blockToDeactivate.name} deactivated`);
    } else {
      toast.error(`Cannot deactivate: ${result.errors.join(', ')}`);
    }
    setDeactivateBlockDialog(false);
    setBlockToDeactivate(null);
    setReassignBlockId('');
  };

  const confirmRoomDeactivate = () => {
    if (!roomToDeactivate) return;
    const result = deactivateRoom(roomToDeactivate.id, reassignBlockId || undefined);
    if (result.success) {
      toast.success(`Room ${roomToDeactivate.roomNumber} deactivated`);
    } else {
      toast.error(`Cannot deactivate: ${result.errors.join(', ')}`);
    }
    setDeactivateRoomDialog(false);
    setRoomToDeactivate(null);
    setReassignBlockId('');
  };

  const handleRoomDelete = (id: string, roomNumber: string) => {
    if (deleteRoom(id)) {
      toast.success(`Room ${roomNumber} deleted`);
    } else {
      toast.error('Cannot delete room with occupants');
    }
  };

  const openBlockDetails = (blockId: string) => {
    setSelectedBlock(selectedBlock === blockId ? null : blockId);
  };

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setStudentModalOpen(true);
  };

  const getAssignedStudents = (room: Room | null): Student[] => {
    if (!room) return [];
    return students.filter(s => room.occupants.includes(s.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">{filteredBlocks.length} blocks total</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={blockSearch} onChange={e => setBlockSearch(e.target.value)}
              placeholder="Search blocks..."
              className="w-64 pl-9 pr-3 py-2 rounded-lg border bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setBlockModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
            <Building className="w-4 h-4" /> Add Block
          </button>
          <button onClick={() => setRoomModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Add Room
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredBlocks.map(block => {
          const blockRooms = rooms.filter(r => r.blockId === block.id);
          const isExpanded = selectedBlock === block.id;
          return (
            <div key={block.id} className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div
                className="p-6 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => openBlockDetails(block.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="text-lg font-semibold text-card-foreground">{block.name}</h3>
                      <p className="text-sm text-muted-foreground">{blockRooms.length} / {block.numberOfRooms} rooms</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openBlockEdit(block); }}
                      className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {block.active ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleBlockDeactivate(block); }}
                        className="p-2 rounded-md hover:bg-orange-100 transition-colors text-muted-foreground hover:text-orange-600"
                        title="Deactivate Block"
                      >
                        <PowerOff className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleBlockReactivate(block); }}
                        className="p-2 rounded-md hover:bg-green-100 transition-colors text-muted-foreground hover:text-green-600"
                        title="Reactivate Block"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Block</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{block.name}"? This will also delete all rooms in this block. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleBlockDelete(block.id, block.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Eye className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t bg-muted/20">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-card-foreground">Rooms in {block.name}</h4>
                      <button
                        onClick={() => { setRoomForm({ ...roomForm, blockId: block.id }); setRoomModalOpen(true); }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
                      >
                        <Plus className="w-4 h-4" /> Add Room
                      </button>
                    </div>
                    <div className="space-y-3">
                      {blockRooms.map(r => {
                        const isFull = r.occupants.length >= r.capacity;
                        const isEmpty = r.occupants.length === 0;
                        return (
                          <div
                            key={r.id}
                            className="flex items-center justify-between py-3 px-4 bg-background rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleRoomClick(r)}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div>
                                <p className="font-medium text-card-foreground">Room {r.roomNumber}</p>
                                <p className="text-sm text-muted-foreground">{r.occupants.length} / {r.capacity} beds</p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.active ? 'bg-success/10 text-success' : 'bg-slate-200 text-slate-600'}`}>
                                {r.active ? 'Active' : 'Inactive'}
                              </span>
                              <div className="w-24 bg-muted rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${isFull ? 'bg-destructive' : isEmpty ? 'bg-success' : 'bg-warning'}`}
                                  style={{ width: `${(r.occupants.length / r.capacity) * 100}%` }}
                                />
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                isFull ? 'bg-destructive/10 text-destructive' :
                                isEmpty ? 'bg-success/10 text-success' :
                                'bg-warning/10 text-warning'
                              }`}>
                                {isFull ? 'Full' : isEmpty ? 'Available' : 'Partial'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => { e.stopPropagation(); openRoomEdit(r); }}
                                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {r.active ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRoomDeactivate(r); }}
                                  className="p-1.5 rounded-md hover:bg-orange-100 transition-colors text-muted-foreground hover:text-orange-600"
                                  title="Deactivate Room"
                                >
                                  <PowerOff className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRoomReactivate(r); }}
                                  className="p-1.5 rounded-md hover:bg-green-100 transition-colors text-muted-foreground hover:text-green-600"
                                  title="Reactivate Room"
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Room</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete Room {r.roomNumber}? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRoomDelete(r.id, r.roomNumber)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        );
                      })}
                      {blockRooms.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No rooms in this block</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filteredBlocks.length === 0 && (
          <div className="text-center py-12">
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No blocks found</p>
          </div>
        )}
      </div>

      {/* Student modal - wider, no backdrop close */}
      <DormModal
        isOpen={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        title={`Room ${selectedRoom?.roomNumber || ''} - Assigned Students`}
        disableBackdropClose={true}
      >
        <div className="max-h-[70vh] overflow-y-auto">
          {selectedRoom && (
            <>
              <div className="mb-4 text-sm text-muted-foreground p-2 bg-muted/20 rounded">
                <p><strong>Block:</strong> {blocks.find(b => b.id === selectedRoom.blockId)?.name || 'Unknown'} &nbsp;|&nbsp;
                <strong>Capacity:</strong> {selectedRoom.capacity} &nbsp;|&nbsp;
                <strong>Occupied:</strong> {selectedRoom.occupants.length}</p>
              </div>
              {getAssignedStudents(selectedRoom).length === 0 ? (
                <p className="text-center text-muted-foreground py-6">No students assigned to this room.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3">Name</th>
                        <th className="text-left px-4 py-3">Student ID</th>
                        <th className="text-left px-4 py-3 hidden sm:table-cell">Phone</th>
                        <th className="text-left px-4 py-3 hidden md:table-cell">Gender</th>
                        <th className="text-left px-4 py-3 hidden md:table-cell">Category</th>
                        <th className="text-left px-4 py-3 hidden lg:table-cell">Batch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getAssignedStudents(selectedRoom).map(student => (
                        <tr key={student.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{student.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{student.studentId}</td>
                          <td className="px-4 py-3 hidden sm:table-cell">{student.phone}</td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${student.gender === 'Male' ? 'bg-primary/10 text-primary' : 'bg-accent text-accent-foreground'}`}>
                              {student.gender}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">
                              {student.category ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">{student.batch ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </DormModal>

      {/* Add/Edit Block Modal */}
      <DormModal isOpen={blockModalOpen} onClose={() => { setBlockModalOpen(false); setEditingBlock(null); setBlockForm({ name: '', numberOfRooms: 3 }); }} title={editingBlock ? 'Edit Block' : 'Add Block'}>
        <form onSubmit={handleBlockSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">Block Name</label>
            <input value={blockForm.name} onChange={e => setBlockForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. Block A" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">Number of Rooms</label>
            <input type="number" min={1} max={150} value={blockForm.numberOfRooms} onChange={e => setBlockForm(f => ({ ...f, numberOfRooms: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setBlockModalOpen(false); setEditingBlock(null); setBlockForm({ name: '', numberOfRooms: 3 }); }}
              className="flex-1 py-2 rounded-lg border text-card-foreground font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit"
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">Save Block</button>
          </div>
        </form>
      </DormModal>

      {/* Add/Edit Room Modal */}
      <DormModal isOpen={roomModalOpen} onClose={() => { setRoomModalOpen(false); setEditingRoom(null); setRoomForm({ blockId: '', roomNumber: '', capacity: 2 }); }} title={editingRoom ? 'Edit Room' : 'Add Room'}>
        <form onSubmit={handleRoomSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">Block</label>
            <select value={roomForm.blockId} onChange={e => setRoomForm(f => ({ ...f, blockId: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" required>
              <option value="">Select Block</option>
              {blocks.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">Room Number</label>
            <input value={roomForm.roomNumber} onChange={e => setRoomForm(f => ({ ...f, roomNumber: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. 101" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">Capacity</label>
            <input type="number" min={1} max={10} value={roomForm.capacity} onChange={e => setRoomForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="room-active"
              type="checkbox"
              checked={roomForm.active}
              onChange={e => setRoomForm(f => ({ ...f, active: e.target.checked }))}
              className="h-4 w-4 rounded border bg-background text-primary focus:ring-primary"
            />
            <label htmlFor="room-active" className="text-sm font-medium text-card-foreground">Room active</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setRoomModalOpen(false); setEditingRoom(null); setRoomForm({ blockId: '', roomNumber: '', capacity: 2 }); }}
              className="flex-1 py-2 rounded-lg border text-card-foreground font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit"
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">Save Room</button>
          </div>
        </form>
      </DormModal>

      {/* Block Deactivation Dialog */}
      <AlertDialog open={deactivateBlockDialog} onOpenChange={setDeactivateBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Block</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate block "{blockToDeactivate?.name}"?
              {blockToDeactivate && (() => {
                const occupiedRooms = rooms.filter(r => r.blockId === blockToDeactivate.id && allocations.some(a => a.roomId === r.id)).length;
                return occupiedRooms > 0 ? ` This block has ${occupiedRooms} occupied room(s). Occupants will be reassigned.` : '';
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {blockToDeactivate && (() => {
            const occupiedRooms = rooms.filter(r => r.blockId === blockToDeactivate.id && allocations.some(a => a.roomId === r.id)).length;
            return occupiedRooms > 0 ? (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-card-foreground">Reassign occupants to block:</label>
                <select
                  value={reassignBlockId}
                  onChange={e => setReassignBlockId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Select block for reassignment</option>
                  {blocks.filter(b => b.id !== blockToDeactivate.id && b.active).map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            ) : null;
          })()}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeactivateBlockDialog(false); setBlockToDeactivate(null); setReassignBlockId(''); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmBlockDeactivate} disabled={blockToDeactivate && rooms.filter(r => r.blockId === blockToDeactivate.id && allocations.some(a => a.roomId === r.id)).length > 0 && !reassignBlockId}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Room Deactivation Dialog */}
      <AlertDialog open={deactivateRoomDialog} onOpenChange={setDeactivateRoomDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate room "{roomToDeactivate?.roomNumber}"?
              {roomToDeactivate && allocations.some(a => a.roomId === roomToDeactivate.id) ? ' This room is occupied. Occupants will be reassigned.' : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {roomToDeactivate && allocations.some(a => a.roomId === roomToDeactivate.id) && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-card-foreground">Reassign occupants to block:</label>
              <select
                value={reassignBlockId}
                onChange={e => setReassignBlockId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Select block for reassignment</option>
                {blocks.filter(b => b.active).map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeactivateRoomDialog(false); setRoomToDeactivate(null); setReassignBlockId(''); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoomDeactivate} disabled={roomToDeactivate && allocations.some(a => a.roomId === roomToDeactivate.id) && !reassignBlockId}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Rooms;