import { BadgeCheck, Building2, Plus, Power, ShieldCheck, Stethoscope } from "lucide-react";
import { useState } from "react";

import { Button, Card, EmptyState, FormField, Modal } from "../../components/ui";
import { useAppForm } from "../../hooks";
import type { ManagedClinic, StaffMember } from "../../types";

type StaffPanelProps = {
  staff: StaffMember[];
  currentUserId: string;
  clinicName: string;
  clinicId: string;
  clinics: ManagedClinic[];
  onAssociate: (clinicId: string, userId: string) => Promise<void>;
  onCreate: (payload: Record<string, unknown>) => Promise<void>;
  onStatusChange: (membershipId: string, isActive: boolean) => Promise<void>;
};

type StaffForm = {
  full_name: string;
  email: string;
  password: string;
  role: string;
  professional_license: string;
  specialty: string;
  specialty_license: string;
};

const roleLabels: Record<string, string> = {
  tenant_admin: "Administración",
  doctor: "Médico",
  nurse: "Enfermería",
  reception: "Recepción",
  auditor: "Revisión",
};

export function StaffPanel({ staff, currentUserId, clinicName, clinicId, clinics, onAssociate, onCreate, onStatusChange }: StaffPanelProps) {
  const [assigningPerson, setAssigningPerson] = useState<StaffMember | null>(null);
  const [targetClinicId, setTargetClinicId] = useState("");
  const [statusError, setStatusError] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const targetClinics = clinics.filter((clinic) => clinic.id !== clinicId && clinic.is_active);
  const [isOpen, setIsOpen] = useState(false);
  const form = useAppForm<StaffForm>({
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      role: "doctor",
      professional_license: "",
      specialty: "",
      specialty_license: "",
    },
  });
  const role = form.watch("role");
  const specialty = form.watch("specialty");

  return (
    <Card>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-title">Personal de {clinicName}</h2>
          <p className="text-sm text-muted">Las personas que agregues quedarán asignadas a {clinicName}. Quitar acceso afecta únicamente a esta clínica.</p>
        </div>
        <Button type="button" icon={<Plus className="h-4 w-4" />} onClick={() => setIsOpen(true)}>
          Agregar persona
        </Button>
      </div>

      {statusError ? <p role="alert" className="mb-3 text-sm text-red-700">{statusError}</p> : null}
      {staff.length === 0 ? (
        <EmptyState title="Sin personal" description="Agrega al equipo que trabajará en esta clínica." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="responsive-table w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Persona</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Función</th>
                <th className="px-4 py-3">Datos profesionales</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {staff.map((person) => {
                const isCurrentUser = person.user_id === currentUserId;
                return (
                  <tr key={person.membership_id} className="align-middle hover:bg-slate-50/70">
                    <td data-label="Persona" className="px-4 py-3 font-semibold text-ink">{person.full_name}</td>
                    <td data-label="Correo" className="px-4 py-3 text-muted">{person.email}</td>
                    <td data-label="Función" className="px-4 py-3 text-ink">{roleLabels[person.role] ?? person.role}</td>
                    <td data-label="Datos profesionales" className="px-4 py-3">
                      {person.professional_license ? (
                        <div className="inline-grid gap-1 text-left">
                          <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                            <Stethoscope className="h-4 w-4 text-brand-600" /> Cédula {person.professional_license}
                          </span>
                          {person.specialty ? <span className="text-xs text-muted">{person.specialty} · Cédula {person.specialty_license}</span> : null}
                          <span className="inline-flex items-center gap-1 text-xs text-muted">
                            <BadgeCheck className="h-3.5 w-3.5" /> {person.is_verified ? "Datos verificados" : "Verificación pendiente"}
                          </span>
                        </div>
                      ) : <span className="text-muted">No aplica</span>}
                    </td>
                    <td data-label="Estado" className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${person.is_active ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-muted"}`}>
                        {person.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td data-label="Acciones" className="px-4 py-3 text-right">
                      <div className="staff-actions">
                        {person.is_active ? (
                          <button
                            type="button"
                            className="staff-action staff-action-assign"
                            onClick={() => { setAssigningPerson(person); setTargetClinicId(""); setAssignmentError(""); }}
                          >
                            <Building2 aria-hidden="true" className="h-4 w-4 shrink-0" />
                            <span>Asignar a otra clínica</span>
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={`staff-action ${isCurrentUser ? "staff-action-current" : person.is_active ? "staff-action-remove" : "staff-action-restore"}`}
                          disabled={isCurrentUser}
                          title={isCurrentUser ? "No puedes quitar tu propio acceso." : `Esta acción sólo afecta a ${clinicName}.`}
                          onClick={async () => { setStatusError(""); try { await onStatusChange(person.membership_id, !person.is_active); } catch (error) { setStatusError(error instanceof Error ? error.message : "No se pudo cambiar el acceso."); } }}
                        >
                          {isCurrentUser ? <ShieldCheck aria-hidden="true" className="h-4 w-4 shrink-0" /> : <Power aria-hidden="true" className="h-4 w-4 shrink-0" />}
                          <span>{isCurrentUser ? "Tu acceso actual" : person.is_active ? "Quitar acceso" : "Restaurar acceso"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={Boolean(assigningPerson)} onClose={() => setAssigningPerson(null)} title="Asignar a otra clínica" description={`${assigningPerson?.full_name ?? ""} conservará también su acceso a ${clinicName}.`}>
        <div className="grid gap-3">
          {targetClinics.length ? <label className="grid gap-1.5"><span className="field-label">Clínica destino</span><select className="field-control" value={targetClinicId} onChange={(event) => setTargetClinicId(event.target.value)}><option value="">Seleccionar clínica</option>{targetClinics.map((clinic) => <option key={clinic.id} value={clinic.id}>{clinic.name}</option>)}</select></label> : <p className="text-sm text-muted">No tienes otra clínica disponible bajo tu administración. Puedes crear una desde Clínicas.</p>}
          {assignmentError ? <p role="alert" className="text-sm text-red-700">{assignmentError}</p> : null}
          <Button type="button" disabled={!targetClinicId} onClick={async () => {
            if (!assigningPerson) return;
            try { await onAssociate(targetClinicId, assigningPerson.user_id); setAssigningPerson(null); }
            catch (error) { setAssignmentError(error instanceof Error ? error.message : "No se pudo asignar el acceso."); }
          }}>Asignar personal</Button>
        </div>
      </Modal>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Agregar personal" description={`Se asignará a: ${clinicName}. Para otra clínica, cambia primero la clínica activa.`}>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={form.submit(async (values) => {
          try {
            await onCreate({
              ...values,
              professional_license: role === "doctor" ? values.professional_license : null,
              specialty: role === "doctor" && values.specialty ? values.specialty : null,
              specialty_license: role === "doctor" && values.specialty ? values.specialty_license : null,
            });
            form.reset({ full_name: "", email: "", password: "", role: "doctor", professional_license: "", specialty: "", specialty_license: "" });
            setIsOpen(false);
          } catch (error) {
            form.applyServerError(error, "email");
          }
        })}>
          <FormField label="Nombre completo" registration={form.register("full_name", { required: "Escribe el nombre completo." })} error={form.formState.errors.full_name} />
          <FormField label="Correo electrónico" type="email" registration={form.register("email", { required: "Escribe el correo." })} error={form.formState.errors.email} />
          <FormField label="Contraseña temporal" type="password" registration={form.register("password", { required: "Crea una contraseña temporal.", minLength: { value: 8, message: "Usa al menos 8 caracteres." } })} error={form.formState.errors.password} />
          <FormField label="Función" as="select" registration={form.register("role")}>
            <option value="doctor">Médico</option>
            <option value="nurse">Enfermería</option>
            <option value="reception">Recepción</option>
            <option value="tenant_admin">Administración</option>
            <option value="auditor">Revisión</option>
          </FormField>
          {role === "doctor" ? (
            <>
              <FormField label="Cédula profesional" registration={form.register("professional_license", { required: "La cédula es obligatoria para médicos." })} error={form.formState.errors.professional_license} />
              <FormField label="Especialidad (opcional)" registration={form.register("specialty")} error={form.formState.errors.specialty} />
              {specialty ? <FormField label="Cédula de especialidad" registration={form.register("specialty_license", { required: "Registra la cédula de especialidad." })} error={form.formState.errors.specialty_license} /> : null}
            </>
          ) : null}
          <div className="grid grid-cols-2 gap-2 sm:col-span-2 sm:flex sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit">Crear cuenta</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
