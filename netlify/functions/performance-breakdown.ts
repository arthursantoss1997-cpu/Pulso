import type { Config } from '@netlify/functions'
import { requireAdmin } from './_lib/auth'
import { db, numeric, rows } from './_lib/db'
import { error, json, localDate } from './_lib/http'

const mapRows = (data: Record<string, unknown>[]) => data.map((row) => ({ id: String(row.id), name: String(row.name), productName: row.product_name ? String(row.product_name) : undefined, spend: numeric(row.spend), clicks: numeric(row.clicks), impressions: numeric(row.impressions), approvedSales: numeric(row.approved_sales), grossRevenue: numeric(row.gross_revenue), netProfit: numeric(row.net_profit) }))

export default async (request: Request) => {
  const denied = await requireAdmin(); if (denied) return denied
  const url = new URL(request.url); const date = url.searchParams.get('date') ?? localDate(new Date()); const level = url.searchParams.get('level') ?? 'campaign'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !['campaign', 'creative'].includes(level)) return error('Parâmetros inválidos.')
  if (level === 'campaign') {
    const data = rows<Record<string, unknown>>(await db().sql`
      WITH traffic AS (SELECT c.meta_campaign_id, c.nome, c.produto_id, SUM(m.gasto_meta) AS spend, SUM(m.cliques) AS clicks, SUM(m.impressoes) AS impressions FROM campanhas_meta c JOIN metricas_campanha_diarias m ON m.campanha_id = c.id WHERE m.data = ${date} GROUP BY c.meta_campaign_id, c.nome, c.produto_id),
      sales AS (SELECT meta_campaign_id, COUNT(*) FILTER (WHERE status = 'approved' AND approved_on = ${date}) AS approved_sales, COALESCE(SUM(gross_amount) FILTER (WHERE status = 'approved' AND approved_on = ${date}), 0) AS gross_revenue, COALESCE(SUM(gross_amount * p.taxa_plataforma_porcentagem / 100 + p.taxa_plataforma_fixa) FILTER (WHERE status = 'approved' AND approved_on = ${date}), 0) AS platform_fees FROM pedidos o JOIN produtos p ON p.id = o.produto_id GROUP BY meta_campaign_id)
      SELECT t.meta_campaign_id AS id, t.nome AS name, p.nome AS product_name, t.spend, t.clicks, t.impressions, COALESCE(s.approved_sales, 0) AS approved_sales, COALESCE(s.gross_revenue, 0) AS gross_revenue, COALESCE(s.gross_revenue, 0) - COALESCE(s.platform_fees, 0) - t.spend AS net_profit FROM traffic t LEFT JOIN sales s ON s.meta_campaign_id = t.meta_campaign_id LEFT JOIN produtos p ON p.id = t.produto_id ORDER BY t.spend DESC
    `)
    return json(mapRows(data))
  }
  const data = rows<Record<string, unknown>>(await db().sql`
    WITH traffic AS (SELECT c.meta_ad_id, c.nome, c.produto_id, SUM(m.gasto_meta) AS spend, SUM(m.cliques) AS clicks, SUM(m.impressoes) AS impressions FROM criativos_meta c JOIN metricas_criativo_diarias m ON m.criativo_id = c.id WHERE m.data = ${date} GROUP BY c.meta_ad_id, c.nome, c.produto_id),
    sales AS (SELECT meta_ad_id, COUNT(*) FILTER (WHERE status = 'approved' AND approved_on = ${date}) AS approved_sales, COALESCE(SUM(gross_amount) FILTER (WHERE status = 'approved' AND approved_on = ${date}), 0) AS gross_revenue, COALESCE(SUM(gross_amount * p.taxa_plataforma_porcentagem / 100 + p.taxa_plataforma_fixa) FILTER (WHERE status = 'approved' AND approved_on = ${date}), 0) AS platform_fees FROM pedidos o JOIN produtos p ON p.id = o.produto_id GROUP BY meta_ad_id)
    SELECT t.meta_ad_id AS id, t.nome AS name, p.nome AS product_name, t.spend, t.clicks, t.impressions, COALESCE(s.approved_sales, 0) AS approved_sales, COALESCE(s.gross_revenue, 0) AS gross_revenue, COALESCE(s.gross_revenue, 0) - COALESCE(s.platform_fees, 0) - t.spend AS net_profit FROM traffic t LEFT JOIN sales s ON s.meta_ad_id = t.meta_ad_id LEFT JOIN produtos p ON p.id = t.produto_id ORDER BY t.spend DESC
  `)
  return json(mapRows(data))
}
export const config: Config = { path: '/api/performance-breakdown' }
