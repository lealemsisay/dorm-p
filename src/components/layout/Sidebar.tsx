import type { Role } from '@/types/role';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import {
  LayoutDashboard, Users, DoorOpen, ArrowRightLeft, LogOut, Building2, X,
} from 'lucide-react';

const getRoleLinks = (role: Role) => {
  const baseLinks = [
<<<<<<< HEAD
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['VicePresident', 'TeamLeader', 'Coordinator', 'Proctor', 'admin', 'staff', 'Student', 'student'] as Role[] },
    { to: '/users', label: 'Users', icon: Users, roles: ['VicePresident', 'admin'] as Role[] },
    { to: '/students', label: 'Students', icon: Users, roles: ['VicePresident', 'TeamLeader', 'Coordinator', 'Proctor', 'admin', 'staff', 'Student', 'student'] as Role[] },
    { to: '/blocks', label: 'Blocks', icon: DoorOpen, roles: ['VicePresident', 'TeamLeader', 'Coordinator', 'admin', 'staff'] as Role[] },
    { to: '/allocations', label: 'Allocations', icon: ArrowRightLeft, roles: ['VicePresident', 'TeamLeader', 'Coordinator', 'admin', 'staff'] as Role[] },
    { to: '/admin', label: 'Admin', icon: Users, roles: ['admin'] as Role[] },
    { to: '/staff', label: 'Staff', icon: Users, roles: ['staff'] as Role[] },
    { to: '/student', label: 'Student', icon: Users, roles: ['Student', 'student'] as Role[] },
=======
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['VicePresident', 'TeamLeader', 'Coordinator', 'Proctor', 'Student'] as Role[] },
    { to: '/users', label: 'Users', icon: Users, roles: ['VicePresident'] as Role[] },
    { to: '/students', label: 'Students', icon: Users, roles: ['VicePresident', 'TeamLeader', 'Coordinator', 'Proctor'] as Role[] },
    { to: '/blocks', label: 'Blocks', icon: DoorOpen, roles: ['VicePresident', 'TeamLeader', 'Coordinator'] as Role[] },
    { to: '/allocations', label: 'Allocations', icon: ArrowRightLeft, roles: ['VicePresident', 'TeamLeader', 'Coordinator'] as Role[] },
>>>>>>> f9624a099bd7184f2cbf42810d1211d4866e6b7b
  ];
  return baseLinks.filter(link => link.roles.includes(role));
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const roleLinks = user ? getRoleLinks(user.role) : [];

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-foreground/30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'hsl(var(--sidebar-bg))' }}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-hover">
          <Building2 className="w-7 h-7 text-primary" />
          <span className="text-lg font-bold" style={{ color: 'hsl(var(--sidebar-fg))' }}>DormManager</span>
          <button onClick={onClose} className="ml-auto lg:hidden" style={{ color: 'hsl(var(--sidebar-fg))' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {roleLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={`sidebar-link ${location.pathname === to || (to !== '/' && location.pathname.startsWith(to)) ? 'active' : ''}`}
              style={{ color: 'hsl(var(--sidebar-fg))' }}
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-hover">
          <button
            onClick={logout}
            className="sidebar-link w-full text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
