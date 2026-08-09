'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, PenLine, Save } from 'lucide-react'
import {
  listarTodasMateriasEnem,
  Materia,
} from '../../../../../lib/materias'
import { listarConteudosPorMateria, Conteudo } from '../../../../../lib/conteudos'
import {
  buscarProva,
  atualizarProva,
  areaEnemDoNumero,
  Prova,
} from '../../../../../lib/provas'
import { criarRedacao } from '../../../../../lib/redacoes'
import {
  lancarRespostasGabarito,
  corrigirGabaritoEmLote,
  buscarGabaritoProva,
  QuestaoIndividual,
  Letra,
  Dificuldade,
  RespostaLancamento,
} from '../../../../../lib/questoes-individuais'
import { BackLink, PageHeader, PageShell } from '@/components/study/page-shell'
import { MonoLabel } from '@/components/study/mono-label'
import { Field } from '@/components/study/field'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const LETRAS: Letra[] = ['A', 'B', 'C', 'D', 'E']
const TAMANHO_BLOCO = 15 // 6 blocos de 15 = 90, igual ao cartão-resposta oficial

const DIFICULDADE_LABELS: Record<Dificuldade, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
}

function blocos1a90(): number[][] {
  const resultado: number[][] = []
  for (let i = 1; i <= 90; i += TAMANHO_BLOCO) {
    resultado.push(Array.from({ length: TAMANHO_BLOCO }, (_, k) => i + k))
  }
  return resultado
}

export default function GabaritoProvaPage() {
  const params = useParams<{ provaUuid: string }>()
  const provaUuid = params.provaUuid

  const [prova, setProva] = useState<Prova | null>(null)
  const [materiasEnem, setMateriasEnem] = useState<Materia[]>([])
  const [gabarito, setGabarito] = useState<QuestaoIndividual[]>([])
  const [conteudosPorMateria, setConteudosPorMateria] = useState<Record<string, Conteudo[]>>({})
  const [carregando, setCarregando] = useState(true)
  const [salvandoLancamento, setSalvandoLancamento] = useState(false)
  const [salvandoCorrecao, setSalvandoCorrecao] = useState(false)

  // Fase LANÇAR — grade visual, uma letra selecionada por número (ou nenhuma = branco)
  const [letrasSelecionadas, setLetrasSelecionadas] = useState<Record<number, Letra>>({})

  // Fase CORRIGIR — uma linha por questão pendente, todos os campos
  const [correcoes, setCorrecoes] = useState<
    Record<string, {
      letra_correta: Letra | ''
      materia_uuid: string
      conteudo_uuid: string
      motivo_erro: string
      dificuldade: Dificuldade | ''
    }>
  >({})

  // Bloco de redação (só dia 1)
  const [temaRedacao, setTemaRedacao] = useState('')
  const [criandoRedacao, setCriandoRedacao] = useState(false)

  async function carregar() {
    const [p, m, g] = await Promise.all([
      buscarProva(provaUuid),
      listarTodasMateriasEnem(),
      buscarGabaritoProva(provaUuid),
    ])
    setProva(p)
    setMateriasEnem(m ?? [])
    setGabarito(g ?? [])
    setCarregando(false)
  }

  useEffect(() => {
    if (provaUuid) carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provaUuid])

  // Busca conteúdos sob demanda, conforme o usuário escolhe a matéria de
  // cada linha na correção (matéria não é mais fixa por linha antecipada).
  useEffect(() => {
    const materiasEscolhidas = new Set(
      Object.values(correcoes).map((c) => c.materia_uuid).filter(Boolean)
    )
    const faltando = [...materiasEscolhidas].filter((uuid) => !(uuid in conteudosPorMateria))
    if (faltando.length === 0) return

    Promise.all(faltando.map((uuid) => listarConteudosPorMateria(uuid))).then((resultados) => {
      setConteudosPorMateria((prev) => {
        const novo = { ...prev }
        faltando.forEach((uuid, i) => { novo[uuid] = resultados[i] ?? [] })
        return novo
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correcoes])

  const numerosJaLancados = useMemo(() => new Set(gabarito.map((q) => q.numero)), [gabarito])
  const faltaLancar = numerosJaLancados.size < 90

  const pendentesCorrecao = useMemo(
    () => gabarito.filter((q) => q.letra_correta === null),
    [gabarito]
  )

  const corrigidas = useMemo(
    () => gabarito.filter((q) => q.letra_correta !== null),
    [gabarito]
  )

  const resumo = useMemo(() => {
    const acertos = corrigidas.filter((q) => q.acertou === true).length
    const erros = corrigidas.filter((q) => q.acertou === false).length
    const perdidas = corrigidas.filter((q) => q.acertou === null).length
    return { acertos, erros, perdidas, corrigidas: corrigidas.length, total: gabarito.length }
  }, [corrigidas, gabarito.length])

  function toggleLetra(numero: number, letra: Letra) {
    setLetrasSelecionadas((prev) => {
      const novo = { ...prev }
      if (novo[numero] === letra) {
        delete novo[numero] // clicar de novo desmarca — volta a ficar em branco
      } else {
        novo[numero] = letra
      }
      return novo
    })
  }

  async function handleSalvarLancamento() {
    if (!prova) return
    const respostas: RespostaLancamento[] = []
    for (let n = 1; n <= 90; n++) {
      if (numerosJaLancados.has(n)) continue
      respostas.push({ numero: n, letra_marcada: letrasSelecionadas[n] ?? null })
    }
    if (respostas.length === 0) return

    setSalvandoLancamento(true)
    await lancarRespostasGabarito(provaUuid, prova.data, respostas)
    setSalvandoLancamento(false)
    setLetrasSelecionadas({})
    await carregar()
  }

  function atualizarLinhaCorrecao(
    uuid: string,
    campo: 'letra_correta' | 'materia_uuid' | 'conteudo_uuid' | 'motivo_erro' | 'dificuldade',
    valor: string
  ) {
    setCorrecoes((prev) => ({
      ...prev,
      [uuid]: {
        letra_correta: prev[uuid]?.letra_correta ?? '',
        materia_uuid: prev[uuid]?.materia_uuid ?? '',
        conteudo_uuid: prev[uuid]?.conteudo_uuid ?? '',
        motivo_erro: prev[uuid]?.motivo_erro ?? '',
        dificuldade: prev[uuid]?.dificuldade ?? '',
        [campo]: valor,
        // trocar matéria limpa o conteúdo escolhido (era de outra matéria)
        ...(campo === 'materia_uuid' ? { conteudo_uuid: '' } : {}),
      },
    }))
  }

  async function handleSalvarCorrecao() {
    if (!prova) return
    const payload = Object.entries(correcoes)
      .filter(([, v]) => v.letra_correta && v.materia_uuid) // matéria + letra certa são obrigatórias
      .map(([uuid, v]) => {
        const questao = gabarito.find((q) => q.uuid === uuid)!
        return {
          uuid,
          letra_marcada: questao.letra_marcada,
          correcao: {
            letra_correta: v.letra_correta as Letra,
            materia_uuid: v.materia_uuid,
            conteudo_uuid: v.conteudo_uuid || undefined,
            motivo_erro: v.motivo_erro || undefined,
            dificuldade: (v.dificuldade || undefined) as Dificuldade | undefined,
          },
        }
      })

    if (payload.length === 0) return

    setSalvandoCorrecao(true)
    await corrigirGabaritoEmLote(payload)
    setSalvandoCorrecao(false)
    setCorrecoes({})
    await carregar()
  }

  async function handleCriarRedacao() {
    if (!prova || !temaRedacao.trim()) return
    setCriandoRedacao(true)
    const nova = await criarRedacao({
      tema: temaRedacao.trim(),
      texto: null,
      nota: null,
      comentario: null,
      data: prova.data,
      competencia_1: null,
      competencia_2: null,
      competencia_3: null,
      competencia_4: null,
      competencia_5: null,
      imagem_path: null,
    })
    if (nova) {
      await atualizarProva(provaUuid, { redacao_uuid: nova.uuid })
    }
    setCriandoRedacao(false)
    setTemaRedacao('')
    await carregar()
  }

  if (carregando) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </PageShell>
    )
  }

  if (!prova || (prova.tipo !== 'enem_dia1' && prova.tipo !== 'enem_dia2')) {
    return (
      <PageShell>
        <div className="mb-5">
          <BackLink href="/estudos/enem">Voltar ao ENEM</BackLink>
        </div>
        <PageHeader eyebrow="Gabarito" title="Prova não encontrada" />
      </PageShell>
    )
  }

  const blocos = blocos1a90()

  return (
    <PageShell>
      <div className="mb-5">
        <BackLink href="/estudos/enem">Voltar ao ENEM</BackLink>
      </div>
      <PageHeader
        eyebrow={prova.tipo === 'enem_dia1' ? 'Dia 1' : 'Dia 2'}
        title="Gabarito digital"
        description="Marque a letra de cada questão, igual ao cartão-resposta oficial. Quem ficar sem clique é contado como em branco quando você salvar."
      />

      {/* Resumo */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:max-w-2xl">
        <Card className="p-4">
          <MonoLabel>Lançadas</MonoLabel>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{resumo.total}/90</p>
        </Card>
        <Card className="p-4">
          <MonoLabel>Acertos</MonoLabel>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-success-foreground">{resumo.acertos}</p>
        </Card>
        <Card className="p-4">
          <MonoLabel>Erros</MonoLabel>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-destructive">{resumo.erros}</p>
        </Card>
        <Card className="p-4">
          <MonoLabel>Perdidas</MonoLabel>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-muted-foreground">{resumo.perdidas}</p>
        </Card>
      </div>

      {/* Redação — só dia 1 */}
      {prova.tipo === 'enem_dia1' && (
        <Card className="mt-6 p-5">
          <div className="flex items-center gap-2">
            <PenLine className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Redação do dia</h2>
          </div>
          {prova.redacao_uuid ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Redação já vinculada. Preencha o texto, a foto e a nota na página{' '}
              <a href="/estudos/redacoes" className="underline underline-offset-4">
                Redações
              </a>{' '}
              quando quiser — não precisa ser agora.
            </p>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); handleCriarRedacao(); }}
              className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <Field label="Tema da redação" className="sm:flex-1">
                <Input
                  value={temaRedacao}
                  onChange={(e) => setTemaRedacao(e.target.value)}
                  placeholder="Ex: Desafios da educação no Brasil"
                />
              </Field>
              <Button type="submit" disabled={criandoRedacao || !temaRedacao.trim()}>
                {criandoRedacao ? <Loader2 className="size-4 animate-spin" /> : <PenLine className="size-4" />}
                Vincular redação
              </Button>
            </form>
          )}
        </Card>
      )}

      {/* FASE 1 — Lançar (grade visual, tipo cartão-resposta) */}
      {faltaLancar && (
        <div className="mt-8 flex flex-col gap-4">
          <h2 className="text-base font-semibold">Lançar respostas</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {blocos.map((bloco, iBloco) => {
              const pendentesDoBloco = bloco.filter((n) => !numerosJaLancados.has(n))
              if (pendentesDoBloco.length === 0) return null
              return (
                <Card key={iBloco} className="overflow-hidden">
                  <div className="bg-secondary/40 px-3 py-1.5">
                    <MonoLabel>Bloco {iBloco + 1} · {bloco[0]}–{bloco[bloco.length - 1]}</MonoLabel>
                  </div>
                  <div className="divide-y divide-border">
                    {bloco.map((numero) => {
                      const jaLancado = numerosJaLancados.has(numero)
                      const areaLabel = areaEnemDoNumero(prova.tipo, numero)
                      const selecionada = letrasSelecionadas[numero]
                      return (
                        <div
                          key={numero}
                          className={cn(
                            'flex items-center gap-2 px-3 py-1.5',
                            jaLancado && 'opacity-40',
                          )}
                          title={areaLabel ?? undefined}
                        >
                          <span className="w-6 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                            {numero}
                          </span>
                          <div className="flex items-center gap-1">
                            {LETRAS.map((l) => (
                              <button
                                key={l}
                                type="button"
                                disabled={jaLancado}
                                onClick={() => toggleLetra(numero, l)}
                                aria-pressed={selecionada === l}
                                aria-label={`Questão ${numero}, letra ${l}`}
                                className={cn(
                                  'flex size-6 shrink-0 items-center justify-center rounded-full border text-[0.7rem] font-medium transition-colors',
                                  selecionada === l
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                                )}
                              >
                                {l}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )
            })}
          </div>

          <div className="flex justify-end">
            <Button size="lg" onClick={handleSalvarLancamento} disabled={salvandoLancamento}>
              {salvandoLancamento ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar lançamento
            </Button>
          </div>
        </div>
      )}

      {/* FASE 2 — Corrigir (linha a linha: matéria, conteúdo, motivo, dificuldade) */}
      {pendentesCorrecao.length > 0 && (
        <div className="mt-10 flex flex-col gap-4">
          <h2 className="text-base font-semibold">Corrigir ({pendentesCorrecao.length} pendentes)</h2>
          <Card className="divide-y divide-border overflow-hidden">
            {pendentesCorrecao.map((q) => {
              const linha = correcoes[q.uuid]
              const materiaEscolhidaUuid = linha?.materia_uuid ?? ''
              const area = areaEnemDoNumero(prova.tipo, q.numero ?? 0)
              const materiasDaArea = materiasEnem.filter((m) => m.area_enem === area)
              const conteudosDaMateria = materiaEscolhidaUuid
                ? conteudosPorMateria[materiaEscolhidaUuid] ?? []
                : []

              return (
                <div key={q.uuid} className="flex flex-col gap-3 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary font-mono text-sm font-medium tabular-nums">
                      {q.numero}
                    </span>
                    <Badge variant="outline">
                      Marcou: {q.letra_marcada ?? 'em branco'}
                    </Badge>
                    <Select
                      value={linha?.letra_correta ?? ''}
                      onChange={(e) => atualizarLinhaCorrecao(q.uuid, 'letra_correta', e.target.value)}
                      aria-label={`Letra correta da questão ${q.numero}`}
                      className="ml-auto w-28 shrink-0"
                    >
                      <option value="">Letra certa…</option>
                      {LETRAS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 gap-3 pl-11 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Matéria">
                      <Select
                        value={materiaEscolhidaUuid}
                        onChange={(e) => atualizarLinhaCorrecao(q.uuid, 'materia_uuid', e.target.value)}
                        aria-label={`Matéria da questão ${q.numero}`}
                      >
                        <option value="">Selecione…</option>
                        {materiasDaArea.map((m) => (
                          <option key={m.uuid} value={m.uuid}>{m.nome}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Conteúdo/assunto" optional>
                      <Select
                        value={linha?.conteudo_uuid ?? ''}
                        onChange={(e) => atualizarLinhaCorrecao(q.uuid, 'conteudo_uuid', e.target.value)}
                        aria-label={`Conteúdo da questão ${q.numero}`}
                        disabled={!materiaEscolhidaUuid}
                      >
                        <option value="">Selecione…</option>
                        {conteudosDaMateria.map((c) => (
                          <option key={c.uuid} value={c.uuid}>{c.nome}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Dificuldade" optional>
                      <Select
                        value={linha?.dificuldade ?? ''}
                        onChange={(e) => atualizarLinhaCorrecao(q.uuid, 'dificuldade', e.target.value)}
                        aria-label={`Dificuldade da questão ${q.numero}`}
                      >
                        <option value="">Selecione…</option>
                        {(Object.keys(DIFICULDADE_LABELS) as Dificuldade[]).map((d) => (
                          <option key={d} value={d}>{DIFICULDADE_LABELS[d]}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Motivo do erro" optional>
                      <Input
                        value={linha?.motivo_erro ?? ''}
                        onChange={(e) => atualizarLinhaCorrecao(q.uuid, 'motivo_erro', e.target.value)}
                        placeholder="Ex: erro de cálculo"
                      />
                    </Field>
                  </div>
                </div>
              )
            })}
          </Card>
          <div className="flex justify-end">
            <Button size="lg" onClick={handleSalvarCorrecao} disabled={salvandoCorrecao}>
              {salvandoCorrecao ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar correção
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  )
}
