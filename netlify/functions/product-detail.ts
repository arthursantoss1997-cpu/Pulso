import type { Config } from '@netlify/functions'
import { requireAdmin } from './_lib/auth'
import { db, first, numeric, rows } from './_lib/db'
import { error, json, localDate } from './_lib/http'

export default async (request: Request, context: { params: Record<string, string> }) => {
  const denied = await requireAdmin(); if (denied) return denied
  const productId = context.params.id
  const url = new URL(request.url)
  const to = url.searchParams.get('to') ?? localDate(new Date())
  const from = url.searchParams.get('from') ?? localDate(new Date(Date.now() - 29 * 86400000))
  if (!productId || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return error('Parâmetros inválidos.')
  const product = first<Record<string, unknown>>(await db().sql`SELECT id, nome, taxa_plataforma_porcentagem, taxa_plataforma_fixa FROM produtos WHERE id = ${productId} AND ativo = TRUE`)
  if (!product) return error('Produto não encontrado.', 404)
  const daily = rows<Record<string, unknown>>(await db().sql`
    SELECT data, gasto_meta, cliques, impressoes, vendas_aprovadas, faturamento_bruto, checkouts_iniciados
    FROM metricas_diarias WHERE produto_id = ${productId} AND data BETWEEN ${from} AND ${to} ORDER BY data
  `).map((row) => ({ date: String(row.data), spend: numeric(row.gasto_meta), clicks: numeric(row.cliques), impressions: numeric(row.impressoes), approvedSales: numeric(row.vendas_aprovadas), grossRevenue: numeric(row.faturamento_bruto), checkouts: numeric(row.checkouts_iniciados) }))
  return json({ product: { id: String(product.id), name: String(product.nome), platformPercent: numeric(product.taxa_plataforma_porcentagem), platformFixed: numeric(product.taxa_plataforma_fixa) }, from, to, daily, updatedAt: new Date().toISOString() })
}
export const config: Config = { path: '/api/products/:id/analytics' }
