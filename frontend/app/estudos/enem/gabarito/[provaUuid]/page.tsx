'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, PenLine, Save } from 'lucide-react'
import {
  listarMaterias,
  Materia,
  AreaEnem,
  AREA_ENEM_LABELS,
} from '../../../../../lib/materias'
import { listarConteudosPorMateria, Conteudo } from '../../../../../lib/conteudos'
import {
  buscarProva,
  atualizarProva,
  areaEnemDoNumero,
  AREAS_POR_DIA,
  Prova,
} from '../../../../../lib/provas'
import { criarRedacao, Redacao } from '../../../../../lib/redacoes'
import {
  lancarRespostasGabarito,
  corrigirGabaritoEmLote,
  buscarGabaritoProva,
  QuestaoIndividual,
  Letra,
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

const LETRAS: Letra[] = ['A', 'B', 'C', 'D', 'E']
const TAMANHO_BLOCO = 15 // só visual — pra lembrar o cartão-resposta oficial

function blocosDaArea(numeros: number[]): number[][] {
  const blocos: number[][] = []
  for (let i = 0; i < numeros.length; i += TAMANHO_BLOCO) {
    blocos.push(numeros.slice(i, i + TAMANHO_BLOCO))
  }
  return blocos
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

  // Estado do formulário de LANÇAMENTO — só existe pra questões ainda não lançadas
  const [respostasLancamento, setRespostasLancamento] = useState<
    Record<number, { materia_uuid: string; letra_marcada: Letra | '' }>
  >({})

  // Estado do formulário de CORREÇÃO — só existe pra questões lançadas sem letra_correta
  const [correcoes, setCorrecoes] = useState<
    Record<string, { letra_correta: Letra | ''; conteudo_uuid: string; motivo_erro: string }>
  >({})

  // Bloco de redação (só dia 1)
  const [temaRedacao, setTemaRedacao] = useState('')
  const [criandoRedacao, setCriandoRedacao] = useState(false)

  async function carregar() {
    const [p, m, g] = await Promise.all([
      buscarProva(provaUuid),
      listarMaterias('enem'),
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

  // Carrega conteúdos das matérias envolvidas nas questões pendentes de correção
  // (só busca quando necessário, uma vez por matéria).
  useEffect(() => {
    const materiasParaBuscar = new Set(
      gabarito.filter((q) => q.letra_correta === null).map((q) => q.materia_uuid)
    )
    const faltando = [...materiasParaBuscar].filter((uuid) => !(uuid in conteudosPorMateria))
    if (faltando.length === 0) return

    Promise.all(faltando.map((uuid) => listarConteudosPorMateria(uuid))).then((resultados) => {
      setConteudosPorMateria((prev) => {
        const novo = { ...prev }
        faltando.forEach((uuid, i) => { novo[uuid] = resultados[i] ?? [] })
        return novo
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gabarito])

  const numerosJaLancados = useMemo(() => new Set(gabarito.map((q) => q.numero)), [gabarito])

  const areasDoDay: [AreaEnem, AreaEnem] | null =
    prova && (prova.tipo === 'enem_dia1' || prova.tipo === 'enem_dia2')
      ? AREAS_POR_DIA[prova.tipo]
      : null

  // Números pendentes de lançamento, agrupados por área
  const pendentesLancamentoPorArea = useMemo(() => {
    if (!prova || !areasDoDay) return {} as Record<AreaEnem, number[]>
    const resultado = {} as Record<AreaEnem, number[]>
    areasDoDay.forEach((area) => { resultado[area] = [] })
    for (let n = 1; n <= 90; n++) {
      if (numerosJaLancados.has(n)) continue
      const area = areaEnemDoNumero(prova.tipo, n)
      if (area) resultado[area].push(n)
    }
    return resultado
  }, [prova, areasDoDay, numerosJaLancados])

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

  function materiaOptions(area: AreaEnem) {
    return materiasEnem.filter((m) => m.area_enem === area)
  }

  function atualizarLinhaLancamento(
    numero: number,
    campo: 'materia_uuid' | 'letra_marcada',
    valor: string
  ) {
    setRespostasLancamento((prev) => ({
      ...prev,
      [numero]: {
        materia_uuid: prev[numero]?.materia_uuid ?? '',
        letra_marcada: (prev[numero]?.letra_marcada ?? '') as Letra | '',
        [campo]: valor,
      },
    }))
  }

  async function handleSalvarLancamento() {
    if (!prova) return
    const respostas: RespostaLancamento[] = Object.entries(respostasLancamento)
      .filter(([, v]) => v.materia_uuid) // só envia linhas com matéria escolhida
      .map(([numero, v]) => ({
        numero: Number(numero),
        materia_uuid: v.materia_uuid,
        letra_marcada: v.letra_marcada === '' ? null : (v.letra_marcada as Letra),
      }))

    if (respostas.length === 0) return

    setSalvandoLancamento(true)
    await lancarRespostasGabarito(provaUuid, prova.data, respostas)
    setSalvandoLancamento(false)
    setRespostasLancamento({})
    await carregar()
  }

  function atualizarLinhaCorrecao(
    uuid: string,
    campo: 'letra_correta' | 'conteudo_uuid' | 'motivo_erro',
    valor: string
  ) {
    setCorrecoes((prev) => ({
      ...prev,
      [uuid]: {
        letra_correta: prev[uuid]?.letra_correta ?? '',
        conteudo_uuid: prev[uuid]?.conteudo_uuid ?? '',
        motivo_erro: prev[uuid]?.motivo_erro ?? '',
        [campo]: valor,
      },
    }))
  }

  async function handleSalvarCorrecao() {
    const payload = Object.entries(correcoes)
      .filter(([, v]) => v.letra_correta)
      .map(([uuid, v]) => {
        const questao = gabarito.find((q) => q.uuid === uuid)!
        return {
          uuid,
          letra_marcada: questao.letra_marcada,
          correcao: {
            letra_correta: v.letra_correta as Letra,
            conteudo_uuid: v.conteudo_uuid || undefined,
            motivo_erro: v.motivo_erro || undefined,
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

  if (!prova || !areasDoDay) {
    return (
      <PageShell>
        <div className="mb-5">
          <BackLink href="/estudos/enem">Voltar ao ENEM</BackLink>
        </div>
        <PageHeader eyebrow="Gabarito" title="Prova não encontrada" />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="mb-5">
        <BackLink href="/estudos/enem">Voltar ao ENEM</BackLink>
      </div>
      <PageHeader
        eyebrow={prova.tipo === 'enem_dia1' ? 'Dia 1' : 'Dia 2'}
        title="Gabarito digital"
        description="Lance as letras marcadas durante a prova. A correção (letra certa, acerto/erro) é feita depois, num passo separado."
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

      {/* FASE 1 — Lançar */}
      <div className="mt-8 flex flex-col gap-8">
        <h2 className="text-base font-semibold">Lançar respostas</h2>

        {areasDoDay.map((area) => {
          const numeros = pendentesLancamentoPorArea[area] ?? []
          if (numeros.length === 0) return null
          const blocos = blocosDaArea(numeros)
          const opcoesMateria = materiaOptions(area)

          return (
            <div key={area} className="flex flex-col gap-4">
              <MonoLabel>{AREA_ENEM_LABELS[area]} · {numeros.length} pendentes</MonoLabel>
              {blocos.map((bloco, iBloco) => (
                <Card key={iBloco} className="divide-y divide-border overflow-hidden">
                  <div className="bg-secondary/40 px-4 py-2">
                    <MonoLabel>
                      Bloco {iBloco + 1} · questões {bloco[0]}–{bloco[bloco.length - 1]}
                    </MonoLabel>
                  </div>
                  {bloco.map((numero) => {
                    const linha = respostasLancamento[numero]
                    return (
                      <div key={numero} className="flex flex-wrap items-center gap-3 px-4 py-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary font-mono text-sm font-medium tabular-nums">
                          {numero}
                        </span>
                        <Select
                          value={linha?.materia_uuid ?? ''}
                          onChange={(e) => atualizarLinhaLancamento(numero, 'materia_uuid', e.target.value)}
                          aria-label={`Matéria da questão ${numero}`}
                          className="min-w-[10rem] flex-1"
                        >
                          <option value="">Matéria…</option>
                          {opcoesMateria.map((m) => (
                            <option key={m.uuid} value={m.uuid}>{m.nome}</option>
                          ))}
                        </Select>
                        <Select
                          value={linha?.letra_marcada ?? ''}
                          onChange={(e) => atualizarLinhaLancamento(numero, 'letra_marcada', e.target.value)}
                          aria-label={`Letra marcada na questão ${numero}`}
                          className="w-28 shrink-0"
                        >
                          <option value="">Em branco</option>
                          {LETRAS.map((l) => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </Select>
                      </div>
                    )
                  })}
                </Card>
              ))}
            </div>
          )
        })}

        {Object.values(pendentesLancamentoPorArea).every((n) => n.length === 0) ? (
          <p className="text-sm text-muted-foreground">Todas as 90 questões já foram lançadas.</p>
        ) : (
          <div className="flex justify-end">
            <Button size="lg" onClick={handleSalvarLancamento} disabled={salvandoLancamento}>
              {salvandoLancamento ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar lançamento
            </Button>
          </div>
        )}
      </div>

      {/* FASE 2 — Corrigir */}
      {pendentesCorrecao.length > 0 && (
        <div className="mt-10 flex flex-col gap-4">
          <h2 className="text-base font-semibold">Corrigir ({pendentesCorrecao.length} pendentes)</h2>
          <Card className="divide-y divide-border overflow-hidden">
            {pendentesCorrecao.map((q) => {
              const materia = materiasEnem.find((m) => m.uuid === q.materia_uuid)
              const conteudos = conteudosPorMateria[q.materia_uuid] ?? []
              const linha = correcoes[q.uuid]
              const errou = linha?.letra_correta && q.letra_marcada !== linha.letra_correta

              return (
                <div key={q.uuid} className="flex flex-col gap-3 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary font-mono text-sm font-medium tabular-nums">
                      {q.numero}
                    </span>
                    <span className="text-sm text-muted-foreground">{materia?.nome ?? '—'}</span>
                    <Badge variant="outline">
                      Marcou: {q.letra_marcada ?? 'em branco'}
                    </Badge>
                    <Select
                      value={linha?.letra_correta ?? ''}
                      onChange={(e) => atualizarLinhaCorrecao(q.uuid, 'letra_correta', e.target.value)}
                      aria-label={`Letra correta da questão ${q.numero}`}
                      className="ml-auto w-32 shrink-0"
                    >
                      <option value="">Letra certa…</option>
                      {LETRAS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </Select>
                  </div>

                  {errou ? (
                    <div className="grid grid-cols-1 gap-3 pl-11 sm:grid-cols-2">
                      <Field label="Conteúdo relacionado" optional>
                        <Select
                          value={linha?.conteudo_uuid ?? ''}
                          onChange={(e) => atualizarLinhaCorrecao(q.uuid, 'conteudo_uuid', e.target.value)}
                          aria-label={`Conteúdo da questão ${q.numero}`}
                        >
                          <option value="">Selecione…</option>
                          {conteudos.map((c) => (
                            <option key={c.uuid} value={c.uuid}>{c.nome}</option>
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
                  ) : null}
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