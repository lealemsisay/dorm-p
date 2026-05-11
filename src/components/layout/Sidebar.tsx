import {
  LayoutDashboard,
  Users,
  DoorOpen,
  ArrowRightLeft,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Role } from '@/types/role';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const getRoleLinks = (role: Role) => {
  const baseLinks = [
    {
      to: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "staff", "student"] as Role[]
    },

    {
      to: "/users",
      label: "Users",
      icon: Users,
      roles: ["admin"] as Role[]
    },

    {
      to: "/students",
      label: "Students",
      icon: Users,
      roles: ["admin", "staff"] as Role[]
    },

    {
      to: "/blocks",
      label: "Blocks",
      icon: DoorOpen,
      roles: ["admin", "staff"] as Role[]
    },

    {
      to: "/allocations",
      label: "Allocations",
      icon: ArrowRightLeft,
      roles: ["admin", "staff"] as Role[]
    },

    {
      to: "/admin",
      label: "Admin Dashboard",
      icon: Users,
      roles: ["admin"] as Role[]
    },

    {
      to: "/staff",
      label: "Staff Dashboard",
      icon: Users,
      roles: ["staff"] as Role[]
    },

    {
      to: "/student",
      label: "Student Dashboard",
      icon: Users,
      roles: ["student"] as Role[]
    }
  ];

  return baseLinks.filter((link) => link.roles.includes(role));
};

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const { user } = useAuth();
  const role = user?.role as Role;
  const links = getRoleLinks(role);

  return (
    <>
      <aside className="hidden lg:flex lg:w-64 lg:min-h-screen lg:flex-col bg-white border-r">
        <div className="p-4 text-xl font-bold border-b">Dormitory System</div>
        <nav className="p-4 flex flex-col gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 p-2 rounded-lg transition ${
                    isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                  }`
                }
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!open}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div
          className={`absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl transform transition-transform ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b p-4">
            <div className="text-lg font-bold">Dormitory System</div>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100">
              <X size={18} />
            </button>
          </div>
          <nav className="p-4 flex flex-col gap-2">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2 p-2 rounded-lg transition ${
                      isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;