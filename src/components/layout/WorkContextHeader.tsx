import { Building2, FolderOpen, UserRound } from "lucide-react";

type WorkContextHeaderProps = {
  clinicName: string;
  userName: string;
  userRole: string;
  recordName: string;
  onChangeClinic: () => void;
  onManageStaff: () => void;
};

const contextItems = [
  { key: "clinic", label: "Clínica", icon: Building2 },
  { key: "user", label: "Usuario", icon: UserRound },
  { key: "record", label: "Expediente seleccionado", icon: FolderOpen },
] as const;

export function WorkContextHeader({ clinicName, userName, userRole, recordName, onChangeClinic, onManageStaff }: WorkContextHeaderProps) {
  const values = { clinic: clinicName, user: userName, record: recordName };

  return (
    <header className="rounded-xl border border-slate-200 bg-white p-3 shadow-soft sm:p-4">
      {userRole === "tenant_admin" ? <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-muted">Administración de {clinicName}</p><button type="button" onClick={onManageStaff} className="min-h-11 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Asignar o quitar personal</button></div> : null}
      <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
        {contextItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="flex min-w-0 items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted">{item.label}</p>
                <p className="truncate text-sm font-semibold text-ink" title={values[item.key]}>
                  {values[item.key]}
                </p>
                {item.key === "user" ? <p className="text-xs text-muted">{{ tenant_admin: "Administración", doctor: "Médico", nurse: "Enfermería", reception: "Recepción", auditor: "Revisión" }[userRole] ?? userRole}</p> : null}
                {item.key === "clinic" ? <button type="button" onClick={onChangeClinic} className="mt-1 min-h-8 text-sm font-semibold text-brand-700 hover:underline">Cambiar clínica</button> : null}
              </div>
            </div>
          );
        })}
      </div>
    </header>
  );
}
