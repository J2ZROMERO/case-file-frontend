import { Building2, UserRoundPlus } from "lucide-react";

import { Button, Card, FormField } from "../../components/ui";
import { useAppForm } from "../../hooks";

export type FirstRunSetupForm = {
  clinic_name: string;
  clinic_legal_name: string;
  full_name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

type FirstRunSetupProps = {
  onCreate: (payload: FirstRunSetupForm) => Promise<void>;
};

export function FirstRunSetup({ onCreate }: FirstRunSetupProps) {
  const form = useAppForm<FirstRunSetupForm>({
    defaultValues: {
      clinic_name: "",
      clinic_legal_name: "",
      full_name: "",
      email: "",
      password: "",
      password_confirmation: "",
    },
  });

  return (
    <Card>
      <div className="mb-5">
        <span className="mb-3 inline-flex rounded-lg bg-brand-100 p-2 text-brand-700">
          <Building2 className="h-5 w-5" />
        </span>
        <h2 className="section-title">Configura tu expediente clínico</h2>
        <p className="mt-1 text-sm text-muted">
          Este paso aparece sólo una vez. Crearás la clínica y la primera cuenta administradora.
        </p>
      </div>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={form.submit(async (values) => {
          if (values.password !== values.password_confirmation) {
            form.setError("password_confirmation", { message: "Las contraseñas no coinciden." });
            return;
          }
          try {
            await onCreate(values);
          } catch (error) {
            form.applyServerError(error, "email");
          }
        })}
      >
        <FormField
          label="Nombre de la clínica"
          registration={form.register("clinic_name", { required: "Escribe el nombre de la clínica." })}
          error={form.formState.errors.clinic_name}
        />
        <FormField
          label="Razón social (opcional)"
          registration={form.register("clinic_legal_name")}
          error={form.formState.errors.clinic_legal_name}
        />
        <FormField
          label="Nombre del administrador"
          autoComplete="name"
          registration={form.register("full_name", { required: "Escribe tu nombre." })}
          error={form.formState.errors.full_name}
        />
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
          autoComplete="new-password"
          registration={form.register("password", {
            required: "Crea una contraseña.",
            minLength: { value: 10, message: "Usa al menos 10 caracteres." },
          })}
          error={form.formState.errors.password}
        />
        <FormField
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          registration={form.register("password_confirmation", {
            required: "Confirma la contraseña.",
          })}
          error={form.formState.errors.password_confirmation}
        />
        <div className="sm:col-span-2">
          <Button type="submit" icon={<UserRoundPlus className="h-4 w-4" />}>
            Crear clínica y administrador
          </Button>
        </div>
      </form>
    </Card>
  );
}
