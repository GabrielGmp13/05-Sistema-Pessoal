'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpenCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Clock3,
  Dumbbell,
  Edit3,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react'

import { BackLink, PageHeader, PageShell } from '@/components/study/page-shell'
import { Field } from '@/components/study/field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  atualizarEventoAgenda,
  criarEventoAgenda,
  deletarEventoAgenda,
  EventoAgenda,
  EventoAgendaInput,
  listarEventosAgenda,
  PrioridadeEventoAgenda,
  TipoEventoAgenda,
} from '@/lib/agenda'
import { Conteudo, listarConteudosPorMateria } from '@/lib/conteudos'
import { listarMaterias, Materia } from '@/lib/materias'
import { listarProvasNoPeriodo, Prova } from '@/lib/provas'
import { getUserId, sb } from '@/lib/supabase'
import { getTodosTreinos, Treino } from '@/lib/treino'
import type { AcaoImportacaoCalendar } from '@/lib/calendar-import'

interface EventoCalendarPrevia {
  id: string
  titulo: string
  data: string
  horaInicio: string | null
  acao: AcaoImportacaoCalendar
  link: string | null
}

interface FormularioEvento {
  titulo: string
  tipo: TipoEventoAgenda
  prioridade: PrioridadeEventoAgenda
  data: string
  horaInicio: string
  duracaoMinutos: string
  descricao: string
  materiaUuid: string
  conteudoUuid: string
  treinoUuid: string
}

const FORMULARIO_VAZIO: FormularioEvento = {
  titulo: '',
  tipo: 'geral',
  prioridade: 'normal',
  data: hojeLocal(),
  horaInicio: '',
  duracaoMinutos: '',
  descricao: '',
  materiaUuid: '',
  conteudoUuid: '',
  treinoUuid: '',
}

const TIPO_LABEL: Record<TipoEventoAgenda, string> = {
  geral: 'Geral',
  estudo: 'Estudo',
  treino: 'Treino',
}

const PRIORIDADE_LABEL: Record<PrioridadeEventoAgenda, string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
}

function hojeLocal() {
  const hoje = new Date()
  hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset())
  return hoje.toISOString().slice(0, 10)
}

function dataLocal(valor: string) {
  return new Date(`${valor}T12:00:00`)
}

function isoLocal(data: Date) {
  const copia = new Date(data)
  copia.setMinutes(copia.getMinutes() - copia.getTimezoneOffset())
  return copia.toISOString().slice(0, 10)
}

function inicioDaSemana(valor: string) {
  const data = dataLocal(valor)
  const dia = data.getDay()
  data.setDate(data.getDate() - (dia === 0 ? 6 : dia - 1))
  return data
}

function somarDias(data: Date, quantidade: number) {
  const nova = new Date(data)
  nova.setDate(nova.getDate() + quantidade)
  return nova
}

function formatarDia(data: Date) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
    .format(data)
    .replace('.', '')
}

function formatarPeriodo(inicio: Date, fim: Date) {
  return `${inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${fim.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
}

export default function AgendaPage() {
  const [dataReferencia, setDataReferencia] = useState(hojeLocal())
  const [eventos, setEventos] = useState<EventoAgenda[]>([])
  const [provas, setProvas] = useState<Prova[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [treinos, setTreinos] = useState<Treino[]>([])
  const [conteudos, setConteudos] = useState<Conteudo[]>([])
  const [formulario, setFormulario] = useState<FormularioEvento>(FORMULARIO_VAZIO)
  const [eventoEditando, setEventoEditando] = useState<EventoAgenda | null>(null)
  const [eventoParaApagar, setEventoParaApagar] = useState<EventoAgenda | null>(null)
  const [diaAberto, setDiaAberto] = useState<string | null>(null)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [googleConectado, setGoogleConectado] = useState(false)
  const [exportandoUuid, setExportandoUuid] = useState<string | null>(null)
  const [importandoCalendar, setImportandoCalendar] = useState(false)
  const [previaCalendar, setPreviaCalendar] = useState<EventoCalendarPrevia[]>([])
  const [selecionadosCalendar, setSelecionadosCalendar] = useState<Set<string>>(new Set())
  const sincronizacaoEmCursoRef = useRef(false)

  const semana = useMemo(() => {
    const inicio = inicioDaSemana(dataReferencia)
    const dias = Array.from({ length: 7 }, (_, indice) => somarDias(inicio, indice))
    return { inicio, fim: dias[6], dias }
  }, [dataReferencia])
  const mesCalendario = useMemo(() => {
    const referencia = dataLocal(dataReferencia)
    const primeiro = new Date(referencia.getFullYear(), referencia.getMonth(), 1)
    const ultimo = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0)
    const inicio = new Date(primeiro)
    inicio.setDate(inicio.getDate() - inicio.getDay())
    const fim = new Date(ultimo)
    fim.setDate(fim.getDate() + (6 - fim.getDay()))
    const dias: Date[] = []
    for (const cursor = new Date(inicio); cursor <= fim; cursor.setDate(cursor.getDate() + 1)) dias.push(new Date(cursor))
    return { inicio, fim, dias, mes: referencia.getMonth() }
  }, [dataReferencia])

  const inicioIso = isoLocal(mesCalendario.inicio)
  const fimIso = isoLocal(mesCalendario.fim)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const [eventosAtuais, provasAtuais, materiasAtuais, userId] = await Promise.all([
      listarEventosAgenda(inicioIso, fimIso),
      listarProvasNoPeriodo(inicioIso, fimIso),
      listarMaterias(),
      getUserId(),
    ])
    const treinosAtuais = userId ? await getTodosTreinos(sb, userId) : []

    if (eventosAtuais === null || provasAtuais === null || materiasAtuais === null) {
      setErro('Não foi possível carregar todos os dados da agenda.')
    } else {
      setEventos(eventosAtuais)
      setProvas(provasAtuais)
      setMaterias(materiasAtuais)
      setTreinos(treinosAtuais)
      setErro('')
    }
    setCarregando(false)
  }, [fimIso, inicioIso])

  const sincronizarAutomaticamente = useCallback(async (informarResultado = false) => {
    if (!googleConectado || sincronizacaoEmCursoRef.current) return
    sincronizacaoEmCursoRef.current = true
    setImportandoCalendar(true)
    if (informarResultado) {
      setErro('')
      setMensagem('')
    }

    try {
      const consulta = await fetch('/api/integracoes/google/calendar/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inicio: inicioIso, fim: fimIso }),
      })
      const comparacao = await consulta.json() as { eventos?: EventoCalendarPrevia[]; erro?: string }
      if (!consulta.ok) throw new Error(comparacao.erro || 'Não foi possível consultar o Google Calendar.')

      const eventosRemotos = comparacao.eventos ?? []
      const idsAplicaveis = eventosRemotos
        .filter((evento) => ['novo', 'atualizar', 'cancelar'].includes(evento.acao))
        .map((evento) => evento.id)
      const conflitos = eventosRemotos.filter((evento) => evento.acao === 'conflito')
      setPreviaCalendar(conflitos)
      setSelecionadosCalendar(new Set())

      if (idsAplicaveis.length > 0) {
        const aplicacao = await fetch('/api/integracoes/google/calendar/import', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inicio: inicioIso, fim: fimIso, aplicarIds: idsAplicaveis }),
        })
        const resultado = await aplicacao.json() as { erro?: string }
        if (!aplicacao.ok) throw new Error(resultado.erro || 'Não foi possível aplicar as mudanças do Google Calendar.')
      }

      const eventosLocais = await listarEventosAgenda(inicioIso, fimIso)
      const pendentes = (eventosLocais ?? []).filter((evento) => (
        !evento.google_calendar_synced_at
        || new Date(evento.updated_at).getTime() > new Date(evento.google_calendar_synced_at).getTime()
      ))
      for (const evento of pendentes) {
        const envio = await fetch('/api/integracoes/google/calendar/export', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agendaUuid: evento.uuid }),
        })
        if (!envio.ok) {
          const resultado = await envio.json().catch(() => null) as { erro?: string } | null
          throw new Error(resultado?.erro || `Não foi possível sincronizar “${evento.titulo}”.`)
        }
      }

      await carregar()
      window.dispatchEvent(new Event('agenda-atualizada'))
      if (informarResultado) {
        setMensagem(conflitos.length > 0
          ? `Sincronização concluída com ${conflitos.length} conflito${conflitos.length === 1 ? '' : 's'} para revisar.`
          : 'Agenda sincronizada com o Google Calendar.')
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível sincronizar o Google Calendar.')
    } finally {
      sincronizacaoEmCursoRef.current = false
      setImportandoCalendar(false)
    }
  }, [carregar, fimIso, googleConectado, inicioIso])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void carregar(), 0)
    const atualizarAgenda = () => void carregar()
    window.addEventListener('agenda-atualizada', atualizarAgenda)
    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('agenda-atualizada', atualizarAgenda)
    }
  }, [carregar])

  useEffect(() => {
    void fetch('/api/integracoes/google/status', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((status: { conexoes?: { calendar?: { conectado?: boolean } } } | null) =>
        setGoogleConectado(Boolean(status?.conexoes?.calendar?.conectado)),
      )
      .catch(() => setGoogleConectado(false))
  }, [])

  useEffect(() => {
    let ativo = true
    const timeoutId = window.setTimeout(() => {
      setConteudos([])
      if (formulario.tipo !== 'estudo' || !formulario.materiaUuid) return
      void listarConteudosPorMateria(formulario.materiaUuid).then((lista) => {
        if (ativo) setConteudos(lista ?? [])
      })
    }, 0)
    return () => {
      ativo = false
      window.clearTimeout(timeoutId)
    }
  }, [formulario.materiaUuid, formulario.tipo])

  function abrirNovo(data = hojeLocal()) {
    setEventoEditando(null)
    setFormulario({ ...FORMULARIO_VAZIO, data })
    setDialogAberto(true)
  }

  function abrirEdicao(evento: EventoAgenda) {
    setEventoEditando(evento)
    setFormulario({
      titulo: evento.titulo,
      tipo: evento.tipo,
      prioridade: evento.prioridade,
      data: evento.data,
      horaInicio: evento.hora_inicio?.slice(0, 5) ?? '',
      duracaoMinutos: evento.duracao_minutos?.toString() ?? '',
      descricao: evento.descricao ?? '',
      materiaUuid: evento.materia_uuid ?? '',
      conteudoUuid: evento.conteudo_uuid ?? '',
      treinoUuid: evento.treino_uuid ?? '',
    })
    setDialogAberto(true)
  }

  function mudarTipo(tipo: TipoEventoAgenda) {
    setFormulario((atual) => ({
      ...atual,
      tipo,
      materiaUuid: tipo === 'estudo' ? atual.materiaUuid : '',
      conteudoUuid: tipo === 'estudo' ? atual.conteudoUuid : '',
      treinoUuid: tipo === 'treino' ? atual.treinoUuid : '',
    }))
  }

  function montarInput(): EventoAgendaInput {
    return {
      titulo: formulario.titulo.trim(),
      tipo: formulario.tipo,
      prioridade: formulario.prioridade,
      data: formulario.data,
      hora_inicio: formulario.horaInicio || null,
      duracao_minutos: formulario.duracaoMinutos ? Number(formulario.duracaoMinutos) : null,
      descricao: formulario.descricao.trim() || null,
      materia_uuid: formulario.tipo === 'estudo' ? formulario.materiaUuid || null : null,
      conteudo_uuid: formulario.tipo === 'estudo' ? formulario.conteudoUuid || null : null,
      treino_uuid: formulario.tipo === 'treino' ? formulario.treinoUuid || null : null,
      concluido: eventoEditando?.concluido ?? false,
    }
  }

  async function enviarMudancaAoGoogle(agendaUuid: string, method: 'POST' | 'DELETE' = 'POST') {
    if (!googleConectado) return
    const response = await fetch('/api/integracoes/google/calendar/export', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agendaUuid }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { erro?: string } | null
      throw new Error(body?.erro || 'A mudança foi salva aqui, mas não chegou ao Google Calendar.')
    }
  }

  async function salvarEvento(event: React.FormEvent) {
    event.preventDefault()
    if (!formulario.titulo.trim()) return
    if (formulario.tipo === 'estudo' && !formulario.materiaUuid) return
    if (formulario.tipo === 'treino' && !formulario.treinoUuid) return

    setSalvando(true)
    const input = montarInput()
    const salvo = eventoEditando
      ? await atualizarEventoAgenda(eventoEditando.uuid, input)
      : await criarEventoAgenda(input)

    if (!salvo) {
      setErro('Não foi possível salvar o compromisso.')
    } else {
      try {
        await enviarMudancaAoGoogle(salvo.uuid)
        setMensagem(googleConectado ? 'Compromisso salvo e sincronizado com o Google Calendar.' : 'Compromisso salvo.')
      } catch (error) {
        setErro(error instanceof Error ? error.message : 'Compromisso salvo, mas não sincronizado com o Google Calendar.')
      }
      setDialogAberto(false)
      await carregar()
      window.dispatchEvent(new Event('agenda-atualizada'))
    }
    setSalvando(false)
  }

  async function alternarConcluido(evento: EventoAgenda) {
    const atualizado = await atualizarEventoAgenda(evento.uuid, { concluido: !evento.concluido })
    if (!atualizado) setErro('Não foi possível atualizar o compromisso.')
    else {
      await carregar()
      window.dispatchEvent(new Event('agenda-atualizada'))
    }
  }

  async function alternarEventoEditando() {
    if (!eventoEditando) return
    await alternarConcluido(eventoEditando)
    setDialogAberto(false)
  }

  async function exportarGoogleCalendar(evento: EventoAgenda) {
    setExportandoUuid(evento.uuid)
    setErro('')
    setMensagem('')
    try {
      const response = await fetch('/api/integracoes/google/calendar/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agendaUuid: evento.uuid }),
      })
      const body = await response.json() as { atualizado?: boolean; erro?: string }
      if (!response.ok) throw new Error(body.erro || 'Não foi possível exportar o compromisso.')
      setMensagem(body.atualizado ? 'Evento atualizado no Google Calendar.' : 'Evento criado no Google Calendar.')
      await carregar()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível exportar o compromisso.')
    } finally {
      setExportandoUuid(null)
    }
  }

  async function aplicarGoogleCalendar() {
    if (selecionadosCalendar.size === 0) return
    setImportandoCalendar(true)
    setErro('')
    try {
      const response = await fetch('/api/integracoes/google/calendar/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inicio: inicioIso, fim: fimIso, aplicarIds: [...selecionadosCalendar] }),
      })
      const body = await response.json() as { aplicados?: number; erro?: string }
      if (!response.ok) throw new Error(body.erro || 'Não foi possível importar os eventos.')
      setMensagem(`${body.aplicados ?? 0} evento${body.aplicados === 1 ? '' : 's'} sincronizado${body.aplicados === 1 ? '' : 's'} com a Agenda.`)
      setPreviaCalendar([])
      setSelecionadosCalendar(new Set())
      await carregar()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível importar os eventos.')
    } finally {
      setImportandoCalendar(false)
    }
  }

  async function apagarEvento() {
    if (!eventoParaApagar) return
    if (googleConectado) {
      try {
        await enviarMudancaAoGoogle(eventoParaApagar.uuid, 'DELETE')
      } catch (error) {
        setErro(error instanceof Error ? error.message : 'Não foi possível apagar o compromisso no Google Calendar.')
        return
      }
    }
    const apagado = await deletarEventoAgenda(eventoParaApagar.uuid)
    if (!apagado) setErro('Não foi possível apagar o compromisso.')
    else {
      setMensagem(googleConectado ? 'Compromisso apagado daqui e do Google Calendar.' : 'Compromisso apagado.')
      await carregar()
      window.dispatchEvent(new Event('agenda-atualizada'))
    }
  }

  function navegarPeriodo(direcao: -1 | 1) {
    const atual = dataLocal(dataReferencia)
    atual.setMonth(atual.getMonth() + direcao, 1)
    setDataReferencia(isoLocal(atual))
  }

  const materiasPorUuid = useMemo(
    () => new Map(materias.map((materia) => [materia.uuid, materia])),
    [materias],
  )
  const treinosPorUuid = useMemo(
    () => new Map(treinos.map((treino) => [treino.uuid, treino])),
    [treinos],
  )

  return (
    <PageShell className="max-w-7xl">
      <div className="mb-5"><BackLink href="/">Voltar ao início</BackLink></div>
      <PageHeader
        title="Agenda"
        description="Mês completo e semana selecionada, sincronizados automaticamente com o Google Calendar."
        actions={<><Button type="button" variant="outline" disabled={!googleConectado || importandoCalendar} onClick={() => void sincronizarAutomaticamente(true)} title={googleConectado ? 'Sincronizar agora com o Google Calendar' : 'Conecte o Calendar em Configurações'}><RefreshCw className={importandoCalendar ? 'animate-spin' : ''} />{importandoCalendar ? 'Sincronizando...' : 'Sincronizar agora'}</Button><Button type="button" onClick={() => abrirNovo(dataReferencia)}><Plus />Novo compromisso</Button></>}
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" onClick={() => navegarPeriodo(-1)} aria-label="Período anterior"><ChevronLeft /></Button>
          <Button type="button" variant="outline" onClick={() => setDataReferencia(hojeLocal())}>Hoje</Button>
          <Button type="button" variant="outline" size="icon" onClick={() => navegarPeriodo(1)} aria-label="Próximo período"><ChevronRight /></Button>
        </div>
        <div className="flex flex-col gap-1 sm:items-end">
          <strong className="text-sm font-semibold capitalize">{dataLocal(dataReferencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong>
          <Input type="date" value={dataReferencia} onChange={(event) => setDataReferencia(event.target.value)} className="w-40" aria-label="Escolher data" />
        </div>
      </div>

      {erro ? <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p> : null}
      {mensagem ? <p role="status" className="mt-5 rounded-lg border border-success/30 bg-success-muted px-3 py-2 text-sm text-foreground">{mensagem}</p> : null}
      {previaCalendar.length > 0 ? (
        <section className="mt-5 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm" aria-label="Prévia de importação do Google Calendar">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="font-semibold">Prévia do Google Calendar</h2><p className="mt-1 text-xs text-muted-foreground">Revise antes de criar, atualizar ou cancelar. Conflitos locais não são sobrescritos.</p></div>
            <Button type="button" size="sm" disabled={importandoCalendar || selecionadosCalendar.size === 0} onClick={() => void aplicarGoogleCalendar()}>Aplicar {selecionadosCalendar.size}</Button>
          </div>
          <div className="mt-4 divide-y divide-border border-y border-border">
            {previaCalendar.map((evento) => {
              const selecionavel = ['novo', 'atualizar', 'cancelar'].includes(evento.acao)
              return <label key={evento.id} className={`flex items-center gap-3 py-3 ${selecionavel ? 'cursor-pointer' : ''}`}>
                <input type="checkbox" checked={selecionadosCalendar.has(evento.id)} disabled={!selecionavel} onChange={(event) => setSelecionadosCalendar((atuais) => { const proximos = new Set(atuais); if (event.target.checked) proximos.add(evento.id); else proximos.delete(evento.id); return proximos })} />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{evento.titulo}</p><p className="text-xs text-muted-foreground">{evento.data}{evento.horaInicio ? ` · ${evento.horaInicio}` : ' · dia inteiro'}</p></div>
                <Badge variant={evento.acao === 'conflito' ? 'warning' : evento.acao === 'sem_alteracao' ? 'outline' : 'default'}>{evento.acao === 'novo' ? 'Novo' : evento.acao === 'atualizar' ? 'Atualizar' : evento.acao === 'cancelar' ? 'Cancelar' : evento.acao === 'conflito' ? 'Conflito local' : 'Sem alteração'}</Badge>
              </label>
            })}
          </div>
          <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={() => { setPreviaCalendar([]); setSelecionadosCalendar(new Set()) }}>Fechar prévia</Button>
        </section>
      ) : null}

      <section className="mt-6" aria-labelledby="agenda-mes-titulo">
        <h2 id="agenda-mes-titulo" className="mb-3 text-lg font-semibold">Visão do mês</h2>
        <div className="overflow-x-auto">
          <div className="grid min-w-[46rem] grid-cols-7 border-l border-t border-border">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => <div key={dia} className="border-b border-r border-border bg-muted/50 px-2 py-2 text-center text-xs font-medium text-muted-foreground">{dia}</div>)}
            {mesCalendario.dias.map((dia) => {
              const data = isoLocal(dia)
              const eventosDoDia = eventos.filter((evento) => evento.data === data)
              const provasDoDia = provas.filter((prova) => prova.data === data)
              const foraDoMes = dia.getMonth() !== mesCalendario.mes
              const selecionado = data === dataReferencia
              const passado = data < hojeLocal()
              return <section key={data} className={`relative min-h-28 cursor-pointer border-b border-r border-border p-2 transition-colors hover:bg-muted/35 ${foraDoMes ? 'bg-muted/25 text-muted-foreground' : 'bg-card'} ${selecionado ? 'ring-2 ring-inset ring-primary' : ''}`} onClick={() => { setDataReferencia(data); setDiaAberto(data) }} aria-label={`Abrir agenda de ${data}`}><div className="flex items-center justify-between"><span className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${data === hojeLocal() ? 'bg-primary text-primary-foreground' : ''}`}>{dia.getDate()}</span><Button type="button" size="icon-xs" variant="ghost" onClick={(event) => { event.stopPropagation(); abrirNovo(data) }} aria-label={`Adicionar compromisso em ${data}`}><Plus /></Button></div><div className="mt-2 space-y-1">{provasDoDia.slice(0, 2).map((prova) => <div key={prova.uuid} className="truncate rounded bg-primary/10 px-1.5 py-1 text-[11px] text-primary" title={prova.titulo || 'Prova'}>{prova.titulo || 'Prova'}</div>)}{eventosDoDia.slice(0, 3).map((evento) => <button type="button" key={evento.uuid} className={`flex w-full items-center gap-1 truncate rounded px-1.5 py-1 text-left text-[11px] ${evento.concluido ? 'bg-muted line-through' : 'bg-secondary'}`} title={`${PRIORIDADE_LABEL[evento.prioridade]} · ${evento.titulo}`} aria-label={`${evento.titulo}, prioridade ${PRIORIDADE_LABEL[evento.prioridade].toLowerCase()}`} onClick={(event) => { event.stopPropagation(); abrirEdicao(evento) }}><span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${evento.prioridade === 'alta' ? 'bg-warning' : evento.prioridade === 'baixa' ? 'bg-primary/45' : 'bg-muted-foreground/55'}`} /><span className="truncate">{evento.hora_inicio ? `${evento.hora_inicio.slice(0, 5)} ` : ''}{evento.titulo}</span></button>)}{eventosDoDia.length + provasDoDia.length > 5 ? <p className="text-[10px] text-muted-foreground">+{eventosDoDia.length + provasDoDia.length - 5} itens</p> : null}</div>{passado ? <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-10" style={{ background: 'linear-gradient(to top right, transparent calc(50% - 0.75px), color-mix(in oklch, var(--muted-foreground) 65%, transparent) 50%, transparent calc(50% + 0.75px))' }} /> : null}</section>
            })}
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="agenda-semana-titulo">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div><h2 id="agenda-semana-titulo" className="text-lg font-semibold">Semana selecionada</h2><p className="mt-1 text-xs text-muted-foreground">{formatarPeriodo(semana.inicio, semana.fim)}</p></div>
        </div>
        <AgendaSemanal dias={semana.dias} eventos={eventos} provas={provas} carregando={carregando} onAbrirDia={(data) => { setDataReferencia(data); setDiaAberto(data) }} onNovo={abrirNovo} onEditar={abrirEdicao} onAlternar={alternarConcluido} />
      </section>

      {diaAberto ? <DiaAgendaDialog data={diaAberto} eventos={eventos.filter((evento) => evento.data === diaAberto)} provas={provas.filter((prova) => prova.data === diaAberto)} materiasPorUuid={materiasPorUuid} treinosPorUuid={treinosPorUuid} onClose={() => setDiaAberto(null)} onNovo={() => { setDiaAberto(null); abrirNovo(diaAberto) }} onEditar={(evento) => { setDiaAberto(null); abrirEdicao(evento) }} onApagar={(evento) => { setDiaAberto(null); setEventoParaApagar(evento) }} onAlternar={(evento) => void alternarConcluido(evento)} /> : null}

      {dialogAberto ? (
        <EventoDialog
          formulario={formulario}
          editando={eventoEditando !== null}
          salvando={salvando}
          concluido={eventoEditando?.concluido}
          materias={materias}
          conteudos={conteudos}
          treinos={treinos}
          onChange={setFormulario}
          onMudarTipo={mudarTipo}
          onClose={() => setDialogAberto(false)}
          onSubmit={salvarEvento}
          onAlternarConcluido={eventoEditando ? alternarEventoEditando : undefined}
          onApagar={eventoEditando ? () => { setDialogAberto(false); setEventoParaApagar(eventoEditando) } : undefined}
          onExportar={eventoEditando && googleConectado ? () => void exportarGoogleCalendar(eventoEditando) : undefined}
          exportando={eventoEditando ? exportandoUuid === eventoEditando.uuid : false}
        />
      ) : null}

      <ConfirmDialog
        open={eventoParaApagar !== null}
        title="Apagar compromisso?"
        description={`"${eventoParaApagar?.titulo ?? ''}" será removido da Agenda.`}
        confirmLabel="Apagar"
        onOpenChange={(open) => { if (!open) setEventoParaApagar(null) }}
        onConfirm={apagarEvento}
      />
    </PageShell>
  )
}

const ALTURA_HORA = 48

function minutosDoHorario(hora: string) {
  const [horas, minutos] = hora.slice(0, 5).split(':').map(Number)
  return horas * 60 + minutos
}

function AgendaSemanal({ dias, eventos, provas, carregando, onAbrirDia, onNovo, onEditar, onAlternar }: {
  dias: Date[]
  eventos: EventoAgenda[]
  provas: Prova[]
  carregando: boolean
  onAbrirDia: (data: string) => void
  onNovo: (data: string) => void
  onEditar: (evento: EventoAgenda) => void
  onAlternar: (evento: EventoAgenda) => Promise<void>
}) {
  const eventosComHora = eventos.filter((evento) => evento.hora_inicio && dias.some((dia) => isoLocal(dia) === evento.data))
  const itensDiaInteiro = dias.map((dia) => {
    const data = isoLocal(dia)
    return {
      data,
      eventos: eventos.filter((evento) => evento.data === data && !evento.hora_inicio),
      provas: provas.filter((prova) => prova.data === data),
    }
  })

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground">
      <div className="overflow-x-auto">
        <div className="min-w-[58rem]">
          <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))] border-b border-border bg-muted/35">
            <div className="border-r border-border p-2 text-[10px] text-muted-foreground">GMT-3</div>
            {dias.map((dia) => {
              const data = isoLocal(dia)
              const hoje = data === hojeLocal()
              return <button type="button" key={data} onClick={() => onAbrirDia(data)} className={`border-r border-border px-2 py-2 text-center last:border-r-0 ${hoje ? 'bg-primary/10 text-primary' : ''}`}><span className="block text-[10px] font-semibold uppercase text-muted-foreground">{formatarDia(dia)}</span><strong className="mt-0.5 block text-lg tabular-nums">{dia.getDate()}</strong></button>
            })}
          </div>

          <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))] border-b border-border">
            <div className="border-r border-border px-1 py-2 text-[10px] text-muted-foreground">Dia inteiro</div>
            {itensDiaInteiro.map((item) => <div key={item.data} className="min-h-12 space-y-1 border-r border-border p-1 last:border-r-0">{item.provas.map((prova) => <button type="button" key={prova.uuid} onClick={() => onAbrirDia(item.data)} className="block w-full truncate rounded bg-primary/10 px-1.5 py-1 text-left text-[10px] text-primary">{prova.titulo || 'Prova'}</button>)}{item.eventos.map((evento) => <button type="button" key={evento.uuid} onClick={() => onEditar(evento)} className={`block w-full truncate rounded bg-secondary px-1.5 py-1 text-left text-[10px] ${evento.concluido ? 'line-through opacity-60' : ''}`}>{evento.titulo}</button>)}{item.eventos.length === 0 && item.provas.length === 0 ? <button type="button" onClick={() => onNovo(item.data)} className="block w-full py-1 text-center text-xs text-muted-foreground/60 hover:text-foreground" aria-label={`Adicionar compromisso em ${item.data}`}><Plus className="mx-auto size-3" /></button> : null}</div>)}
          </div>

          <div className="max-h-[34rem] overflow-y-auto">
            <div className="relative grid grid-cols-[4rem_repeat(7,minmax(0,1fr))]" style={{ height: `${24 * ALTURA_HORA}px` }}>
              <div className="relative border-r border-border">
                {Array.from({ length: 24 }, (_, hora) => <span key={hora} className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground" style={{ top: `${hora * ALTURA_HORA}px` }}>{String(hora).padStart(2, '0')}:00</span>)}
              </div>
              {dias.map((dia) => {
                const data = isoLocal(dia)
                const eventosDoDia = eventosComHora.filter((evento) => evento.data === data)
                return <div key={data} className="relative border-r border-border last:border-r-0">{Array.from({ length: 24 }, (_, hora) => <span aria-hidden="true" key={hora} className="absolute inset-x-0 border-t border-border/70" style={{ top: `${hora * ALTURA_HORA}px` }} />)}{eventosDoDia.map((evento) => {
                  const inicio = minutosDoHorario(evento.hora_inicio!)
                  const duracao = evento.duracao_minutos ?? 60
                  const altura = Math.max(32, Math.min(duracao, 1440 - inicio) * ALTURA_HORA / 60)
                  return <article key={evento.uuid} className={`absolute inset-x-1 z-10 overflow-hidden rounded-md border border-primary/35 bg-primary/10 p-1 text-[10px] shadow-sm ${evento.concluido ? 'opacity-55' : ''}`} style={{ top: `${inicio * ALTURA_HORA / 60}px`, height: `${altura}px` }}><button type="button" onClick={() => onEditar(evento)} className="block w-full truncate text-left font-semibold"><span className={evento.concluido ? 'line-through' : ''}>{evento.titulo}</span><span className="block font-normal text-muted-foreground">{evento.hora_inicio!.slice(0, 5)}{evento.duracao_minutos ? ` · ${evento.duracao_minutos} min` : ''}</span></button><button type="button" onClick={() => void onAlternar(evento)} className="absolute bottom-1 right-1 rounded bg-card/90 px-1.5 py-0.5 font-medium shadow-sm hover:bg-card" aria-label={evento.concluido ? `Reabrir ${evento.titulo}` : `Concluir ${evento.titulo}`}><Check className="mr-0.5 inline size-3" />{evento.concluido ? 'Reabrir' : 'Concluir'}</button></article>
                })}</div>
              })}
              {carregando ? <div className="pointer-events-none absolute inset-0 z-20 animate-pulse bg-muted/30" /> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DiaAgendaDialog({ data, eventos, provas, materiasPorUuid, treinosPorUuid, onClose, onNovo, onEditar, onApagar, onAlternar }: {
  data: string
  eventos: EventoAgenda[]
  provas: Prova[]
  materiasPorUuid: Map<string, Materia>
  treinosPorUuid: Map<string, Treino>
  onClose: () => void
  onNovo: () => void
  onEditar: (evento: EventoAgenda) => void
  onApagar: (evento: EventoAgenda) => void
  onAlternar: (evento: EventoAgenda) => void
}) {
  useEffect(() => {
    function fechar(event: KeyboardEvent) { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', fechar)
    return () => window.removeEventListener('keydown', fechar)
  }, [onClose])

  const tituloData = dataLocal(data).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  const itens = [...eventos].sort((a, b) => (a.hora_inicio ?? '99:99').localeCompare(b.hora_inicio ?? '99:99'))
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation" onMouseDown={onClose}><div role="dialog" aria-modal="true" aria-labelledby="dia-agenda-titulo" className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4 border-b border-border pb-4"><div><p className="text-xs font-medium uppercase text-muted-foreground">Agenda do dia</p><h2 id="dia-agenda-titulo" className="mt-1 text-xl font-semibold capitalize">{tituloData}</h2><p className="mt-1 text-sm text-muted-foreground">{eventos.length + provas.length} {eventos.length + provas.length === 1 ? 'item' : 'itens'}</p></div><Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Fechar"><X /></Button></div><div className="mt-5 space-y-3">{provas.map((prova) => <ProvaAgenda key={prova.uuid} prova={prova} materia={prova.materia_uuid ? materiasPorUuid.get(prova.materia_uuid) : undefined} />)}{itens.map((evento) => <EventoCard key={evento.uuid} evento={evento} materia={evento.materia_uuid ? materiasPorUuid.get(evento.materia_uuid) : undefined} treino={evento.treino_uuid ? treinosPorUuid.get(evento.treino_uuid) : undefined} onEditar={() => onEditar(evento)} onApagar={() => onApagar(evento)} onAlternar={() => onAlternar(evento)} />)}{eventos.length === 0 && provas.length === 0 ? <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">Nada marcado para este dia.</div> : null}</div><div className="mt-5 flex justify-end border-t border-border pt-4"><Button type="button" onClick={onNovo}><Plus />Novo compromisso</Button></div></div></div>
}

function EventoCard({ evento, materia, treino, onEditar, onApagar, onAlternar }: {
  evento: EventoAgenda
  materia?: Materia
  treino?: Treino
  onEditar: () => void
  onApagar?: () => void
  onAlternar: () => void
}) {
  const Icon = evento.tipo === 'estudo' ? BookOpenCheck : evento.tipo === 'treino' ? Dumbbell : CalendarDays
  return (
    <article className={`rounded-lg border border-border bg-card p-3 text-card-foreground ${evento.concluido ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline">{TIPO_LABEL[evento.tipo]}</Badge>
            <Badge variant={evento.prioridade === 'alta' ? 'warning' : evento.prioridade === 'baixa' ? 'outline' : 'default'}>
              {PRIORIDADE_LABEL[evento.prioridade]}
            </Badge>
          </div>
          <h3 className={`mt-2 break-words text-sm font-semibold ${evento.concluido ? 'line-through' : ''}`}>{evento.titulo}</h3>
          {evento.hora_inicio ? <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" />{evento.hora_inicio.slice(0, 5)}{evento.duracao_minutos ? ` · ${evento.duracao_minutos} min` : ''}</p> : null}
          {materia ? <p className="mt-1 truncate text-xs text-muted-foreground">{materia.nome}</p> : null}
          {treino ? <p className="mt-1 truncate text-xs text-muted-foreground">{treino.nome}</p> : null}
          {evento.descricao ? <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{evento.descricao}</p> : null}
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-1 border-t border-border pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onAlternar} aria-label={evento.concluido ? 'Reabrir compromisso' : 'Concluir compromisso'}><Check />{evento.concluido ? 'Reabrir' : 'Concluir'}</Button>
        <Button type="button" variant="ghost" size="icon-xs" onClick={onEditar} aria-label="Editar compromisso"><Edit3 /></Button>
        {onApagar ? <Button type="button" variant="ghost" size="icon-xs" onClick={onApagar} aria-label="Apagar compromisso"><Trash2 /></Button> : null}
      </div>
    </article>
  )
}

function ProvaAgenda({ prova, materia }: { prova: Prova; materia?: Materia }) {
  const conteudo = (
    <article className="rounded-lg border border-primary/25 bg-primary/5 p-3">
      <div className="flex items-start gap-2">
        <BookOpenCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <Badge>Prova</Badge>
          <h3 className="mt-2 break-words text-sm font-semibold">{prova.titulo || 'Prova'}</h3>
          {materia ? <p className="mt-1 truncate text-xs text-muted-foreground">{materia.nome}</p> : null}
          {prova.feita ? <p className="mt-1 text-xs text-muted-foreground">Concluída em Estudos</p> : null}
        </div>
      </div>
    </article>
  )
  return prova.materia_uuid ? <Link href={`/estudos/materia/${prova.materia_uuid}`} className="outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30">{conteudo}</Link> : conteudo
}

function EventoDialog({ formulario, editando, salvando, concluido, materias, conteudos, treinos, onChange, onMudarTipo, onClose, onSubmit, onAlternarConcluido, onApagar, onExportar, exportando }: {
  formulario: FormularioEvento
  editando: boolean
  salvando: boolean
  concluido?: boolean
  materias: Materia[]
  conteudos: Conteudo[]
  treinos: Treino[]
  onChange: React.Dispatch<React.SetStateAction<FormularioEvento>>
  onMudarTipo: (tipo: TipoEventoAgenda) => void
  onClose: () => void
  onSubmit: (event: React.FormEvent) => void
  onAlternarConcluido?: () => void
  onApagar?: () => void
  onExportar?: () => void
  exportando: boolean
}) {
  useEffect(() => {
    function fechar(event: KeyboardEvent) { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', fechar)
    return () => window.removeEventListener('keydown', fechar)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="evento-dialog-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-border bg-card p-5 text-card-foreground shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-medium uppercase text-muted-foreground">Agenda</p><h2 id="evento-dialog-title" className="mt-1 text-lg font-semibold">{editando ? 'Editar compromisso' : 'Novo compromisso'}</h2></div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Fechar"><X /></Button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tipo" htmlFor="evento-tipo">
            <Select id="evento-tipo" value={formulario.tipo} onChange={(event) => onMudarTipo(event.target.value as TipoEventoAgenda)}>
              <option value="geral">Geral</option><option value="estudo">Estudo</option><option value="treino">Treino</option>
            </Select>
          </Field>
          <Field label="Prioridade" htmlFor="evento-prioridade">
            <Select id="evento-prioridade" value={formulario.prioridade} onChange={(event) => onChange((atual) => ({ ...atual, prioridade: event.target.value as PrioridadeEventoAgenda }))}>
              <option value="baixa">Baixa</option><option value="normal">Normal</option><option value="alta">Alta</option>
            </Select>
          </Field>
          <Field label="Data" htmlFor="evento-data"><Input id="evento-data" type="date" required value={formulario.data} onChange={(event) => onChange((atual) => ({ ...atual, data: event.target.value }))} /></Field>
          <Field label="Título" htmlFor="evento-titulo" className="sm:col-span-2"><Input id="evento-titulo" required value={formulario.titulo} onChange={(event) => onChange((atual) => ({ ...atual, titulo: event.target.value }))} /></Field>
          <Field label="Horário" htmlFor="evento-hora" optional><Input id="evento-hora" type="time" value={formulario.horaInicio} onChange={(event) => onChange((atual) => ({ ...atual, horaInicio: event.target.value }))} /></Field>
          <Field label="Duração em minutos" htmlFor="evento-duracao" optional><Input id="evento-duracao" type="number" min="1" value={formulario.duracaoMinutos} onChange={(event) => onChange((atual) => ({ ...atual, duracaoMinutos: event.target.value }))} /></Field>

          {formulario.tipo === 'estudo' ? <>
            <Field label="Matéria" htmlFor="evento-materia"><Select id="evento-materia" required value={formulario.materiaUuid} onChange={(event) => onChange((atual) => ({ ...atual, materiaUuid: event.target.value, conteudoUuid: '' }))}><option value="">Selecione</option>{materias.map((materia) => <option key={materia.uuid} value={materia.uuid}>{materia.nome}</option>)}</Select></Field>
            <Field label="Conteúdo" htmlFor="evento-conteudo" optional><Select id="evento-conteudo" value={formulario.conteudoUuid} disabled={!formulario.materiaUuid} onChange={(event) => onChange((atual) => ({ ...atual, conteudoUuid: event.target.value }))}><option value="">Nenhum</option>{conteudos.map((item) => <option key={item.uuid} value={item.uuid}>{item.nome}</option>)}</Select></Field>
          </> : null}

          {formulario.tipo === 'treino' ? <Field label="Treino" htmlFor="evento-treino" className="sm:col-span-2"><Select id="evento-treino" required value={formulario.treinoUuid} onChange={(event) => onChange((atual) => ({ ...atual, treinoUuid: event.target.value }))}><option value="">Selecione</option>{treinos.map((treino) => <option key={treino.uuid} value={treino.uuid}>{treino.nome}</option>)}</Select></Field> : null}

          <Field label="Descrição" htmlFor="evento-descricao" optional className="sm:col-span-2"><Textarea id="evento-descricao" value={formulario.descricao} onChange={(event) => onChange((atual) => ({ ...atual, descricao: event.target.value }))} /></Field>
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4 sm:col-span-2">{onAlternarConcluido ? <Button type="button" variant="secondary" onClick={onAlternarConcluido} disabled={salvando} className="mr-auto"><Check />{concluido ? 'Reabrir compromisso' : 'Concluir compromisso'}</Button> : null}{onExportar ? <Button type="button" variant="outline" onClick={onExportar} disabled={salvando || exportando}><CloudUpload className={exportando ? 'animate-pulse' : ''} />{exportando ? 'Enviando...' : 'Enviar ao Google'}</Button> : null}{onApagar ? <Button type="button" variant="ghost" onClick={onApagar} disabled={salvando} className="text-destructive"><Trash2 />Apagar</Button> : null}<Button type="button" variant="outline" onClick={onClose} disabled={salvando}>Cancelar</Button><Button type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</Button></div>
        </form>
      </div>
    </div>
  )
}
