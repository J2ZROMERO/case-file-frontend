import { CalendarDays, ClipboardList, FileText, LogOut, ShieldCheck, Stethoscope, UserCog, Users } from "lucide-react";

type AppShellProps = {
  children: React.ReactNode;
  activeView: string;
  isAuthenticated: boolean;
  userRole?: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
};

const navItems = [
  { id: "security", label: "Acceso", icon: ShieldCheck },
  { id: "patients", label: "Pacientes", icon: Users },
  { id: "appointments", label: "Agenda", icon: CalendarDays, roles: ["tenant_admin", "reception", "doctor"] },
  { id: "record", label: "Expediente", icon: FileText },
  { id: "compliance", label: "Documentos", icon: Stethoscope },
  { id: "staff", label: "Administración", icon: UserCog, roles: ["tenant_admin"] },
  { id: "audit", label: "Actividad", icon: ClipboardList },
];

export function AppShell({
  children,
  activeView,
  isAuthenticated,
  userRole,
  onViewChange,
  onLogout,
}: AppShellProps) {
  const visibleItems = isAuthenticated
    ? navItems.filter((item) => item.id !== "security" && (!("roles" in item) || !item.roles || item.roles.includes(userRole ?? "")))
    : navItems.filter((item) => item.id === "security");
  const mobileGridClass = visibleItems.length === 6 ? "grid-cols-6" : visibleItems.length === 5 ? "grid-cols-5" : visibleItems.length === 4 ? "grid-cols-4" : "grid-cols-1";

  return (
    <div className="min-h-screen bg-surface">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:block lg:p-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700 sm:text-xs">
                Expediente clínico
              </p>
              <h1 className="text-xl font-bold text-ink sm:text-2xl">Medical Case File</h1>
            </div>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-slate-100 lg:mt-5"
              >
                <LogOut className="h-4 w-4" /> Salir
              </button>
            ) : null}
          </div>
          <nav
            className={`fixed inset-x-0 bottom-0 z-40 grid border-t border-slate-200 bg-white/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,.08)] backdrop-blur lg:static lg:grid-cols-1 lg:gap-2 lg:border-0 lg:bg-transparent lg:px-4 lg:pb-4 lg:pt-0 lg:shadow-none ${
              mobileGridClass
            }`}
          >
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onViewChange(item.id)}
                  className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[11px] font-semibold transition lg:flex-row lg:justify-start lg:gap-2 lg:px-3 lg:text-sm ${
                    activeView === item.id
                      ? "bg-brand-600 text-white"
                      : "text-muted hover:bg-slate-100 hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>
        <main className="page-shell">{children}</main>
      </div>
    </div>
  );
}
