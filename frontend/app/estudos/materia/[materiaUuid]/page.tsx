'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileQuestion,
  GraduationCap,
  Plus,
  Target,
  Trash2,
} from 'lucide-react'

import { BackLink, PageHeader, PageShell } from '@/components/study/page-shell'
import { useContextoAcademico } from '@/components/useContextoAcademico'
import { Section } from '@/components/study/section'
import { MonoLabel } from '@/components/study/mono-label'
import { EmptyState } from '@/components/study/empty-state'
import { Field } from '@/components/study/field'
import { StudyRecords } from '@/components/study/study-records'
import { AvaliacoesMateria } from '@/components/study/avaliacoes-materia'
import { TopicosMateria } from '@/components/study/topicos-materia'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PrivateDocumentAction } from '@/components/PrivateDocumentAction'
import { dataLocalIso } from '@/lib/date'
import { apagarMidiaPessoal } from '@/lib/midias-pessoais'

import { buscarMateria, Materia } from '../../../../lib/materias'
import {
  listarConteudosPorMateria,
  Conteudo,
} from '../../../../lib/conteudos'
import {
  listarProvasPorMateria,
  criarProva,
  atualizarProva,
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
  atualizarArquivoSimulado,
  Simulado,
} from '../../../../lib/simulados'

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

interface Confirmacao {
  title: string
  description: string
  confirmLabel: string
  action: () => Promise<void>
}

type OrigemMateria = 'escola' | 'enem' | 'olimpiada' | 'vestibular' | 'outro'

const ORIGENS_MATERIA: Record<OrigemMateria, { label: string; href: string }> = {
  escola: { label: 'Escola', href: '/estudos/escola' },
  enem: { label: 'ENEM', href: '/estudos/enem' },
  olimpiada: { label: 'Olimpíadas', href: '/estudos/areas/olimpiada' },
  vestibular: { label: 'Vestibulares', href: '/estudos/areas/vestibular' },
  outro: { label: 'Outros estudos', href: '/estudos/areas/outro' },
}

export default function MateriaDetalhePage() {
  const params = useParams<{ materiaUuid: string }>()
  const materiaUuid = params.materiaUuid
  const searchParams = useSearchParams()
  const rotuloAcademico = useContextoAcademico()
  // Contexto de onde a matéria foi acessada — decide o que a página mostra.
  // A matéria em si é uma linha única (mostra_escola/mostra_enem só marcam
  // ONDE ela aparece na navegação); o que é exibido AQUI é decidido pela
  // origem da navegação, não por um campo da matéria. Default 'escola' se
  // a página for aberta direto, sem vir de nenhum link (ex: link salvo).
  const origemParam = searchParams.get('from')
  const from: OrigemMateria = origemParam && origemParam in ORIGENS_MATERIA
    ? origemParam as OrigemMateria
    : 'escola'

  const [materia, setMateria] = useState<Materia | null>(null)
  const [conteudos, setConteudos] = useState<Conteudo[]>([])
  const [provas, setProvas] = useState<Prova[]>([])
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [simulados, setSimulados] = useState<Simulado[]>([])
  const [taxaAcerto, setTaxaAcerto] = useState<number | null>(null)
  const [carregando, setCarregando] = useState(true)

  const [novaProva, setNovaProva] = useState({ titulo: '', data: '' })
  const [novaAtividade, setNovaAtividade] = useState({ titulo: '', data_entrega: '' })
  const [novaQuestao, setNovaQuestao] = useState({ acertou: true, conteudo_uuid: '' })
  const [novoSimulado, setNovoSimulado] = useState({
    total_questoes: '',
    total_acertos: '',
    total_anuladas: '0',
    conteudo_uuid: '',
  })
  const [confirmacao, setConfirmacao] = useState<Confirmacao | null>(null)
  const [salvandoSimulado, setSalvandoSimulado] = useState(false)
  const [erroSimulado, setErroSimulado] = useState('')

  async function carregar() {
    const [materiaAtual, cont, prov, ativ, sim, taxa] = await Promise.all([
      buscarMateria(materiaUuid),
      listarConteudosPorMateria(materiaUuid),
      from !== 'enem' ? listarProvasPorMateria(materiaUuid) : Promise.resolve([]),
      from !== 'enem' ? listarAtividades(materiaUuid) : Promise.resolve([]),
      listarSimuladosPorMateria(materiaUuid),
      taxaDeAcertoRecente(30, materiaUuid),
    ])
    setMateria(materiaAtual)
    setConteudos(cont ?? [])
    setProvas(prov ?? [])
    setAtividades(ativ ?? [])
    setSimulados(sim ?? [])
    setTaxaAcerto(taxa)

    setCarregando(false)
  }

  useEffect(() => {
    // UUID e origem da rota determinam a consulta assíncrona do detalhe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (materiaUuid) carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materiaUuid, from])

  async function handleCriarProva(e: React.FormEvent) {
    e.preventDefault()
    if (!novaProva.titulo.trim() || !novaProva.data) return
    await criarProva({
      materia_uuid: materiaUuid,
      tipo: from === 'escola' ? 'escola' : 'outro', // prova ENEM nunca é criada aqui — só em /estudos/enem
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

  function handleApagarProva(prova: Prova) {
    setConfirmacao({
      title: 'Apagar prova?',
      description: `A prova "${prova.titulo || 'sem título'}" será removida da lista desta matéria.`,
      confirmLabel: 'Apagar',
      action: async () => {
        const removida = await deletarProva(prova.uuid)
        if (removida && prova.arquivo_path) await apagarMidiaPessoal(prova.arquivo_path)
        await carregar()
      },
    })
  }

  async function handleToggleProva(prova: Prova) {
    await atualizarProva(prova.uuid, { feita: !prova.feita })
    await carregar()
  }

  async function handleArquivoProva(prova: Prova, arquivoPath: string) {
    const atualizada = await atualizarProva(prova.uuid, { arquivo_path: arquivoPath })
    if (!atualizada) return false
    setProvas((atuais) => atuais.map((item) => item.uuid === prova.uuid ? atualizada : item))
    return true
  }

  async function handleArquivoSimulado(simulado: Simulado, arquivoPath: string) {
    const atualizado = await atualizarArquivoSimulado(simulado.uuid, arquivoPath)
    if (!atualizado) return false
    setSimulados((atuais) => atuais.map((item) => item.uuid === simulado.uuid ? atualizado : item))
    return true
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

  function handleApagarAtividade(atividade: Atividade) {
    setConfirmacao({
      title: 'Apagar atividade?',
      description: `A atividade "${atividade.titulo}" será removida da lista desta matéria.`,
      confirmLabel: 'Apagar',
      action: async () => {
        await deletarAtividade(atividade.uuid)
        await carregar()
      },
    })
  }

  async function handleRegistrarQuestao(e: React.FormEvent) {
    e.preventDefault()
    await registrarQuestao({
      materia_uuid: materiaUuid,
      conteudo_uuid: novaQuestao.conteudo_uuid || null,
      acertou: novaQuestao.acertou,
      data: dataLocalIso(),
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
    const anuladas = Number(novoSimulado.total_anuladas)
    if (salvandoSimulado) return
    if (
      !Number.isInteger(total) || total < 0 ||
      !Number.isInteger(anuladas) || anuladas < 0 || anuladas > total ||
      !Number.isInteger(acertos) || acertos < 0 || acertos > total - anuladas
    ) return
    setSalvandoSimulado(true)
    setErroSimulado('')
    try {
    const salvo = await registrarSimulado({
      materia_uuid: materiaUuid,
      data: dataLocalIso(),
      total_questoes: total,
      total_acertos: acertos,
      total_anuladas: anuladas,
      tempo_minutos: null,
      observacoes: null,
      conteudo_uuid: novoSimulado.conteudo_uuid || null,
      redacao_uuid: null,
    })
    if (!salvo) { setErroSimulado('Registro não confirmado. Confira a lista antes de reenviar.'); return }
    setNovoSimulado({ total_questoes: '', total_acertos: '', total_anuladas: '0', conteudo_uuid: '' })
    await carregar()
    } catch { setErroSimulado('Não foi possível concluir. Confira a lista antes de reenviar.') }
    finally { setSalvandoSimulado(false) }
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
        <PageHeader title="Matéria não encontrada" />
        <div className="mt-8">
          <EmptyState
            title="Essa matéria não existe"
            description="Ela pode ter sido removida. Volte e escolha outra."
          />
        </div>
      </PageShell>
    )
  }

  const origem = from === 'escola' ? { ...ORIGENS_MATERIA.escola, label: rotuloAcademico } : ORIGENS_MATERIA[from]
  const mostrarProvasEAtividades = from !== 'enem'

  return (
    <PageShell>
      <div className="mb-5">
        <BackLink href={origem.href}>Voltar a {origem.label}</BackLink>
      </div>
      <PageHeader
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
        <TopicosMateria materiaUuid={materiaUuid} escopo={from === 'enem' ? 'enem' : 'escola'} />

        {mostrarProvasEAtividades && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Provas — só no contexto Escola */}
            <Section title="Provas" count={provas.length}>
              <div className="flex flex-col gap-4">
                {provas.length === 0 ? (
                  <EmptyState icon={CalendarDays} title="Nenhuma prova cadastrada" compact />
                ) : (
                  <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                    {provas.map((p) => (
                      <li key={p.uuid} className="flex flex-col gap-3 px-4 py-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-medium">{p.titulo}</span>
                          <MonoLabel>{formatDate(p.data)}</MonoLabel>
                        </div>
                        <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:ml-auto sm:w-auto">
                          <Badge variant={p.feita ? 'success' : 'outline'}>
                            {p.feita ? 'feita' : 'pendente'}
                            {p.nota != null ? ` · ${p.nota}` : ''}
                          </Badge>
                          <Button
                            type="button"
                            variant={p.feita ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => handleToggleProva(p)}
                          >
                            {p.feita ? <CheckCircle2 className="size-3.5" /> : null}
                            {p.feita ? 'Reabrir' : 'Concluir'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleApagarProva(p)}
                            aria-label="Apagar prova"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                        </div>
                        <PrivateDocumentAction path={p.arquivo_path} scope={`provas/${p.uuid}`} onPersist={(path) => handleArquivoProva(p, path)} />
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
            <Section title="Atividades" count={atividades.length}>
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
                            onClick={() => handleApagarAtividade(a)}
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
          <Section title="Registrar questão avulsa">
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
          <Section title="Simulados" count={simulados.length}>
            <div className="flex flex-col gap-4">
              {simulados.length === 0 ? (
                <EmptyState icon={Target} title="Nenhum simulado registrado" compact />
              ) : (
                <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                  {simulados.map((s) => (
                    <li key={s.uuid} className="flex flex-col gap-2 px-4 py-3">
                      <div className="flex items-center gap-3"><MonoLabel>{formatDate(s.data)}</MonoLabel>
                      <span className="ml-auto font-mono text-sm tabular-nums">
                        {s.total_acertos}/{s.total_questoes - s.total_anuladas} válidas · {s.total_anuladas} anuladas
                      </span></div>
                      <PrivateDocumentAction path={s.arquivo_path} scope={`simulados/${s.uuid}`} onPersist={(path) => handleArquivoSimulado(s, path)} />
                    </li>
                  ))}
                </ul>
              )}

              <Card className="p-3">
                <form onSubmit={handleRegistrarSimulado} className="flex flex-col gap-2">
                  {erroSimulado && <p role="alert">{erroSimulado}</p>}
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={novoSimulado.total_questoes}
                      onChange={(e) =>
                        setNovoSimulado((s) => ({ ...s, total_questoes: e.target.value }))
                      }
                      placeholder="Total"
                      aria-label="Total de questões"
                      inputMode="numeric"
                      className="h-8 text-sm"
                    />
                    <Input
                      type="number"
                      min="0"
                      max={Math.max(0, Number(novoSimulado.total_questoes) - Number(novoSimulado.total_anuladas))}
                      step="1"
                      required
                      value={novoSimulado.total_acertos}
                      onChange={(e) =>
                        setNovoSimulado((s) => ({ ...s, total_acertos: e.target.value }))
                      }
                      placeholder="Acertos"
                      aria-label="Acertos"
                      inputMode="numeric"
                      className="h-8 text-sm"
                    />
                  </div>
                  <Field label="Questões anuladas" htmlFor="simulado-anuladas" hint="Anuladas não contam no percentual nem na revisão. Sem questões válidas, não há avaliação SM-2.">
                    <Input id="simulado-anuladas" type="number" min="0" max={novoSimulado.total_questoes || 0} step="1" required value={novoSimulado.total_anuladas} onChange={(e) => setNovoSimulado((s) => ({ ...s, total_anuladas: e.target.value }))} />
                  </Field>
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
                  <Button type="submit" size="sm" disabled={salvandoSimulado}>
                    <Plus className="size-3.5" />
                    Registrar simulado
                  </Button>
                </form>
              </Card>
            </div>
          </Section>
        </div>

        <div className="flex flex-col gap-6">
          {mostrarProvasEAtividades && <AvaliacoesMateria key={materiaUuid} materiaUuid={materiaUuid} />}
          <StudyRecords materiaUuid={materiaUuid} conteudos={conteudos} />
        </div>
      </div>

      <ConfirmDialog
        open={confirmacao !== null}
        title={confirmacao?.title ?? ''}
        description={confirmacao?.description ?? ''}
        confirmLabel={confirmacao?.confirmLabel ?? 'Confirmar'}
        onOpenChange={(open) => {
          if (!open) setConfirmacao(null)
        }}
        onConfirm={async () => {
          await confirmacao?.action()
        }}
      />

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
