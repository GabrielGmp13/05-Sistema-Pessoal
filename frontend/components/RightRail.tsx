'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, ExternalLink, ImageIcon, Loader2, LogOut, RefreshCw, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { listarEventosAgenda, type EventoAgenda } from '@/lib/agenda'
import { dataLocalIso } from '@/lib/date'
import { listarProvasNoPeriodo, type Prova } from '@/lib/provas'
import { getSignedUrl, getSession, sb } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'
import styles from './RightRail.module.css'

type PerfilResumo = {
  nome: string
  email: string | null
  descricao: string | null
  avatarUrl: string | null
  backgroundUrl: string | null
}

type ItemLinhaTempo = {
  id: string
  data: string
  hora: string | null
  titulo: string
  tipo: 'agenda' | 'prova'
  detalhe: string
}

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const FORMATADOR_DATA = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
const FORMATADOR_MES = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

function dataIso(data: Date) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function montarGradeMes(referencia: Date) {
  const ano = referencia.getFullYear()
  const mes = referencia.getMonth()
  const primeiro = new Date(ano, mes, 1)
  const inicio = new Date(primeiro)
  inicio.setDate(primeiro.getDate() - primeiro.getDay())

  return Array.from({ length: 42 }, (_, indice) => {
    const data = new Date(inicio)
    data.setDate(inicio.getDate() + indice)
    return {
      iso: dataIso(data),
      dia: data.getDate(),
      foraDoMes: data.getMonth() !== mes,
    }
  })
}

function compararItens(a: ItemLinhaTempo, b: ItemLinhaTempo) {
  const data = a.data.localeCompare(b.data)
  if (data !== 0) return data
  return (a.hora ?? '99:99').localeCompare(b.hora ?? '99:99')
}

function formatarHora(hora: string | null) {
  return hora ? hora.slice(0, 5) : 'Dia todo'
}

function criarItemEvento(evento: EventoAgenda): ItemLinhaTempo {
  return {
    id: `agenda-${evento.uuid}`,
    data: evento.data,
    hora: evento.hora_inicio,
    titulo: evento.titulo,
    tipo: 'agenda',
    detalhe: evento.tipo === 'estudo' ? 'Estudo' : evento.tipo === 'treino' ? 'Treino' : 'Agenda',
  }
}

function criarItemProva(prova: Prova): ItemLinhaTempo {
  return {
    id: `prova-${prova.uuid}`,
    data: prova.data,
    hora: null,
    titulo: prova.titulo || 'Prova sem título',
    tipo: 'prova',
    detalhe: 'Prova',
  }
}

export function RightRail({ recolhendo = false }: { recolhendo?: boolean }) {
  const router = useRouter()
  const [agora, setAgora] = useState(() => new Date())
  const [carregando, setCarregando] = useState(true)
  const [saindo, setSaindo] = useState(false)
  const [eventos, setEventos] = useState<EventoAgenda[]>([])
  const [provas, setProvas] = useState<Prova[]>([])
  const [perfil, setPerfil] = useState<PerfilResumo | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const hoje = dataLocalIso(agora)
  const grade = useMemo(() => montarGradeMes(agora), [agora])
  const inicioPainel = grade[0]?.iso ?? hoje
  const fimPainel = grade.at(-1)?.iso ?? hoje
  const eventosPorDia = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const evento of eventos) mapa.set(evento.data, (mapa.get(evento.data) ?? 0) + 1)
    for (const prova of provas) mapa.set(prova.data, (mapa.get(prova.data) ?? 0) + 1)
    return mapa
  }, [eventos, provas])
  const linhaTempo = useMemo(() => [
    ...eventos.filter((evento) => evento.data === hoje).map(criarItemEvento),
    ...provas.filter((prova) => prova.data === hoje).map(criarItemProva),
  ].sort(compararItens), [eventos, hoje, provas])

  async function carregar() {
    setCarregando(true)
    setAviso(null)

    try {
      const [eventosResultado, provasResultado, sessaoResultado] = await Promise.allSettled([
        listarEventosAgenda(inicioPainel, fimPainel),
        listarProvasNoPeriodo(inicioPainel, fimPainel),
        getSession(),
      ])
      const eventosData = eventosResultado.status === 'fulfilled' ? eventosResultado.value : null
      const provasData = provasResultado.status === 'fulfilled' ? provasResultado.value : null
      const session = sessaoResultado.status === 'fulfilled' ? sessaoResultado.value : null

      setEventos(eventosData ?? [])
      setProvas(provasData ?? [])

      if (session) {
        const meta = session.user.user_metadata
        const [avatarResultado, backgroundResultado] = await Promise.allSettled([
          meta?.avatar_path ? getSignedUrl('midias-pessoais', meta.avatar_path) : null,
          meta?.background_path ? getSignedUrl('midias-pessoais', meta.background_path) : null,
        ])
        const avatarSigned = avatarResultado.status === 'fulfilled' ? avatarResultado.value : null
        const backgroundSigned = backgroundResultado.status === 'fulfilled' ? backgroundResultado.value : null

        setPerfil({
          nome: meta?.full_name || meta?.name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email ?? null,
          descricao: meta?.subtitle || null,
          avatarUrl: avatarSigned || meta?.avatar_url || null,
          backgroundUrl: backgroundSigned || meta?.background_url || null,
        })
      } else {
        setPerfil(null)
      }

      const houveFalha = eventosResultado.status === 'rejected'
        || provasResultado.status === 'rejected'
        || sessaoResultado.status === 'rejected'
        || (Boolean(session) && (eventosData === null || provasData === null))
      if (houveFalha) setAviso('Parte dos dados não pôde ser carregada. Tente atualizar.')
    } catch (error) {
      console.error('Erro inesperado ao carregar a coluna pessoal:', error)
      setAviso('Não foi possível atualizar a coluna pessoal.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    const timer = window.setInterval(() => setAgora(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => void carregar(), 0)
    const atualizarPerfil = () => void carregar()
    const atualizarAgenda = () => void carregar()
    window.addEventListener('perfil-atualizado', atualizarPerfil)
    window.addEventListener('agenda-atualizada', atualizarAgenda)
    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener('perfil-atualizado', atualizarPerfil)
      window.removeEventListener('agenda-atualizada', atualizarAgenda)
    }
    // Recarrega quando o dia muda; os demais dados podem ser atualizados pelo botão.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoje])

  const inicial = perfil?.nome.charAt(0).toUpperCase() || 'U'

  async function handleLogout() {
    if (saindo) return
    setSaindo(true)
    try {
      const { error } = await sb.auth.signOut()
      if (error) {
        console.error('Erro ao sair:', error)
        return
      }
      router.replace('/login')
      router.refresh()
    } finally {
      setSaindo(false)
    }
  }

  return (
    <aside className={cn(styles.rail, recolhendo && styles.railRecolhendo)} aria-label="Painel lateral pessoal" aria-hidden={recolhendo || undefined}>
      <section className={cn(styles.card, styles.identidadeCard)} aria-label="Perfil" data-perfil-amplo>
        <div className={styles.capaPerfil}>
          {perfil?.backgroundUrl ? (
            <span aria-hidden="true" style={{ backgroundImage: `url(${perfil.backgroundUrl})` }} />
          ) : (
            <ImageIcon aria-hidden="true" />
          )}
        </div>
        <div className={styles.perfilCorpo}>
          <span className={styles.avatar}>
            {perfil?.avatarUrl ? (
              <span
                aria-hidden="true"
                className={styles.avatarImagem}
                style={{ backgroundImage: `url(${perfil.avatarUrl})` }}
              />
            ) : (
              <span aria-hidden="true">{inicial}</span>
            )}
          </span>
          <div>
            <span className={styles.eyebrow}>Perfil</span>
            <h2>{perfil?.nome || 'Usuário'}</h2>
            {perfil?.descricao ? <p>{perfil.descricao}</p> : perfil?.email ? <p>{perfil.email}</p> : null}
          </div>
        </div>
      </section>

      <section className={cn(styles.card, styles.relogioCard)} aria-label="Relógio">
        <span className={styles.eyebrow}>Agora</span>
        <strong className={styles.hora} suppressHydrationWarning>
          {agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </strong>
        <span className={styles.segundos} suppressHydrationWarning>{agora.toLocaleTimeString('pt-BR', { second: '2-digit' })}s</span>
        <p suppressHydrationWarning>{FORMATADOR_DATA.format(agora)}</p>
      </section>

      <section className={styles.card} aria-label="Calendário do mês">
        <div className={styles.cardTopo}>
          <div>
            <span className={styles.eyebrow}>Calendário</span>
            <h2>{FORMATADOR_MES.format(agora)}</h2>
          </div>
          <CalendarDays aria-hidden="true" />
        </div>
        <div className={styles.calendario}>
          {DIAS_SEMANA.map((dia, indice) => <span key={`${dia}-${indice}`} className={styles.diaSemana}>{dia}</span>)}
          {grade.map((dia) => {
            const quantidade = eventosPorDia.get(dia.iso) ?? 0
            return (
              <span
                key={dia.iso}
                className={cn(
                  styles.dia,
                  dia.foraDoMes && styles.diaFora,
                  dia.iso === hoje && styles.diaHoje,
                  quantidade > 0 && styles.diaComEvento,
                )}
                title={quantidade ? `${quantidade} item(ns)` : undefined}
              >
                {dia.dia}
              </span>
            )
          })}
        </div>
      </section>

      <section className={cn(styles.card, styles.agendaCard)} aria-label="Linha do tempo da agenda">
        <div className={styles.cardTopo}>
          <div>
            <span className={styles.eyebrow}>Agenda</span>
            <h2>Hoje</h2>
          </div>
          <button type="button" className={styles.atualizar} onClick={() => void carregar()} disabled={carregando}>
            {carregando ? <Loader2 aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
            <span className="sr-only">Atualizar agenda lateral</span>
          </button>
        </div>
        {carregando && !linhaTempo.length ? (
          <p className={styles.vazio} role="status">Carregando próximos itens...</p>
        ) : linhaTempo.length ? (
          <ol className={styles.linhaTempo}>
            {linhaTempo.map((item) => (
              <li key={item.id}>
                <span className={cn(styles.marcador, item.tipo === 'prova' && styles.marcadorProva)} />
                <time dateTime={item.data}>{new Date(`${item.data}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</time>
                <strong>{item.titulo}</strong>
                <small>{formatarHora(item.hora)} · {item.detalhe}</small>
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.vazio}>Nada marcado para hoje.</p>
        )}
        <Link href="/agenda" className={styles.linkAgenda}>
          Abrir agenda <ExternalLink aria-hidden="true" />
        </Link>
        {aviso ? <p className={styles.aviso} role="status">{aviso}</p> : null}
      </section>

      <section className={cn(styles.card, styles.controlesCard)} aria-label="Perfil e tema">
        <div className={styles.perfilAcoes}>
          <Link href="/configuracoes">
            <UserRound aria-hidden="true" />
            Editar
          </Link>
          <ThemeToggle className={cn(styles.temaRail, 'theme-toggle--rail')} />
          <button type="button" onClick={handleLogout} disabled={saindo} className={styles.sair}>
            <LogOut aria-hidden="true" />
            <span>{saindo ? 'Saindo...' : 'Sair'}</span>
          </button>
        </div>
      </section>
    </aside>
  )
}
