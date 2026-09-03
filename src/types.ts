export type RoasTone = 'good' | 'watch' | 'risk' | 'neutral'

export interface ProductMetric {
  id: string
  name: string
  spend: number
  clicks: number
  impressions: number
  approvedSales: number
  grossRevenue: number
  checkouts: number
  platformPercent: number
  platformFixed: number
  basePrice?: number
  periodLabel?: string
  chargebackAmount?: number
  refundedSales?: number
  untrackedSales?: number
}

export interface DashboardResponse {
  date: string
  updatedAt: string
  products: ProductMetric[]
  summaryLabel?: string
}

export interface DailyPoint {
  date: string
  spend: number
  grossRevenue: number
  clicks: number
  impressions: number
  approvedSales: number
  checkouts: number
}

export interface ProductDetailResponse {
  product: { id: string; name: string; platformPercent: number; platformFixed: number }
  from: string
  to: string
  updatedAt: string
  daily: DailyPoint[]
  periodLabel?: string
  sourceLabel?: string
  chargebackAmount?: number
  refundedSales?: number
  untrackedSales?: number
}

export interface ProductInput {
  name: string
  externalProductId: string
  basePrice: number
  platformPercent: number
  platformFixed: number
}

export interface CampaignMappingInput {
  metaCampaignId: string
  campaignName: string
  productId: string
}

export interface InsightAlert {
  id: string
  productId: string
  title: string
  detail: string
  severity: 'risk' | 'watch'
}

export interface OfferTest {
  id: string
  productId: string
  productName: string
  hypothesis: string
  audience: string
  budget: number
  status: 'running' | 'scale' | 'iterate' | 'paused'
  decisionNote?: string
  startedOn: string
  testType?: 'offer' | 'creative'
  finalLoss?: number
  finalSpend?: number
  finalGrossRevenue?: number
  finalImpressions?: number
  finalClicks?: number
  finalCheckouts?: number
  finalApprovedSales?: number
}

export interface PerformanceBreakdown {
  id: string
  name: string
  productName?: string
  spend: number
  clicks: number
  impressions: number
  approvedSales: number
  grossRevenue: number
  netProfit: number
}

export interface OfferEconomics {
  productId: string
  targetMarginPercent: number
  targetCpm: number
  landingToCheckoutPercent: number
  checkoutToSalePercent: number
  orderBumpPrice: number
  orderBumpTakeRate: number
  upsellPrice: number
  upsellTakeRate: number
  downsellPrice: number
  downsellTakeRate: number
  isConfigured?: boolean
}

export interface HistoricalImport {
  id: string
  productId: string
  productName: string
  period: string
  spend: number
  grossRevenue: number
  chargebackAmount: number
  sales: number
  refundedSales: number
  impressions: number
  clicks: number
  checkouts: number
  attribution: 'tracked' | 'untracked' | 'partial'
  notes?: string
  createdAt: string
}
