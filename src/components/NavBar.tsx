
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md py-3 px-4 md:px-8">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-bold text-2xl text-edu-purple">LearnQuest</span>
        </Link>

        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="font-medium text-gray-700 hover:text-edu-purple">
            Dashboard
          </Link>
          <Link to="/exercises" className="font-medium text-gray-700 hover:text-edu-purple">
            Exercises
          </Link>
          <Link to="/quizzes" className="font-medium text-gray-700 hover:text-edu-purple">
            Quizzes
          </Link>
          <Link to="/progress" className="font-medium text-gray-700 hover:text-edu-purple">
            My Progress
          </Link>
          <Button className="bg-edu-purple hover:bg-edu-light-purple text-white">
            Sign In
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white shadow-md md:hidden z-50">
            <div className="flex flex-col p-4 space-y-3">
              <Link 
                to="/" 
                className="p-2 rounded hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/exercises" 
                className="p-2 rounded hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Exercises
              </Link>
              <Link 
                to="/quizzes" 
                className="p-2 rounded hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Quizzes
              </Link>
              <Link 
                to="/progress" 
                className="p-2 rounded hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                My Progress
              </Link>
              <Button className="bg-edu-purple hover:bg-edu-light-purple text-white">
                Sign In
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
