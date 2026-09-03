import type { Config } from '@netlify/functions'
import { requireAdmin } from './_lib/auth'
import { db, first, rows } from './_lib/db'
import { error, json } from './_lib/http'

export default async (request: Request) => {
  const denied = await requireAdmin(); if (denied) return denied
  if (request.method === 'GET') return json(rows(await db().sql`SELECT c.meta_campaign_id, c.nome AS campaign_name, c.produto_id, p.nome AS product_name FROM campanhas_meta c LEFT JOIN produtos p ON p.id = c.produto_id ORDER BY c.nome`))
  if (request.method !== 'POST') return error('Método não permitido.', 405)
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const metaCampaignId = String(body?.metaCampaignId ?? '').trim(); const campaignName = String(body?.campaignName ?? '').trim(); const productId = String(body?.productId ?? '').trim()
  if (!metaCampaignId || !campaignName || !productId) return error('Dados da campanha inválidos.')
  const product = first(await db().sql`SELECT id FROM produtos WHERE id = ${productId} AND ativo = TRUE`)
  if (!product) return error('Produto não encontrado.', 404)
  const mapping = first(await db().sql`
    INSERT INTO campanhas_meta (meta_campaign_id, nome, produto_id) VALUES (${metaCampaignId}, ${campaignName}, ${productId})
    ON CONFLICT (meta_campaign_id) DO UPDATE SET nome = EXCLUDED.nome, produto_id = EXCLUDED.produto_id, updated_at = now()
    RETURNING id, meta_campaign_id, produto_id
  `)
  return json(mapping, 201)
}
export const config: Config = { path: '/api/campaign-mappings' }
