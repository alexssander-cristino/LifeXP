import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, Menu, X, LayoutDashboard, ClipboardList, Activity, Award, BarChart3, Settings, User } from "lucide-react";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = React.useState(false);

  const items = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Missões", icon: ClipboardList, href: "/missions" },
    { label: "Hábitos", icon: Activity, href: "/habits" },
    { label: "Conquistas", icon: Award, href: "/achievements" },
    { label: "Progresso", icon: BarChart3, href: "/xp" },
    { label: "Perfil", icon: User, href: "/profile" },
    { label: "Configurações", icon: Settings, href: "/settings" },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm onClick={() => setOpen(false)} lg:hidden" />
      )}
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-rpg-border transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 lg:!border-r`}>
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-rpg-purple flex items-center justify-center text-white font-bold">LX</div>
            <span className="font-display font-bold text-lg text-rpg-foreground tracking-tight">LifeXP</span>
          </div>
          <button className="lg:hidden p-2 text-rpg-foreground hover:bg-rpg-panel" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {items.map((item) => {
            const active = location.pathname === item.href;
            return (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${active ? "bg-rpg-purple/20 text-rpg-purple border-r border-rpg-purple/50" : "text-rpg-foreground/70 hover:bg-rpg-panel hover:text-rpg-foreground"}`}
                onClick={() => { navigate(item.href); setOpen(false); }}
              >
                <item.icon size={18} className={active ? "text-rpg-purple" : "text-rpg-foreground/60"} />
                {item.label}
              </button>
            );
          })}
          <hr className="my-3 border-rpg-border" />
          <button className="btn-rpg-secondary w-full" onClick={logout}>Sair</button>
        </nav>
      </aside>
      {/* Mobile menu button */}
      <button className="lg:hidden p-3 text-rpg-foreground hover:bg-rpg-panel" onClick={() => setOpen(true)}>
        <Menu size={22} />
      </button>
      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-rpg-dark p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}
