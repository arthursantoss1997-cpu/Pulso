import { getUser } from '@netlify/identity'
import { error } from './http'

export async function requireAdmin() {
  const user = await getUser()
  return user?.roles?.includes('admin') || user?.role === 'admin' ? null : error('Acesso de administrador necessário.', 401)
}
