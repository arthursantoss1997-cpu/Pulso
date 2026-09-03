import type { Config } from '@netlify/functions'
import { requireAdmin } from './_lib/auth'
import { db, first, numeric, rows } from './_lib/db'
import { error, json } from './_lib/http'

export default async (request: Request) => {
  const denied = await requireAdmin(); if (denied) return denied
  if (request.method === 'GET') {
    const products = rows<Record<string, unknown>>(await db().sql`SELECT id, nome, external_product_id, preco_base, taxa_plataforma_porcentagem, taxa_plataforma_fixa FROM produtos WHERE ativo = TRUE ORDER BY nome`)
    return json(products.map((row) => ({ id: String(row.id), name: String(row.nome), externalProductId: String(row.external_product_id), basePrice: numeric(row.preco_base), platformPercent: numeric(row.taxa_plataforma_porcentagem), platformFixed: numeric(row.taxa_plataforma_fixa) })))
  }
  if (request.method !== 'POST') return error('Método não permitido.', 405)
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const name = String(body?.name ?? '').trim(); const externalProductId = String(body?.externalProductId ?? '').trim()
  const basePrice = Number(body?.basePrice); const platformPercent = Number(body?.platformPercent); const platformFixed = Number(body?.platformFixed)
  if (!name || !externalProductId || [basePrice, platformPercent, platformFixed].some((value) => !Number.isFinite(value) || value < 0)) return error('Dados do produto inválidos.')
  const product = first<Record<string, unknown>>(await db().sql`
    INSERT INTO produtos (nome, external_product_id, preco_base, taxa_plataforma_porcentagem, taxa_plataforma_fixa)
    VALUES (${name}, ${externalProductId}, ${basePrice}, ${platformPercent}, ${platformFixed}) RETURNING id, nome
  `)
  return json({ id: product?.id, name: product?.nome }, 201)
}
export const config: Config = { path: '/api/products' }
