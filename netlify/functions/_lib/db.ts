import { getDatabase } from '@netlify/database'

export const db = () => getDatabase()
export const rows = <T>(result: unknown): T[] => {
  if (Array.isArray(result)) return result as T[]
  return ((result as { rows?: T[] })?.rows ?? [])
}
export const first = <T>(result: unknown): T | undefined => rows<T>(result)[0]
export const numeric = (value: unknown) => Number(value ?? 0)
