
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-edu-bg p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-edu-purple mb-4">404</div>
        <h1 className="text-3xl font-bold mb-4">Oops! Page not found</h1>
        <p className="text-gray-600 mb-8">
          The page you are looking for might have been moved or doesn't exist.
        </p>
        <div className="flex justify-center">
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-edu-purple hover:bg-edu-light-purple text-white px-6 py-2"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
