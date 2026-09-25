export function volumePorGrupo(
  series: Array<{ exercicio_uuid: string; concluida: boolean; carga_real: number | null; reps_real: number | null }>,
  exercicios: Array<{ uuid: string; grupo_muscular: string | null }>,
) {
  const grupos = new Map(exercicios.map((ex) => [ex.uuid, ex.grupo_muscular?.trim() || 'Sem classificação']))
  const totais = new Map<string, { grupo: string; series: number; volume: number; seriesComVolume: number }>()
  for (const serie of series) {
    if (!serie.concluida) continue
    const grupo = grupos.get(serie.exercicio_uuid) ?? 'Sem classificação'
    const chave = grupo.toLocaleLowerCase('pt-BR')
    const total = totais.get(chave) ?? { grupo, series: 0, volume: 0, seriesComVolume: 0 }
    total.series++
    if (serie.carga_real !== null && serie.reps_real !== null && Number.isFinite(Number(serie.carga_real)) && Number.isFinite(Number(serie.reps_real)) && Number(serie.carga_real) >= 0 && Number(serie.reps_real) >= 0) {
      total.volume += Number(serie.carga_real) * Number(serie.reps_real)
      total.seriesComVolume++
    }
    totais.set(chave, total)
  }
  return [...totais.values()].sort((a, b) => b.series - a.series || a.grupo.localeCompare(b.grupo, 'pt-BR'))
}

export function consolidarCardioPorDia(
  execucoes: Array<{ data_hora: string; distancia_real_km: number | null; duracao_real_minutos: number | null }>,
  campo: 'distancia' | 'duracao',
) {
  const porDia = new Map<string, number>()
  for (const execucao of execucoes) {
    const data = new Date(execucao.data_hora)
    const valor = campo === 'distancia' ? execucao.distancia_real_km : execucao.duracao_real_minutos
    if (!Number.isFinite(data.getTime()) || valor === null || !Number.isFinite(Number(valor)) || Number(valor) < 0) continue
    const dia = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
    porDia.set(dia, (porDia.get(dia) ?? 0) + Number(valor))
  }
  return [...porDia].sort(([a], [b]) => a.localeCompare(b)).slice(-30).map(([dia, valor]) => ({
    label: new Date(`${dia}T00:00:00`).toLocaleDateString('pt-BR'), valor,
  }))
}
