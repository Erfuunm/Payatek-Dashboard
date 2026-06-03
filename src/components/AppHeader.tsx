import { LogOut, LayoutDashboard, Wallet, HistoryIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

import { departmentLabel } from "@/lib/departments";
import { useAuth } from "@/context/AuthContext";

export function AppHeader() {
  const { profile, isAdmin, logout, user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg gradient-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold leading-none">وب اپ گزارشات شرکت پایاتک</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {isAdmin ? "مدیر سیستم" : departmentLabel(profile?.department)}
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {user && (
  <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/transactions")}>
              <HistoryIcon className="ml-2 h-4 w-4" />
              تاریخچه
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <LayoutDashboard className="ml-2 h-4 w-4" />
              داشبورد
            </Button>
      
  </>
          )}
          <ThemeToggle />
          {user && (
            <Button variant="ghost" size="icon" onClick={async () => { await logout(); navigate("/auth"); }} aria-label="خروج">
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
