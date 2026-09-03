import type { Config } from '@netlify/functions'
import { requireAdmin } from './_lib/auth'
import { db, first, numeric, rows } from './_lib/db'
import { error, json } from './_lib/http'

const attribution = ['tracked', 'untracked', 'partial'] as const

export default async (request: Request) => {
  const denied = await requireAdmin(); if (denied) return denied
  if (request.method === 'GET') {
    const records = rows<Record<string, unknown>>(await db().sql`
      SELECT i.*, p.nome AS product_name FROM importacoes_historicas i
      JOIN produtos p ON p.id = i.produto_id ORDER BY i.created_at DESC
    `)
    return json(records.map((item) => ({ id: String(item.id), productId: String(item.produto_id), productName: String(item.product_name), period: String(item.period), spend: numeric(item.gasto), grossRevenue: numeric(item.faturamento_bruto), chargebackAmount: numeric(item.chargebacks), sales: Number(item.vendas), refundedSales: Number(item.vendas_estornadas), impressions: Number(item.impressoes), clicks: Number(item.cliques), checkouts: Number(item.checkouts), attribution: item.atribuicao, notes: item.observacoes ?? undefined, createdAt: String(item.created_at) })))
  }
  if (request.method !== 'POST') return error('Método não permitido.', 405)
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const productId = String(body?.productId ?? ''); const period = String(body?.period ?? '').trim(); const attributionValue = String(body?.attribution ?? 'tracked')
  const numberField = (key: string) => Number(body?.[key] ?? 0)
  const spend = numberField('spend'); const grossRevenue = numberField('grossRevenue'); const chargebackAmount = numberField('chargebackAmount'); const sales = numberField('sales'); const refundedSales = numberField('refundedSales'); const impressions = numberField('impressions'); const clicks = numberField('clicks'); const checkouts = numberField('checkouts'); const notes = String(body?.notes ?? '').trim() || null
  const values = [spend, grossRevenue, chargebackAmount, sales, refundedSales, impressions, clicks, checkouts]
  if (!productId || !period || !attribution.includes(attributionValue as typeof attribution[number]) || values.some((value) => !Number.isFinite(value) || value < 0) || refundedSales > sales) return error('Preencha os dados do histórico corretamente.')
  const product = first(await db().sql`SELECT id FROM produtos WHERE id = ${productId}`)
  if (!product) return error('Produto não encontrado.', 404)
  const inserted = first(await db().sql`INSERT INTO importacoes_historicas (produto_id, periodo, gasto, faturamento_bruto, chargebacks, vendas, vendas_estornadas, impressoes, cliques, checkouts, atribuicao, observacoes) VALUES (${productId}, ${period}, ${spend}, ${grossRevenue}, ${chargebackAmount}, ${sales}, ${refundedSales}, ${impressions}, ${clicks}, ${checkouts}, ${attributionValue}, ${notes}) RETURNING id`)
  return json(inserted, 201)
}

export const config: Config = { path: '/api/historical-imports' }
