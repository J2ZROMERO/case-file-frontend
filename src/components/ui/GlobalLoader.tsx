import { Loader2 } from "lucide-react";

type GlobalLoaderProps = {
  active: boolean;
};

export function GlobalLoader({ active }: GlobalLoaderProps) {
  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/35 px-5 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-label="Cargando información"
    >
      <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-xl">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-600" />
        <p className="mt-4 text-base font-semibold text-ink">Estamos cargando tu información</p>
        <p className="mt-1 text-sm text-muted">Espera un momento, por favor.</p>
      </div>
    </div>
  );
}
