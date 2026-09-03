export type SaleStatus = 'pending' | 'approved' | 'refunded'

export function nextOrderStatus(previous: SaleStatus | undefined, incoming: SaleStatus): SaleStatus {
  if (previous === 'refunded' || incoming === 'refunded') return 'refunded'
  if (previous === 'approved' || incoming === 'approved') return 'approved'
  return 'pending'
}

export function affectedMetricDates(...dates: Array<string | null | undefined>) {
  return [...new Set(dates.filter((date): date is string => Boolean(date)))]
}
