import { Loader2 } from "lucide-react";

type GlobalLoaderProps = {
  active: boolean;
};

export function GlobalLoader({ active }: GlobalLoaderProps) {
  if (!active) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 bg-brand-100">
      <div className="h-full w-1/3 animate-pulse bg-brand-600" />
      <div className="fixed right-4 top-4 rounded-md bg-white px-3 py-2 text-sm shadow-soft">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
          Procesando
        </span>
      </div>
    </div>
  );
}

