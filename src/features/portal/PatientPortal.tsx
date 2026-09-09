import { CalendarDays, Clock3, LogOut, Pill, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { Button, Card, GlobalLoader } from "../../components/ui";
import { api } from "../../lib";
import type { PortalAppointment, PortalMedication, PortalProfile } from "../../types";

const statusLabels: Record<string, string> = {
  scheduled: "Por confirmar", confirmed: "Confirmada", checked_in: "En espera", in_consultation: "En consulta", completed: "Terminada", cancelled: "Cancelada", no_show: "No asistió",
};

export function PatientPortal() {
  const params = new URLSearchParams(window.location.search);
  const invitationToken = params.get("invite") ?? "";
  const clinicId = params.get("clinic") ?? "";
  const [token, setToken] = useState(() => sessionStorage.getItem("patient_portal_token") ?? "");
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [appointments, setAppointments] = useState<PortalAppointment[]>([]);
  const [medications, setMedications] = useState<PortalMedication[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([api.getPortalProfile(token), api.getPortalAppointments(token), api.getPortalMedications(token)])
      .then(([profileResult, appointmentResult, medicationResult]) => {
        setProfile(profileResult.data);
        setAppointments(appointmentResult.data);
        setMedications(medicationResult.data);
      })
      .catch((requestError: Error) => {
        setError(requestError.message);
        sessionStorage.removeItem("patient_portal_token");
        setToken("");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const saveToken = (value: string) => {
    sessionStorage.setItem("patient_portal_token", value);
    setToken(value);
  };

  const acceptInvitation = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) { setError("Las contraseñas no coinciden."); return; }
    setLoading(true); setError("");
    try {
      const result = await api.acceptPatientInvitation(invitationToken, password);
      window.history.replaceState({}, "", `/?portal=1&clinic=${encodeURIComponent(clinicId)}`);
      saveToken(result.data.access_token);
    } catch (requestError) { setError((requestError as Error).message); }
    finally { setLoading(false); }
  };

  const login = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError("");
    try { const result = await api.patientPortalLogin(clinicId, email, password); saveToken(result.data.access_token); }
    catch (requestError) { setError((requestError as Error).message); }
    finally { setLoading(false); }
  };

  if (!token) {
    return <main className="min-h-screen bg-surface px-4 py-8 sm:grid sm:place-items-center">
      <GlobalLoader active={loading} />
      <Card className="mx-auto w-full max-w-md">
        <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Portal del paciente</p><h1 className="mt-1 text-2xl font-bold text-ink">Tu información de salud</h1><p className="mt-2 text-sm text-muted">Consulta citas y tratamientos compartidos por tu clínica.</p></div>
        <form className="grid gap-3" onSubmit={invitationToken ? acceptInvitation : login}>
          {!invitationToken ? <label className="grid gap-1.5"><span className="field-label">Correo electrónico</span><input className="field-control" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label> : <div className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700"><ShieldCheck className="mb-2 h-5 w-5" /><p className="font-semibold">Invitación verificada</p><p>Crea una contraseña para activar tu acceso opcional.</p></div>}
          <label className="grid gap-1.5"><span className="field-label">Contraseña</span><input className="field-control" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label>
          {invitationToken ? <label className="grid gap-1.5"><span className="field-label">Confirmar contraseña</span><input className="field-control" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required /></label> : null}
          {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          <Button type="submit">{invitationToken ? "Activar mi cuenta" : "Entrar"}</Button>
        </form>
        <p className="mt-4 text-xs text-muted">No necesitas una cuenta para recibir atención. Este acceso es opcional.</p>
      </Card>
    </main>;
  }

  return <div className="min-h-screen bg-surface">
    <GlobalLoader active={loading} />
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6"><div><p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{profile?.clinic_name ?? "Portal del paciente"}</p><h1 className="text-xl font-bold text-ink">Hola, {profile?.full_name ?? "paciente"}</h1></div><Button variant="ghost" icon={<LogOut className="h-4 w-4" />} onClick={() => { sessionStorage.removeItem("patient_portal_token"); setToken(""); }}>Salir</Button></div></header>
    <main className="mx-auto grid max-w-5xl gap-4 px-4 py-5 sm:px-6">
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Card><div className="mb-4 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-brand-600" /><h2 className="section-title">Mis citas</h2></div>{appointments.length ? <div className="grid gap-3 sm:grid-cols-2">{appointments.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-4"><p className="font-semibold text-ink">{new Date(item.starts_at).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}</p><p className="mt-1 inline-flex items-center gap-2 text-sm text-muted"><Clock3 className="h-4 w-4" />{new Date(item.starts_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</p><p className="mt-2 text-sm text-ink">{item.doctor_name}</p><span className="mt-2 inline-block rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">{statusLabels[item.status] ?? item.status}</span></article>)}</div> : <p className="text-sm text-muted">No tienes citas registradas.</p>}</Card>
      <Card><div className="mb-4 flex items-center gap-2"><Pill className="h-5 w-5 text-brand-600" /><h2 className="section-title">Mis medicamentos</h2></div>{medications.length ? <div className="grid gap-3">{medications.map((item) => <article key={item.medication_id} className="rounded-xl border border-slate-200 p-4"><p className="font-semibold text-ink">{item.medication_name ?? item.medication}</p>{item.dose ? <p className="text-sm text-muted">{item.dose}</p> : null}{item.schedule_times.length ? <div className="mt-3 flex flex-wrap gap-2">{item.schedule_times.map((time) => <span key={time} className="rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">{time}</span>)}</div> : null}<p className="mt-3 text-sm text-ink">{item.indications}</p><p className="mt-2 text-xs text-muted">Indicado por {item.prescribed_by}</p></article>)}</div> : <p className="text-sm text-muted">No tienes tratamientos compartidos.</p>}</Card>
    </main>
  </div>;
}
