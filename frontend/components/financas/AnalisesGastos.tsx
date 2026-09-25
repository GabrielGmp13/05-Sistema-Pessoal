import type { CategoriaFinanceira, LancamentoFinanceiro } from '@/lib/financas'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AnalisesGastos({ periodo, lancamentos, categorias }: {
  periodo: string; lancamentos: LancamentoFinanceiro[]; categorias: CategoriaFinanceira[]
}) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) return null
  const [ano, mes] = periodo.split('-').map(Number)
  const meses = Array.from({ length: 6 }, (_, indice) => {
    const data = new Date(ano, mes - 6 + indice, 1)
    const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
    const movimentos = lancamentos.filter((item) => !item.deleted && item.data.startsWith(chave))
    const somar = (tipo: 'entrada' | 'saida') => movimentos.filter((item) => item.tipo === tipo).reduce((soma, item) => soma + Number(item.valor), 0)
    return { chave, entradas: somar('entrada'), saidas: somar('saida') }
  })
  const grupos = new Map<string, number>()
  for (const item of lancamentos) {
    if (!item.deleted && item.tipo === 'saida' && item.data.startsWith(periodo)) grupos.set(item.categoria_uuid, (grupos.get(item.categoria_uuid) ?? 0) + Number(item.valor))
  }
  const gastos = [...grupos].sort((a, b) => b[1] - a[1])
  const total = gastos.reduce((soma, [, valor]) => soma + valor, 0)
  return <section className="mt-8 border-t border-border pt-5"><h2 className="text-xl font-semibold">Análise dos lançamentos</h2>
    <p className="mt-2 text-sm text-muted-foreground">Seis meses até o período selecionado. Considera somente lançamentos registrados; meses vazios não comprovam ausência de gastos.</p>
    <div className="mt-4 grid gap-6 md:grid-cols-2"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Entradas, saídas e saldo por mês</caption><thead><tr><th className="py-2">Mês</th><th>Entradas</th><th>Saídas</th><th>Saldo</th></tr></thead><tbody>{meses.map((item) => <tr key={item.chave} className="border-t border-border"><th className="py-2 font-normal">{item.chave}</th><td>{moeda.format(item.entradas)}</td><td>{moeda.format(item.saidas)}</td><td>{moeda.format(item.entradas - item.saidas)}</td></tr>)}</tbody></table></div>
    <div><h3 className="text-sm font-medium">Saídas por categoria · {periodo}</h3>{!gastos.length ? <p className="mt-2 text-sm text-muted-foreground">Sem despesas registradas neste mês.</p> : <ul className="mt-3 space-y-3">{gastos.map(([uuid, valor]) => <li key={uuid}><div className="flex justify-between gap-2 text-sm"><span>{categorias.find((item) => item.uuid === uuid)?.nome ?? 'Categoria removida'}</span><span>{moeda.format(valor)} · {(valor / total * 100).toFixed(1)}%</span></div><progress className="mt-1 h-2 w-full accent-primary" value={valor} max={total} aria-label={`Participação de ${categorias.find((item) => item.uuid === uuid)?.nome ?? 'categoria removida'}`} /></li>)}</ul>}</div></div>
  </section>
}
