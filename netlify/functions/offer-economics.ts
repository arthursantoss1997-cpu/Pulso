import type { Config } from '@netlify/functions'
import { requireAdmin } from './_lib/auth'
import { db, first, numeric } from './_lib/db'
import { error, json } from './_lib/http'

const serialize = (row: Record<string, unknown>) => ({ productId: String(row.produto_id), targetMarginPercent: numeric(row.margem_desejada_porcentagem), targetCpm: numeric(row.cpm_planejado), landingToCheckoutPercent: numeric(row.clique_checkout_porcentagem), checkoutToSalePercent: numeric(row.checkout_venda_porcentagem), orderBumpPrice: numeric(row.order_bump_preco), orderBumpTakeRate: numeric(row.order_bump_aceite_porcentagem), upsellPrice: numeric(row.upsell_preco), upsellTakeRate: numeric(row.upsell_aceite_porcentagem), downsellPrice: numeric(row.downsell_preco), downsellTakeRate: numeric(row.downsell_aceite_porcentagem), isConfigured: true })

export default async (request: Request) => {
  const denied = await requireAdmin(); if (denied) return denied
  if (request.method === 'GET') {
    const productId = new URL(request.url).searchParams.get('productId')
    if (!productId) return error('Produto obrigatório.')
    const saved = first<Record<string, unknown>>(await db().sql`SELECT * FROM economia_oferta WHERE produto_id = ${productId}`)
    return json(saved ? serialize(saved) : { productId, targetMarginPercent: 30, targetCpm: 20, landingToCheckoutPercent: 0, checkoutToSalePercent: 0, orderBumpPrice: 0, orderBumpTakeRate: 0, upsellPrice: 0, upsellTakeRate: 0, downsellPrice: 0, downsellTakeRate: 0, isConfigured: false })
  }
  if (request.method !== 'POST') return error('Método não permitido.', 405)
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const productId = String(body?.productId ?? '')
  const values = ['targetMarginPercent', 'targetCpm', 'landingToCheckoutPercent', 'checkoutToSalePercent', 'orderBumpPrice', 'orderBumpTakeRate', 'upsellPrice', 'upsellTakeRate', 'downsellPrice', 'downsellTakeRate'].map((key) => Number(body?.[key]))
  if (!productId || values.some((value) => !Number.isFinite(value) || value < 0) || values[0] >= 100 || values[2] > 100 || values[3] > 100 || values[5] > 100 || values[7] > 100 || values[9] > 100) return error('Parâmetros econômicos inválidos.')
  const product = first(await db().sql`SELECT id FROM produtos WHERE id = ${productId} AND ativo = TRUE`)
  if (!product) return error('Produto não encontrado.', 404)
  const result = first<Record<string, unknown>>(await db().sql`
    INSERT INTO economia_oferta (produto_id, margem_desejada_porcentagem, cpm_planejado, clique_checkout_porcentagem, checkout_venda_porcentagem, order_bump_preco, order_bump_aceite_porcentagem, upsell_preco, upsell_aceite_porcentagem, downsell_preco, downsell_aceite_porcentagem)
    VALUES (${productId}, ${values[0]}, ${values[1]}, ${values[2]}, ${values[3]}, ${values[4]}, ${values[5]}, ${values[6]}, ${values[7]}, ${values[8]}, ${values[9]})
    ON CONFLICT (produto_id) DO UPDATE SET margem_desejada_porcentagem = EXCLUDED.margem_desejada_porcentagem, cpm_planejado = EXCLUDED.cpm_planejado, clique_checkout_porcentagem = EXCLUDED.clique_checkout_porcentagem, checkout_venda_porcentagem = EXCLUDED.checkout_venda_porcentagem, order_bump_preco = EXCLUDED.order_bump_preco, order_bump_aceite_porcentagem = EXCLUDED.order_bump_aceite_porcentagem, upsell_preco = EXCLUDED.upsell_preco, upsell_aceite_porcentagem = EXCLUDED.upsell_aceite_porcentagem, downsell_preco = EXCLUDED.downsell_preco, downsell_aceite_porcentagem = EXCLUDED.downsell_aceite_porcentagem, updated_at = now()
    RETURNING *
  `)
  return json(result ? serialize(result) : null)
}
export const config: Config = { path: '/api/offer-economics' }
