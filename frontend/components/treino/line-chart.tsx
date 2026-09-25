'use client'

interface PontoGrafico {
  label: string
  valor: number
}

interface GraficoLinhaProps {
  ariaLabel: string
  pontos: PontoGrafico[]
  sufixo: string
}

export function GraficoLinha({ ariaLabel, pontos, sufixo }: GraficoLinhaProps) {
  if (pontos.length < 2) return <p className="text-sm text-muted-foreground">Registre pelo menos dois pontos para ver a evolução.</p>

  const largura = 560
  const altura = 190
  const margem = 20
  const valores = pontos.map((ponto) => ponto.valor)
  const minimo = Math.min(...valores)
  const maximo = Math.max(...valores)
  const amplitude = maximo - minimo || 1
  const coordenadas = pontos.map((ponto, indice) => {
    const x = margem + ((largura - margem * 2) * indice) / (pontos.length - 1)
    const y = altura - margem - ((ponto.valor - minimo) / amplitude) * (altura - margem * 2)
    return { ...ponto, x, y }
  })

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${largura} ${altura}`} role="img" aria-label={ariaLabel} className="min-w-[28rem] w-full">
        <line x1={margem} x2={largura - margem} y1={altura - margem} y2={altura - margem} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={coordenadas.map((ponto) => `${ponto.x},${ponto.y}`).join(' ')} />
        {coordenadas.map((ponto) => (
          <g key={`${ponto.label}-${ponto.x}`}>
            <title>{`${ponto.label}: ${formatarNumero(ponto.valor)}${sufixo}`}</title>
            <circle cx={ponto.x} cy={ponto.y} r="4" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2" />
          </g>
        ))}
        <text x={margem} y={altura - 3} fill="var(--muted-foreground)" fontSize="11">{pontos[0].label}</text>
        <text x={largura - margem} y={altura - 3} fill="var(--muted-foreground)" fontSize="11" textAnchor="end">{pontos.at(-1)?.label}</text>
      </svg>
      <p className="mt-1 text-xs text-muted-foreground">Mínimo: {formatarNumero(minimo)}{sufixo} · Máximo: {formatarNumero(maximo)}{sufixo}</p>
      <details className="mt-2 text-sm"><summary>Consultar valores</summary><ul>{pontos.map((ponto, indice) => <li key={indice}>{ponto.label}: {formatarNumero(ponto.valor)}{sufixo}</li>)}</ul></details>
    </div>
  )
}

function formatarNumero(valor: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(valor)
}
