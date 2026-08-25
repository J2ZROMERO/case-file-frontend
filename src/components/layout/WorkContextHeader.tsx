import { Building2, FolderOpen, UserRound } from "lucide-react";

type WorkContextHeaderProps = {
  clinicName: string;
  userName: string;
  recordName: string;
};

const contextItems = [
  { key: "clinic", label: "Clínica", icon: Building2 },
  { key: "user", label: "Usuario", icon: UserRound },
  { key: "record", label: "Expediente seleccionado", icon: FolderOpen },
] as const;

export function WorkContextHeader({ clinicName, userName, recordName }: WorkContextHeaderProps) {
  const values = { clinic: clinicName, user: userName, record: recordName };

  return (
    <header className="rounded-xl border border-slate-200 bg-white p-3 shadow-soft sm:p-4">
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
              </div>
            </div>
          );
        })}
      </div>
    </header>
  );
}
