/** Datas ISO locais: a falta é derivada de uma ocorrência real, nunca do plano atual. */
export function estadoTreinoAgendado(data: string, concluido: boolean, hoje: string) {
  return concluido ? 'feito' : data < hoje ? 'falta' : 'agendado'
}
