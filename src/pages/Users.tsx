import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { CreateUserPayload } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

import { toast } from 'sonner';
import type { Role } from '@/types/role';
import { UserPlus, Edit, Trash2 } from 'lucide-react';

const EMPTY_FORM: CreateUserPayload = {
  username: '',
  password: '',
  role: '' as Role,
  fullName: '',
  nationalId: '',
  phoneNumber: '',
  address: '',
  email: '',
};

const Users = () => {
  const { users, createUser, deleteUser, updateUser } = useAuth();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateUserPayload>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);

  const [selectedRole, setSelectedRole] = useState<Role>('Coordinator');
  const [search, setSearch] = useState('');

  const set = (field: keyof CreateUserPayload, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const reset = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
  };

  // ✅ PHONE VALIDATION + AUTO FORMAT (+251)
  const formatPhone = (phone: string) => {
    let cleaned = phone.replace(/\s/g, '');

    if (cleaned.startsWith('09')) {
      cleaned = '+251' + cleaned.substring(1);
    }

    if (!cleaned.startsWith('+251')) {
      cleaned = '+251' + cleaned;
    }

    return cleaned;
  };

  const isValidPhone = (phone: string) => {
    return /^\+2519\d{8}$/.test(phone);
  };

  // ✅ CREATE + UPDATE
  const handleSubmit = () => {
    const required: (keyof CreateUserPayload)[] = [
      'username', 'password', 'role',
      'fullName', 'nationalId',
      'phoneNumber', 'address', 'email'
    ];

    for (const f of required) {
      if (!form[f]) {
        toast.error(`Missing ${f}`);
        return;
      }
    }

    const formattedPhone = formatPhone(form.phoneNumber);

    if (!isValidPhone(formattedPhone)) {
      toast.error('Phone must be valid Ethiopian format (+2519XXXXXXXX)');
      return;
    }

    const finalForm = {
      ...form,
      phoneNumber: formattedPhone
    };

    if (editId) {
      updateUser({
        id: editId,
        ...finalForm
      } as any);

      toast.success('User updated successfully');
    } else {
      createUser(finalForm);
      toast.success('User created successfully');
    }

    reset();
    setOpen(false);
  };

  // ✅ DELETE
  const handleDelete = (id: string) => {
    deleteUser(id);
    toast.success('User deleted successfully');
  };

  // ✅ EDIT
  const handleEdit = (u: any) => {
    setEditId(u.id);
    setForm({
      username: u.username,
      password: u.password || '',
      role: u.role,
      fullName: u.fullName || '',
      nationalId: u.nationalId || '',
      phoneNumber: u.phoneNumber || '',
      address: u.address || '',
      email: u.email || '',
    });
    setOpen(true);
  };

  // ✅ GLOBAL SEARCH
  const filtered = users
    .filter(u => {
      const q = search.toLowerCase();
      if (!q) return true;

      return (
        u.username?.toLowerCase().includes(q) ||
        u.fullName?.toLowerCase().includes(q) ||
        u.nationalId?.toLowerCase().includes(q) ||
        u.phoneNumber?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.address?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
      );
    })
    .filter(u => u.role === selectedRole);

  return (
    <RoleGuard allowedRoles={['VicePresident']}>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex justify-between">
          <h1 className="text-xl font-bold">Users</h1>

          <Button onClick={() => { reset(); setOpen(true); }}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* SEARCH + ROLE FILTER */}
        <div className="flex gap-3">
          <Input
            className="max-w-sm"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as Role)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Coordinator">Coordinator</SelectItem>
              <SelectItem value="Proctor">Proctor</SelectItem>
              <SelectItem value="TeamLeader">Team Leader</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* TABLE */}
        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>{u.fullName}</TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{u.nationalId}</TableCell>
                    <TableCell>{u.phoneNumber}</TableCell>
                    <TableCell>{u.role}</TableCell>

                    <TableCell className="flex gap-2">

                      <Button size="sm" variant="outline" onClick={() => handleEdit(u)}>
                        <Edit className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(u.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

            </Table>
          </CardContent>
        </Card>

        {/* CREATE / EDIT MODAL */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? 'Edit User' : 'Create User'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
              <Input placeholder="Username" value={form.username} onChange={e => set('username', e.target.value)} />
              <Input placeholder="Password" value={form.password} onChange={e => set('password', e.target.value)} />

              <Select value={form.role} onValueChange={v => set('role', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Coordinator">Coordinator</SelectItem>
                  <SelectItem value="Proctor">Proctor</SelectItem>
                  <SelectItem value="TeamLeader">Team Leader</SelectItem>
                </SelectContent>
              </Select>

              <Input placeholder="Full Name" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
              <Input placeholder="National ID" value={form.nationalId} onChange={e => set('nationalId', e.target.value)} />

              {/* PHONE (must start +251 enforced) */}
              <Input
                placeholder="+251..."
                value={form.phoneNumber}
                onChange={e => set('phoneNumber', e.target.value)}
              />

              <Input placeholder="Email" value={form.email} onChange={e => set('email', e.target.value)} />
              <Input placeholder="Address" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>

          </DialogContent>
        </Dialog>

      </div>
    </RoleGuard>
  );
};

export default Users;