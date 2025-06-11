import ReadingModule from "@/components/ReadingModule";
import NavBar from "@/components/NavBar";

const ReadingPage = () => {
  const handleProgressUpdate = (points: number) => {
    console.log("Earned points:", points);
    // Optional: save to progress tracker or localStorage
  };

  return (
    <div className="min-h-screen bg-edu-bg">
      <NavBar />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 text-edu-dark">📚 Reading Adventures</h1>
        <ReadingModule level={1} onProgress={handleProgressUpdate} />
      </div>
    </div>
  );
};

export default ReadingPage;
