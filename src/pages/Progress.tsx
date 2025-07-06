import NavBar from "@/components/NavBar";
import SupabaseProgressDashboard from "@/components/SupabaseProgressDashboard";

const Progress = () => {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto py-8">
        <SupabaseProgressDashboard />
      </main>
    </div>
  );
};

export default Progress;
