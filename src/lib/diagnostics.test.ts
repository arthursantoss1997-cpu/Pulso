import { describe, expect, it } from 'vitest'
import { diagnoseProduct } from './diagnostics'
import type { ProductMetric } from '../types'

const base: ProductMetric = { id: '1', name: 'Oferta', spend: 100, clicks: 120, impressions: 3000, approvedSales: 0, grossRevenue: 0, checkouts: 0, platformPercent: 0, platformFixed: 0 }

describe('diagnoseProduct', () => {
  it('identifica o checkout quando há intenção sem venda', () => {
    expect(diagnoseProduct({ ...base, checkouts: 12 }).status).toBe('Gargalo no checkout')
  })

  it('identifica a página quando há clique sem checkout', () => {
    expect(diagnoseProduct(base).status).toBe('Gargalo na página')
  })

  it('prioriza a meta de margem de 30%', () => {
    expect(diagnoseProduct({ ...base, grossRevenue: 130, approvedSales: 3, checkouts: 14 }).status).toBe('Margem em atenção')
  })
})
