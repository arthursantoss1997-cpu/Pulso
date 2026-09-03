import type { CampaignMappingInput, DashboardResponse, HistoricalImport, OfferEconomics, OfferTest, PerformanceBreakdown, ProductDetailResponse, ProductInput } from '../types'

const jsonHeaders = { 'Content-Type': 'application/json' }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: 'include', ...init, headers: { ...jsonHeaders, ...init?.headers } })
  if (!response.ok) throw new Error(response.status === 401 ? 'Sua sessão expirou. Entre novamente.' : 'Não foi possível atualizar os dados.')
  return response.json() as Promise<T>
}

export const getDashboard = (date: string) => request<DashboardResponse>(`/api/dashboard?date=${date}`)
export const getProductDetail = (id: string, from: string, to: string) => request<ProductDetailResponse>(`/api/products/${id}/analytics?from=${from}&to=${to}`)
export const saveProduct = (product: ProductInput) => request('/api/products', { method: 'POST', body: JSON.stringify(product) })
export const saveCampaignMapping = (mapping: CampaignMappingInput) => request('/api/campaign-mappings', { method: 'POST', body: JSON.stringify(mapping) })
export const getOfferTests = () => request<OfferTest[]>('/api/offer-tests')
export const saveOfferTest = (test: Omit<OfferTest, 'id' | 'productName'>) => request('/api/offer-tests', { method: 'POST', body: JSON.stringify(test) })
export const getPerformanceBreakdown = (date: string, level: 'campaign' | 'creative') => request<PerformanceBreakdown[]>(`/api/performance-breakdown?date=${date}&level=${level}`)
export const getOfferEconomics = (productId: string) => request<OfferEconomics>(`/api/offer-economics?productId=${productId}`)
export const saveOfferEconomics = (settings: OfferEconomics) => request<OfferEconomics>('/api/offer-economics', { method: 'POST', body: JSON.stringify(settings) })
export const getHistoricalImports = () => request<HistoricalImport[]>('/api/historical-imports')
export const saveHistoricalImport = (record: Omit<HistoricalImport, 'id' | 'productName' | 'createdAt'>) => request('/api/historical-imports', { method: 'POST', body: JSON.stringify(record) })
