import type { DashboardResponse, HistoricalImport, OfferTest, PerformanceBreakdown, ProductDetailResponse } from '../types'

export const demoDashboard: DashboardResponse = {
  date: new Date().toISOString().slice(0, 10),
  updatedAt: new Date().toISOString(),
  summaryLabel: 'Relatórios históricos importados · cada oferta pode ter um período diferente',
  products: [
    { id: 'desafio-pilates-50-latam', name: 'Desafio Pilates em Casa +50 · LATAM', periodLabel: '01–31/08/2026 · relatório diário da UTMify', basePrice: 43.19, spend: 1025.36, clicks: 728, impressions: 14458, approvedSales: 8, grossRevenue: 345.52, checkouts: 86, platformPercent: 0, platformFixed: 0 },
    { id: 'mapa-catecismo-latam', name: 'Mapa do Catecismo · LATAM', periodLabel: '28–29/08/2026 · receita convertida a R$ 5,40/USD', basePrice: 68.58, spend: 159.35, clicks: 101, impressions: 4653, approvedSales: 1, grossRevenue: 68.58, checkouts: 9, platformPercent: 0, platformFixed: 0 },
    { id: 'artesanato-canino', name: 'Artesanato Canino', periodLabel: '7 vendas não atribuídas pela UTMify · 1 chargeback', basePrice: 17.14, spend: 159.35, clicks: 101, impressions: 4653, approvedSales: 7, refundedSales: 1, untrackedSales: 7, grossRevenue: 120, chargebackAmount: 42, checkouts: 9, platformPercent: 0, platformFixed: 0 }
  ]
}

const pilatesDailyValues: Record<number, Omit<ProductDetailResponse['daily'][number], 'date'>> = {
  1: { spend: 0, grossRevenue: 34.95, clicks: 0, impressions: 0, approvedSales: 1, checkouts: 0 },
  4: { spend: 223.03, grossRevenue: 217.74, clicks: 254, impressions: 3806, approvedSales: 5, checkouts: 8 },
  5: { spend: 183.37, grossRevenue: 45.42, clicks: 92, impressions: 1361, approvedSales: 1, checkouts: 16 },
  6: { spend: 249.58, grossRevenue: 47.41, clicks: 124, impressions: 2659, approvedSales: 1, checkouts: 23 },
  7: { spend: 103.67, grossRevenue: 0, clicks: 67, impressions: 1019, approvedSales: 0, checkouts: 16 },
  15: { spend: 121.76, grossRevenue: 0, clicks: 112, impressions: 3019, approvedSales: 0, checkouts: 20 },
  16: { spend: 69.03, grossRevenue: 0, clicks: 50, impressions: 1402, approvedSales: 0, checkouts: 3 },
  22: { spend: 74.92, grossRevenue: 0, clicks: 29, impressions: 1192, approvedSales: 0, checkouts: 0 }
}

const pilatesDaily = Array.from({ length: 31 }, (_, index) => {
  const day = index + 1
  return { date: `2026-08-${String(day).padStart(2, '0')}`, ...(pilatesDailyValues[day] ?? { spend: 0, grossRevenue: 0, clicks: 0, impressions: 0, approvedSales: 0, checkouts: 0 }) }
})

const range = Array.from({ length: 30 }, (_, index) => {
  const date = new Date(); date.setDate(date.getDate() - 29 + index)
  const spend = 25 + ((index * 17) % 42)
  const sales = index % 5 === 0 ? 1 : 2 + (index % 3)
  return { date: date.toISOString().slice(0, 10), spend, grossRevenue: sales * 38.99, clicks: Math.round(spend * 2.2), impressions: Math.round(spend * 47), approvedSales: sales, checkouts: sales + 2 }
})

export const demoProduct = (id: string): ProductDetailResponse => {
  const product = demoDashboard.products.find((item) => item.id === id) ?? demoDashboard.products[0]
  return {
    product: { id: product.id, name: product.name, platformPercent: product.platformPercent, platformFixed: product.platformFixed },
    from: product.id === 'desafio-pilates-50-latam' ? '2026-08-01' : '', to: product.id === 'desafio-pilates-50-latam' ? '2026-08-31' : '', periodLabel: product.periodLabel ?? 'Período consolidado do relatório enviado', sourceLabel: product.untrackedSales ? 'UTMify · vendas não atribuídas' : 'UTMify · dados históricos', chargebackAmount: product.chargebackAmount, refundedSales: product.refundedSales, untrackedSales: product.untrackedSales, updatedAt: new Date().toISOString(),
    daily: product.id === 'desafio-pilates-50-latam' ? pilatesDaily : [{ date: new Date().toISOString().slice(0, 10), spend: product.spend, grossRevenue: product.grossRevenue, clicks: product.clicks, impressions: product.impressions, approvedSales: product.approvedSales, checkouts: product.checkouts }]
  }
}

export const demoTests: OfferTest[] = [
  { id: 'pilates-latam-report', productId: 'desafio-pilates-50-latam', productName: 'Desafio Pilates em Casa +50 · LATAM', hypothesis: 'Quiz + mini VSL para Pilates em Casa +50 no mercado LATAM.', audience: 'LATAM', budget: 0, status: 'iterate', testType: 'offer', finalLoss: 679.84, finalSpend: 1025.36, finalGrossRevenue: 345.52, finalImpressions: 14458, finalClicks: 728, finalCheckouts: 86, finalApprovedSales: 8, decisionNote: 'Relatório diário oficial da UTMify para agosto. Prioridade: auditar checkout → venda.', startedOn: '2026-08-01' },
  { id: 'mapa-catecismo-report', productId: 'mapa-catecismo-latam', productName: 'Mapa do Catecismo · LATAM', hypothesis: 'Quiz + mini VSL para Mapa do Catecismo no mercado LATAM.', audience: 'LATAM', budget: 0, status: 'iterate', testType: 'offer', finalLoss: 90.77, finalSpend: 159.35, finalGrossRevenue: 68.58, finalImpressions: 4653, finalClicks: 101, finalCheckouts: 9, finalApprovedSales: 1, decisionNote: 'Receita de US$ 12,70 convertida a R$ 5,40/USD. Amostra ainda pequena.', startedOn: '2026-08-28' },
  { id: 'artesanato-canino-report', productId: 'artesanato-canino', productName: 'Artesanato Canino', hypothesis: 'Oferta de artesanato canino com vendas não atribuídas na UTMify.', audience: 'Não informado', budget: 0, status: 'iterate', testType: 'offer', finalLoss: 81.35, finalSpend: 159.35, finalGrossRevenue: 78, finalImpressions: 4653, finalClicks: 101, finalCheckouts: 9, finalApprovedSales: 6, decisionNote: 'R$ 120 em 7 vendas; chargeback de R$ 42. A UTMify marcou as 7 como não atribuídas.', startedOn: '2026-09-02' }
]

export const demoHistoricalImports: HistoricalImport[] = [
  { id: 'historical-pilates', productId: 'desafio-pilates-50-latam', productName: 'Desafio Pilates em Casa +50 · LATAM', period: '01–31/08/2026', spend: 1025.36, grossRevenue: 345.52, chargebackAmount: 0, sales: 8, refundedSales: 0, impressions: 14458, clicks: 728, checkouts: 86, attribution: 'partial', notes: 'Importado do relatório diário oficial da UTMify.', createdAt: '2026-08-31' },
  { id: 'historical-mapa', productId: 'mapa-catecismo-latam', productName: 'Mapa do Catecismo · LATAM', period: '28–29/08/2026', spend: 159.35, grossRevenue: 68.58, chargebackAmount: 0, sales: 1, refundedSales: 0, impressions: 4653, clicks: 101, checkouts: 9, attribution: 'partial', notes: 'Receita convertida a R$ 5,40/USD.', createdAt: '2026-08-29' },
  { id: 'historical-artesanato', productId: 'artesanato-canino', productName: 'Artesanato Canino', period: 'Histórico sem atribuição', spend: 159.35, grossRevenue: 120, chargebackAmount: 42, sales: 7, refundedSales: 1, impressions: 4653, clicks: 101, checkouts: 9, attribution: 'untracked', notes: 'UTMify marcou 7 vendas não atribuídas.', createdAt: '2026-09-02' }
]

export const demoBreakdown: PerformanceBreakdown[] = [
  { id: 'pilates-august', name: 'Agosto · relatório UTMify', productName: 'Desafio Pilates +50', spend: 1025.36, clicks: 728, impressions: 14458, approvedSales: 8, grossRevenue: 345.52, netProfit: -679.84 },
  { id: 'mapa-campaign', name: 'ABO MAPA TESTE 1-1-4', productName: 'Mapa do Catecismo', spend: 159.35, clicks: 101, impressions: 4653, approvedSales: 1, grossRevenue: 68.58, netProfit: -90.77 }
]
