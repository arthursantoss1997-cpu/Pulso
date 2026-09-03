import { describe, expect, it } from 'vitest'
import { affectedMetricDates, nextOrderStatus } from '../../netlify/functions/_lib/order-state'

describe('order lifecycle', () => {
  it('promotes pending sales and never restores a refunded order', () => {
    expect(nextOrderStatus('pending', 'approved')).toBe('approved')
    expect(nextOrderStatus('approved', 'refunded')).toBe('refunded')
    expect(nextOrderStatus('refunded', 'approved')).toBe('refunded')
  })

  it('returns unique impacted dates for an idempotent recomputation', () => {
    expect(affectedMetricDates('2026-09-02', '2026-09-02', undefined, '2026-09-03')).toEqual(['2026-09-02', '2026-09-03'])
  })
})
