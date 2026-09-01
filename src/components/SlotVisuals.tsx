import Link from "next/link";
import type { CSSProperties } from "react";
import { colorHex } from "@/lib/colors";
import { formatDuration } from "@/lib/date";
import type { ResolvedSlot } from "@/lib/types";

export function slotStyle(color: string): CSSProperties {
  return { ["--c"]: colorHex(color) } as CSSProperties;
}

/** Bloc positionné dans une grille horaire (vue semaine). */
export function SlotBlock({
  slot,
  href,
  style,
}: {
  slot: ResolvedSlot;
  href: string;
  style: CSSProperties;
}) {
  return (
    <Link
      href={href}
      style={{ ...style, ...slotStyle(slot.color) }}
      className="slot absolute overflow-hidden rounded-md px-1.5 py-1 text-[0.7rem] leading-tight transition-opacity hover:opacity-85"
      title={`${slot.start} – ${slot.end} · ${slot.title}${slot.location ? ` · ${slot.location}` : ""}`}
    >
      <span className="block truncate font-semibold">{slot.title}</span>
      <span className="block truncate opacity-80">
        {slot.start} – {slot.end}
      </span>
      {slot.location && (
        <span className="block truncate opacity-70">{slot.location}</span>
      )}
    </Link>
  );
}

/** Pastille compacte (vue mois). */
export function SlotChip({ slot }: { slot: ResolvedSlot }) {
  return (
    <span
      style={slotStyle(slot.color)}
      className="slot flex items-center gap-1 truncate rounded px-1 py-px text-[0.65rem] leading-4"
      title={`${slot.start} – ${slot.end} · ${slot.title}`}
    >
      <span className="hidden font-mono opacity-75 sm:inline">{slot.start}</span>
      <span className="truncate font-medium">{slot.title}</span>
    </span>
  );
}

/** Ligne détaillée (vue jour). */
export function SlotRow({
  slot,
  actions,
}: {
  slot: ResolvedSlot;
  actions?: React.ReactNode;
}) {
  return (
    <li className="flex items-stretch gap-3">
      <div className="w-14 shrink-0 pt-2.5 text-right font-mono text-xs text-[var(--muted)] sm:w-16 sm:text-sm">
        {slot.start}
      </div>
      <div
        style={slotStyle(slot.color)}
        className="slot flex min-w-0 flex-1 items-center gap-3 rounded-lg py-2.5 pl-3 pr-2"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{slot.title}</p>
          <p className="mt-0.5 truncate text-xs opacity-75">
            {slot.start} – {slot.end}
            <span className="mx-1.5">·</span>
            {formatDuration(slot.endMin - slot.startMin)}
            {slot.location && (
              <>
                <span className="mx-1.5">·</span>
                {slot.location}
              </>
            )}
          </p>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-0.5">{actions}</div>}
      </div>
    </li>
  );
}
