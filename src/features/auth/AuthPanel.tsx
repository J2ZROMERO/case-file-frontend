import { Building2, KeyRound } from "lucide-react";

import { Button, Card, FormField } from "../../components/ui";
import { useAppForm } from "../../hooks";

export type ClinicAccess = { id: string; name: string; role: string };
export type ClinicSelection = {
  selection_token: string;
  full_name: string;
  email: string;
  clinics: ClinicAccess[];
};

type AuthPanelProps = {
  selection: ClinicSelection | null;
  onIdentify: (payload: { email: string; password: string }) => Promise<void>;
  onSelectClinic: (clinic: ClinicAccess) => Promise<void>;
  onBack: () => void;
  backLabel?: string;
};

type LoginForm = { email: string; password: string };

const roleLabels: Record<string, string> = {
  tenant_admin: "Administración",
  doctor: "Médico",
  nurse: "Enfermería",
  reception: "Recepción",
  auditor: "Consulta de actividad",
};

export function AuthPanel({ selection, onIdentify, onSelectClinic, onBack, backLabel = "Usar otra cuenta" }: AuthPanelProps) {
  const form = useAppForm<LoginForm>({ defaultValues: { email: "", password: "" } });

  return (
    <Card>
      {!selection ? (
        <>
          <div className="mb-5">
            <h2 className="section-title">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-muted">
              Escribe tus datos. Después podrás elegir una de tus clínicas.
            </p>
          </div>
          <form
            className="grid gap-4"
            onSubmit={form.submit(async (values) => {
              try {
                await onIdentify(values);
              } catch (error) {
                form.applyServerError(error, "password");
              }
            })}
          >
            <FormField
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              registration={form.register("email", { required: "Escribe tu correo." })}
              error={form.formState.errors.email}
            />
            <FormField
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              registration={form.register("password", { required: "Escribe tu contraseña." })}
              error={form.formState.errors.password}
            />
            <Button type="submit" icon={<KeyRound className="h-4 w-4" />}>
              Continuar
            </Button>
          </form>
        </>
      ) : (
        <>
          <div className="mb-5">
            <h2 className="section-title">Elige dónde trabajarás</h2>
            <p className="mt-1 text-sm text-muted">
              Hola, {selection.full_name}. Sólo aparecen las clínicas asociadas a tu cuenta.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {selection.clinics.map((clinic) => (
              <button
                key={clinic.id}
                type="button"
                onClick={() => onSelectClinic(clinic)}
                className="flex min-h-24 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-brand-500 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <span className="rounded-lg bg-brand-100 p-2 text-brand-700">
                  <Building2 className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-ink">{clinic.name}</span>
                  <span className="block text-sm text-muted">{roleLabels[clinic.role] ?? clinic.role}</span>
                </span>
              </button>
            ))}
          </div>
          <Button className="mt-4" type="button" variant="secondary" onClick={onBack}>
            {backLabel}
          </Button>
        </>
      )}
    </Card>
  );
}
