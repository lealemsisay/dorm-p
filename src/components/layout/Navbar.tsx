import { Menu, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NavbarProps {
  onMenuClick: () => void;
  title: string;
}

const Navbar = ({ onMenuClick, title }: NavbarProps) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-card border-b px-4 lg:px-6 py-3 flex items-center gap-4">
      <button onClick={onMenuClick} className="lg:hidden text-muted-foreground hover:text-foreground">
        <Menu className="w-6 h-6" />
      </button>
      <h1 className="text-lg font-semibold text-card-foreground">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        <button className="relative text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
        </button>
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
              {user.username.slice(0,1).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-card-foreground">{user.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role.replace(/([A-Z])/g, ' $1').trim()}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
