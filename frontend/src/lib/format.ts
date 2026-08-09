import { format, isValid, parseISO } from "date-fns";

export function formatSlot(timeslot: string): string {
  const d = parseISO(timeslot);
  if (!isValid(d)) return timeslot;
  return format(d, "EEE d MMM yyyy 'at' HH:mm");
}

export function formatSlotShort(timeslot: string): string {
  const d = parseISO(timeslot);
  if (!isValid(d)) return timeslot;
  return format(d, "d MMM, HH:mm");
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
