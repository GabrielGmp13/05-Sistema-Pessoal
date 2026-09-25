import { estatisticasEnem } from '@/lib/enem-estatisticas'

export function ResultadoEnem({ questoes }: { questoes: Parameters<typeof estatisticasEnem>[0] }) {
  const dados = estatisticasEnem(questoes)
  return <section className="mt-6 space-y-4 rounded-xl border border-border p-5" aria-label="Distribuição do resultado">
    <h2 className="font-semibold">Resultado da correção</h2>
    <p className="text-sm text-muted-foreground">{dados.corrigidas} de {dados.total} questões com gabarito. {dados.percentualCorrigidas === null ? 'Ainda não há resultado corrigido.' : `${dados.percentualCorrigidas.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% de acertos entre as questões com gabarito, incluindo as deixadas em branco.`} Percentual de acertos não é nota TRI.</p>
    <dl className="space-y-3">{[
      ['Acertos', dados.acertos], ['Erros', dados.erros], ['Em branco, com gabarito', dados.emBranco], ['Sem correção', dados.semCorrecao],
    ].map(([nome, valor]) => <div key={nome}>
      <dt className="text-sm">{nome}</dt><dd className="flex items-center gap-3">
        <meter aria-label={String(nome)} className="h-4 flex-1" min={0} max={dados.total} value={Number(valor)} />
        <span className="font-mono text-sm">{valor}/{dados.total}</span>
      </dd>
    </div>)}</dl>
    <h3 className="text-sm font-semibold">Motivos dos erros</h3>
    {dados.erros === 0 ? <p className="text-sm text-muted-foreground">Nenhum erro corrigido para analisar.</p> : <ul className="space-y-2">{dados.motivos.map(item => <li key={item.motivo}>
      <span className="break-words text-sm">{item.motivo}</span>
      <div className="flex items-center gap-3"><meter className="h-4 flex-1" aria-label={`Erros: ${item.motivo}`} min={0} max={dados.erros} value={item.quantidade} /><span className="font-mono text-sm">{item.quantidade}/{dados.erros}</span></div>
    </li>)}</ul>}
  </section>
}
