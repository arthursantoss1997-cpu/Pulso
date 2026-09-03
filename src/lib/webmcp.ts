import { useEffect } from 'react'
import { productFinancials } from './financials'
import type { DashboardResponse } from '../types'

type ModelContext = { registerTool: (tool: { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: unknown) => unknown }, options: { signal: AbortSignal }) => void | Promise<void> }

export function useDashboardTools(dashboard: DashboardResponse | null, openProduct: (id: string) => void) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext
    if (!context?.registerTool || !dashboard) return
    const lifecycle = new AbortController()
    void Promise.resolve(context.registerTool({
      name: 'summarize_low_ticket_performance',
      title: 'Resumir desempenho do painel',
      description: 'Lê os totais e alertas do dashboard de ofertas atualmente visível.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => ({ date: dashboard.date, products: dashboard.products.map((product) => ({ name: product.name, spend: product.spend, grossRevenue: product.grossRevenue, netProfit: productFinancials(product).netProfit, roas: productFinancials(product).roas })) })
    }, { signal: lifecycle.signal })).catch(() => undefined)
    void Promise.resolve(context.registerTool({
      name: 'open_offer_analysis',
      title: 'Abrir análise de oferta',
      description: 'Abre no painel a análise detalhada de um produto já listado no dashboard.',
      inputSchema: { type: 'object', properties: { productId: { type: 'string', description: 'ID do produto exibido no dashboard.' } }, required: ['productId'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        const productId = (input as { productId?: string })?.productId
        if (!productId || !dashboard.products.some((product) => product.id === productId)) throw new Error('Produto não encontrado no painel atual.')
        openProduct(productId)
        return { opened: productId }
      }
    }, { signal: lifecycle.signal })).catch(() => undefined)
    return () => lifecycle.abort()
  }, [dashboard, openProduct])
}
