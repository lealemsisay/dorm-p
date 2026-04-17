import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const { user, isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (login(username, password)) {
        toast.success(`Welcome, ${user?.role || 'User'} (${username})!`);
      } else {
        toast.error(`Invalid credentials. Try: vp_admin/vp123, teamleader/team123, coord1/coord123, proctor/proctor123, student1/student123`);
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">DormManager</h1>
          <p className="text-muted-foreground mt-1">Dormitory Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Demos: vp_admin/vp123 | teamleader/team123 | coord1/coord123 | proctor/proctor123 | student1/student123
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
