import type { ProductMetric, RoasTone } from '../types'

export const safeDivide = (numerator: number, denominator: number) =>
  denominator > 0 ? numerator / denominator : null

export function productFinancials(metric: ProductMetric) {
  const chargebackAmount = metric.chargebackAmount ?? 0
  const netSales = Math.max(0, metric.approvedSales - (metric.refundedSales ?? 0))
  const recognizedRevenue = Math.max(0, metric.grossRevenue - chargebackAmount)
  const feePercent = recognizedRevenue * (metric.platformPercent / 100)
  const feeFixed = netSales * metric.platformFixed
  const netProfit = recognizedRevenue - feePercent - feeFixed - metric.spend
  return {
    cpa: safeDivide(metric.spend, netSales),
    cpc: safeDivide(metric.spend, metric.clicks),
    ctr: safeDivide(metric.clicks * 100, metric.impressions),
    cpm: safeDivide(metric.spend * 1000, metric.impressions),
    roas: safeDivide(recognizedRevenue, metric.spend),
    netProfit,
    netMargin: safeDivide(netProfit * 100, recognizedRevenue),
    platformFees: feePercent + feeFixed,
    recognizedRevenue,
    chargebackAmount,
    netSales
  }
}

export function totals(metrics: ProductMetric[]): ProductMetric {
  const grossRevenue = metrics.reduce((total, item) => total + productFinancials(item).recognizedRevenue, 0)
  const spend = metrics.reduce((total, item) => total + item.spend, 0)
  const approvedSales = metrics.reduce((total, item) => total + productFinancials(item).netSales, 0)
  const clicks = metrics.reduce((total, item) => total + item.clicks, 0)
  const impressions = metrics.reduce((total, item) => total + item.impressions, 0)
  const checkouts = metrics.reduce((total, item) => total + item.checkouts, 0)
  const platformFees = metrics.reduce((total, item) => total + productFinancials(item).platformFees, 0)
  return {
    id: 'total', name: 'Operação', spend, clicks, impressions, approvedSales, grossRevenue, checkouts,
    platformPercent: grossRevenue ? (platformFees / grossRevenue) * 100 : 0, platformFixed: 0
  }
}

export function roasTone(roas: number | null): RoasTone {
  if (roas === null) return 'neutral'
  if (roas > 2) return 'good'
  if (roas >= 1) return 'watch'
  return 'risk'
}

export const money = (value: number | null) => value === null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
export const number = (value: number | null, digits = 0) => value === null ? '—' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value)
export const percent = (value: number | null) => value === null ? '—' : `${number(value, 1)}%`

export function offerEconomics(product: ProductMetric, settings: import('../types').OfferEconomics) {
  const baseTicket = product.basePrice ?? safeDivide(product.grossRevenue, product.approvedSales) ?? 0
  const bumpRevenue = settings.orderBumpPrice * (settings.orderBumpTakeRate / 100)
  const upsellRevenue = settings.upsellPrice * (settings.upsellTakeRate / 100)
  const downsellRevenue = settings.downsellPrice * (settings.downsellTakeRate / 100)
  const averageTicket = baseTicket + bumpRevenue + upsellRevenue + downsellRevenue
  const netBeforeTraffic = averageTicket * (1 - product.platformPercent / 100) - product.platformFixed
  const idealCpa = Math.max(0, netBeforeTraffic * (1 - settings.targetMarginPercent / 100))
  const clickToSale = (settings.landingToCheckoutPercent / 100) * (settings.checkoutToSalePercent / 100)
  const idealCpc = idealCpa * clickToSale
  const idealCtr = idealCpc > 0 ? settings.targetCpm / idealCpc / 10 : null
  return { baseTicket, bumpRevenue, upsellRevenue, downsellRevenue, averageTicket, netBeforeTraffic, idealCpa, idealCpc, idealCtr, clickToSale: clickToSale * 100 }
}
