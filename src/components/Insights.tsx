import { FormEvent, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronRight, FlaskConical, Plus, Sparkles, X } from 'lucide-react'
import { demoBreakdown, demoTests } from '../data/demo'
import { HistoricalImports } from './HistoricalImports'
import { getOfferTests, getPerformanceBreakdown, saveOfferTest } from '../lib/api'
import { money, number, productFinancials, roasTone, safeDivide } from '../lib/financials'
import type { InsightAlert, OfferTest, PerformanceBreakdown, ProductMetric } from '../types'

const demoMode = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true'

function alertsFor(products: ProductMetric[]): InsightAlert[] {
  const alerts: InsightAlert[] = []
  products.forEach((product) => {
    const insight = productFinancials(product)
    if (product.spend > 0 && product.approvedSales === 0) alerts.push({ id: `${product.id}-zero-sales`, productId: product.id, title: `${product.name}: gasto sem venda`, detail: `${money(product.spend)} investidos sem venda aprovada. Revise ou pause o teste.`, severity: 'risk' })
    else if (insight.roas !== null && insight.roas < 1) alerts.push({ id: `${product.id}-roas-risk`, productId: product.id, title: `${product.name}: ROAS abaixo de 1`, detail: `Retorno de ${number(insight.roas, 2)}x. O investimento está maior que o faturamento.`, severity: 'risk' })
    else if (insight.roas !== null && insight.roas <= 2) alerts.push({ id: `${product.id}-roas-watch`, productId: product.id, title: `${product.name}: ROAS em atenção`, detail: `ROAS de ${number(insight.roas, 2)}x. Mantenha orçamento controlado e itere o criativo.`, severity: 'watch' })
  })
  return alerts.slice(0, 3)
}

function TestForm({ products, close, saved }: { products: ProductMetric[]; close: () => void; saved: () => void }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError('')
    const form = new FormData(event.currentTarget)
    const optionalNumber = (field: string) => {
      const value = String(form.get(field) ?? '')
      return value === '' ? undefined : Number(value)
    }
    try {
      await saveOfferTest({ productId: String(form.get('productId')), hypothesis: String(form.get('hypothesis')), audience: String(form.get('audience')), budget: Number(form.get('budget')), status: String(form.get('status')) as OfferTest['status'], testType: String(form.get('testType')) as 'offer' | 'creative', startedOn: String(form.get('startedOn')), finalLoss: optionalNumber('finalLoss'), finalSpend: optionalNumber('finalSpend'), finalGrossRevenue: optionalNumber('finalGrossRevenue'), finalImpressions: optionalNumber('finalImpressions'), finalClicks: optionalNumber('finalClicks'), finalCheckouts: optionalNumber('finalCheckouts'), finalApprovedSales: optionalNumber('finalApprovedSales') })
      saved(); close()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível registrar o teste.') } finally { setSaving(false) }
  }
  return <div className="test-modal-backdrop"><form className="test-modal" onSubmit={submit}><header><div><span className="eyebrow">NOVO TESTE</span><h2>Uma variável por vez</h2></div><button type="button" className="icon-button" onClick={close} aria-label="Fechar"><X size={18}/></button></header><div className="test-type-picker"><label><input type="radio" name="testType" value="offer" defaultChecked/> <strong>Oferta</strong><small>Promessa, preço, bônus ou página</small></label><label><input type="radio" name="testType" value="creative"/> <strong>Criativo</strong><small>Hook, ângulo, formato ou CTA</small></label></div><label>Produto<select name="productId" required defaultValue=""><option disabled value="">Escolha a oferta</option>{products.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}</select></label><label>Hipótese<input name="hypothesis" placeholder="Ex.: promessa e criativo que serão testados" required /></label><label>Público / segmentação<input name="audience" placeholder="Ex.: lookalike 2% compradores" required /></label><div className="two-fields"><label>Orçamento diário<input name="budget" type="number" min="0" step="0.01" required /></label><label>Início<input name="startedOn" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></label></div><label>Status<select name="status" defaultValue="running"><option value="running">Em teste</option><option value="iterate">Iterar</option><option value="paused">Pausado</option><option value="scale">Escalar</option></select></label><details className="result-fields"><summary>Registrar resultado do teste (opcional)</summary><p>Se só souber o prejuízo, informe apenas ele. Os demais dados tornam o diagnóstico mais preciso.</p><div className="two-fields"><label>Prejuízo final (R$)<input name="finalLoss" type="number" min="0" step="0.01" placeholder="Ex.: 250" /></label><label>Gasto total (R$)<input name="finalSpend" type="number" min="0" step="0.01" /></label><label>Faturamento (R$)<input name="finalGrossRevenue" type="number" min="0" step="0.01" /></label><label>Impressões<input name="finalImpressions" type="number" min="0" step="1" /></label><label>Cliques<input name="finalClicks" type="number" min="0" step="1" /></label><label>Checkouts<input name="finalCheckouts" type="number" min="0" step="1" /></label><label>Vendas aprovadas<input name="finalApprovedSales" type="number" min="0" step="1" /></label></div></details>{error && <p className="form-error">{error}</p>}<button className="button primary" disabled={saving}>{saving ? 'Registrando...' : <><FlaskConical size={16}/> Registrar teste</>}</button></form></div>
}

function LearningPanel({ tests }: { tests: OfferTest[] }) {
  const testsWithLoss = tests.filter((test) => test.finalLoss !== undefined)
  const totalLoss = testsWithLoss.reduce((sum, test) => sum + (test.finalLoss ?? 0), 0)
  const fullyMeasured = tests.filter((test) => [test.finalImpressions, test.finalClicks, test.finalCheckouts, test.finalApprovedSales].every((value) => value !== undefined)).length
  return <section className="learning-section"><div className="section-heading"><div><span className="eyebrow">APRENDIZADO DE TESTES</span><h2>Transforme prejuízo em decisão</h2></div></div><div className="learning-summary"><div><small>Prejuízos registrados</small><strong>{testsWithLoss.length}</strong></div><div><small>Valor mapeado</small><strong>{money(totalLoss)}</strong></div><div><small>Testes com funil completo</small><strong>{fullyMeasured}/{tests.length || 0}</strong></div></div><div className="learning-grid"><article><strong>1. Separe o que está sendo testado</strong><p>Teste <b>criativo</b> ou <b>oferta</b> — nunca os dois juntos. Assim você sabe o que causou o resultado.</p></article><article><strong>2. Registre o funil mínimo</strong><p>Impressões, cliques, checkouts e vendas. Sem isso, o painel mostra o prejuízo, mas não consegue apontar o vazamento.</p></article><article><strong>3. Tome uma decisão simples</strong><p>Depois do orçamento definido, escolha: pausar, iterar uma única hipótese ou escalar. Evite “mexer em tudo”.</p></article></div></section>
}

function OfferTests({ products }: { products: ProductMetric[] }) {
  const [tests, setTests] = useState<OfferTest[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const load = () => getOfferTests().then(setTests).catch(() => { if (demoMode) setTests(demoTests) })
  useEffect(() => { void load() }, [])
  const labels: Record<OfferTest['status'], string> = { running: 'Em teste', scale: 'Escalar', iterate: 'Iterar', paused: 'Pausado' }
  return <><LearningPanel tests={tests}/><section className="tests-section"><div className="section-heading"><div><span className="eyebrow">HISTÓRICO DE TESTES</span><h2>Hipóteses e decisões</h2></div><button className="button soft" onClick={() => setFormOpen(true)}><Plus size={16}/> Novo teste</button></div>{tests.length ? <div className="test-grid">{tests.map((test) => <article className="test-card" key={test.id}><div className="test-card-head"><span className={`test-status status-${test.status}`}>{labels[test.status]}</span><span className="test-kind">{test.testType === 'creative' ? 'Criativo' : 'Oferta'}</span></div><h3>{test.hypothesis}</h3><p>{test.productName} · {test.audience}</p><footer><strong>{test.finalLoss !== undefined ? `− ${money(test.finalLoss)}` : <>{money(test.budget)}<small>/dia</small></>}</strong>{test.finalLoss !== undefined ? <span>Prejuízo registrado</span> : test.decisionNote ? <span>{test.decisionNote}</span> : <span>Decisão pendente</span>}</footer></article>)}</div> : <div className="empty-insight"><FlaskConical/><p>Registre a hipótese antes de investir para comparar decisões com clareza.</p></div>}{formOpen && <TestForm products={products} close={() => setFormOpen(false)} saved={load}/>}</section></>
}

function PerformanceBreakdownPanel({ date }: { date: string }) {
  const [level, setLevel] = useState<'campaign' | 'creative'>('campaign')
  const [items, setItems] = useState<PerformanceBreakdown[]>([])
  useEffect(() => { getPerformanceBreakdown(date, level).then(setItems).catch(() => { if (demoMode) setItems(demoBreakdown) }) }, [date, level])
  return <section className="breakdown-section"><div className="section-heading"><div><span className="eyebrow">ONDE O ORÇAMENTO ESTÁ INDO</span><h2>Desempenho por ativo</h2></div><div className="segmented compact"><button className={level === 'campaign' ? 'active' : ''} onClick={() => setLevel('campaign')}>Campanhas</button><button className={level === 'creative' ? 'active' : ''} onClick={() => setLevel('creative')}>Criativos</button></div></div>{items.length ? <div className="breakdown-list">{items.map((item) => { const roas = safeDivide(item.grossRevenue, item.spend); return <div className="breakdown-row" key={item.id}><div className="breakdown-name"><span>{item.name}</span><small>{item.productName ?? 'Sem produto associado'}</small></div><div><small>Gasto</small><strong>{money(item.spend)}</strong></div><div><small>Vendas</small><strong>{item.approvedSales}</strong></div><div><small>ROAS</small><strong className={`tone-${roasTone(roas)}`}>{roas === null ? '—' : `${number(roas, 2)}x`}</strong></div><ChevronRight size={17}/></div> })}</div> : <div className="empty-insight"><Sparkles/><p>Aguardando dados de {level === 'campaign' ? 'campanhas' : 'criativos'} associados às ofertas.</p></div>}</section>
}

export function Insights({ products, date, openProduct }: { products: ProductMetric[]; date: string; openProduct: (id: string) => void }) {
  const alerts = useMemo(() => alertsFor(products), [products])
  return <><section className="alerts-section"><div className="section-heading"><div><span className="eyebrow">ATENÇÃO NECESSÁRIA</span><h2>Alertas acionáveis</h2></div><span>{alerts.length ? `${alerts.length} para revisar` : 'Tudo sob controle'}</span></div>{alerts.length ? <div className="alert-list">{alerts.map((alert) => <button className={`alert-card alert-${alert.severity}`} key={alert.id} onClick={() => openProduct(alert.productId)}>{alert.severity === 'risk' ? <AlertTriangle size={19}/> : <Sparkles size={19}/>}<div><strong>{alert.title}</strong><p>{alert.detail}</p></div><ChevronRight size={18}/></button>)}</div> : <div className="all-clear"><CheckCircle2 size={20}/><span>Nenhum alerta crítico para os produtos ativos neste período.</span></div>}</section><PerformanceBreakdownPanel date={date}/><HistoricalImports products={products}/><OfferTests products={products}/></>
}
