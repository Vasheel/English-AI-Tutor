
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import UserProfile from "@/components/UserProfile";

const NavBar = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/grammar", label: "Grammar", icon: "✍️" },
    { path: "/exercise-generator", label: "Exercises", icon: "📝" },
    { path: "/games", label: "Games", icon: "🎮" },
    { path: "/reading", label: "Reading", icon: "📚" },
    { path: "/cloze", label: "Close Test", icon: "✏️" },
    { path: "/quizzes", label: "Quizzes", icon: "📝" },
    { path: "/adaptive-quiz", label: "Smart Quiz", icon: "🎯" },
    { path: "/image-quiz", label: "Image Quiz", icon: "🎨" },
    { path: "/progress", label: "Progress", icon: "📊" },
    { path: "/chat", label: "PSAC Chat", icon: "💬" },
    { path: "/ai-demo", label: "Topic Questions", icon: "🤖" },
  ];

  return (
    <nav className="bg-white shadow-md border-b-2 border-edu-purple">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-edu-purple">LearnQuest</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  className={`flex items-center space-x-2 ${
                    location.pathname === item.path 
                      ? "bg-edu-purple text-white" 
                      : "text-gray-700 hover:text-edu-purple"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <UserProfile />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
