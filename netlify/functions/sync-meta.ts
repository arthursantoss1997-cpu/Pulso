import type { Config } from '@netlify/functions'
import { db, first, rows } from './_lib/db'
import { localDate } from './_lib/http'
import { recomputeProductDate } from './_lib/metrics'

type MetaInsight = { campaign_id: string; campaign_name: string; ad_id?: string; ad_name?: string; spend?: string; clicks?: string; impressions?: string; date_start: string }

async function insights(accountId: string, token: string, date: string, level: 'campaign' | 'ad') {
  const url = new URL(`https://graph.facebook.com/${process.env.META_GRAPH_VERSION ?? 'v22.0'}/act_${accountId}/insights`)
  url.searchParams.set('level', level)
  url.searchParams.set('fields', level === 'campaign' ? 'campaign_id,campaign_name,spend,clicks,impressions,date_start' : 'campaign_id,campaign_name,ad_id,ad_name,spend,clicks,impressions,date_start')
  url.searchParams.set('time_range', JSON.stringify({ since: date, until: date }))
  url.searchParams.set('limit', '100')
  url.searchParams.set('access_token', token)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Meta API respondeu ${response.status}`)
  return (await response.json() as { data?: MetaInsight[] }).data ?? []
}

export default async () => {
  const accountId = process.env.META_AD_ACCOUNT_ID
  const token = process.env.META_ACCESS_TOKEN
  if (!accountId || !token) return new Response('Meta credentials are not configured.', { status: 204 })
  const database = db()
  const run = first<{ id: string }>(await database.sql`INSERT INTO execucoes_sincronizacao (origem, status) VALUES ('meta', 'started') RETURNING id`)
  try {
    const date = localDate(new Date())
    const campaignInsights = await insights(accountId, token, date, 'campaign')
    const productsToRecompute = new Set<string>()
    for (const item of campaignInsights) {
      const campaign = first<{ id: string; produto_id: string | null }>(await database.sql`
        INSERT INTO campanhas_meta (meta_campaign_id, nome, last_synced_at)
        VALUES (${item.campaign_id}, ${item.campaign_name}, now())
        ON CONFLICT (meta_campaign_id) DO UPDATE SET nome = EXCLUDED.nome, last_synced_at = now(), updated_at = now()
        RETURNING id, produto_id
      `)
      if (!campaign) continue
      await database.sql`
        INSERT INTO metricas_campanha_diarias (campanha_id, data, gasto_meta, cliques, impressoes)
        VALUES (${campaign.id}, ${item.date_start}, ${Number(item.spend ?? 0)}, ${Number(item.clicks ?? 0)}, ${Number(item.impressions ?? 0)})
        ON CONFLICT (campanha_id, data) DO UPDATE SET gasto_meta = EXCLUDED.gasto_meta, cliques = EXCLUDED.cliques, impressoes = EXCLUDED.impressoes, updated_at = now()
      `
      if (campaign.produto_id) productsToRecompute.add(campaign.produto_id)
    }
    const adInsights = await insights(accountId, token, date, 'ad')
    for (const item of adInsights) {
      if (!item.ad_id || !item.ad_name) continue
      const campaign = first<{ produto_id: string | null }>(await database.sql`SELECT produto_id FROM campanhas_meta WHERE meta_campaign_id = ${item.campaign_id}`)
      const creative = first<{ id: string }>(await database.sql`
        INSERT INTO criativos_meta (meta_ad_id, meta_campaign_id, nome, produto_id, last_synced_at)
        VALUES (${item.ad_id}, ${item.campaign_id}, ${item.ad_name}, ${campaign?.produto_id ?? null}, now())
        ON CONFLICT (meta_ad_id) DO UPDATE SET meta_campaign_id = EXCLUDED.meta_campaign_id, nome = EXCLUDED.nome, produto_id = EXCLUDED.produto_id, last_synced_at = now(), updated_at = now()
        RETURNING id
      `)
      if (!creative) continue
      await database.sql`
        INSERT INTO metricas_criativo_diarias (criativo_id, data, gasto_meta, cliques, impressoes)
        VALUES (${creative.id}, ${item.date_start}, ${Number(item.spend ?? 0)}, ${Number(item.clicks ?? 0)}, ${Number(item.impressions ?? 0)})
        ON CONFLICT (criativo_id, data) DO UPDATE SET gasto_meta = EXCLUDED.gasto_meta, cliques = EXCLUDED.cliques, impressoes = EXCLUDED.impressoes, updated_at = now()
      `
    }
    await Promise.all([...productsToRecompute].map((productId) => recomputeProductDate(productId, date)))
    await database.sql`UPDATE execucoes_sincronizacao SET status = 'success', detalhes = ${JSON.stringify({ campaigns: campaignInsights.length, creatives: adInsights.length })}::jsonb, finished_at = now() WHERE id = ${run?.id}`
    return new Response(null, { status: 204 })
  } catch (caught) {
    await database.sql`UPDATE execucoes_sincronizacao SET status = 'failed', detalhes = ${JSON.stringify({ error: caught instanceof Error ? caught.message : 'Unknown error' })}::jsonb, finished_at = now() WHERE id = ${run?.id}`
    throw caught
  }
}
export const config: Config = { schedule: '*/15 * * * *' }
