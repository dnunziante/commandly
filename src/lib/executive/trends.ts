export type ExecutiveTrendSourceRow = {
  periodStart: string;
  locationId: string;
  revenueTarget: number;
  revenueActual: number;
  unitsTarget: number;
  unitsActual: number;
  leads: number;
  appointments: number;
};

export type ExecutiveTrendPeriod = {
  period: string;
  revenueTarget: number;
  revenueActual: number;
  salesPace: number | null;
  unitsTarget: number;
  unitsActual: number;
  leads: number;
  appointments: number;
  approvedLocations: number;
  reviewCompleted: boolean;
};

export function buildExecutiveTrends(rows: ExecutiveTrendSourceRow[], completedPeriods: string[]): ExecutiveTrendPeriod[] {
  const periods = new Map<string, ExecutiveTrendPeriod>();
  for (const row of rows) {
    const period = row.periodStart.slice(0, 7);
    const current = periods.get(period) ?? { period, revenueTarget: 0, revenueActual: 0, salesPace: null, unitsTarget: 0, unitsActual: 0, leads: 0, appointments: 0, approvedLocations: 0, reviewCompleted: completedPeriods.includes(period) };
    current.revenueTarget += row.revenueTarget;
    current.revenueActual += row.revenueActual;
    current.unitsTarget += row.unitsTarget;
    current.unitsActual += row.unitsActual;
    current.leads += row.leads;
    current.appointments += row.appointments;
    current.approvedLocations += 1;
    periods.set(period, current);
  }
  return [...periods.values()].map((item) => ({ ...item, salesPace: item.revenueTarget > 0 ? Math.round(item.revenueActual / item.revenueTarget * 100) : null })).sort((a, b) => a.period.localeCompare(b.period));
}

export function calculateTrendChange(periods: ExecutiveTrendPeriod[]) {
  const measurable = periods.filter((item) => item.salesPace !== null);
  if (measurable.length < 2) return null;
  return measurable.at(-1)!.salesPace! - measurable.at(-2)!.salesPace!;
}


export function compareExecutiveTrendPeriods(periods: ExecutiveTrendPeriod[], fromPeriod?: string, toPeriod?: string) {
  if (periods.length < 2) return null;
  const fallbackFrom = periods.at(-2)!;
  const fallbackTo = periods.at(-1)!;
  const from = periods.find((item) => item.period === fromPeriod) ?? fallbackFrom;
  const to = periods.find((item) => item.period === toPeriod) ?? fallbackTo;
  return {
    from,
    to,
    revenueChange: to.revenueActual - from.revenueActual,
    paceChange: from.salesPace === null || to.salesPace === null ? null : to.salesPace - from.salesPace,
    unitChange: to.unitsActual - from.unitsActual,
    leadChange: to.leads - from.leads,
    appointmentChange: to.appointments - from.appointments,
  };
}
