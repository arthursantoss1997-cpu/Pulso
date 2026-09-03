import type { Config } from '@netlify/functions'
import { requireAdmin } from './_lib/auth'
import { db, numeric, rows } from './_lib/db'
import { error, json, localDate } from './_lib/http'

export default async (request: Request) => {
  const denied = await requireAdmin(); if (denied) return denied
  const date = new URL(request.url).searchParams.get('date') ?? localDate(new Date())
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return error('Data inválida.')
  const result = rows<Record<string, unknown>>(await db().sql`
    SELECT p.id, p.nome, p.preco_base, p.taxa_plataforma_porcentagem, p.taxa_plataforma_fixa,
      COALESCE(m.gasto_meta, 0) AS gasto_meta, COALESCE(m.cliques, 0) AS cliques,
      COALESCE(m.impressoes, 0) AS impressoes, COALESCE(m.vendas_aprovadas, 0) AS vendas_aprovadas,
      COALESCE(m.faturamento_bruto, 0) AS faturamento_bruto, COALESCE(m.checkouts_iniciados, 0) AS checkouts_iniciados
    FROM produtos p LEFT JOIN metricas_diarias m ON m.produto_id = p.id AND m.data = ${date}
    WHERE p.ativo = TRUE ORDER BY p.nome
  `).map((row) => ({
    id: String(row.id), name: String(row.nome), basePrice: numeric(row.preco_base), spend: numeric(row.gasto_meta), clicks: numeric(row.cliques), impressions: numeric(row.impressoes),
    approvedSales: numeric(row.vendas_aprovadas), grossRevenue: numeric(row.faturamento_bruto), checkouts: numeric(row.checkouts_iniciados),
    platformPercent: numeric(row.taxa_plataforma_porcentagem), platformFixed: numeric(row.taxa_plataforma_fixa)
  }))
  return json({ date, products: result, updatedAt: new Date().toISOString() })
}
export const config: Config = { path: '/api/dashboard' }
