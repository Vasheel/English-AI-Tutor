
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import UserProfile from "@/components/UserProfile";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

const NavBar = () => {
  const location = useLocation();
  const { isAdmin } = useAdminAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const MobileMenu = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <div className="flex flex-col space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-edu-purple">LearnQuest</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg">{item.icon}</span>
                <span className={`font-medium ${
                  location.pathname === item.path 
                    ? "text-edu-purple" 
                    : "text-gray-700"
                }`}>
                  {item.label}
                </span>
              </Link>
            ))}
            
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg">🛡️</span>
                <span className={`font-medium ${
                  location.pathname === "/admin" 
                    ? "text-red-600" 
                    : "text-gray-700"
                }`}>
                  Admin
                </span>
              </Link>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <nav className="bg-white shadow-md border-b-2 border-edu-purple sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl sm:text-2xl font-bold text-edu-purple">LearnQuest</span>
          </Link>
          
          {/* Desktop Navigation */}
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
            {isAdmin && (
              <Link to="/admin">
                <Button
                  variant={location.pathname === "/admin" ? "default" : "ghost"}
                  className={`flex items-center space-x-2 ${
                    location.pathname === "/admin" 
                      ? "bg-red-600 text-white" 
                      : "text-gray-700 hover:text-red-600"
                  }`}
                >
                  <span>🛡️</span>
                  <span>Admin</span>
                </Button>
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <UserProfile />
            <MobileMenu />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
