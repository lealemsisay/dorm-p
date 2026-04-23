import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import DormModal from '@/components/dorm/DormModal';
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
import type { Student } from '@/data/students';

const categories = ['Freshman', 'Senior', 'Remedial', 'GC'] as const;
const batchOptions = ['2023', '2024', '2025', '2026'] as const;

const emptyForm = {
  name: '',
  studentId: '',
  phone: '',
  gender: 'Male' as const,
  category: 'Freshman' as const,
  batch: '' as const,
};

const maxNameLength = 35;
const maxPhoneLength = 13;
const validatePhone = (phone: string): boolean => /^\+2519\d{8}$/.test(phone);

const formatPhone = (value: string): string => {
  if (validatePhone(value)) return value;
  let hasPlus = value.startsWith('+');
  let digits = value.replace(/[^\d]/g, '');
  if (digits.startsWith('09') && digits.length >= 10) {
    digits = '251' + digits.substring(1);
    hasPlus = true;
  } else if (digits.startsWith('9') && digits.length === 9) {
    digits = '251' + digits;
    hasPlus = true;
  } else if (digits.startsWith('251') && digits.length === 12) {
    hasPlus = true;
  }
  let result = hasPlus ? '+' : '';
  result += digits.slice(0, maxPhoneLength - (hasPlus ? 1 : 0));
  return result;
};

const Students = () => {
  const { students, blocks, rooms, addStudent, updateStudent, deleteStudent } = useData();

  // DEBUG: Check if functions exist
  console.log('🚀 addStudent exists?', !!addStudent);
  console.log('🚀 updateStudent exists?', !!updateStudent);
  console.log('🚀 deleteStudent exists?', !!deleteStudent);
  console.log('📋 Current students:', students);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const filtered = students.filter(s => {
    const term = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.studentId.toLowerCase().includes(term) ||
      s.phone.includes(term) ||
      (s.category?.toLowerCase().includes(term) ?? false) ||
      (s.batch?.toLowerCase().includes(term) ?? false) ||
      blocks.find(b => b.id === s.blockId)?.name.toLowerCase().includes(term) ||
      rooms.find(r => r.id === s.roomId)?.roomNumber.toString().includes(term)
    );
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setNameError('');
    setPhoneError('');
    setModalOpen(true);
  };

  const openEdit = (student: Student) => {
    console.log('✏️ Edit clicked for:', student);
    setEditing(student);
    setForm({
      name: student.name,
      studentId: student.studentId,
      phone: student.phone,
      gender: student.gender,
      category: student.category ?? 'Freshman',
      batch: student.batch ?? '',
    });
    setNameError('');
    setPhoneError('');
    setModalOpen(true);
  };

  const handleNameChange = (value: string) => {
    const sanitized = value.replace(/[^A-Za-z\s]/g, '').slice(0, maxNameLength);
    setForm(f => ({ ...f, name: sanitized }));
    if (/[^A-Za-z\s]/.test(value)) setNameError('Only letters and spaces');
    else if (value.length > maxNameLength) setNameError(`Max ${maxNameLength} chars`);
    else setNameError('');
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setForm(f => ({ ...f, phone: formatted }));
    if (formatted && !validatePhone(formatted)) setPhoneError('Use +2519XXXXXXXX');
    else setPhoneError('');
  };

  const isFormValid = Boolean(
    form.name.trim() &&
    form.studentId.trim() &&
    form.phone.trim() &&
    form.batch &&
    !nameError &&
    !phoneError &&
    validatePhone(form.phone)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error('Fix errors first');
      return;
    }
    if (editing) {
      const updated = { ...editing, ...form };
      console.log('🔄 Updating student:', updated);
      updateStudent(updated);
      toast.success('Student updated');
    } else {
      console.log('➕ Adding student:', form);
      addStudent(form);
      toast.success('Student added');
    }
    setModalOpen(false);
  };

  const confirmDelete = (student: Student) => {
    console.log('🗑️ Delete clicked for:', student);
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (studentToDelete) {
      console.log('❌ Deleting student id:', studentToDelete.id);
      deleteStudent(studentToDelete.id);
      toast.success('Student deleted');
      setStudentToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border bg-card"
          />
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground">
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
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
                <th className="text-left px-4 py-3">Block</th>
                <th className="text-left px-4 py-3">Room</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const block = blocks.find(b => b.id === s.blockId);
                const room = rooms.find(r => r.id === s.roomId);
                return (
                  <tr key={s.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.studentId}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{s.phone}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.gender === 'Male' ? 'bg-primary/10' : 'bg-accent'}`}>
                        {s.gender}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/10">{s.category}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">{s.batch}</td>
                    <td className="px-4 py-3">
                      {block ? <span className="text-xs px-2 py-0.5 rounded-full bg-info/10">{block.name}</span> : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {room ? <span className="text-xs px-2 py-0.5 rounded-full bg-success/10">Room {room.roomNumber}</span> : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-md hover:bg-muted">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => confirmDelete(s)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">No students</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {studentToDelete?.name}? Cannot undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Modal */}
      <DormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Student' : 'Add Student'}>
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label>Full Name</label>
              <input value={form.name} onChange={e => handleNameChange(e.target.value)} className={`w-full p-2 border rounded ${nameError ? 'border-red-500' : ''}`} required />
              {nameError && <p className="text-red-500 text-xs">{nameError}</p>}
            </div>
            <div>
              <label>Student ID</label>
              <input value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))} className="w-full p-2 border rounded" required />
            </div>
            <div>
              <label>Phone (+2519XXXXXXXX)</label>
              <input value={form.phone} onChange={e => handlePhoneChange(e.target.value)} placeholder="+2519XXXXXXXX" className={`w-full p-2 border rounded ${phoneError ? 'border-red-500' : ''}`} required />
              {phoneError && <p className="text-red-500 text-xs">{phoneError}</p>}
            </div>
            <div>
              <label>Gender</label>
              <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as any }))} className="w-full p-2 border rounded">
                <option>Male</option><option>Female</option>
              </select>
            </div>
            <div>
              <label>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))} className="w-full p-2 border rounded">
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label>Batch</label>
              <select value={form.batch} onChange={e => setForm(f => ({ ...f, batch: e.target.value as any }))} className="w-full p-2 border rounded" required>
                <option value="">Select</option>
                {batchOptions.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="flex-1 p-2 border rounded">Cancel</button>
              <button type="submit" disabled={!isFormValid} className={`flex-1 p-2 rounded text-white ${isFormValid ? 'bg-primary' : 'bg-gray-400'}`}>
                {editing ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </DormModal>
    </div>
  );
};

export default Students;