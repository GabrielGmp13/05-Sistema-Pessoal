'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { EventoAgenda, listarEventosAgenda, atualizarEventoAgenda } from '@/lib/agenda'
import { dataLocalIso, dataLocalSomandoDias } from '@/lib/date'
import { estadoTreinoAgendado } from '@/lib/treino-presenca'
import { Button } from '@/components/ui/button'

export function PresencasTreino() {
  const [eventos, setEventos] = useState<EventoAgenda[]>([])
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [hoje, setHoje] = useState(() => dataLocalIso())
  const carregar = useCallback(async () => {
    const dados = await listarEventosAgenda(dataLocalSomandoDias(-30), dataLocalSomandoDias(7))
    if (!dados) { setErro('Não foi possível carregar os treinos agendados.'); return }
    setEventos(dados.filter((e) => e.tipo === 'treino' && e.treino_uuid)); setErro('')
  }, [])
  useEffect(() => {
    const id = setTimeout(() => void carregar(), 0)
    const timer = setInterval(() => setHoje(dataLocalIso()), 15000)
    return () => { clearTimeout(id); clearInterval(timer) }
  }, [carregar])

  return <section className="rounded-xl border border-border bg-card p-4">
    <h2 className="text-lg font-semibold">Presença nos treinos agendados</h2>
    <p className="my-2 text-sm text-muted-foreground">Datas marcadas na Agenda: últimos 30 dias e próximos 7. Após a virada do dia local, um treino sem conclusão aparece como falta. Você pode corrigir depois. O plano semanal é um modelo; marque as datas na Agenda para acompanhá-las.</p>
    {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
    <div className="my-3 flex gap-3"><Link href="/agenda" className="underline">Agendar ou corrigir datas</Link><Button variant="ghost" disabled={ocupado} onClick={() => void carregar()}>Atualizar presenças</Button></div>
    {!eventos.length && <p className="text-sm text-muted-foreground">Nenhum treino com data neste período.</p>}
    <ul className="divide-y divide-border">{eventos.map((e) => <li key={e.uuid} className="flex flex-wrap items-center gap-3 py-3">
      <span className="mr-auto">{e.data.split('-').reverse().join('/')} · {e.titulo} · {{feito:'Feito',falta:'Falta',agendado:'Agendado'}[estadoTreinoAgendado(e.data, e.concluido, hoje)]}</span>
      <Button variant="outline" disabled={ocupado || !!erro} onClick={async () => {
        setOcupado(true)
        try {
          const salvo = await atualizarEventoAgenda(e.uuid, { concluido: !e.concluido }, e)
          if (!salvo) { setErro('Alteração não confirmada. Atualize as presenças antes de tentar novamente.'); return }
          setEventos((atuais) => atuais.map((item) => item.uuid === salvo.uuid ? salvo : item)); setErro('')
        } catch { setErro('Conexão indisponível. Confira as presenças antes de reenviar.') }
        finally { setOcupado(false) }
      }}>{e.concluido ? 'Corrigir para não feito' : 'Marcar como feito'}</Button>
    </li>)}</ul>
  </section>
}
