import { FormEvent, useEffect, useState } from 'react'
import { Archive, FilePlus2, Plus, X } from 'lucide-react'
import { demoHistoricalImports } from '../data/demo'
import { getHistoricalImports, saveHistoricalImport } from '../lib/api'
import { money } from '../lib/financials'
import type { HistoricalImport, ProductMetric } from '../types'

const demoMode = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true'

function ImportForm({ products, close, saved }: { products: ProductMetric[]; close: () => void; saved: (record?: HistoricalImport) => void }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError('')
    const form = new FormData(event.currentTarget)
    const input = { productId: String(form.get('productId')), period: String(form.get('period')), spend: Number(form.get('spend')), grossRevenue: Number(form.get('grossRevenue')), chargebackAmount: Number(form.get('chargebackAmount') || 0), sales: Number(form.get('sales')), refundedSales: Number(form.get('refundedSales') || 0), impressions: Number(form.get('impressions') || 0), clicks: Number(form.get('clicks') || 0), checkouts: Number(form.get('checkouts') || 0), attribution: String(form.get('attribution')) as HistoricalImport['attribution'], notes: String(form.get('notes') || '') }
    try { await saveHistoricalImport(input); saved(); close() }
    catch (caught) {
      if (demoMode) {
        const product = products.find((item) => item.id === input.productId)
        saved({ ...input, id: `local-${Date.now()}`, productName: product?.name ?? 'Oferta', createdAt: new Date().toISOString() }); close()
      } else setError(caught instanceof Error ? caught.message : 'Não foi possível importar o histórico.')
    } finally { setSaving(false) }
  }
  return <div className="test-modal-backdrop"><form className="test-modal historical-form" onSubmit={submit}><header><div><span className="eyebrow">IMPORTAR HISTÓRICO</span><h2>Resultado de uma oferta antiga</h2></div><button className="icon-button" type="button" onClick={close} aria-label="Fechar"><X size={18}/></button></header><p className="form-explainer">Esses dados ficam separados da operação atual. Use os valores reais, mesmo que a atribuição esteja incompleta.</p><label>Oferta<select name="productId" required defaultValue=""><option value="" disabled>Escolha a oferta</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label>Período do relatório<input name="period" placeholder="Ex.: 01–15/08/2026" required /></label><div className="two-fields"><label>Gasto total (R$)<input name="spend" type="number" min="0" step="0.01" required /></label><label>Faturamento bruto (R$)<input name="grossRevenue" type="number" min="0" step="0.01" required /></label><label>Chargebacks (R$)<input name="chargebackAmount" type="number" min="0" step="0.01" defaultValue="0" /></label><label>Vendas brutas<input name="sales" type="number" min="0" step="1" required /></label><label>Vendas estornadas<input name="refundedSales" type="number" min="0" step="1" defaultValue="0" /></label><label>Checkouts<input name="checkouts" type="number" min="0" step="1" defaultValue="0" /></label><label>Impressões<input name="impressions" type="number" min="0" step="1" defaultValue="0" /></label><label>Cliques<input name="clicks" type="number" min="0" step="1" defaultValue="0" /></label></div><label>Atribuição<select name="attribution" defaultValue="untracked"><option value="tracked">Completa</option><option value="partial">Parcial</option><option value="untracked">Não atribuída</option></select></label><label>Observações<textarea name="notes" placeholder="Ex.: vendas não atribuídas, moeda convertida, relatório incompleto" /></label>{error && <p className="form-error">{error}</p>}<button className="button primary" disabled={saving}>{saving ? 'Importando...' : <><FilePlus2 size={16}/> Salvar histórico</>}</button></form></div>
}

export function HistoricalImports({ products }: { products: ProductMetric[] }) {
  const [records, setRecords] = useState<HistoricalImport[]>([])
  const [open, setOpen] = useState(false)
  const load = () => getHistoricalImports().then(setRecords).catch(() => { if (demoMode) setRecords(demoHistoricalImports) })
  useEffect(() => { void load() }, [])
  const labels: Record<HistoricalImport['attribution'], string> = { tracked: 'Atribuição completa', partial: 'Atribuição parcial', untracked: 'Não atribuída' }
  return <section className="history-section"><div className="section-heading"><div><span className="eyebrow">BASE DE APRENDIZADO</span><h2>Histórico importado</h2></div><button className="button soft" onClick={() => setOpen(true)}><Plus size={16}/> Importar relatório</button></div><p className="history-intro">Registros antigos não entram na leitura do dia. Eles preservam contexto para comparar ofertas e evitar repetir testes.</p>{records.length ? <div className="history-list">{records.map((record) => { const revenue = Math.max(0, record.grossRevenue - record.chargebackAmount); const profit = revenue - record.spend; return <article key={record.id}><div><strong>{record.productName}</strong><small>{record.period}</small></div><span className={`history-attribution attribution-${record.attribution}`}>{labels[record.attribution]}</span><dl><div><dt>Resultado</dt><dd className={profit >= 0 ? 'positive' : 'negative'}>{money(profit)}</dd></div><div><dt>Faturamento realizado</dt><dd>{money(revenue)}</dd></div><div><dt>Vendas</dt><dd>{record.sales - record.refundedSales}</dd></div></dl>{record.notes && <p>{record.notes}</p>}</article> })}</div> : <div className="empty-insight"><Archive/><p>Nenhum relatório histórico importado ainda.</p></div>}{open && <ImportForm products={products} close={() => setOpen(false)} saved={(record) => record ? setRecords((current) => [record, ...current]) : load()}/>}</section>
}
