'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BookOpenCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  Edit3,
  Plus,
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
  TipoEventoAgenda,
} from '@/lib/agenda'
import { Conteudo, listarConteudosPorMateria } from '@/lib/conteudos'
import { listarMaterias, Materia } from '@/lib/materias'
import { listarProvasNoPeriodo, Prova } from '@/lib/provas'
import { getUserId, sb } from '@/lib/supabase'
import { getTodosTreinos, Treino } from '@/lib/treino'

interface FormularioEvento {
  titulo: string
  tipo: TipoEventoAgenda
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
  const [dialogAberto, setDialogAberto] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const semana = useMemo(() => {
    const inicio = inicioDaSemana(dataReferencia)
    const dias = Array.from({ length: 7 }, (_, indice) => somarDias(inicio, indice))
    return { inicio, fim: dias[6], dias }
  }, [dataReferencia])

  const inicioIso = isoLocal(semana.inicio)
  const fimIso = isoLocal(semana.fim)

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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void carregar(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [carregar])

  useEffect(() => {
    if (formulario.tipo !== 'estudo' || !formulario.materiaUuid) {
      setConteudos([])
      return
    }

    let ativo = true
    void listarConteudosPorMateria(formulario.materiaUuid).then((lista) => {
      if (ativo) setConteudos(lista ?? [])
    })
    return () => { ativo = false }
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
      setDialogAberto(false)
      await carregar()
    }
    setSalvando(false)
  }

  async function alternarConcluido(evento: EventoAgenda) {
    const atualizado = await atualizarEventoAgenda(evento.uuid, { concluido: !evento.concluido })
    if (!atualizado) setErro('Não foi possível atualizar o compromisso.')
    else await carregar()
  }

  async function apagarEvento() {
    if (!eventoParaApagar) return
    const apagado = await deletarEventoAgenda(eventoParaApagar.uuid)
    if (!apagado) setErro('Não foi possível apagar o compromisso.')
    else await carregar()
  }

  function navegarSemana(dias: number) {
    setDataReferencia(isoLocal(somarDias(dataLocal(dataReferencia), dias)))
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
        eyebrow="Planejamento"
        title="Agenda"
        description="Compromissos gerais, estudos, provas e treinos organizados por semana."
        actions={<Button type="button" onClick={() => abrirNovo(dataReferencia)}><Plus />Novo compromisso</Button>}
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" onClick={() => navegarSemana(-7)} aria-label="Semana anterior"><ChevronLeft /></Button>
          <Button type="button" variant="outline" onClick={() => setDataReferencia(hojeLocal())}>Hoje</Button>
          <Button type="button" variant="outline" size="icon" onClick={() => navegarSemana(7)} aria-label="Próxima semana"><ChevronRight /></Button>
        </div>
        <div className="flex flex-col gap-1 sm:items-end">
          <strong className="text-sm font-semibold">{formatarPeriodo(semana.inicio, semana.fim)}</strong>
          <Input type="date" value={dataReferencia} onChange={(event) => setDataReferencia(event.target.value)} className="w-40" aria-label="Escolher data" />
        </div>
      </div>

      {erro ? <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p> : null}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {semana.dias.map((dia) => {
          const data = isoLocal(dia)
          const eventosDoDia = eventos.filter((evento) => evento.data === data)
          const provasDoDia = provas.filter((prova) => prova.data === data)
          const hoje = data === hojeLocal()

          return (
            <section key={data} className={`min-w-0 border-t-2 pt-3 ${hoje ? 'border-primary' : 'border-border'}`}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">{formatarDia(dia)}</p>
                  <h2 className="mt-1 text-xl font-semibold tabular-nums">{dia.getDate()}</h2>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => abrirNovo(data)} aria-label={`Adicionar compromisso em ${data}`}><Plus /></Button>
              </div>

              <div className="flex flex-col gap-2">
                {carregando ? <div className="h-20 animate-pulse rounded-lg bg-muted" /> : null}
                {!carregando && eventosDoDia.length === 0 && provasDoDia.length === 0 ? (
                  <p className="py-4 text-xs text-muted-foreground">Sem compromissos</p>
                ) : null}
                {provasDoDia.map((prova) => (
                  <ProvaAgenda key={prova.uuid} prova={prova} materia={prova.materia_uuid ? materiasPorUuid.get(prova.materia_uuid) : undefined} />
                ))}
                {eventosDoDia.map((evento) => (
                  <EventoCard
                    key={evento.uuid}
                    evento={evento}
                    materia={evento.materia_uuid ? materiasPorUuid.get(evento.materia_uuid) : undefined}
                    treino={evento.treino_uuid ? treinosPorUuid.get(evento.treino_uuid) : undefined}
                    onEditar={() => abrirEdicao(evento)}
                    onApagar={() => setEventoParaApagar(evento)}
                    onAlternar={() => void alternarConcluido(evento)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {dialogAberto ? (
        <EventoDialog
          formulario={formulario}
          editando={eventoEditando !== null}
          salvando={salvando}
          materias={materias}
          conteudos={conteudos}
          treinos={treinos}
          onChange={setFormulario}
          onMudarTipo={mudarTipo}
          onClose={() => setDialogAberto(false)}
          onSubmit={salvarEvento}
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

function EventoCard({ evento, materia, treino, onEditar, onApagar, onAlternar }: {
  evento: EventoAgenda
  materia?: Materia
  treino?: Treino
  onEditar: () => void
  onApagar: () => void
  onAlternar: () => void
}) {
  const Icon = evento.tipo === 'estudo' ? BookOpenCheck : evento.tipo === 'treino' ? Dumbbell : CalendarDays
  return (
    <article className={`rounded-lg border border-border bg-card p-3 text-card-foreground ${evento.concluido ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <Badge variant="outline">{TIPO_LABEL[evento.tipo]}</Badge>
          <h3 className={`mt-2 break-words text-sm font-semibold ${evento.concluido ? 'line-through' : ''}`}>{evento.titulo}</h3>
          {evento.hora_inicio ? <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" />{evento.hora_inicio.slice(0, 5)}{evento.duracao_minutos ? ` · ${evento.duracao_minutos} min` : ''}</p> : null}
          {materia ? <p className="mt-1 truncate text-xs text-muted-foreground">{materia.nome}</p> : null}
          {treino ? <p className="mt-1 truncate text-xs text-muted-foreground">{treino.nome}</p> : null}
          {evento.descricao ? <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{evento.descricao}</p> : null}
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-1 border-t border-border pt-2">
        <Button type="button" variant="ghost" size="icon-xs" onClick={onAlternar} aria-label={evento.concluido ? 'Reabrir compromisso' : 'Concluir compromisso'}><Check /></Button>
        <Button type="button" variant="ghost" size="icon-xs" onClick={onEditar} aria-label="Editar compromisso"><Edit3 /></Button>
        <Button type="button" variant="ghost" size="icon-xs" onClick={onApagar} aria-label="Apagar compromisso"><Trash2 /></Button>
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

function EventoDialog({ formulario, editando, salvando, materias, conteudos, treinos, onChange, onMudarTipo, onClose, onSubmit }: {
  formulario: FormularioEvento
  editando: boolean
  salvando: boolean
  materias: Materia[]
  conteudos: Conteudo[]
  treinos: Treino[]
  onChange: React.Dispatch<React.SetStateAction<FormularioEvento>>
  onMudarTipo: (tipo: TipoEventoAgenda) => void
  onClose: () => void
  onSubmit: (event: React.FormEvent) => void
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
          <div className="flex justify-end gap-2 border-t border-border pt-4 sm:col-span-2"><Button type="button" variant="outline" onClick={onClose} disabled={salvando}>Cancelar</Button><Button type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</Button></div>
        </form>
      </div>
    </div>
  )
}
