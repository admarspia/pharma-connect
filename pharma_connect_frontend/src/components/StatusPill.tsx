import { ReservationStatus } from "@/lib/types";

const STYLES: Record<ReservationStatus, string> = {
  PENDING: "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-400/40",
  ACCEPTED: "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-300/50",
  REJECTED: "bg-clay-500/10 text-clay-600 ring-1 ring-inset ring-clay-500/30",
  CANCELLED: "bg-ink/5 text-ink/50 ring-1 ring-inset ring-ink/10",
  EXPIRED: "bg-ink/5 text-ink/40 ring-1 ring-inset ring-ink/10",
  COMPLETED: "bg-sage-500/10 text-sage-600 ring-1 ring-inset ring-sage-500/30",
};

const LABELS: Record<ReservationStatus, string> = {
  PENDING: "Awaiting pharmacy",
  ACCEPTED: "Ready for pickup",
  REJECTED: "Declined",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  COMPLETED: "Picked up",
};

export function StatusPill({ status }: { status: ReservationStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
