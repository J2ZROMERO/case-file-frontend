import { ClipboardList, UserRound, Clock3 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Card, EmptyState } from "../../components/ui";
import { formatDateTime } from "../../lib";
import type { AuditEvent } from "../../types";

type AuditPanelProps = { events: AuditEvent[]; loading: boolean; error: string | null; tenantId: string; onRefresh: () => Promise<void> };

const actionLabels: Record<string, string> = {
  "patient.created": "Paciente registrado", "patient.updated": "Paciente actualizado", "patient.read": "Ficha de paciente consultada",
  "staff.created": "Personal agregado", "staff.associated": "Personal asignado a la clínica", "staff.activated": "Acceso del personal restaurado", "staff.deactivated": "Acceso del personal retirado",
  "doctor.availability_changed": "Horario de atención actualizado", "patient.referred": "Paciente referido a otra clínica",
  "clinic.created": "Clínica creada", "appointment.created": "Cita agendada", "appointment.rescheduled": "Cita reprogramada",
  "appointment.scheduled": "Cita por confirmar", "appointment.confirmed": "Cita confirmada", "appointment.checked_in": "Paciente en espera", "appointment.in_consultation": "Consulta iniciada", "appointment.completed": "Consulta terminada", "appointment.cancelled": "Cita cancelada", "appointment.no_show": "Inasistencia registrada",
  "medical_record.created": "Expediente creado", "medical_record.doctor_assigned": "Médico asignado al expediente",
  "clinical_note.signed": "Nota clínica firmada", "consent.signed": "Consentimiento firmado", "prescription.signed": "Receta firmada",
};

const roles: Record<string, string> = { tenant_admin: "Administración", doctor: "Médico", reception: "Recepción", nurse: "Enfermería", auditor: "Revisión" };
const statuses: Record<string, string> = { scheduled: "Por confirmar", confirmed: "Confirmada", checked_in: "En espera", in_consultation: "En consulta", completed: "Terminada", cancelled: "Cancelada", no_show: "No asistió" };
const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
function timestamp(value: string) {
  return /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
}
function showValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Sin registrar";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "string") return statuses[value] ?? value;
  if (Array.isArray(value)) return value.length ? value.map(showValue).join("; ") : "Sin horario configurado";
  if (typeof value === "object") {
    const item = value as Record<string, unknown>;
    if (typeof item.starts_at === "string" && typeof item.ends_at === "string") return `${formatDateTime(timestamp(item.starts_at))} — ${formatDateTime(timestamp(item.ends_at))}`;
    if (typeof item.weekday === "number") return `${days[item.weekday]}: ${item.start_time}–${item.end_time}${item.is_active === false ? " (inactivo)" : ""}`;
    return Object.values(item).map(showValue).join(" · ");
  }
  return String(value);
}

export function AuditPanel({ events, tenantId, onRefresh, loading, error }: AuditPanelProps) {
  const [search, setSearch] = useState("");
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const actors = useMemo(() => Array.from(new Map(events.map((event) => [event.actor_id, event.details?.actor_name ?? `Usuario ${event.actor_id}`])).entries()), [events]);
  const actions = useMemo(() => Array.from(new Set(events.map((event) => event.action))).sort(), [events]);
  const filtered = events.filter((event) => {
    const details = event.details;
    const text = [details?.actor_name, details?.subject_name, details?.clinic_name, details?.doctor_name, details?.reason, details?.source_clinic, details?.target_clinic, actionLabels[event.action], event.resource_id].join(" ").toLocaleLowerCase("es-MX");
    const date = new Date(timestamp(event.occurred_at));
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return text.includes(search.trim().toLocaleLowerCase("es-MX")) && (!actor || event.actor_id === actor) && (!action || event.action === action) && (!from || day >= from) && (!to || day <= to);
  });
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><h2 className="section-title">Actividad de la clínica</h2><p className="text-sm text-muted">Quién hizo el cambio, a quién afectó y por qué.</p></div>
        <Button type="button" variant="secondary" icon={<ClipboardList className="h-4 w-4" />} onClick={onRefresh} disabled={!tenantId || loading}>Actualizar</Button>
      </div>
      <div className="mb-5 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="grid gap-1"><span className="field-label">Buscar persona, clínica o motivo</span><input className="field-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ej. Ana López" /></label>
        <label className="grid gap-1"><span className="field-label">Responsable</span><select className="field-control" value={actor} onChange={(event) => setActor(event.target.value)}><option value="">Todos</option>{actors.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        <label className="grid gap-1"><span className="field-label">Acción</span><select className="field-control" value={action} onChange={(event) => setAction(event.target.value)}><option value="">Todas</option>{actions.map((item) => <option key={item} value={item}>{actionLabels[item] ?? item}</option>)}</select></label>
        <label className="grid gap-1"><span className="field-label">Desde</span><input className="field-control" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
        <label className="grid gap-1"><span className="field-label">Hasta</span><input className="field-control" type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} /></label>
        <Button type="button" variant="ghost" onClick={() => { setSearch(""); setActor(""); setAction(""); setFrom(""); setTo(""); }}>Limpiar filtros</Button>
      </div>
      {loading ? <p role="status" className="p-4 text-sm text-muted">Cargando actividad...</p> : error ? <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p> : !filtered.length ? <EmptyState title={events.length ? "Sin coincidencias" : "Sin actividad"} description={events.length ? "Ajusta los filtros para ver otros movimientos." : "Los nuevos movimientos de esta clínica aparecerán aquí."} /> : (
        <div className="grid gap-3">
          <p className="text-xs text-muted">{filtered.length} movimientos</p>
          {filtered.map((event) => {
            const d = event.details;
            return <article key={event.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <p className="flex items-center gap-2 text-ink"><UserRound aria-hidden="true" className="h-4 w-4 text-brand-700" /><strong>{d?.actor_name ?? "Responsable no detallado"}</strong><span className="text-muted">{d?.actor_role ? `· ${roles[d.actor_role] ?? d.actor_role}` : ""}</span></p>
                <p className="flex items-center gap-1.5 text-xs text-muted"><Clock3 aria-hidden="true" className="h-3.5 w-3.5" /><time dateTime={timestamp(event.occurred_at)}>{formatDateTime(timestamp(event.occurred_at))}</time></p>
              </div>
              <p className="mt-3 text-ink"><strong>{actionLabels[event.action] ?? event.action}</strong>{d?.subject_name ? <> · <strong>{d.subject_name}</strong></> : null}{d?.clinic_name ? <> en <strong>{d.clinic_name}</strong></> : null}.</p>
              {d?.doctor_name ? <p className="mt-1 text-muted">Médico: {d.doctor_name}</p> : null}
              {d?.changes?.length ? <div className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3">{d.changes.map((change, index) => <div key={index}><p className="text-xs font-semibold text-muted">{change.field}</p><p className="mt-1 break-words text-ink"><span className="text-muted">{showValue(change.before)}</span><span aria-label="cambió a" className="mx-2 text-brand-700">→</span><span className="font-medium">{showValue(change.after)}</span></p></div>)}</div> : null}
              {d?.reason ? <p className="mt-3 break-words text-ink"><strong>Motivo:</strong> {d.reason}</p> : null}
              {d?.remaining_clinics?.length ? <p className="mt-2 text-muted">Conserva acceso a: {d.remaining_clinics.join(", ")}.</p> : null}
              {!d ? <p className="mt-2 text-xs text-muted">Evento anterior a la bitácora detallada. No se registraron nombres, valores anteriores ni motivo.</p> : null}
              <details className="mt-3 border-t border-slate-100 pt-3">
                <summary className="w-fit cursor-pointer font-semibold text-brand-700">Ver detalles</summary>
                <dl className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2">
                  {d?.comment ? <div className="sm:col-span-2"><dt className="font-semibold">Comentario adicional</dt><dd className="mt-1 whitespace-pre-wrap break-words">{d.comment}</dd></div> : null}
                  <div><dt>Referencia del movimiento</dt><dd className="break-all">{event.id}</dd></div>
                  <div><dt>Responsable · identificador</dt><dd className="break-all">{event.actor_id}</dd></div>
                  <div><dt>Registro afectado · identificador</dt><dd className="break-all">{event.resource_id}</dd></div>
                  <div><dt>Clínica · identificador</dt><dd className="break-all">{event.tenant_id}</dd></div>
                </dl>
              </details>
            </article>;
          })}
        </div>
      )}
    </Card>
  );
}
