import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Search, Home } from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AI Pisma Urzędowe</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button
              variant={isActive("/") ? "default" : "ghost"}
              asChild
            >
              <Link to="/">
                <Home />
                Start
              </Link>
            </Button>
            <Button
              variant={isActive("/generator") ? "default" : "ghost"}
              asChild
            >
              <Link to="/generator">
                <FileText />
                Generator
              </Link>
            </Button>
            <Button
              variant={isActive("/dotacje") ? "default" : "ghost"}
              asChild
            >
              <Link to="/dotacje">
                <Search />
                Dotacje
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
