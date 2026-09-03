import type { Config } from '@netlify/functions'
import { requireAdmin } from './_lib/auth'
import { db, first, numeric, rows } from './_lib/db'
import { error, json } from './_lib/http'

const statuses = ['running', 'scale', 'iterate', 'paused'] as const

export default async (request: Request) => {
  const denied = await requireAdmin(); if (denied) return denied
  if (request.method === 'GET') {
    const tests = rows<Record<string, unknown>>(await db().sql`
      SELECT t.id, t.produto_id, p.nome AS product_name, t.hipotese, t.publico, t.orcamento_diario, t.status, t.nota_decisao, t.iniciado_em,
        t.tipo_teste, t.prejuizo_final, t.gasto_final, t.faturamento_final, t.impressoes_final, t.cliques_final, t.checkouts_final, t.vendas_final
      FROM testes_oferta t JOIN produtos p ON p.id = t.produto_id ORDER BY t.iniciado_em DESC, t.created_at DESC
    `)
    return json(tests.map((test) => ({
      id: String(test.id), productId: String(test.produto_id), productName: String(test.product_name), hypothesis: String(test.hipotese), audience: String(test.publico), budget: numeric(test.orcamento_diario), status: test.status, decisionNote: test.nota_decisao ?? undefined, startedOn: String(test.iniciado_em),
      testType: test.tipo_teste, finalLoss: test.prejuizo_final === null ? undefined : numeric(test.prejuizo_final), finalSpend: test.gasto_final === null ? undefined : numeric(test.gasto_final), finalGrossRevenue: test.faturamento_final === null ? undefined : numeric(test.faturamento_final),
      finalImpressions: test.impressoes_final === null ? undefined : Number(test.impressoes_final), finalClicks: test.cliques_final === null ? undefined : Number(test.cliques_final), finalCheckouts: test.checkouts_final === null ? undefined : Number(test.checkouts_final), finalApprovedSales: test.vendas_final === null ? undefined : Number(test.vendas_final)
    })))
  }
  if (request.method !== 'POST') return error('Método não permitido.', 405)
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const productId = String(body?.productId ?? ''); const hypothesis = String(body?.hypothesis ?? '').trim(); const audience = String(body?.audience ?? '').trim(); const budget = Number(body?.budget); const status = String(body?.status ?? 'running'); const startedOn = String(body?.startedOn ?? ''); const testType = String(body?.testType ?? 'offer')
  const optionalNumber = (key: string) => body?.[key] === '' || body?.[key] === undefined || body?.[key] === null ? null : Number(body[key])
  const finalLoss = optionalNumber('finalLoss'); const finalSpend = optionalNumber('finalSpend'); const finalGrossRevenue = optionalNumber('finalGrossRevenue'); const finalImpressions = optionalNumber('finalImpressions'); const finalClicks = optionalNumber('finalClicks'); const finalCheckouts = optionalNumber('finalCheckouts'); const finalApprovedSales = optionalNumber('finalApprovedSales')
  const optionalValues = [finalLoss, finalSpend, finalGrossRevenue, finalImpressions, finalClicks, finalCheckouts, finalApprovedSales]
  if (!productId || !hypothesis || !audience || !Number.isFinite(budget) || budget < 0 || !statuses.includes(status as typeof statuses[number]) || !['offer', 'creative'].includes(testType) || optionalValues.some((value) => value !== null && (!Number.isFinite(value) || value < 0)) || !/^\d{4}-\d{2}-\d{2}$/.test(startedOn)) return error('Dados do teste inválidos.')
  const product = first(await db().sql`SELECT id FROM produtos WHERE id = ${productId} AND ativo = TRUE`)
  if (!product) return error('Produto não encontrado.', 404)
  const result = first(await db().sql`INSERT INTO testes_oferta (produto_id, hipotese, publico, orcamento_diario, status, iniciado_em, tipo_teste, prejuizo_final, gasto_final, faturamento_final, impressoes_final, cliques_final, checkouts_final, vendas_final) VALUES (${productId}, ${hypothesis}, ${audience}, ${budget}, ${status}, ${startedOn}, ${testType}, ${finalLoss}, ${finalSpend}, ${finalGrossRevenue}, ${finalImpressions}, ${finalClicks}, ${finalCheckouts}, ${finalApprovedSales}) RETURNING id`)
  return json(result, 201)
}
export const config: Config = { path: '/api/offer-tests' }
