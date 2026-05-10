import {
  LayoutDashboard,
  Users,
  DoorOpen,
  ArrowRightLeft
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Role } from "@/types/role";

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

const Sidebar = () => {
  const { user } = useAuth();

  const role = user?.role as Role;

  const links = getRoleLinks(role);

  return (
    <aside className="w-64 min-h-screen bg-white border-r">
      <div className="p-4 text-xl font-bold border-b">
        Dormitory System
      </div>

      <nav className="p-4 flex flex-col gap-2">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-2 p-2 rounded-lg transition ${
                  isActive
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100"
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
  );
};

export default Sidebar;