import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";

export type ChangeReason = { change_reason: string; change_comment: string | null };
type Request = { title: string; summary: string; changes?: string[] };

export function useActionReason() {
  const [request, setRequest] = useState<Request | null>(null);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const resolveRef = useRef<((value: ChangeReason | null) => void) | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const close = (value: ChangeReason | null) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setRequest(null);
    previousFocus.current?.focus();
  };
  useEffect(() => {
    if (!request) return;
    dialogRef.current?.querySelector<HTMLElement>("textarea")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.stopImmediatePropagation(); close(null); }
      if (event.key === "Tab") {
        const elements = dialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), textarea");
        if (!elements?.length) return;
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [request]);
  useEffect(() => () => resolveRef.current?.(null), []);

  const requestReason = (next: Request): Promise<ChangeReason | null> => {
    resolveRef.current?.(null);
    previousFocus.current = document.activeElement as HTMLElement | null;
    setReason(""); setComment(""); setRequest(next);
    return new Promise((resolve) => { resolveRef.current = resolve; });
  };

  const reasonDialog = request ? (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4">
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="action-reason-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <h2 id="action-reason-title" className="text-lg font-semibold text-ink">{request.title}</h2>
        <p className="mt-2 text-sm text-muted">{request.summary}</p>
        {request.changes?.length ? <ul className="my-4 grid gap-2 rounded-lg bg-slate-50 p-3 text-sm text-ink">{request.changes.map((change, i) => <li key={i}>{change}</li>)}</ul> : null}
        <form className="mt-4 grid gap-4" onSubmit={(event) => { event.preventDefault(); if (reason.trim().length >= 5) close({ change_reason: reason.trim(), change_comment: comment.trim() || null }); }}>
          <label className="grid gap-1.5"><span className="field-label">Motivo del cambio <span className="text-red-700">*</span></span><textarea className="field-control min-h-24" required minLength={5} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ej. Solicitud del paciente por cambio de disponibilidad." /></label>
          <label className="grid gap-1.5"><span className="field-label">Comentario adicional (opcional)</span><textarea className="field-control min-h-20" maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} /></label>
          <p className="text-xs text-muted">El cambio quedará registrado con tu nombre, rol, fecha y motivo.</p>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => close(null)}>Cancelar</Button><Button type="submit" disabled={reason.trim().length < 5}>Confirmar cambio</Button></div>
        </form>
      </section>
    </div>
  ) : null;
  return { requestReason, reasonDialog };
}
