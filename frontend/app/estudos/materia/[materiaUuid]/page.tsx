'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  Award,
  BookCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileQuestion,
  GraduationCap,
  Link2,
  Plus,
  Target,
  Trash2,
} from 'lucide-react'

import { BackLink, PageHeader, PageShell } from '@/components/study/page-shell'
import { Section } from '@/components/study/section'
import { MonoLabel } from '@/components/study/mono-label'
import { EmptyState } from '@/components/study/empty-state'
import { Field } from '@/components/study/field'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

import { buscarMateria, Materia } from '../../../../lib/materias'
import {
  criarConteudo,
  listarConteudosPorMateria,
  atualizarConteudo,
  deletarConteudo,
  vincularConteudoAMateria,
  Conteudo,
} from '../../../../lib/conteudos'
import {
  listarProvasPorMateria,
  criarProva,
  deletarProva,
  Prova,
} from '../../../../lib/provas'
import {
  listarAtividades,
  criarAtividade,
  atualizarAtividade,
  deletarAtividade,
  Atividade,
} from '../../../../lib/atividades'
import {
  registrarQuestao,
  taxaDeAcertoRecente,
} from '../../../../lib/questoes-individuais'
import {
  listarSimuladosPorMateria,
  registrarSimulado,
  Simulado,
} from '../../../../lib/simulados'
import {
  avaliarCardPorConteudo,
  buscarCardsRevisao,
  CardRevisao,
} from '../../../../lib/revisao'

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// Escala de qualidade do SM-2 (estilo Anki) — 4 botões em vez de nota 0-5 solta.
const BOTOES_QUALIDADE: { label: string; qualidade: number }[] = [
  { label: 'Errei', qualidade: 1 },
  { label: 'Difícil', qualidade: 3 },
  { label: 'Bom', qualidade: 4 },
  { label: 'Fácil', qualidade: 5 },
]

export default function MateriaDetalhePage() {
  const params = useParams<{ materiaUuid: string }>()
  const materiaUuid = params.materiaUuid
  const searchParams = useSearchParams()
  // Contexto de onde a matéria foi acessada — decide o que a página mostra.
  // A matéria em si é uma linha única (mostra_escola/mostra_enem só marcam
  // ONDE ela aparece na navegação); o que é exibido AQUI é decidido pela
  // origem da navegação, não por um campo da matéria. Default 'escola' se
  // a página for aberta direto, sem vir de nenhum link (ex: link salvo).
  const from = (searchParams.get('from') === 'enem' ? 'enem' : 'escola') as 'enem' | 'escola'

  const [materia, setMateria] = useState<Materia | null>(null)
  const [conteudos, setConteudos] = useState<Conteudo[]>([])
  const [cardsRevisao, setCardsRevisao] = useState<Record<string, CardRevisao>>({})
  const [provas, setProvas] = useState<Prova[]>([])
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [simulados, setSimulados] = useState<Simulado[]>([])
  const [taxaAcerto, setTaxaAcerto] = useState<number | null>(null)
  const [carregando, setCarregando] = useState(true)

  const [novoConteudoNome, setNovoConteudoNome] = useState('')
  const [novaProva, setNovaProva] = useState({ titulo: '', data: '' })
  const [novaAtividade, setNovaAtividade] = useState({ titulo: '', data_entrega: '' })
  const [novaQuestao, setNovaQuestao] = useState({ acertou: true, conteudo_uuid: '' })
  const [novoSimulado, setNovoSimulado] = useState({
    total_questoes: '',
    total_acertos: '',
    conteudo_uuid: '',
  })

  async function carregar() {
    const [materiaAtual, cont, prov, ativ, sim, taxa] = await Promise.all([
      buscarMateria(materiaUuid),
      listarConteudosPorMateria(materiaUuid),
      from === 'escola' ? listarProvasPorMateria(materiaUuid) : Promise.resolve([]),
      from === 'escola' ? listarAtividades(materiaUuid) : Promise.resolve([]),
      listarSimuladosPorMateria(materiaUuid),
      taxaDeAcertoRecente(30, materiaUuid),
    ])
    setMateria(materiaAtual)
    setConteudos(cont ?? [])
    setProvas(prov ?? [])
    setAtividades(ativ ?? [])
    setSimulados(sim ?? [])
    setTaxaAcerto(taxa)

    const revisaoUuids = (cont ?? [])
      .map((c) => c.revisao_uuid)
      .filter((u): u is string => u !== null)
    if (revisaoUuids.length > 0) {
      const cards = await buscarCardsRevisao(revisaoUuids)
      const mapa: Record<string, CardRevisao> = {}
      ;(cards ?? []).forEach((card) => { mapa[card.uuid] = card })
      setCardsRevisao(mapa)
    } else {
      setCardsRevisao({})
    }

    setCarregando(false)
  }

  useEffect(() => {
    if (materiaUuid) carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materiaUuid, from])

  async function handleCriarConteudo(e: React.FormEvent) {
    e.preventDefault()
    if (!novoConteudoNome.trim()) return
    await criarConteudo(
      { nome: novoConteudoNome.trim(), teoria_vista: false, dominado_manual: false, revisao_uuid: null, modulo_curso_uuid: null },
      [materiaUuid],
    )
    setNovoConteudoNome('')
    await carregar()
  }

  async function handleToggleTeoriaVista(uuid: string, atual: boolean) {
    await atualizarConteudo(uuid, { teoria_vista: !atual })
    await carregar()
  }

  async function handleToggleDominadoManual(uuid: string, atual: boolean) {
    await atualizarConteudo(uuid, { dominado_manual: !atual })
    await carregar()
  }

  async function handleAvaliarRevisao(conteudoUuid: string, qualidade: number) {
    await avaliarCardPorConteudo(conteudoUuid, qualidade)
    await carregar()
  }

  async function handleApagarConteudo(uuid: string) {
    await deletarConteudo(uuid)
    await carregar()
  }

  async function handleVincularOutraMateria(conteudoUuid: string) {
    const alvoUuid = window.prompt(
      'UUID de outra matéria pra vincular este conteúdo também:',
    )
    if (!alvoUuid) return
    await vincularConteudoAMateria(conteudoUuid, alvoUuid)
    await carregar()
  }

  async function handleCriarProva(e: React.FormEvent) {
    e.preventDefault()
    if (!novaProva.titulo.trim() || !novaProva.data) return
    await criarProva({
      materia_uuid: materiaUuid,
      tipo: 'escola', // prova ENEM nunca é criada aqui — só em /estudos/enem
      conteudo_uuid: null,
      titulo: novaProva.titulo.trim(),
      data: novaProva.data,
      tempo_minutos: null,
      redacao_uuid: null,
      nota: null,
      feita: false,
      observacoes: null,
    })
    setNovaProva({ titulo: '', data: '' })
    await carregar()
  }

  async function handleApagarProva(uuid: string) {
    await deletarProva(uuid)
    await carregar()
  }

  async function handleCriarAtividade(e: React.FormEvent) {
    e.preventDefault()
    if (!novaAtividade.titulo.trim()) return
    await criarAtividade({
      materia_uuid: materiaUuid,
      titulo: novaAtividade.titulo.trim(),
      data_entrega: novaAtividade.data_entrega || null,
      feita: false,
      entregue: false,
      observacoes: null,
    })
    setNovaAtividade({ titulo: '', data_entrega: '' })
    await carregar()
  }

  async function handleToggleAtividade(a: Atividade, campo: 'feita' | 'entregue') {
    await atualizarAtividade(a.uuid, { [campo]: !a[campo] })
    await carregar()
  }

  async function handleApagarAtividade(uuid: string) {
    await deletarAtividade(uuid)
    await carregar()
  }

  async function handleRegistrarQuestao(e: React.FormEvent) {
    e.preventDefault()
    await registrarQuestao({
      materia_uuid: materiaUuid,
      conteudo_uuid: novaQuestao.conteudo_uuid || null,
      acertou: novaQuestao.acertou,
      data: new Date().toISOString().slice(0, 10),
      prova_uuid: null,
      numero: null,
      motivo_erro: null,
      dificuldade: null,
      letra_marcada: null,
      letra_correta: null,
    })
    await carregar()
  }

  async function handleRegistrarSimulado(e: React.FormEvent) {
    e.preventDefault()
    const total = Number(novoSimulado.total_questoes)
    const acertos = Number(novoSimulado.total_acertos)
    if (!total) return
    await registrarSimulado({
      materia_uuid: materiaUuid,
      data: new Date().toISOString().slice(0, 10),
      total_questoes: total,
      total_acertos: acertos,
      tempo_minutos: null,
      observacoes: null,
      conteudo_uuid: novoSimulado.conteudo_uuid || null,
      redacao_uuid: null,
    })
    setNovoSimulado({ total_questoes: '', total_acertos: '', conteudo_uuid: '' })
    await carregar()
  }

  if (carregando) {
    return (
      <PageShell>
        <div className="mb-5">
          <BackLink href="/estudos">Voltar</BackLink>
        </div>
        <div className="mt-8 flex flex-col gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </PageShell>
    )
  }

  if (!materia) {
    return (
      <PageShell>
        <div className="mb-5">
          <BackLink href="/estudos">Voltar</BackLink>
        </div>
        <PageHeader eyebrow="Matéria" title="Matéria não encontrada" />
        <div className="mt-8">
          <EmptyState
            title="Essa matéria não existe"
            description="Ela pode ter sido removida. Volte e escolha outra."
          />
        </div>
      </PageShell>
    )
  }

  const voltarPara = from === 'enem' ? '/estudos/enem' : '/estudos/escola'
  const voltarLabel = from === 'enem' ? 'Voltar ao ENEM' : 'Voltar à Escola'
  const mostrarProvasEAtividades = from === 'escola'

  return (
    <PageShell>
      <div className="mb-5">
        <BackLink href={voltarPara}>{voltarLabel}</BackLink>
      </div>
      <PageHeader
        eyebrow={from === 'enem' ? 'Matéria · ENEM' : 'Matéria · Escola'}
        title={materia.nome}
        actions={
          taxaAcerto != null ? (
            <Badge variant={taxaAcerto >= 60 ? 'success' : 'warning'}>
              {taxaAcerto}% de acerto (30 dias)
            </Badge>
          ) : (
            <Badge variant="outline">Sem dados de acerto</Badge>
          )
        }
      />

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Conteúdos" value={String(conteudos.length)} icon={GraduationCap} />
        {mostrarProvasEAtividades && (
          <>
            <StatCard label="Provas" value={String(provas.length)} icon={CalendarDays} />
            <StatCard label="Atividades" value={String(atividades.length)} icon={ClipboardList} />
          </>
        )}
        <StatCard label="Simulados" value={String(simulados.length)} icon={Target} />
      </div>

      <div className="mt-10 flex flex-col gap-10">
        {/* Conteúdos */}
        <Section label="Bloco 1" title="Conteúdos" count={conteudos.length}>
          <div className="flex flex-col gap-4">
            {conteudos.length === 0 ? (
              <EmptyState title="Nenhum conteúdo cadastrado" compact />
            ) : (
              <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                {conteudos.map((c) => {
                  const card = c.revisao_uuid ? cardsRevisao[c.revisao_uuid] : null
                  const repeticoes = card?.repeticoes ?? 0
                  const dominado = c.dominado_manual || repeticoes >= 5
                  return (
                    <li key={c.uuid} className="flex flex-col gap-2 px-4 py-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.nome}</span>
                          {dominado && (
                            <Badge variant="success" className="shrink-0">
                              <Award className="size-3" />
                              Dominado
                            </Badge>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant={c.teoria_vista ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => handleToggleTeoriaVista(c.uuid, c.teoria_vista)}
                            title="Marca se você já teve o primeiro contato (aula/leitura) com este conteúdo"
                          >
                            <BookCheck className="size-3.5" />
                            Teoria vista
                          </Button>
                          <Button
                            type="button"
                            variant={c.dominado_manual ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => handleToggleDominadoManual(c.uuid, c.dominado_manual)}
                            title="Marcar como dominado manualmente, independente do número de revisões"
                          >
                            <Award className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleVincularOutraMateria(c.uuid)}
                            aria-label="Vincular a outra matéria"
                            title="Vincular a outra matéria"
                          >
                            <Link2 className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleApagarConteudo(c.uuid)}
                            aria-label="Apagar conteúdo"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <MonoLabel>
                          {card
                            ? `Revisado ${repeticoes}/5 · Próxima: ${formatDate(card.proxima_revisao)}`
                            : 'Ainda sem revisão'}
                        </MonoLabel>
                        <div className="ml-auto flex items-center gap-1">
                          {BOTOES_QUALIDADE.map((b) => (
                            <Button
                              key={b.label}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAvaliarRevisao(c.uuid, b.qualidade)}
                            >
                              {b.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            <Card className="p-3">
              <form onSubmit={handleCriarConteudo} className="flex items-center gap-2">
                <Input
                  value={novoConteudoNome}
                  onChange={(e) => setNovoConteudoNome(e.target.value)}
                  placeholder="Nome do conteúdo (ex: Funções)"
                  className="h-8 text-sm"
                />
                <Button type="submit" size="sm">
                  <Plus className="size-3.5" />
                  Adicionar
                </Button>
              </form>
            </Card>
          </div>
        </Section>

        {mostrarProvasEAtividades && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Provas — só no contexto Escola */}
            <Section label="Bloco 2" title="Provas" count={provas.length}>
              <div className="flex flex-col gap-4">
                {provas.length === 0 ? (
                  <EmptyState icon={CalendarDays} title="Nenhuma prova cadastrada" compact />
                ) : (
                  <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                    {provas.map((p) => (
                      <li key={p.uuid} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-medium">{p.titulo}</span>
                          <MonoLabel>{formatDate(p.data)}</MonoLabel>
                        </div>
                        <div className="ml-auto flex shrink-0 items-center gap-2">
                          <Badge variant={p.feita ? 'success' : 'outline'}>
                            {p.feita ? 'feita' : 'pendente'}
                            {p.nota != null ? ` · ${p.nota}` : ''}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleApagarProva(p.uuid)}
                            aria-label="Apagar prova"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <Card className="p-3">
                  <form onSubmit={handleCriarProva} className="flex flex-col gap-2">
                    <Input
                      value={novaProva.titulo}
                      onChange={(e) => setNovaProva((p) => ({ ...p, titulo: e.target.value }))}
                      placeholder="Título da prova"
                      className="h-8 text-sm"
                    />
                    <Input
                      type="date"
                      value={novaProva.data}
                      onChange={(e) => setNovaProva((p) => ({ ...p, data: e.target.value }))}
                      className="h-8 text-sm"
                    />
                    <Button type="submit" size="sm">
                      <Plus className="size-3.5" />
                      Adicionar prova
                    </Button>
                  </form>
                </Card>
              </div>
            </Section>

            {/* Atividades — só no contexto Escola */}
            <Section label="Bloco 3" title="Atividades" count={atividades.length}>
              <div className="flex flex-col gap-4">
                {atividades.length === 0 ? (
                  <EmptyState icon={ClipboardList} title="Nenhuma atividade cadastrada" compact />
                ) : (
                  <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                    {atividades.map((a) => (
                      <li key={a.uuid} className="flex flex-col gap-2 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium">{a.titulo}</span>
                            <MonoLabel>
                              {a.data_entrega ? formatDate(a.data_entrega) : 'sem data'}
                            </MonoLabel>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="ml-auto"
                            onClick={() => handleApagarAtividade(a.uuid)}
                            aria-label="Apagar atividade"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant={a.feita ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => handleToggleAtividade(a, 'feita')}
                          >
                            {a.feita ? <CheckCircle2 className="size-3.5" /> : null}
                            Feita
                          </Button>
                          <Button
                            type="button"
                            variant={a.entregue ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => handleToggleAtividade(a, 'entregue')}
                          >
                            {a.entregue ? <CheckCircle2 className="size-3.5" /> : null}
                            Entregue
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <Card className="p-3">
                  <form onSubmit={handleCriarAtividade} className="flex items-center gap-2">
                    <Input
                      value={novaAtividade.titulo}
                      onChange={(e) => setNovaAtividade((a) => ({ ...a, titulo: e.target.value }))}
                      placeholder="Título da atividade"
                      className="h-8 text-sm"
                    />
                    <Input
                      type="date"
                      value={novaAtividade.data_entrega}
                      onChange={(e) =>
                        setNovaAtividade((a) => ({ ...a, data_entrega: e.target.value }))
                      }
                      className="h-8 w-36 text-sm"
                    />
                    <Button type="submit" size="sm">
                      <Plus className="size-3.5" />
                    </Button>
                  </form>
                </Card>
              </div>
            </Section>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Questão avulsa — comum aos dois contextos */}
          <Section label={mostrarProvasEAtividades ? 'Bloco 4' : 'Bloco 2'} title="Registrar questão avulsa">
            <Card className="p-4">
              <form onSubmit={handleRegistrarQuestao} className="flex flex-col gap-3">
                <Field label="Conteúdo" optional>
                  <Select
                    value={novaQuestao.conteudo_uuid}
                    onChange={(e) =>
                      setNovaQuestao((q) => ({ ...q, conteudo_uuid: e.target.value }))
                    }
                  >
                    <option value="">(sem conteúdo específico)</option>
                    {conteudos.map((c) => (
                      <option key={c.uuid} value={c.uuid}>
                        {c.nome}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Resultado">
                  <Select
                    value={novaQuestao.acertou ? '1' : '0'}
                    onChange={(e) =>
                      setNovaQuestao((q) => ({ ...q, acertou: e.target.value === '1' }))
                    }
                  >
                    <option value="1">Acertou</option>
                    <option value="0">Errou</option>
                  </Select>
                </Field>
                <Button type="submit" size="sm">
                  <FileQuestion className="size-3.5" />
                  Registrar
                </Button>
              </form>
            </Card>
          </Section>

          {/* Simulados — comum aos dois contextos, dispara SM-2 */}
          <Section label={mostrarProvasEAtividades ? 'Bloco 5' : 'Bloco 3'} title="Simulados" count={simulados.length}>
            <div className="flex flex-col gap-4">
              {simulados.length === 0 ? (
                <EmptyState icon={Target} title="Nenhum simulado registrado" compact />
              ) : (
                <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                  {simulados.map((s) => (
                    <li key={s.uuid} className="flex items-center gap-3 px-4 py-3">
                      <MonoLabel>{formatDate(s.data)}</MonoLabel>
                      <span className="ml-auto font-mono text-sm tabular-nums">
                        {s.total_acertos}/{s.total_questoes}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <Card className="p-3">
                <form onSubmit={handleRegistrarSimulado} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={novoSimulado.total_questoes}
                      onChange={(e) =>
                        setNovoSimulado((s) => ({ ...s, total_questoes: e.target.value }))
                      }
                      placeholder="Total"
                      inputMode="numeric"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={novoSimulado.total_acertos}
                      onChange={(e) =>
                        setNovoSimulado((s) => ({ ...s, total_acertos: e.target.value }))
                      }
                      placeholder="Acertos"
                      inputMode="numeric"
                      className="h-8 text-sm"
                    />
                  </div>
                  <Select
                    value={novoSimulado.conteudo_uuid}
                    onChange={(e) =>
                      setNovoSimulado((s) => ({ ...s, conteudo_uuid: e.target.value }))
                    }
                    className="h-8 text-sm"
                  >
                    <option value="">(sem conteúdo — não dispara revisão)</option>
                    {conteudos.map((c) => (
                      <option key={c.uuid} value={c.uuid}>
                        {c.nome} (dispara SM-2)
                      </option>
                    ))}
                  </Select>
                  <Button type="submit" size="sm">
                    <Plus className="size-3.5" />
                    Registrar simulado
                  </Button>
                </form>
              </Card>
            </div>
          </Section>
        </div>
      </div>
    </PageShell>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof CalendarDays
}) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <Icon className="size-4 text-muted-foreground" />
      <span className="mt-1 text-2xl font-semibold tabular-nums">{value}</span>
      <MonoLabel>{label}</MonoLabel>
    </Card>
  )
}