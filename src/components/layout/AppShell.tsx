import { Activity, ClipboardList, FileText, LogOut, ShieldCheck, Stethoscope, Users } from "lucide-react";

type AppShellProps = {
  children: React.ReactNode;
  activeView: string;
  isAuthenticated: boolean;
  onViewChange: (view: string) => void;
  onLogout: () => void;
};

const navItems = [
  { id: "security", label: "Acceso", icon: ShieldCheck },
  { id: "patients", label: "Pacientes", icon: Users },
  { id: "record", label: "Expediente", icon: FileText },
  { id: "compliance", label: "Documentos", icon: Stethoscope },
  { id: "audit", label: "Auditoria", icon: ClipboardList },
];

export function AppShell({
  children,
  activeView,
  isAuthenticated,
  onViewChange,
  onLogout,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-surface">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3 p-4 lg:block">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                Expediente clinico electronico
              </p>
              <h1 className="text-2xl font-bold text-ink">Medical Case File</h1>
            </div>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-slate-100 lg:mt-4"
              >
                <LogOut className="h-4 w-4" /> Salir
              </button>
            ) : null}
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:grid lg:overflow-visible">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onViewChange(item.id)}
                  className={`inline-flex min-w-fit items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
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
          <div className="hidden border-t border-slate-200 p-4 text-xs text-muted lg:block">
            <Activity className="mb-2 h-4 w-4 text-brand-600" />
            Gestiona una clinica, entra con tu usuario y trabaja con un paciente a la vez.
          </div>
        </aside>
        <main className="page-shell">{children}</main>
      </div>
    </div>
  );
}
