import { describe, expect, it } from 'vitest'
import { offerEconomics, productFinancials, roasTone, safeDivide } from './financials'

const metric = { id: '1', name: 'Oferta A', spend: 100, clicks: 50, impressions: 1000, approvedSales: 4, grossRevenue: 400, checkouts: 8, platformPercent: 10, platformFixed: 2 }

describe('financial calculations', () => {
  it('calculates operational profit after fees and traffic', () => {
    const data = productFinancials(metric)
    expect(data.netProfit).toBe(252)
    expect(data.roas).toBe(4)
    expect(data.cpa).toBe(25)
    expect(data.ctr).toBe(5)
  })

  it('does not divide by zero', () => {
    expect(safeDivide(10, 0)).toBeNull()
    expect(roasTone(null)).toBe('neutral')
  })

  it('maps ROAS thresholds to alert tones', () => {
    expect(roasTone(2.01)).toBe('good')
    expect(roasTone(1)).toBe('watch')
    expect(roasTone(0.99)).toBe('risk')
  })

  it('turns full-funnel ticket and margin targets into CPA, CPC and CTR ceilings', () => {
    const economics = offerEconomics({ ...metric, basePrice: 40 }, { productId: '1', targetMarginPercent: 30, targetCpm: 20, landingToCheckoutPercent: 10, checkoutToSalePercent: 50, orderBumpPrice: 20, orderBumpTakeRate: 50, upsellPrice: 30, upsellTakeRate: 20, downsellPrice: 0, downsellTakeRate: 0 })
    expect(economics.averageTicket).toBe(56)
    expect(economics.idealCpa).toBeCloseTo(33.88, 2)
    expect(economics.idealCpc).toBeCloseTo(1.694, 3)
    expect(economics.idealCtr).toBeCloseTo(1.18, 2)
  })

  it('deducts chargebacks from revenue, profit and ROAS', () => {
    const result = productFinancials({ id: 'refund', name: 'Refund', spend: 159.35, clicks: 101, impressions: 4653, approvedSales: 7, refundedSales: 1, grossRevenue: 120, chargebackAmount: 42, checkouts: 9, platformPercent: 0, platformFixed: 0 })
    expect(result.recognizedRevenue).toBe(78)
    expect(result.netSales).toBe(6)
    expect(result.netProfit).toBeCloseTo(-81.35)
    expect(result.roas).toBeCloseTo(78 / 159.35)
  })
})
