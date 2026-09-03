import { FormEvent, useEffect, useMemo, useState } from 'react'
import { handleAuthCallback, getUser, login, logout } from '@netlify/identity'
import { ArrowLeft, BarChart3, Calculator, CalendarDays, ChevronRight, CircleDollarSign, Layers3, LoaderCircle, LogOut, Menu, Plus, Settings2, Target, X } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { demoDashboard, demoProduct } from './data/demo'
import { Insights } from './components/Insights'
import { OfferEconomicsView } from './components/OfferEconomics'
import { getDashboard, getProductDetail, saveCampaignMapping, saveProduct } from './lib/api'
import { money, number, percent, productFinancials, roasTone, safeDivide } from './lib/financials'
import { useDashboardTools } from './lib/webmcp'
import type { DashboardResponse, ProductDetailResponse, ProductMetric, RoasTone } from './types'

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
const daysBefore = (days: number) => { const date = new Date(); date.setDate(date.getDate() - days); return date.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }) }
const demoMode = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true'

function MetricCard({ label, value, note, tone = 'neutral' }: { label: string; value: string; note?: string; tone?: RoasTone }) {
  return <article className={`metric-card metric-${tone}`}><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</article>
}

function Brand() { return <div className="brand"><span className="brand-mark">P</span><span>Pulso</span><em>Low Ticket</em></div> }

function RoasPill({ value }: { value: number | null }) {
  const tone = roasTone(value)
  return <span className={`roas roas-${tone}`}><i />{value === null ? '—' : `${number(value, 2)}x`}</span>
}

function Login({ onLogin }: { onLogin: () => Promise<void> }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setLoading(true)
    try { await login(email, password); await onLogin() } catch { setError('Não foi possível entrar. Confirme seu convite e suas credenciais.') } finally { setLoading(false) }
  }
  return <main className="login-page"><section className="login-card"><Brand /><div><h1>Seu painel de operação.</h1><p>Entre para acompanhar tráfego, vendas e lucro das suas ofertas.</p></div><form onSubmit={submit}><label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><label>Senha<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>{error && <p className="form-error">{error}</p>}<button className="button primary" disabled={loading}>{loading ? 'Entrando...' : 'Entrar no painel'}</button></form><small>Acesso restrito a administradores convidados.</small></section></main>
}

function AdminSheet({ products, onClose, onSaved }: { products: ProductMetric[]; onClose: () => void; onSaved: () => void }) {
  const [tab, setTab] = useState<'product' | 'campaign'>('product')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const createProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setMessage('')
    const form = new FormData(event.currentTarget)
    try {
      await saveProduct({ name: String(form.get('name')), externalProductId: String(form.get('externalProductId')), basePrice: Number(form.get('basePrice')), platformPercent: Number(form.get('platformPercent')), platformFixed: Number(form.get('platformFixed')) })
      setMessage('Produto salvo.'); event.currentTarget.reset(); onSaved()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Erro ao salvar produto.') } finally { setLoading(false) }
  }
  const mapCampaign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setMessage('')
    const form = new FormData(event.currentTarget)
    try {
      await saveCampaignMapping({ metaCampaignId: String(form.get('metaCampaignId')), campaignName: String(form.get('campaignName')), productId: String(form.get('productId')) })
      setMessage('Campanha associada.'); event.currentTarget.reset(); onSaved()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Erro ao associar campanha.') } finally { setLoading(false) }
  }
  return <div className="sheet-backdrop" role="presentation"><aside className="admin-sheet" aria-label="Configurações"><header><div><span className="eyebrow">ADMINISTRAÇÃO</span><h2>Organize a operação</h2></div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20} /></button></header><div className="segmented"><button className={tab === 'product' ? 'active' : ''} onClick={() => setTab('product')}>Produto</button><button className={tab === 'campaign' ? 'active' : ''} onClick={() => setTab('campaign')}>Campanha</button></div>{tab === 'product' ? <form className="admin-form" onSubmit={createProduct}><label>Nome do produto<input name="name" placeholder="Ex.: Guia Detox 21D" required /></label><label>ID externo do checkout<input name="externalProductId" placeholder="guia-detox-21d" required /></label><div className="two-fields"><label>Preço base<input name="basePrice" type="number" min="0" step="0.01" required /></label><label>Taxa %<input name="platformPercent" type="number" min="0" step="0.01" defaultValue="0" required /></label></div><label>Taxa fixa por venda<input name="platformFixed" type="number" min="0" step="0.01" defaultValue="0" required /></label><p className="fee-hint">Defina as taxas quando escolher sua plataforma de checkout.</p><button className="button primary" disabled={loading}>{loading ? 'Salvando...' : <><Plus size={16} /> Adicionar produto</>}</button></form> : <form className="admin-form" onSubmit={mapCampaign}><label>ID da campanha Meta<input name="metaCampaignId" placeholder="1202..." required /></label><label>Nome da campanha<input name="campaignName" placeholder="[TESTE] Guia Detox" required /></label><label>Produto<select name="productId" defaultValue="" required><option value="" disabled>Escolha um produto</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><button className="button primary" disabled={loading}>{loading ? 'Salvando...' : <><Target size={16} /> Associar campanha</>}</button></form>}{message && <p className="form-status">{message}</p>}<footer>Associações manuais mantêm seu histórico de tráfego ligado ao produto certo.</footer></aside></div>
}

function ProductTable({ products, onOpen }: { products: ProductMetric[]; onOpen: (id: string) => void }) {
  return <section className="table-section"><div className="section-heading"><div><span className="eyebrow">VISÃO POR OFERTA</span><h2>Produtos ativos</h2></div><span>{products.length} produtos</span></div><div className="table-scroll"><table><thead><tr><th>Produto</th><th>Gasto</th><th>Vendas</th><th>CPA</th><th>CPC</th><th>CTR</th><th>Faturamento</th><th>Lucro líquido</th><th>ROAS</th><th aria-label="Abrir" /></tr></thead><tbody>{products.map((product) => { const data = productFinancials(product); return <tr key={product.id} onClick={() => onOpen(product.id)} tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onOpen(product.id)}><td><strong>{product.name}</strong><small>{product.periodLabel ?? `${product.checkouts} checkouts`}</small></td><td>{money(product.spend)}</td><td>{data.netSales}</td><td>{money(data.cpa)}</td><td>{money(data.cpc)}</td><td>{percent(data.ctr)}</td><td>{money(data.recognizedRevenue)}</td><td className={data.netProfit >= 0 ? 'positive' : 'negative'}>{money(data.netProfit)}</td><td><RoasPill value={data.roas} /></td><td><ChevronRight size={18} /></td></tr> })}</tbody></table></div></section>
}

function Dashboard({ data, date, setDate, onOpen, onSettings }: { data: DashboardResponse; date: string; setDate: (date: string) => void; onOpen: (id: string) => void; onSettings: () => void }) {
  const products = data.products
  const spend = products.reduce((sum, product) => sum + product.spend, 0)
  const gross = products.reduce((sum, product) => sum + productFinancials(product).recognizedRevenue, 0)
  const profit = products.reduce((sum, product) => sum + productFinancials(product).netProfit, 0)
  const roas = safeDivide(gross, spend)
  const margin = safeDivide(profit * 100, gross)
  return <main className="content"><header className="page-header"><div><span className="eyebrow">{data.summaryLabel ? 'DADOS IMPORTADOS' : 'OPERAÇÃO EM TEMPO REAL'}</span><h1>Visão geral</h1><p>{data.summaryLabel ?? 'Resultado consolidado das suas ofertas hoje.'}</p></div><div className="header-actions"><label className="date-field"><CalendarDays size={16}/><input aria-label="Data selecionada" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><button className="button soft" onClick={onSettings}><Settings2 size={16} /> Configurar</button></div></header><section className="metric-grid"><MetricCard label="Investimento total" value={money(spend)} note="Meta Ads" /><MetricCard label="Faturamento realizado" value={money(gross)} note={`${products.reduce((sum, product) => sum + productFinancials(product).netSales, 0)} vendas após estornos`} /><MetricCard label="Lucro líquido" value={money(profit)} note={`Margem de ${percent(margin)}`} tone={profit >= 0 ? 'good' : 'risk'} /><MetricCard label="ROAS geral" value={roas === null ? '—' : `${number(roas, 2)}x`} note="Receita ÷ investimento" tone={roasTone(roas)} /></section><Insights products={products} date={date} openProduct={onOpen}/><ProductTable products={products} onOpen={onOpen} /></main>
}

function ProductView({ detail, onBack }: { detail: ProductDetailResponse; onBack: () => void }) {
  const aggregate = useMemo(() => {
    const daily = detail.daily
    const grossRevenue = daily.reduce((sum, day) => sum + day.grossRevenue, 0)
    const spend = daily.reduce((sum, day) => sum + day.spend, 0)
    const clicks = daily.reduce((sum, day) => sum + day.clicks, 0)
    const impressions = daily.reduce((sum, day) => sum + day.impressions, 0)
    const approvedSales = daily.reduce((sum, day) => sum + day.approvedSales, 0)
    const checkouts = daily.reduce((sum, day) => sum + day.checkouts, 0)
    return { id: detail.product.id, name: detail.product.name, grossRevenue, spend, clicks, impressions, approvedSales, checkouts, chargebackAmount: detail.chargebackAmount, refundedSales: detail.refundedSales, untrackedSales: detail.untrackedSales, platformPercent: detail.product.platformPercent, platformFixed: detail.product.platformFixed }
  }, [detail])
  const data = productFinancials(aggregate)
  const funnel = [['CPM', money(data.cpm)], ['CTR', percent(data.ctr)], ['CPC', money(data.cpc)], ['Checkouts', number(aggregate.checkouts)], ['Vendas aprovadas', number(data.netSales)]]
  return <main className="content"><header className="page-header product-header"><div><button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Todas as ofertas</button><span className="eyebrow">{detail.sourceLabel ?? 'ANÁLISE DE PRODUTO · 30 DIAS'}</span><h1>{detail.product.name}</h1><p>{detail.periodLabel ?? `${detail.from.split('-').reverse().join('/')} — ${detail.to.split('-').reverse().join('/')}`}</p></div><RoasPill value={data.roas} /></header><section className="product-hero"><div className="profit-spotlight"><span>Lucro líquido real</span><strong className={data.netProfit >= 0 ? 'positive' : 'negative'}>{money(data.netProfit)}</strong><p>Margem de {percent(data.netMargin)} após taxas e tráfego.</p></div><div className="micro-metrics"><div><span>Faturamento</span><strong>{money(aggregate.grossRevenue)}</strong></div><div><span>Investimento</span><strong>{money(aggregate.spend)}</strong></div><div><span>Taxas</span><strong>{money(data.platformFees)}</strong></div></div></section><section className="chart-section"><div className="section-heading"><div><span className="eyebrow">{detail.sourceLabel ? 'RESUMO IMPORTADO' : 'EVOLUÇÃO DIÁRIA'}</span><h2>{detail.sourceLabel ? 'Gastos e faturamento do período' : 'Gastos × faturamento'}</h2></div><span>BRL</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height={290}><AreaChart data={detail.daily} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}><defs><linearGradient id="income" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#b6e56e" stopOpacity={0.6}/><stop offset="100%" stopColor="#b6e56e" stopOpacity={0.03}/></linearGradient><linearGradient id="spend" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#576d62" stopOpacity={0.3}/><stop offset="100%" stopColor="#576d62" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#e1e8e2"/><XAxis dataKey="date" tickFormatter={(value) => value.slice(5).split('-').reverse().join('/')} tickLine={false} axisLine={false} minTickGap={28}/><YAxis tickFormatter={(value) => `R$${value}`} tickLine={false} axisLine={false} width={56}/><Tooltip formatter={(value: number) => money(value)} labelFormatter={(value) => String(value).split('-').reverse().join('/')} contentStyle={{ borderRadius: 12, border: '1px solid #dce5dd', boxShadow: '0 12px 32px rgba(20,37,31,.12)' }}/><Area type="monotone" dataKey="grossRevenue" name="Faturamento" stroke="#5b8d43" strokeWidth={2.5} fill="url(#income)"/><Area type="monotone" dataKey="spend" name="Gasto" stroke="#435b50" strokeWidth={2} fill="url(#spend)"/></AreaChart></ResponsiveContainer></div></section><section className="funnel-section"><div className="section-heading"><div><span className="eyebrow">EFICIÊNCIA DO FUNIL</span><h2>Da impressão à venda</h2></div></div><div className="funnel">{funnel.map(([label, value], index) => <div className="funnel-step" key={label}><span className="funnel-index">0{index + 1}</span><span>{label}</span><strong>{value}</strong></div>)}</div></section></main>
}

function Sidebar({ current, onHome, onEconomics, onSettings, onLogout, open, setOpen }: { current: 'dashboard' | 'product' | 'economics'; onHome: () => void; onEconomics: () => void; onSettings: () => void; onLogout: () => void; open: boolean; setOpen: (value: boolean) => void }) {
  return <><button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu size={21}/></button><div className={`sidebar-overlay ${open ? 'visible' : ''}`} onClick={() => setOpen(false)} /><aside className={`sidebar ${open ? 'open' : ''}`}><Brand /><nav><button className={current === 'dashboard' ? 'active' : ''} onClick={() => { onHome(); setOpen(false) }}><BarChart3 size={19}/> Visão geral</button><button className={current === 'economics' ? 'active' : ''} onClick={() => { onEconomics(); setOpen(false) }}><Calculator size={19}/> CPA ideal</button><button onClick={() => { onSettings(); setOpen(false) }}><Settings2 size={19}/> Configurar</button></nav><div className="sidebar-bottom"><div className="sync-status"><i/> Dados sincronizados</div><button onClick={onLogout}><LogOut size={18}/> Sair</button></div></aside></>
}

export default function App() {
  const [userReady, setUserReady] = useState(demoMode)
  const [authenticated, setAuthenticated] = useState(demoMode)
  const [date, setDate] = useState(today)
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [detail, setDetail] = useState<ProductDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [economicsOpen, setEconomicsOpen] = useState(false)

  const refreshIdentity = async () => { await handleAuthCallback(); const user = await getUser(); setAuthenticated(Boolean(user)); setUserReady(true) }
  useEffect(() => { if (!demoMode) void refreshIdentity() }, [])
  const loadDashboard = async () => {
    setLoading(true); setError('')
    try { setDashboard(await getDashboard(date)) } catch (cause) { if (demoMode) setDashboard({ ...demoDashboard, date }); else setError(cause instanceof Error ? cause.message : 'Erro ao carregar painel.') } finally { setLoading(false) }
  }
  useEffect(() => { if (authenticated) void loadDashboard() }, [authenticated, date])
  useEffect(() => { if (!selectedProduct || !authenticated) return; setDetail(null); getProductDetail(selectedProduct, daysBefore(29), today()).then(setDetail).catch(() => demoMode ? setDetail(demoProduct(selectedProduct)) : setError('Não foi possível abrir o produto.')) }, [selectedProduct, authenticated])
  const openProduct = (id: string) => { setEconomicsOpen(false); setSelectedProduct(id) }
  const exit = async () => { if (!demoMode) await logout(); setAuthenticated(false); setSelectedProduct(null); setEconomicsOpen(false) }
  useDashboardTools(dashboard, openProduct)

  if (!userReady) return <div className="loading-screen"><LoaderCircle className="spin"/> Carregando acesso seguro…</div>
  if (!authenticated) return <Login onLogin={refreshIdentity} />
  const current = economicsOpen ? 'economics' : selectedProduct ? 'product' : 'dashboard'
  return <div className="app-shell"><Sidebar current={current} onHome={() => { setSelectedProduct(null); setEconomicsOpen(false) }} onEconomics={() => { setSelectedProduct(null); setEconomicsOpen(true) }} onSettings={() => setSettingsOpen(true)} onLogout={() => void exit()} open={menuOpen} setOpen={setMenuOpen}/>{demoMode && <div className="demo-badge">Modo demonstrativo</div>}<div className="main-area">{loading && !dashboard ? <div className="loading-screen"><LoaderCircle className="spin"/> Atualizando indicadores…</div> : error ? <div className="error-state"><CircleDollarSign/><h1>Não foi possível carregar o painel</h1><p>{error}</p><button className="button primary" onClick={() => void loadDashboard()}>Tentar novamente</button></div> : economicsOpen && dashboard ? <OfferEconomicsView products={dashboard.products} openProduct={openProduct}/> : selectedProduct ? detail ? <ProductView detail={detail} onBack={() => setSelectedProduct(null)}/> : <div className="loading-screen"><LoaderCircle className="spin"/> Carregando produto…</div> : dashboard ? <Dashboard data={dashboard} date={date} setDate={setDate} onOpen={openProduct} onSettings={() => setSettingsOpen(true)}/> : null}</div>{settingsOpen && dashboard && <AdminSheet products={dashboard.products} onClose={() => setSettingsOpen(false)} onSaved={() => void loadDashboard()}/>}</div>
}
