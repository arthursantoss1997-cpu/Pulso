import { createHmac, timingSafeEqual } from 'node:crypto'
import type { Config } from '@netlify/functions'
import { db, first } from './_lib/db'
import { error, json, localDate } from './_lib/http'
import { recomputeProductDate } from './_lib/metrics'
import { affectedMetricDates } from './_lib/order-state'

type SalesEvent = {
  eventId: string
  orderId: string
  provider?: string
  externalProductId: string
  status: 'pending' | 'approved' | 'refunded'
  amountGross: number
  currency?: string
  occurredAt: string
  metaCampaignId?: string
  metaAdId?: string
}

function validSignature(raw: string, supplied: string | null) {
  const secret = process.env.SALES_WEBHOOK_SECRET
  if (!secret || !supplied) return false
  const expected = `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}`
  const suppliedBytes = Buffer.from(supplied)
  const expectedBytes = Buffer.from(expected)
  return suppliedBytes.length === expectedBytes.length && timingSafeEqual(suppliedBytes, expectedBytes)
}

export default async (request: Request) => {
  if (request.method !== 'POST') return error('Método não permitido.', 405)
  const raw = await request.text()
  if (!validSignature(raw, request.headers.get('x-webhook-signature'))) return error('Assinatura inválida.', 401)
  const event = JSON.parse(raw) as SalesEvent
  if (!event?.eventId || !event.orderId || !event.externalProductId || !['pending', 'approved', 'refunded'].includes(event.status) || !Number.isFinite(Number(event.amountGross)) || Number(event.amountGross) < 0 || Number.isNaN(Date.parse(event.occurredAt))) return error('Payload de venda inválido.')
  const provider = String(event.provider ?? 'generic').toLowerCase()
  const database = db()
  const product = first<{ id: string }>(await database.sql`SELECT id FROM produtos WHERE external_product_id = ${event.externalProductId} AND ativo = TRUE`)
  if (!product) return error('Produto externo não mapeado.', 422)
  const duplicate = first(await database.sql`
    INSERT INTO webhook_eventos (provider, external_event_id, external_order_id, payload)
    VALUES (${provider}, ${event.eventId}, ${event.orderId}, ${raw}::jsonb)
    ON CONFLICT (provider, external_event_id) DO NOTHING RETURNING id
  `)
  if (!duplicate) return json({ accepted: true, duplicate: true })
  const previous = first<{ produto_id: string; checkout_started_on: string | null; approved_on: string | null }>(await database.sql`SELECT produto_id, checkout_started_on, approved_on FROM pedidos WHERE provider = ${provider} AND external_order_id = ${event.orderId}`)
  const date = localDate(event.occurredAt)
  const order = first<{ produto_id: string; checkout_started_on: string | null; approved_on: string | null }>(await database.sql`
    INSERT INTO pedidos (provider, external_order_id, produto_id, status, gross_amount, moeda, checkout_started_on, approved_on, refunded_on, occurred_at, meta_campaign_id, meta_ad_id)
    VALUES (${provider}, ${event.orderId}, ${product.id}, ${event.status}, ${Number(event.amountGross)}, ${(event.currency ?? 'BRL').toUpperCase()}, ${date}, ${event.status === 'approved' ? date : null}, ${event.status === 'refunded' ? date : null}, ${event.occurredAt}, ${event.metaCampaignId ?? null}, ${event.metaAdId ?? null})
    ON CONFLICT (provider, external_order_id) DO UPDATE SET
      produto_id = EXCLUDED.produto_id,
      gross_amount = EXCLUDED.gross_amount,
      moeda = EXCLUDED.moeda,
      status = CASE WHEN pedidos.status = 'refunded' OR EXCLUDED.status = 'refunded' THEN 'refunded' WHEN EXCLUDED.status = 'approved' THEN 'approved' ELSE pedidos.status END,
      checkout_started_on = COALESCE(pedidos.checkout_started_on, EXCLUDED.checkout_started_on),
      approved_on = CASE WHEN EXCLUDED.status = 'approved' THEN COALESCE(pedidos.approved_on, EXCLUDED.approved_on) ELSE pedidos.approved_on END,
      refunded_on = CASE WHEN EXCLUDED.status = 'refunded' THEN EXCLUDED.refunded_on ELSE pedidos.refunded_on END,
      occurred_at = EXCLUDED.occurred_at, updated_at = now()
      , meta_campaign_id = COALESCE(EXCLUDED.meta_campaign_id, pedidos.meta_campaign_id)
      , meta_ad_id = COALESCE(EXCLUDED.meta_ad_id, pedidos.meta_ad_id)
    RETURNING produto_id, checkout_started_on, approved_on
  `)
  const dates = affectedMetricDates(previous?.checkout_started_on, previous?.approved_on, order?.checkout_started_on, order?.approved_on)
  await Promise.all(dates.map((affectedDate) => recomputeProductDate(product.id, affectedDate)))
  return json({ accepted: true, duplicate: false })
}
export const config: Config = { path: '/api/webhooks/sales' }
