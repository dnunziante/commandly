export type RecordStatus = "draft" | "approved";
export type QualityStatus = RecordStatus | "missing" | "outdated";

export function classifySalesDataQuality(selectedPeriodStart: string, selectedStatus: RecordStatus | null, latestPeriodStart: string | null): QualityStatus {
  if (selectedStatus) return selectedStatus;
  return latestPeriodStart && latestPeriodStart < selectedPeriodStart ? "outdated" : "missing";
}
