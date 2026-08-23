import { ClipboardList } from "lucide-react";

import { Button, Card, EmptyState } from "../../components/ui";
import { formatDateTime } from "../../lib";
import type { AuditEvent } from "../../types";

type AuditPanelProps = {
  events: AuditEvent[];
  tenantId: string;
  onRefresh: () => Promise<void>;
};

export function AuditPanel({ events, tenantId, onRefresh }: AuditPanelProps) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Auditoria</h2>
          <p className="text-sm text-muted">Bitacora de operaciones clinicas y lectura de paciente.</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          icon={<ClipboardList className="h-4 w-4" />}
          onClick={onRefresh}
          disabled={!tenantId}
        >
          Refrescar
        </Button>
      </div>

      <div className="grid gap-2">
        {events.length === 0 ? (
          <EmptyState title="Sin eventos" description="Crea pacientes, expedientes o notas para generar auditoria." />
        ) : (
          events.map((event) => (
            <div key={event.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-semibold text-ink">{event.action}</span>
                <span className="text-xs text-muted">{formatDateTime(event.occurred_at)}</span>
              </div>
              <p className="mt-1 break-all text-muted">
                {event.resource_type}: {event.resource_id}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

