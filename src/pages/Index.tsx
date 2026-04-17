// Update this page (the content is just a fallback if you fail to update the page)
import { useData } from "@/contexts/DataContext";
import Allocations from "./Allocations";
import { Users, DoorOpen } from "lucide-react";

const Index = () => {
  const { students, rooms, allocations } = useData();

  return (
    <div className="container mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dorm Harmony Dashboard</h1>
        <p className="text-muted-foreground">Overview of student housing and room assignments.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 bg-card rounded-xl border shadow-sm flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Students</p>
            <p className="text-2xl font-bold">{students.length}</p>
          </div>
        </div>
        <div className="p-6 bg-card rounded-xl border shadow-sm flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary"><DoorOpen className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Occupied Rooms</p>
            <p className="text-2xl font-bold">{new Set(allocations.map(a => a.roomNumber)).size} / {rooms.length}</p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Manage Allocations</h2>
        <Allocations />
      </section>
    </div>
  );
};

export default Index;
