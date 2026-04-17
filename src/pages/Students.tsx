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
const maxPhoneLength = 13; // +2519 + 8 digits

const validatePhone = (phone: string): boolean => /^\+2519\d{8}$/.test(phone);

// Format: allow user to type +2519XXXXXXXX, also convert 09...
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
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const filtered = students.filter(s => {
    const searchTerm = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(searchTerm) ||
      s.studentId.toLowerCase().includes(searchTerm) ||
      s.phone.includes(searchTerm) ||
      (s.category?.toLowerCase().includes(searchTerm) ?? false) ||
      (s.batch?.toLowerCase().includes(searchTerm) ?? false) ||
      (blocks.find(b => b.id === s.blockId)?.name.toLowerCase().includes(searchTerm) ?? false) ||
      (rooms.find(r => r.id === s.roomId)?.roomNumber.toString().includes(searchTerm) ?? false)
    );
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setNameError('');
    setPhoneError('');
    setModalOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({
      name: s.name,
      studentId: s.studentId,
      phone: s.phone,
      gender: s.gender,
      category: s.category ?? 'Freshman',
      batch: s.batch ?? '',
    });
    setNameError('');
    setPhoneError('');
    setModalOpen(true);
  };

  const handleNameChange = (value: string) => {
    const sanitized = value.replace(/[^A-Za-z\s]/g, '').slice(0, maxNameLength);
    setForm(f => ({ ...f, name: sanitized }));
    const hasInvalidChars = /[^A-Za-z\s]/.test(value);
    const isTooLong = value.length > maxNameLength;
    if (hasInvalidChars && isTooLong) {
      setNameError('Name may only contain letters and spaces, and must be 35 characters or fewer');
    } else if (hasInvalidChars) {
      setNameError('Name may only contain letters and spaces');
    } else if (isTooLong) {
      setNameError(`Name must be ${maxNameLength} characters or fewer`);
    } else {
      setNameError('');
    }
  };

  const handlePhoneChange = (value: string) => {
    let formatted = value;
    if (value.length > 0) {
      formatted = formatPhone(value);
    }
    setForm(f => ({ ...f, phone: formatted }));
    if (formatted && !validatePhone(formatted)) {
      setPhoneError('Phone must be Ethiopian format: +2519XXXXXXXX');
    } else {
      setPhoneError('');
    }
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
      toast.error('Please fix form errors');
      return;
    }
    if (editing) {
      updateStudent({
        ...editing,
        name: form.name,
        studentId: form.studentId,
        phone: form.phone,
        gender: form.gender,
        category: form.category,
        batch: form.batch,
      });
      toast.success('Student updated');
    } else {
      addStudent(form);
      toast.success('Student added');
    }
    setModalOpen(false);
  };

  const confirmDelete = (student: Student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (studentToDelete) {
      deleteStudent(studentToDelete.id);
      toast.success('Student deleted');
      setStudentToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-1 gap-2 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, ID, or phone..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

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
              {filtered.map(s => {
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
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(s)}
                          className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No students found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog - Fixed */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {studentToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Modal with scrollable content */}
      <DormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Student' : 'Add Student'}>
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Full Name</label>
              <input
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${nameError ? 'border-destructive' : 'border-input'}`}
                placeholder="Only letters and spaces"
                required
              />
              {nameError && <p className="mt-2 text-xs text-destructive">{nameError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Student ID</label>
              <input value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Phone (Ethiopian: +2519XXXXXXXX)</label>
              <input
                value={form.phone}
                onChange={e => handlePhoneChange(e.target.value)}
                placeholder="+2519XXXXXXXX"
                className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${phoneError ? 'border-destructive' : 'border-input'}`}
                required
              />
              {phoneError && <p className="mt-2 text-xs text-destructive">{phoneError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Gender</label>
              <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as 'Male' | 'Female' }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Batch</label>
              <select value={form.batch} onChange={e => setForm(f => ({ ...f, batch: e.target.value as any }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" required>
                <option value="">Select batch</option>
                {batchOptions.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalOpen(false)}
                className="flex-1 py-2 rounded-lg border text-card-foreground font-medium hover:bg-muted transition-colors">Cancel</button>
              <button type="submit"
                disabled={!isFormValid}
                className={`flex-1 py-2 rounded-lg font-medium transition-opacity ${isFormValid ? 'bg-primary text-primary-foreground hover:opacity-90' : 'bg-primary/60 text-primary-foreground/70 cursor-not-allowed'}`}>
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