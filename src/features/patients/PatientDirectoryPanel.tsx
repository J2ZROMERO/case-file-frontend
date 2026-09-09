import { useMemo, useState } from "react";
import { Link2, Pencil, Plus, RefreshCw, Search } from "lucide-react";

import { Button, Card, EmptyState, FormField, Modal } from "../../components/ui";
import { useAppForm } from "../../hooks";
import type { Patient } from "../../types";

type PatientDirectoryPanelProps = {
  patients: Patient[];
  onCreate: (payload: Record<string, unknown>) => Promise<void>;
  canCreate: boolean;
  onRefresh: () => Promise<void>;
  onUpdate: (patientId: string, payload: Record<string, unknown>) => Promise<void>;
  canInvite: boolean;
  onInvite: (patientId: string) => Promise<string>;
};

type PatientForm = {
  first_name: string;
  last_name: string;
  email: string;
  birth_date: string;
  curp: string;
};

export function PatientPanel({ patients, onCreate, canCreate, onRefresh, onUpdate, canInvite, onInvite }: PatientDirectoryPanelProps) {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [invitationLink, setInvitationLink] = useState("");
  const form = useAppForm<PatientForm>({
    defaultValues: { first_name: "", last_name: "", email: "", birth_date: "", curp: "" },
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

  const openEditModal = (patient: Patient) => {
    form.reset({
      first_name: patient.first_name,
      last_name: patient.last_name,
      email: patient.email ?? "",
      birth_date: patient.birth_date ?? "",
      curp: patient.curp ?? "",
    });
    setEditingPatient(patient);
  };

  const openCreateModal = () => {
    form.reset({ first_name: "", last_name: "", email: "", birth_date: "", curp: "" });
    setEditingPatient(null);
    setIsCreateOpen(true);
  };

  const closeModal = () => {
    setEditingPatient(null);
    setIsCreateOpen(false);
  };

  return (
    <Card>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-title">Pacientes</h2>
          <p className="text-sm text-muted">Busca, agrega o corrige los datos de tus pacientes.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button type="button" variant="secondary" icon={<RefreshCw className="h-4 w-4" />} onClick={onRefresh}>
            Actualizar
          </Button>
          {canCreate ? (
            <Button type="button" icon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
              Agregar paciente
            </Button>
          ) : null}
        </div>
      </div>

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
        <span className="text-sm text-muted">{filteredPatients.length} de {patients.length} pacientes</span>
      </div>

      {patients.length === 0 ? (
        <EmptyState title="Sin pacientes" description={canCreate ? "Todavia no hay pacientes registrados en esta clinica." : "Todavía no tienes pacientes disponibles."} />
      ) : filteredPatients.length === 0 ? (
        <EmptyState title="Sin resultados" description="No hay pacientes que coincidan con la busqueda." />
      ) : (
        <div className="sm:overflow-hidden sm:rounded-lg sm:border sm:border-slate-200">
          <div>
            <table className="responsive-table min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Paciente</th>
                  <th className="px-4 py-3 font-semibold">Correo electrónico</th>
                  <th className="px-4 py-3 font-semibold">Fecha de nacimiento</th>
                  <th className="px-4 py-3 font-semibold">CURP</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50">
                    <td data-label="Paciente" className="whitespace-nowrap px-4 py-3 font-semibold text-ink">{patient.first_name} {patient.last_name}</td>
                    <td data-label="Correo" className="break-all px-4 py-3 text-muted">{patient.email || "Sin correo"}</td>
                    <td data-label="Nacimiento" className="whitespace-nowrap px-4 py-3 text-muted">{patient.birth_date || "No registrada"}</td>
                    <td data-label="CURP" className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">{patient.curp || "No registrada"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {canInvite ? <Button type="button" variant="secondary" icon={<Link2 className="h-4 w-4" />} onClick={async () => setInvitationLink(await onInvite(patient.id))}>Invitar</Button> : null}
                        <Button type="button" variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={() => openEditModal(patient)}>Editar</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isCreateOpen || Boolean(editingPatient)}
        onClose={closeModal}
        title={editingPatient ? "Editar paciente" : "Agregar paciente"}
        description={editingPatient ? "Corrige los datos necesarios y guarda los cambios." : "Captura los datos del nuevo paciente."}
      >
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={form.submit(async (values) => {
            try {
              const payload = {
                ...values,
                birth_date: values.birth_date || null,
                curp: values.curp || null,
              };
              if (editingPatient) await onUpdate(editingPatient.id, payload);
              else await onCreate(payload);
              closeModal();
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
          <div className="grid grid-cols-2 gap-2 md:col-span-2 sm:flex sm:justify-end">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button type="submit">{editingPatient ? "Guardar cambios" : "Guardar paciente"}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(invitationLink)} onClose={() => setInvitationLink("")} title="Invitación para el paciente" description="La cuenta es opcional. Comparte este enlace sólo con el paciente.">
        <div className="grid gap-3">
          <label className="grid gap-1.5"><span className="field-label">Enlace de acceso</span><input className="field-control" readOnly value={invitationLink} /></label>
          <Button type="button" onClick={async () => navigator.clipboard.writeText(invitationLink)}>Copiar enlace</Button>
          <p className="text-xs text-muted">El enlace vence en 7 días y sólo puede utilizarse una vez.</p>
        </div>
      </Modal>
    </Card>
  );
}
