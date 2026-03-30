import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Plus,
  FileText,
  Settings,
  Shield,
  LogOut,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: "New Invoice",
    path: "/new",
    icon: <Plus className="h-5 w-5" />,
  },
  {
    label: "Jobs",
    path: "/jobs",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: <Settings className="h-5 w-5" />,
  },
  {
    label: "Admin",
    path: "/admin",
    icon: <Shield className="h-5 w-5" />,
    adminOnly: true,
  },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAuth();

  const visibleNav = navItems.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );

  const isActive = (path: string) => {
    if (path === "/new") {
      return (
        location === "/new" ||
        location === "/new/services" ||
        location === "/new/invoice"
      );
    }
    return location === path;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setLocation("/auth");
    } catch {
      // signOut failed — stay on current page
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Desktop Sidebar ──────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-60 shrink-0"
        style={{ backgroundColor: "#0077B6" }}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/20">
          <p className="text-3xl font-black text-white tracking-tight leading-none">
            PPP
          </p>
          <p className="text-xs text-white/70 mt-1 font-medium tracking-wide">
            Price per Pound
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={[
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150",
                isActive(item.path)
                  ? "bg-white text-[#0077B6] shadow-sm"
                  : "text-white/80 hover:text-white hover:bg-white/15",
              ].join(" ")}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-white/20 space-y-3">
          {user && (
            <div className="px-1">
              <p className="text-xs font-semibold text-white truncate">
                {user.displayName || user.email}
              </p>
              {user.displayName && (
                <p className="text-[11px] text-white/60 truncate mt-0.5">
                  {user.email}
                </p>
              )}
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/15 transition-all duration-150"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>

        {/* ── Mobile Bottom Tab Bar ─────────────────────────── */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card z-40"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-stretch">
            {visibleNav.map((item) => (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={[
                  "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-all duration-150",
                  isActive(item.path)
                    ? "text-[#0077B6]"
                    : "text-muted-foreground",
                ].join(" ")}
              >
                <span
                  className={[
                    "p-1 rounded-md transition-colors",
                    isActive(item.path) ? "bg-[#0077B6]/10" : "",
                  ].join(" ")}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
