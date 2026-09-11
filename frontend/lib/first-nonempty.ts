// Uma fonte lenta não deve reter o resultado útil de outra fonte independente.
export async function firstNonempty<T>(queries: Array<() => Promise<T[]>>): Promise<T[]> {
  try {
    return await Promise.any(queries.map(async (query) => {
      const items = await query()
      if (items.length === 0) throw new Error('Sem resultados')
      return items
    }))
  } catch {
    return []
  }
}
