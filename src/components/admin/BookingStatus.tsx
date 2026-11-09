import type { BookingStatus } from "@/generated/prisma/enums";

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "À valider",
  CONFIRMED: "Confirmé",
  CANCELLED: "Annulé",
  COMPLETED: "Terminé",
  NO_SHOW: "Absent",
};

const TONES: Record<BookingStatus, string> = {
  PENDING: "border-ember/60 text-ember",
  CONFIRMED: "border-gold/60 text-gold",
  CANCELLED: "border-bone/20 text-bone-dim line-through",
  COMPLETED: "border-bone/20 text-bone-dim",
  NO_SHOW: "border-bone/20 text-bone-dim",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${TONES[status]}`}>{BOOKING_STATUS_LABELS[status]}</span>
  );
}
