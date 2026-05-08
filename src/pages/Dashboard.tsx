import { useData } from '@/contexts/DataContext';

const Dashboard = () => {
  useData();

  return (
    <div className="space-y-6">
      <div className="text-card-foreground">
        <p className="text-sm text-muted-foreground">Student dashboard widgets have been removed.</p>
      </div>
    </div>
  );
};

export default Dashboard;
