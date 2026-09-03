import { productFinancials, safeDivide } from './financials'
import type { ProductMetric } from '../types'

export type DiagnosisTone = 'good' | 'watch' | 'risk' | 'neutral'

export interface ProductDiagnosis {
  tone: DiagnosisTone
  status: string
  title: string
  evidence: string
  action: string
  lesson: string
  isEarlySignal: boolean
}

const pct = (value: number | null) => value === null ? '—' : `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
const brl = (value: number | null) => value === null ? '—' : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/**
 * Gives a beginner-friendly next action without pretending that one fixed
 * benchmark works for every country, offer or audience.
 */
export function diagnoseProduct(product: ProductMetric): ProductDiagnosis {
  const data = productFinancials(product)
  const clickToCheckout = safeDivide(product.checkouts * 100, product.clicks)
  const checkoutToSale = safeDivide(data.netSales * 100, product.checkouts)
  const isEarlySignal = product.clicks < 100 || product.checkouts < 10

  if (product.spend <= 0 || product.impressions <= 0) {
    return { tone: 'neutral', status: 'Aguardando dados', title: 'Ainda não há tráfego suficiente', evidence: 'Sem gasto ou impressões no período selecionado.', action: 'Confirme se a campanha está ativa e se o período do painel está correto.', lesson: 'Sem impressões não dá para avaliar hook, CTR ou custo.', isEarlySignal: true }
  }

  if (product.clicks <= 0) {
    return { tone: 'risk', status: 'Gargalo no anúncio', title: 'O anúncio não está trazendo cliques', evidence: `${product.impressions.toLocaleString('pt-BR')} impressões e nenhum clique.`, action: 'Teste outro hook nos primeiros segundos, uma promessa mais clara e um CTA direto.', lesson: 'Impressão é visualização; clique mostra que a pessoa quis saber mais.', isEarlySignal }
  }

  if (data.netSales <= 0 && product.checkouts > 0) {
    return { tone: 'risk', status: 'Gargalo no checkout', title: 'Há intenção, mas a venda não fecha', evidence: `${product.checkouts} checkouts iniciados e nenhuma venda aprovada.`, action: 'Revise preço, formas de pagamento, confiança, garantia e a coerência entre promessa e checkout.', lesson: `Checkout → venda está em ${pct(checkoutToSale)}. Esse ponto mede a decisão final de compra.`, isEarlySignal }
  }

  if (data.netSales <= 0) {
    return { tone: 'risk', status: 'Gargalo na página', title: 'O anúncio gera cliques, mas não leva ao checkout', evidence: `${product.clicks} cliques, ${product.checkouts} checkouts e nenhum pedido aprovado.`, action: 'Simplifique a promessa da página/VSL, deixe o benefício mais concreto e teste um CTA mais visível.', lesson: `Clique → checkout está em ${pct(clickToCheckout)}. Ele mostra se a página transforma curiosidade em intenção.`, isEarlySignal }
  }

  if (data.ctr !== null && data.ctr < 1) {
    return { tone: 'watch', status: 'Hook para testar', title: 'A oferta vende, mas o anúncio chama pouca atenção', evidence: `CTR de ${pct(data.ctr)} e CPC de ${brl(data.cpc)}.`, action: 'Crie variações de hook, ângulo e visual antes de mexer na oferta inteira.', lesson: 'CTR mede quantas pessoas clicam depois de ver o anúncio. É um sinal do criativo, não uma regra fixa.', isEarlySignal }
  }

  if (data.netMargin !== null && data.netMargin < 30) {
    return { tone: 'watch', status: 'Margem em atenção', title: 'A oferta vende, mas ainda não bate sua meta de lucro', evidence: `Margem líquida de ${pct(data.netMargin)}; sua meta é acima de 30%.`, action: 'Compare o CPA atual com o CPA ideal. Depois teste redução de custo, aumento de ticket ou um order bump.', lesson: 'Lucro é o que sobra depois de tráfego, taxas e estornos — não apenas o faturamento.', isEarlySignal }
  }

  return { tone: 'good', status: 'Sinal saudável', title: 'A oferta está dentro da meta de margem', evidence: `Margem líquida de ${pct(data.netMargin)} e ROAS de ${data.roas?.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) ?? '—'}x.`, action: 'Aumente o orçamento com calma e mantenha o mesmo acompanhamento diário.', lesson: 'Mesmo um resultado saudável precisa de volume antes de virar uma decisão de escala.', isEarlySignal }
}
