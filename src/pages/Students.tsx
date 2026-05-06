import { useState, type FormEvent } from 'react';
import * as XLSX from 'xlsx';
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

const registrarPrefixes = ['RNS', 'RSS', 'RMNS', 'RMSS'];
const categories = ['Freshman', 'Senior', 'Remedial', 'GC'] as const;
const years = ['1', '2', '3', '4', '5'];

const emptyForm = {
  name: '',
  idInput: '',
  department: '',
  year: '',
  phone: '',
  gender: 'Male' as const,
  category: 'Freshman' as const,
  batch: '',
};

const maxNameLength = 35;
const validatePhone = (phone: string): boolean => /^\+2519\d{8}$/.test(phone);

const formatPhone = (value: string): string => {
  let digits = value.replace(/\D/g, '');

  // Handle Ethiopian prefixes
  if (digits.startsWith('09') && digits.length >= 10) {
    digits = '251' + digits.substring(1);
  } else if (digits.startsWith('9') && digits.length === 9) {
    digits = '251' + digits;
  } else if (digits.startsWith('251') && digits.length < 12) {
    // Pad if needed
    if (digits.length === 11) digits = digits; // Already correct length
  }

  // Build result with +251 prefix
  if (digits.startsWith('251')) {
    return '+' + digits.slice(0, 12);
  }

  // If we can't determine a valid format, return as-is for error handling
  return '+' + digits.slice(0, 12);
};

const isValidEthiopianPhone = (phone: string): boolean => /^\+2519\d{8}$/.test(phone);

const isRegistrarId = (value: string) => {
  const normalized = value.trim().toUpperCase();
  return registrarPrefixes.some(prefix => normalized.startsWith(prefix));
};

const getIdType = (student: Student) => (student.registrar_id ? 'Registrar ID' : 'Admission Number');
const getStatus = (student: Student) => (student.registrar_id ? 'Complete' : 'Pending Registrar ID');
const getIdValue = (student: Student) => student.registrar_id || student.admission_number || student.studentId;

const mockSaveStudent = async (payload: unknown) => {
  try {
    await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    console.log('Mock save student data:', payload);
  }
};

const Students = () => {
  const { students, addStudent, addStudentsAndAutoAssign, updateStudent, deleteStudent } = useData();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [admissionUpdate, setAdmissionUpdate] = useState({ admissionNumber: '', registrarId: '' });
  const [importCapacity, setImportCapacity] = useState<4 | 5 | 6>(4);

  const normalizeId = (value: string) => value.trim().toLowerCase();

  const createIdPayload = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return { admission_number: '', registrar_id: '', studentId: '' };
    if (isRegistrarId(trimmed)) {
      return { admission_number: '', registrar_id: trimmed, studentId: trimmed };
    }
    return { admission_number: trimmed, registrar_id: '', studentId: trimmed };
  };

  const hasDuplicateId = (value: string, excludeId?: string) => {
    const normalized = normalizeId(value);
    if (!normalized) return false;
    return students.some(student => student.id !== excludeId && (
      normalizeId(student.studentId) === normalized ||
      normalizeId(student.admission_number ?? '') === normalized ||
      normalizeId(student.registrar_id ?? '') === normalized
    ));
  };

  const handleNameChange = (value: string) => {
    const sanitized = value.replace(/[^A-Za-z\s]/g, '').slice(0, maxNameLength);
    setForm(prev => ({ ...prev, name: sanitized }));
    if (/[^A-Za-z\s]/.test(value)) {
      setNameError('Only letters and spaces are allowed.');
    } else if (value.length > maxNameLength) {
      setNameError(`Maximum ${maxNameLength} characters allowed.`);
    } else {
      setNameError('');
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setForm(prev => ({ ...prev, phone: formatted }));
    if (formatted && !isValidEthiopianPhone(formatted)) {
      setPhoneError('Phone must be in format +2519XXXXXXXX (Ethiopian number).');
    } else if (!formatted) {
      setPhoneError('Phone is required.');
    } else {
      setPhoneError('');
    }
  };

  const isFormValid = Boolean(
    form.name.trim() &&
    form.idInput.trim() &&
    form.department.trim() &&
    form.year.trim() &&
    isValidEthiopianPhone(form.phone) &&
    !nameError &&
    !phoneError
  );

  const handleOpenAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setNameError('');
    setPhoneError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditing(student);
    setForm({
      name: student.name,
      idInput: student.registrar_id || student.admission_number || student.studentId || '',
      department: student.department ?? '',
      year: student.year ?? '',
      phone: student.phone,
      gender: student.gender,
      category: student.category ?? 'Freshman',
      batch: student.batch ?? '',
    });
    setNameError('');
    setPhoneError('');
    setModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isFormValid) {
      toast.error('Complete all required fields before saving.');
      return;
    }

    if (hasDuplicateId(form.idInput, editing?.id)) {
      toast.error('This ID is already in use. Use a unique admission number or registrar ID.');
      return;
    }

    const idPayload = createIdPayload(form.idInput);
    const studentPayload: Omit<Student, 'id' | 'blockId' | 'roomId'> = {
      name: form.name.trim(),
      studentId: idPayload.studentId,
      admission_number: idPayload.admission_number,
      registrar_id: idPayload.registrar_id,
      department: form.department.trim(),
      year: form.year.trim(),
      phone: form.phone.trim(),
      gender: form.gender,
      category: form.category,
      batch: form.batch.trim(),
      role: 'Student',
    };

    if (editing) {
      updateStudent({ ...editing, ...studentPayload });
      await mockSaveStudent({ ...editing, ...studentPayload });
      toast.success('Student record updated successfully.');
    } else {
      const newStudentId = addStudent(studentPayload);
      await mockSaveStudent({ ...studentPayload, id: newStudentId });
      toast.success('Student registered successfully.');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!studentToDelete) return;
    deleteStudent(studentToDelete.id);
    toast.success(`Deleted ${studentToDelete.name}.`);
    setStudentToDelete(null);
    setDeleteDialogOpen(false);
  };

  const normalizeImportKey = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');

  const parseExcelRows = (rows: unknown[][]) => {
    const headers = (rows[0] as string[]).map(header => normalizeImportKey(String(header ?? '')));
    return rows.slice(1).map(row => {
      const rowArray = row as unknown[];
      const rowRecord = headers.reduce<Record<string, string>>((acc, key, index) => {
        acc[key] = String(rowArray[index] ?? '').trim();
        return acc;
      }, {});
      return rowRecord;
    });
  };

  const normalizeImportRole = (value: string): Student['role'] => {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'proctor') return 'Proctor';
    if (normalized === 'coordinator') return 'Coordinator';
    if (normalized === 'team leader' || normalized === 'teamleader') return 'TeamLeader';
    if (normalized === 'vice president' || normalized === 'vicepresident') return 'VicePresident';
    return 'Student';
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: '' });
      if (rawRows.length < 2) {
        toast.error('The file must include a header row and at least one record.');
        return;
      }

      const importRows = parseExcelRows(rawRows as unknown[][]);
      const importedStudents: Omit<Student, 'id' | 'blockId' | 'roomId'>[] = [];
      const errors: string[] = [];

      importRows.forEach((row, index) => {
        const name = row['name'] || row['full name'] || row['student name'];
        const admissionNumber = row['admission number'] || row['admission_number'] || row['admissionno'] || '';
        const phone = row['phone'] || row['mobile'] || row['contact'];
        const gender = (row['gender'] || 'Male').toLowerCase();
        const category = row['category'] || 'Freshman';
        const batch = row['batch'] || '';
        const department = row['department'] || '';
        const year = row['year'] || '';
        const role = normalizeImportRole(row['role'] || 'Student');

        if (!name) {
          errors.push(`Row ${index + 2}: Missing name.`);
          return;
        }
        if (!admissionNumber && role === 'Student') {
          errors.push(`Row ${index + 2}: Missing admission number for ${name}.`);
          return;
        }
        if (!phone) {
          errors.push(`Row ${index + 2}: Missing phone for ${name}.`);
          return;
        }
        if (!['male', 'female'].includes(gender)) {
          errors.push(`Row ${index + 2}: Invalid gender for ${name}.`);
          return;
        }
        if (hasDuplicateId(admissionNumber || name)) {
          errors.push(`Row ${index + 2}: Duplicate admission number / ID for ${name}.`);
          return;
        }

        importedStudents.push({
          name,
          studentId: admissionNumber || name,
          admission_number: admissionNumber || undefined,
          registrar_id: undefined,
          phone: formatPhone(phone),
          gender: gender === 'female' ? 'Female' : 'Male',
          category: (['Freshman', 'Senior', 'Remedial', 'GC'] as const).includes(category as any) ? category as any : 'Freshman',
          batch,
          department,
          year,
          role,
        });
      });

      if (importedStudents.length === 0) {
        toast.error('No valid student data was found in the file.');
        return;
      }

      const importResult = addStudentsAndAutoAssign(importedStudents, importCapacity);
      const assignedCount = importResult.assigned.length;
      const failedCount = importResult.errors.length;
      toast.success(`Imported ${importedStudents.length} users. ${assignedCount} students auto-assigned, ${failedCount} skipped.`);
      if (importResult.errors.length) {
        importResult.errors.forEach(message => toast.error(message));
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to parse the import file. Use a valid Excel or CSV file.');
    }
  };

  const handleRegistrarUpdate = async () => {
    const admissionNumber = admissionUpdate.admissionNumber.trim();
    const registrarId = admissionUpdate.registrarId.trim();

    if (!admissionNumber || !registrarId) {
      toast.error('Both admission number and registrar ID are required.');
      return;
    }
    if (!isRegistrarId(registrarId)) {
      toast.error('Registrar ID must start with RNS, RSS, RMNS, or RMSS.');
      return;
    }
    if (hasDuplicateId(registrarId)) {
      toast.error('This registrar ID is already in use.');
      return;
    }

    const student = students.find(s => normalizeId(s.admission_number ?? '') === normalizeId(admissionNumber));
    if (!student) {
      toast.error('No student found with that admission number.');
      return;
    }

    const updated: Student = {
      ...student,
      registrar_id: registrarId,
      studentId: registrarId,
    };
    updateStudent(updated);
    await mockSaveStudent(updated);
    toast.success('Registrar ID updated successfully.');
    setAdmissionUpdate({ admissionNumber: '', registrarId: '' });
  };

  const filteredStudents = students.filter(student => {
    const term = search.toLowerCase();
    const idText = getIdValue(student).toLowerCase();
    return (
      student.name.toLowerCase().includes(term) ||
      idText.includes(term) ||
      student.department?.toLowerCase().includes(term) ||
      student.year?.toLowerCase().includes(term) ||
      student.category?.toLowerCase().includes(term) ||
      student.batch?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Student Registration</h2>
          <p className="text-sm text-muted-foreground">Accept both admission number and registrar IDs in a single field.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border bg-card text-card-foreground"
            />
          </div>
          <button onClick={handleOpenAdd} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground">
            <Plus className="w-4 h-4" /> Add Student
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/90">
            <Plus className="w-4 h-4" /> Upload File
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} className="hidden" />
          </label>
          <div className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <span className="text-sm text-muted-foreground">Capacity</span>
            <select
              value={importCapacity}
              onChange={e => setImportCapacity(Number(e.target.value) as 4 | 5 | 6)}
              className="rounded-lg border bg-background px-2 py-1 text-sm"
            >
              <option value={4}>4</option>
              <option value={5}>5</option>
              <option value={6}>6</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="bg-card rounded-xl border p-4">
          <h3 className="font-semibold mb-3">Students</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Department</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Year</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Batch</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{student.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{getIdValue(student)}</td>
                    <td className="px-4 py-3">{getIdType(student)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${student.registrar_id ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {getStatus(student)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">{student.department || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{student.year || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{student.batch || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenEdit(student)} className="rounded-md p-1.5 hover:bg-muted">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setStudentToDelete(student); setDeleteDialogOpen(true); }} className="rounded-md p-1.5 hover:bg-destructive/10 text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No students match your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-xl border p-4">
            <h3 className="font-semibold mb-3">Update Registrar ID</h3>
            <p className="text-sm text-muted-foreground mb-3">Use admission number to add a registrar ID later.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Admission Number</label>
                <input
                  value={admissionUpdate.admissionNumber}
                  onChange={e => setAdmissionUpdate(prev => ({ ...prev, admissionNumber: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                  placeholder="e.g. 900123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Registrar ID</label>
                <input
                  value={admissionUpdate.registrarId}
                  onChange={e => setAdmissionUpdate(prev => ({ ...prev, registrarId: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                  placeholder="e.g. RNS-0262/23"
                />
              </div>
              <button onClick={handleRegistrarUpdate} className="w-full rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
                Update Registrar ID
              </button>
            </div>
          </div>
          <div className="bg-card rounded-xl border p-4">
            <h3 className="font-semibold mb-3">ID Guidelines</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Use a single ID field for both admission number and registrar IDs.</li>
              <li>Registrar IDs start with <strong>RNS</strong>, <strong>RSS</strong>, <strong>RMNS</strong>, or <strong>RMSS</strong>.</li>
              <li>Other values are stored as admission numbers.</li>
              <li>Admission numbers show <strong>Pending Registrar ID</strong> status until updated.</li>
            </ul>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {studentToDelete?.name}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Student' : 'Add Student'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              value={form.name}
              onChange={e => handleNameChange(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 bg-background ${nameError ? 'border-red-500' : ''}`}
              placeholder="Student full name"
              required
            />
            {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ID (Admission number or Registrar ID)</label>
            <input
              value={form.idInput}
              onChange={e => setForm(prev => ({ ...prev, idInput: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 bg-background"
              placeholder="e.g. 900123 or RNS-0262/23"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <input
              value={form.department}
              onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 bg-background"
              placeholder="e.g. Computer Science"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <select
              value={form.year}
              onChange={e => setForm(prev => ({ ...prev, year: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 bg-background"
              required
            >
              <option value="">Select year</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              value={form.phone}
              onChange={e => handlePhoneChange(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 bg-background ${phoneError ? 'border-red-500' : ''}`}
              placeholder="+2519XXXXXXXX"
            />
            {phoneError && <p className="mt-1 text-xs text-red-500">{phoneError}</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select
                value={form.gender}
                onChange={e => setForm(prev => ({ ...prev, gender: e.target.value as 'Male' | 'Female' }))}
                className="w-full rounded-lg border px-3 py-2 bg-background"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value as typeof categories[number] }))}
                className="w-full rounded-lg border px-3 py-2 bg-background"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Batch</label>
            <input
              value={form.batch}
              onChange={e => setForm(prev => ({ ...prev, batch: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 bg-background"
              placeholder="e.g. 2026"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border px-4 py-2">
              Cancel
            </button>
            <button type="submit" disabled={!isFormValid} className={`flex-1 rounded-lg px-4 py-2 text-white ${isFormValid ? 'bg-primary hover:bg-primary/90' : 'bg-slate-400'}`}>
              {editing ? 'Update Student' : 'Register Student'}
            </button>
          </div>
        </form>
      </DormModal>
    </div>
  );
};

export default Students;
