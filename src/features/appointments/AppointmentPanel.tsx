import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { Clock3, Download, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button, Card, FormField, Modal } from "../../components/ui";
import { useAppForm } from "../../hooks";
import type { Appointment, DoctorAvailability, Patient, StaffMember } from "../../types";

type AppointmentPanelProps = {
  appointments: Appointment[];
  patients: Patient[];
  doctors: StaffMember[];
  userId: string;
  userRole: string;
  onCreate: (payload: Record<string, unknown>) => Promise<void>;
  onReschedule: (appointmentId: string, payload: { starts_at: string; ends_at: string }) => Promise<void>;
  onStatusChange: (appointmentId: string, status: string) => Promise<void>;
  onGetAvailability: (doctorUserId: string) => Promise<DoctorAvailability[]>;
  onSetAvailability: (doctorUserId: string, days: DoctorAvailability[]) => Promise<void>;
};

type AppointmentForm = {
  patient_id: string;
  doctor_user_id: string;
  starts_at: string;
  ends_at: string;
  visit_type: string;
  reason: string;
};

const statusLabels: Record<string, string> = {
  scheduled: "Por confirmar",
  confirmed: "Confirmada",
  checked_in: "Paciente en espera",
  in_consultation: "En consulta",
  completed: "Terminada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};

const weekdays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function toLocalInput(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export function AppointmentPanel({ appointments, patients, doctors, userId, userRole, onCreate, onReschedule, onStatusChange, onGetAvailability, onSetAvailability }: AppointmentPanelProps) {
  const canSchedule = ["tenant_admin", "reception", "doctor"].includes(userRole);
  const canConfigureHours = userRole === "tenant_admin" || userRole === "doctor";
  const [actionError, setActionError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [movingAppointment, setMovingAppointment] = useState<Appointment | null>(null);
  const moveForm = useAppForm<{ starts_at: string; ends_at: string }>({ defaultValues: { starts_at: "", ends_at: "" } });
  const [isHoursOpen, setIsHoursOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [scheduleDoctorId, setScheduleDoctorId] = useState(userRole === "doctor" ? userId : "");
  const [activeDays, setActiveDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 639px)").matches);
  const calendarRef = useRef<FullCalendar>(null);
  const form = useAppForm<AppointmentForm>({
    defaultValues: { patient_id: "", doctor_user_id: userRole === "doctor" ? userId : "", starts_at: "", ends_at: "", visit_type: "in_person", reason: "" },
  });

  const events = useMemo(() => appointments.map((item) => ({
    id: item.id,
    title: `${item.patient_name} · ${item.doctor_name}`,
    start: item.starts_at,
    end: item.ends_at,
    backgroundColor: item.status === "cancelled" ? "#94a3b8" : item.status === "completed" ? "#14736c" : "#2563eb",
    borderColor: "transparent",
    extendedProps: { appointment: item },
  })), [appointments]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const updateLayout = () => {
      const mobile = media.matches;
      setIsMobile(mobile);
      const calendar = calendarRef.current?.getApi();
      if (calendar) calendar.changeView(mobile ? "timeGridDay" : "timeGridWeek");
    };
    media.addEventListener("change", updateLayout);
    return () => media.removeEventListener("change", updateLayout);
  }, []);

  const openAt = (date: Date) => {
    const end = new Date(date.getTime() + 30 * 60_000);
    form.reset({ patient_id: "", doctor_user_id: userRole === "doctor" ? userId : "", starts_at: toLocalInput(date), ends_at: toLocalInput(end), visit_type: "in_person", reason: "" });
    setIsCreateOpen(true);
  };

  const openHours = async () => {
    const doctorId = userRole === "doctor" ? userId : scheduleDoctorId;
    if (doctorId) {
      const current = await onGetAvailability(doctorId);
      if (current.length) {
        setActiveDays(current.filter((day) => day.is_active).map((day) => day.weekday));
        setStartTime(current[0].start_time);
        setEndTime(current[0].end_time);
      }
    }
    setIsHoursOpen(true);
  };

  const exportCalendar = () => {
    const formatDate = (value: string) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const eventsText = appointments.filter((item) => item.status !== "cancelled").map((item) => [
      "BEGIN:VEVENT",
      `UID:${item.id}@medical-case-file.local`,
      `DTSTART:${formatDate(item.starts_at)}`,
      `DTEND:${formatDate(item.ends_at)}`,
      "SUMMARY:Consulta médica",
      `DESCRIPTION:Cita clínica. Referencia ${item.id}`,
      "END:VEVENT",
    ].join("\r\n")).join("\r\n");
    const content = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Expediente Clínico//Agenda//ES\r\n${eventsText}\r\nEND:VCALENDAR\r\n`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "agenda-clinica.ics";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-4">
      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="section-title">Agenda de citas</h2>
            <p className="text-sm text-muted">Consulta horarios y organiza la atención de la clínica.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 sm:flex sm:flex-wrap sm:justify-end">
            <Button type="button" variant="secondary" icon={<Download className="h-4 w-4" />} onClick={exportCalendar}>Exportar</Button>
            {canConfigureHours ? <Button type="button" variant="secondary" icon={<Clock3 className="h-4 w-4" />} onClick={openHours}>Horarios</Button> : null}
            {canSchedule ? <Button type="button" icon={<Plus className="h-4 w-4" />} onClick={() => openAt(new Date())}>Nueva cita</Button> : null}
          </div>
        </div>
        <div className="clinical-calendar min-w-0 overflow-hidden">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            locale={esLocale}
            initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
            headerToolbar={isMobile
              ? { left: "prev,next", center: "title", right: "today" }
              : { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
            buttonText={{ today: "Hoy", month: "Mes", week: "Semana", day: "Día" }}
            events={events}
            selectable={canSchedule}
            select={(selection) => openAt(selection.start)}
            dateClick={(selection) => canSchedule && openAt(selection.date)}
            eventClick={(selection) => setSelectedAppointment(selection.event.extendedProps.appointment as Appointment)}
            nowIndicator
            allDaySlot={false}
            slotMinTime="07:00:00"
            slotMaxTime="21:00:00"
            height="auto"
          />
        </div>
      </Card>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nueva cita" description="Selecciona paciente, médico y horario.">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={form.submit(async (values) => {
          try {
            await onCreate({ ...values, starts_at: new Date(values.starts_at).toISOString(), ends_at: new Date(values.ends_at).toISOString(), reason: values.reason || null, internal_notes: null });
            setIsCreateOpen(false);
          } catch (error) {
            form.applyServerError(error, "starts_at");
          }
        })}>
          <FormField label="Paciente" as="select" registration={form.register("patient_id", { required: "Selecciona un paciente." })} error={form.formState.errors.patient_id}>
            <option value="">Seleccionar</option>
            {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.first_name} {patient.last_name}</option>)}
          </FormField>
          <FormField label="Médico" as="select" registration={form.register("doctor_user_id", { required: "Selecciona un médico." })} error={form.formState.errors.doctor_user_id}>
            <option value="">Seleccionar</option>
            {doctors.filter((doctor) => userRole !== "doctor" || doctor.user_id === userId).map((doctor) => <option key={doctor.user_id} value={doctor.user_id}>{doctor.full_name}</option>)}
          </FormField>
          <FormField label="Inicio" type="datetime-local" registration={form.register("starts_at", { required: "Selecciona la hora de inicio." })} error={form.formState.errors.starts_at} />
          <FormField label="Término" type="datetime-local" registration={form.register("ends_at", { required: "Selecciona la hora de término." })} error={form.formState.errors.ends_at} />
          <FormField label="Modalidad" as="select" registration={form.register("visit_type")}>
            <option value="in_person">Presencial</option><option value="phone">Llamada</option><option value="video">Videollamada</option>
          </FormField>
          <FormField label="Motivo breve (opcional)" registration={form.register("reason")} error={form.formState.errors.reason} />
          <div className="grid grid-cols-2 gap-2 sm:col-span-2 sm:flex sm:justify-end"><Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</Button><Button type="submit">Guardar cita</Button></div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(selectedAppointment)} onClose={() => setSelectedAppointment(null)} title="Detalle de la cita">
        {actionError ? <p role="alert" className="mb-3 text-sm text-red-700">{actionError}</p> : null}
        {selectedAppointment ? <div className="grid gap-3">
          <div className="rounded-lg bg-slate-50 p-4"><p className="font-semibold text-ink">{selectedAppointment.patient_name}</p><p className="text-sm text-muted">{selectedAppointment.doctor_name}</p><p className="mt-2 text-sm text-ink">{new Date(selectedAppointment.starts_at).toLocaleString("es-MX")}</p><p className="text-sm text-muted">{statusLabels[selectedAppointment.status] ?? selectedAppointment.status}</p></div>
          {canSchedule && ["scheduled", "confirmed", "checked_in", "in_consultation"].includes(selectedAppointment.status) ? <Button type="button" onClick={() => {
            moveForm.reset({ starts_at: toLocalInput(new Date(selectedAppointment.starts_at)), ends_at: toLocalInput(new Date(selectedAppointment.ends_at)) });
            setMovingAppointment(selectedAppointment);
            setSelectedAppointment(null);
          }}>Reprogramar cita</Button> : null}
          <label className="grid gap-1.5"><span className="field-label">Actualizar estado</span><select className="field-control" value={selectedAppointment.status} onChange={async (event) => { const nextStatus = event.target.value; setActionError(""); try { await onStatusChange(selectedAppointment.id, nextStatus); setSelectedAppointment({ ...selectedAppointment, status: nextStatus }); } catch (error) { setActionError(error instanceof Error ? error.message : "No se pudo cambiar la cita."); } }}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div> : null}
      </Modal>

      <Modal isOpen={Boolean(movingAppointment)} onClose={() => setMovingAppointment(null)} title="Reprogramar cita" description="Elige la nueva fecha y horario.">
        <form className="grid gap-3" onSubmit={moveForm.submit(async (values) => {
          if (!movingAppointment) return;
          try {
            await onReschedule(movingAppointment.id, { starts_at: new Date(values.starts_at).toISOString(), ends_at: new Date(values.ends_at).toISOString() });
            setMovingAppointment(null);
          } catch (error) { moveForm.applyServerError(error, "starts_at"); }
        })}>
          <p className="text-sm text-muted">{movingAppointment?.patient_name}</p>
          <FormField label="Inicio" type="datetime-local" registration={moveForm.register("starts_at", { required: "Selecciona la hora de inicio." })} error={moveForm.formState.errors.starts_at} />
          <FormField label="Término" type="datetime-local" registration={moveForm.register("ends_at", { required: "Selecciona la hora de término." })} error={moveForm.formState.errors.ends_at} />
          <Button type="submit">Guardar nuevo horario</Button>
        </form>
      </Modal>

      <Modal isOpen={isHoursOpen} onClose={() => setIsHoursOpen(false)} title="Horario de atención" description="Define los días en los que el médico acepta citas.">
        {actionError ? <p role="alert" className="mb-3 text-sm text-red-700">{actionError}</p> : null}
        <div className="grid gap-4">
          {userRole !== "doctor" ? <label className="grid gap-1.5"><span className="field-label">Médico</span><select className="field-control" value={scheduleDoctorId} onChange={(event) => setScheduleDoctorId(event.target.value)}><option value="">Seleccionar</option>{doctors.filter((doctor) => userRole !== "doctor" || doctor.user_id === userId).map((doctor) => <option key={doctor.user_id} value={doctor.user_id}>{doctor.full_name}</option>)}</select></label> : null}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{weekdays.map((day, index) => <label key={day} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"><input type="checkbox" checked={activeDays.includes(index)} onChange={() => setActiveDays((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])} /> {day}</label>)}</div>
          <div className="grid grid-cols-2 gap-3"><label className="grid gap-1.5"><span className="field-label">Desde</span><input className="field-control" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label><label className="grid gap-1.5"><span className="field-label">Hasta</span><input className="field-control" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label></div>
          <Button type="button" disabled={!(userRole === "doctor" ? userId : scheduleDoctorId)} onClick={async () => { const doctorId = userRole === "doctor" ? userId : scheduleDoctorId; setActionError(""); try { await onSetAvailability(doctorId, activeDays.map((weekday) => ({ weekday, start_time: startTime, end_time: endTime, is_active: true }))); setIsHoursOpen(false); } catch (error) { setActionError(error instanceof Error ? error.message : "No se pudo cambiar el horario."); } }}>Guardar horario</Button>
        </div>
      </Modal>
    </div>
  );
}
