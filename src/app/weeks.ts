import { cairoDate } from "./api";
export const firstActivityWeek = "2026-10-05";
export function shiftDate(day: string, amount: number) {
  const date = new Date(day + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
export function workingWeek(today = cairoDate()) {
  const day = new Date(today + "T00:00:00Z").getUTCDay();
  const start = shiftDate(today, day === 0 ? 1 : day === 6 ? 2 : 1 - day);
  return { start, end: shiftDate(start, 4) };
}
export function pastWeeks(today = cairoDate()) {
  const weeks: { start: string; end: string }[] = [];
  for (let start = firstActivityWeek; shiftDate(start, 4) < today; start = shiftDate(start, 7)) {
    weeks.push({ start, end: shiftDate(start, 4) });
  }
  return weeks.reverse();
}
export function weekLabel(start: string, end: string) {
  const format = (day: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(day + "T00:00:00Z"));
  return `${format(start)} – ${format(end)}`;
}
