import { useState } from "react";
import { UserPlus } from "lucide-react";

import { Button, Card, FormField, Modal } from "../../components/ui";
import { useAppForm } from "../../hooks";

type PatientPanelProps = {
  tenantId: string;
  onCreate: (payload: Record<string, unknown>) => Promise<void>;
};

type PatientForm = {
  first_name: string;
  last_name: string;
  email: string;
  birth_date: string;
  curp: string;
};

export function PatientPanel({ tenantId, onCreate }: PatientPanelProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const form = useAppForm<PatientForm>({
    defaultValues: { first_name: "", last_name: "", email: "", birth_date: "", curp: "" },
  });

  return (
    <Card>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="section-title">Agregar paciente</h2>
          <p className="mt-1 text-sm text-muted">
            Registra un paciente nuevo. Para consultar pacientes y abrir sus expedientes, ve a Expediente.
          </p>
        </div>
        <Button type="button" icon={<UserPlus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)} disabled={!tenantId}>
          Agregar paciente
        </Button>
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nuevo paciente" description="Captura los datos para registrarlo en la clinica actual.">
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={form.submit(async (values) => {
            try {
              await onCreate({ ...values, birth_date: values.birth_date || null, curp: values.curp || null });
              form.reset({ first_name: "", last_name: "", email: "", birth_date: "", curp: "" });
              setIsCreateOpen(false);
            } catch (error) {
              form.applyServerError(error, "email");
            }
          })}
        >
          <FormField label="Nombre" registration={form.register("first_name", { required: "Nombre obligatorio." })} error={form.formState.errors.first_name} />
          <FormField label="Apellidos" registration={form.register("last_name", { required: "Apellidos obligatorios." })} error={form.formState.errors.last_name} />
          <FormField label="Correo electrónico (opcional)" type="email" registration={form.register("email")} error={form.formState.errors.email} />
          <FormField label="Fecha de nacimiento" type="date" registration={form.register("birth_date")} error={form.formState.errors.birth_date} />
          <div className="md:col-span-2">
            <FormField
              label="CURP"
              registration={form.register("curp", {
                minLength: { value: 18, message: "CURP debe tener 18 caracteres." },
                maxLength: { value: 18, message: "CURP debe tener 18 caracteres." },
              })}
              error={form.formState.errors.curp}
            />
          </div>
          <div className="flex justify-end gap-2 md:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" icon={<UserPlus className="h-4 w-4" />}>Guardar paciente</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
