'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
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
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

import { listarMaterias, Materia } from '../../../../lib/materias'
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
  TipoProva,
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

// Tipos de prova disponíveis por tipo de matéria — nunca inclui enem_dia1/
// enem_dia2 aqui: prova ENEM é gerenciada só em /estudos/enem (cobre a área
// inteira, não uma matéria isolada).
function tiposProvaDisponiveis(tipoMateria: Materia['tipo']): { value: TipoProva; label: string }[] {
  if (tipoMateria === 'curso') return [{ value: 'curso', label: 'Curso' }, { value: 'outro', label: 'Outro' }]
  return [{ value: 'escola', label: 'Escola' }, { value: 'outro', label: 'Outro' }]
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

  const [materia, setMateria] = useState<Materia | null>(null)
  const [conteudos, setConteudos] = useState<Conteudo[]>([])
  const [cardsRevisao, setCardsRevisao] = useState<Record<string, CardRevisao>>({})
  const [provas, setProvas] = useState<Prova[]>([])
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [simulados, setSimulados] = useState<Simulado[]>([])
  const [taxaAcerto, setTaxaAcerto] = useState<number | null>(null)
  const [carregando, setCarregando] = useState(true)

  const [novoConteudoNome, setNovoConteudoNome] = useState('')
  const [novaProva, setNovaProva] = useState({
    titulo: '',
    data: '',
    tipo: 'escola' as TipoProva,
  })
  const [novaAtividade, setNovaAtividade] = useState({
    titulo: '',
    data_entrega: '',
  })
  const [novaQuestao, setNovaQuestao] = useState({
    acertou: true,
    conteudo_uuid: '',
  })
  const [novoSimulado, setNovoSimulado] = useState({
    total_questoes: '',
    total_acertos: '',
    conteudo_uuid: '',
  })

  async function carregar() {
    const [todasMaterias, cont, prov, ativ, sim, taxa] = await Promise.all([
      listarMaterias(),
      listarConteudosPorMateria(materiaUuid),
      listarProvasPorMateria(materiaUuid),
      listarAtividades(materiaUuid),
      listarSimuladosPorMateria(materiaUuid),
      taxaDeAcertoRecente(30, materiaUuid),
    ])
    const materiaAtual = (todasMaterias ?? []).find((m) => m.uuid === materiaUuid) ?? null
    setMateria(materiaAtual)
    setConteudos(cont ?? [])
    setProvas(prov ?? [])
    setAtividades(ativ ?? [])
    setSimulados(sim ?? [])
    setTaxaAcerto(taxa)

    // Ajusta o tipo padrão do form de prova conforme o tipo da matéria
    if (materiaAtual) {
      setNovaProva((p) => ({ ...p, tipo: materiaAtual.tipo === 'curso' ? 'curso' : 'escola' }))
    }

    // Busca os cards de revisão dos conteúdos que já têm revisao_uuid
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
  }, [materiaUuid])

  async function handleCriarConteudo(e: React.FormEvent) {
    e.preventDefault()
    if (!novoConteudoNome.trim()) return
    await criarConteudo(
      { nome: novoConteudoNome.trim(), progresso: 0, revisao_uuid: null, modulo_curso_uuid: null },
      [materiaUuid],
    )
    setNovoConteudoNome('')
    await carregar()
  }

  async function handleAtualizarProgresso(uuid: string, progresso: number) {
    await atualizarConteudo(uuid, { progresso: Math.min(100, progresso) })
    await carregar()
  }

  // Revisão SM-2 — separada do progresso. Qualidade 0-5, mesma escala do
  // algoritmo (ver lib/revisao.ts). Cria o card na primeira avaliação.
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
      'UUID da outra matéria pra vincular este conteúdo (ex: mesma matéria no Escola):',
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
      tipo: novaProva.tipo,
      conteudo_uuid: null,
      titulo: novaProva.titulo.trim(),
      data: novaProva.data,
      tempo_minutos: null,
      redacao_uuid: null,
      nota: null,
      feita: false,
      observacoes: null,
    })
    setNovaProva((p) => ({ titulo: '', data: '', tipo: p.tipo }))
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

  const voltarPara = materia.tipo === 'enem' ? '/estudos/enem' : '/estudos/escola'
  const voltarLabel = materia.tipo === 'enem' ? 'Voltar ao ENEM' : 'Voltar à Escola'
  // Prova ENEM nunca é criada aqui — só na tela /estudos/enem (cobre a área
  // inteira do dia, não uma matéria isolada). Ver DECISIONS.md.
  const mostrarBlocoProvas = materia.tipo !== 'enem'
  const opcoesTipoProva = tiposProvaDisponiveis(materia.tipo)

  return (
    <PageShell>
      <div className="mb-5">
        <BackLink href={voltarPara}>{voltarLabel}</BackLink>
      </div>
      <PageHeader
        eyebrow="Matéria"
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
        <StatCard label="Provas" value={String(provas.length)} icon={CalendarDays} />
        <StatCard label="Atividades" value={String(atividades.length)} icon={ClipboardList} />
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
                  return (
                    <li key={c.uuid} className="flex flex-col gap-2 px-4 py-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.nome}</span>
                          <Progress value={c.progresso} className="hidden w-24 sm:block" />
                          <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                            {c.progresso}%
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAtualizarProgresso(c.uuid, c.progresso + 25)}
                          >
                            +25%
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

                      {/* Revisão SM-2 — independente do progresso acima */}
                      <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-1">
                        <MonoLabel>
                          {card ? `Próxima revisão: ${formatDate(card.proxima_revisao)}` : 'Ainda sem revisão'}
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Provas — só pra matérias que não são ENEM */}
          {mostrarBlocoProvas && (
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
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={novaProva.data}
                        onChange={(e) => setNovaProva((p) => ({ ...p, data: e.target.value }))}
                        className="h-8 text-sm"
                      />
                      <Select
                        value={novaProva.tipo}
                        onChange={(e) =>
                          setNovaProva((p) => ({ ...p, tipo: e.target.value as TipoProva }))
                        }
                        className="h-8 text-sm"
                      >
                        {opcoesTipoProva.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </Select>
                    </div>
                    <Button type="submit" size="sm">
                      <Plus className="size-3.5" />
                      Adicionar prova
                    </Button>
                  </form>
                </Card>
              </div>
            </Section>
          )}

          {/* Atividades */}
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Questão avulsa */}
          <Section label="Bloco 4" title="Registrar questão avulsa">
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

          {/* Simulados */}
          <Section label="Bloco 5" title="Simulados" count={simulados.length}>
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