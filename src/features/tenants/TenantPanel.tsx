import { Building2, Copy } from "lucide-react";

import { Button, Card, FormField } from "../../components/ui";
import { useAppForm } from "../../hooks";
import type { Tenant } from "../../types";

type TenantPanelProps = {
  tenant: Tenant | null;
  onCreate: (payload: { name: string; legal_name?: string | null }) => Promise<void>;
  onTenantIdChange: (tenantId: string) => void;
  selectedTenantId: string;
};

type TenantForm = {
  name: string;
  legal_name: string;
};

export function TenantPanel({ tenant, onCreate, onTenantIdChange, selectedTenantId }: TenantPanelProps) {
  const form = useAppForm<TenantForm>({
    defaultValues: { name: "Clinica Demo", legal_name: "Clinica Demo S.A. de C.V." },
  });

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Clinica o consultorio</h2>
          <p className="text-sm text-muted">Crea el espacio de trabajo donde viviran pacientes y expedientes.</p>
        </div>
        <Building2 className="h-5 w-5 text-brand-600" />
      </div>

      <form
        className="grid gap-3 md:grid-cols-2"
        onSubmit={form.submit(async (values) => {
          try {
            await onCreate({
              name: values.name,
              legal_name: values.legal_name || null,
            });
            form.reset({ name: "", legal_name: "" });
          } catch (error) {
            form.applyServerError(error, "name");
          }
        })}
      >
        <FormField
          label="Nombre comercial"
          registration={form.register("name", { required: "El nombre es obligatorio." })}
          error={form.formState.errors.name}
        />
        <FormField
          label="Razon social"
          registration={form.register("legal_name")}
          error={form.formState.errors.legal_name}
        />
        <div className="md:col-span-2">
          <Button type="submit">Crear tenant</Button>
        </div>
      </form>

      <div className="mt-4 grid gap-2">
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Clinica seleccionada</span>
          <input
            className="field-control"
            value={selectedTenantId}
            onChange={(event) => onTenantIdChange(event.target.value)}
            placeholder="Crea una clinica o pega su identificador"
          />
        </label>
        {tenant ? (
          <div className="flex flex-wrap items-center gap-2 rounded-md bg-brand-50 p-3 text-sm text-brand-700">
            <Copy className="h-4 w-4" />
            <span className="font-semibold">{tenant.name}</span>
            <span className="break-all">{tenant.id}</span>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
