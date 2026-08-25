import { BadgeCheck, Plus, Power, Stethoscope } from "lucide-react";
import { useState } from "react";

import { Button, Card, EmptyState, FormField, Modal } from "../../components/ui";
import { useAppForm } from "../../hooks";
import type { StaffMember } from "../../types";

type StaffPanelProps = {
  staff: StaffMember[];
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

export function StaffPanel({ staff, onCreate, onStatusChange }: StaffPanelProps) {
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
          <h2 className="section-title">Personal de la clínica</h2>
          <p className="text-sm text-muted">Administra las cuentas y los profesionales que pueden atender consultas.</p>
        </div>
        <Button type="button" icon={<Plus className="h-4 w-4" />} onClick={() => setIsOpen(true)}>
          Agregar persona
        </Button>
      </div>

      {staff.length === 0 ? (
        <EmptyState title="Sin personal" description="Agrega al equipo que trabajará en esta clínica." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {staff.map((person) => (
            <article key={person.membership_id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{person.full_name}</p>
                  <p className="truncate text-sm text-muted">{person.email}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${person.is_active ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-muted"}`}>
                  {person.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-ink">{roleLabels[person.role] ?? person.role}</p>
              {person.professional_license ? (
                <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="inline-flex items-center gap-2 font-semibold text-ink"><Stethoscope className="h-4 w-4 text-brand-600" /> Cédula {person.professional_license}</p>
                  {person.specialty ? <p className="mt-1 text-muted">{person.specialty} · Cédula {person.specialty_license}</p> : null}
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted"><BadgeCheck className="h-3.5 w-3.5" /> {person.is_verified ? "Datos verificados" : "Verificación pendiente"}</p>
                </div>
              ) : null}
              <Button className="mt-3 w-full" type="button" variant="secondary" icon={<Power className="h-4 w-4" />} onClick={() => onStatusChange(person.membership_id, !person.is_active)}>
                {person.is_active ? "Desactivar acceso" : "Activar acceso"}
              </Button>
            </article>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Agregar personal" description="Crea una cuenta afiliada a esta clínica.">
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
