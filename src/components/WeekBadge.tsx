import type { WeekType } from "@/lib/types";

export function WeekBadge({
  type,
  className = "",
}: {
  type: WeekType;
  className?: string;
}) {
  return (
    <span className={`badge ${type === "A" ? "badge-a" : "badge-b"} ${className}`}>
      Semaine {type}
    </span>
  );
}

export function CustomBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`badge badge-custom ${className}`} title="Journée modifiée">
      Modifié
    </span>
  );
}
