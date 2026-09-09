import { useMemo, useState } from "react";
import { Plus, RefreshCw, Search, UserPlus, X } from "lucide-react";

import { Button, Card, EmptyState, FormField } from "../../components/ui";
import { useAppForm } from "../../hooks";
import type { Patient } from "../../types";

type PatientPanelProps = {
  tenantId: string;
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  onCreate: (payload: Record<string, unknown>) => Promise<void>;
  onRefresh: () => Promise<void>;
};

type PatientForm = {
  first_name: string;
  last_name: string;
  email: string;
  birth_date: string;
  curp: string;
};

export function PatientPanel({
  tenantId,
  patients,
  selectedPatientId,
  onSelectPatient,
  onCreate,
  onRefresh,
}: PatientPanelProps) {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const form = useAppForm<PatientForm>({
    defaultValues: {
      first_name: "Ana",
      last_name: "Lopez",
      email: "ana.lopez@example.com",
      birth_date: "1990-01-01",
      curp: "LOPA900101MDFXXX01",
    },
  });

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-MX");
    if (!term) return patients;

    return patients.filter((patient) =>
      [patient.first_name, patient.last_name, patient.email, patient.curp ?? ""]
        .join(" ")
        .toLocaleLowerCase("es-MX")
        .includes(term),
    );
  }, [patients, search]);

  return (
    <Card>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-title">Pacientes</h2>
          <p className="text-sm text-muted">Consulta y selecciona los pacientes disponibles.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={onRefresh}
            disabled={!tenantId}
          >
            Actualizar
          </Button>
          <Button
            type="button"
            icon={isCreateOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            onClick={() => setIsCreateOpen((current) => !current)}
            disabled={!tenantId}
            aria-expanded={isCreateOpen}
          >
            {isCreateOpen ? "Cerrar formulario" : "Agregar paciente"}
          </Button>
        </div>
      </div>

      {isCreateOpen && (
        <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4">
            <h3 className="font-semibold text-ink">Nuevo paciente</h3>
            <p className="text-sm text-muted">Captura los datos para agregarlo a la lista.</p>
          </div>
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={form.submit(async (values) => {
              try {
                await onCreate({
                  ...values,
                  birth_date: values.birth_date || null,
                  curp: values.curp || null,
                });
                form.reset({
                  first_name: "",
                  last_name: "",
                  email: "",
                  birth_date: "",
                  curp: "",
                });
                setIsCreateOpen(false);
              } catch (error) {
                form.applyServerError(error, "email");
              }
            })}
          >
            <FormField
              label="Nombre"
              registration={form.register("first_name", { required: "Nombre obligatorio." })}
              error={form.formState.errors.first_name}
            />
            <FormField
              label="Apellidos"
              registration={form.register("last_name", { required: "Apellidos obligatorios." })}
              error={form.formState.errors.last_name}
            />
            <FormField
              label="Correo electrónico (opcional)"
              type="email"
              registration={form.register("email")}
              error={form.formState.errors.email}
            />
            <FormField
              label="Fecha de nacimiento"
              type="date"
              registration={form.register("birth_date")}
              error={form.formState.errors.birth_date}
            />
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
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" icon={<UserPlus className="h-4 w-4" />} disabled={!tenantId}>
                Guardar paciente
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-md">
          <span className="sr-only">Buscar pacientes</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, correo o CURP"
            className="field-control pl-9"
          />
        </label>
        <p className="text-sm text-muted">
          {filteredPatients.length} de {patients.length} pacientes
        </p>
      </div>

      {patients.length === 0 ? (
        <EmptyState title="Sin pacientes" description="Agrega un paciente para comenzar su expediente." />
      ) : filteredPatients.length === 0 ? (
        <EmptyState title="Sin resultados" description="No hay pacientes que coincidan con tu busqueda." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Paciente</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Correo electrónico</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Fecha de nacimiento</th>
                  <th scope="col" className="px-4 py-3 font-semibold">CURP</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPatients.map((patient) => {
                  const isSelected = selectedPatientId === patient.id;
                  return (
                    <tr key={patient.id} className={isSelected ? "bg-brand-50" : "hover:bg-slate-50"}>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">
                        {patient.first_name} {patient.last_name}
                      </td>
                      <td className="px-4 py-3 text-muted">{patient.email || "Sin correo"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">
                        {patient.birth_date || "No registrada"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
                        {patient.curp || "No registrada"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant={isSelected ? "primary" : "secondary"}
                          onClick={() => onSelectPatient(patient.id)}
                        >
                          {isSelected ? "Seleccionado" : "Seleccionar"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}
