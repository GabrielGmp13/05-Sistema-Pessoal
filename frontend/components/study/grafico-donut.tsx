import type { ContagemDesempenho } from '@/lib/topico-metricas'
import { percentualDesempenho } from '@/lib/topico-metricas'

export function GraficoDonut({ label, dados }: { label: string; dados: ContagemDesempenho }) {
  const percentual = percentualDesempenho(dados)
  if (percentual === null) {
    const temRegistrosNeutros = dados.neutras > 0
    return (
      <div className="min-w-24 rounded-lg border border-border bg-background/35 p-2.5 text-center">
        <p className="text-xs font-medium">{label}</p>
        {temRegistrosNeutros ? (
          <>
            <div
              className="relative mx-auto mt-2 grid size-12 place-items-center rounded-full bg-muted"
              role="img"
              aria-label={`${label}: ${dados.neutras} registro(s) neutro(s), sem dados avaliáveis`}
            >
              <span className="grid size-8 place-items-center rounded-full bg-card text-sm font-semibold">—</span>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">Sem dados avaliáveis</p>
          </>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Sem dados ainda</p>
        )}
      </div>
    )
  }
  const total = dados.corretas + dados.incorretas + dados.neutras
  const fimCorretas = total ? (dados.corretas / total) * 100 : 0
  const fimIncorretas = total ? fimCorretas + (dados.incorretas / total) * 100 : fimCorretas
  return (
    <div className="min-w-24 rounded-lg border border-border bg-background/35 p-2.5 text-center">
      <p className="text-xs font-medium">{label}</p>
      <div
        className="relative mx-auto mt-2 grid size-12 place-items-center rounded-full"
        style={{ background: `conic-gradient(var(--primary) 0 ${fimCorretas}%, var(--destructive) ${fimCorretas}% ${fimIncorretas}%, var(--muted) ${fimIncorretas}% 100%)` }}
        role="img"
        aria-label={`${label}: ${percentual}% de acerto, ${dados.corretas} corretas, ${dados.incorretas} incorretas e ${dados.neutras} neutras`}
      >
        <span className="grid size-8 place-items-center rounded-full bg-card text-[11px] font-semibold">{percentual}%</span>
      </div>
    </div>
  )
}
