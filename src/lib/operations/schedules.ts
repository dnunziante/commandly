import type { OperationsScheduleRecord } from "@/lib/operations/data";

export function getNextScheduleDate(currentDate: string, frequency: OperationsScheduleRecord["frequency"]) {
  const [year, month, day] = currentDate.split("-").map(Number);
  const next = new Date(year, month - 1, day);
  if (frequency === "Daily") next.setDate(next.getDate() + 1);
  if (frequency === "Weekly") next.setDate(next.getDate() + 7);
  if (frequency === "Monthly") next.setMonth(next.getMonth() + 1);
  const nextYear = next.getFullYear();
  const nextMonth = String(next.getMonth() + 1).padStart(2, "0");
  const nextDay = String(next.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}
