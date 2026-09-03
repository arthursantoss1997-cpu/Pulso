import { db, first, numeric } from './db'

export async function recomputeProductDate(productId: string, date: string) {
  const database = db()
  const traffic = first<{ spend: unknown; clicks: unknown; impressions: unknown }>(await database.sql`
    SELECT COALESCE(SUM(m.gasto_meta), 0) AS spend,
           COALESCE(SUM(m.cliques), 0) AS clicks,
           COALESCE(SUM(m.impressoes), 0) AS impressions
    FROM metricas_campanha_diarias m
    JOIN campanhas_meta c ON c.id = m.campanha_id
    WHERE c.produto_id = ${productId} AND m.data = ${date}
  `) ?? { spend: 0, clicks: 0, impressions: 0 }
  const sales = first<{ approved_sales: unknown; gross_revenue: unknown; checkouts: unknown }>(await database.sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'approved' AND approved_on = ${date}) AS approved_sales,
      COALESCE(SUM(gross_amount) FILTER (WHERE status = 'approved' AND approved_on = ${date}), 0) AS gross_revenue,
      COUNT(*) FILTER (WHERE checkout_started_on = ${date}) AS checkouts
    FROM pedidos WHERE produto_id = ${productId}
  `) ?? { approved_sales: 0, gross_revenue: 0, checkouts: 0 }

  await database.sql`
    INSERT INTO metricas_diarias (produto_id, data, gasto_meta, cliques, impressoes, vendas_aprovadas, faturamento_bruto, checkouts_iniciados)
    VALUES (${productId}, ${date}, ${numeric(traffic.spend)}, ${numeric(traffic.clicks)}, ${numeric(traffic.impressions)}, ${numeric(sales.approved_sales)}, ${numeric(sales.gross_revenue)}, ${numeric(sales.checkouts)})
    ON CONFLICT (produto_id, data) DO UPDATE SET
      gasto_meta = EXCLUDED.gasto_meta, cliques = EXCLUDED.cliques, impressoes = EXCLUDED.impressoes,
      vendas_aprovadas = EXCLUDED.vendas_aprovadas, faturamento_bruto = EXCLUDED.faturamento_bruto,
      checkouts_iniciados = EXCLUDED.checkouts_iniciados, updated_at = now()
  `
}
