'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Clock3, ImagePlus, Loader2, PenLine, Save } from 'lucide-react'
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
import {
  buscarRedacao,
  criarRedacao,
  deletarRedacao,
  uploadImagemRedacao,
  Redacao,
} from '../../../../../lib/redacoes'
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
  const [erro, setErro] = useState('')
  const [modoProva, setModoProva] = useState(false)
  const [fimProva, setFimProva] = useState<number | null>(null)
  const [agora, setAgora] = useState(() => Date.now())
  const [finalizandoTempo, setFinalizandoTempo] = useState(false)
  const [tentativaAutomatica, setTentativaAutomatica] = useState(false)

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
  const [imagemRedacao, setImagemRedacao] = useState<File | null>(null)
  const [redacaoVinculada, setRedacaoVinculada] = useState<Redacao | null>(null)
  const [criandoRedacao, setCriandoRedacao] = useState(false)

  async function carregar() {
    const [p, m, g] = await Promise.all([
      buscarProva(provaUuid),
      listarTodasMateriasEnem(),
      buscarGabaritoProva(provaUuid),
    ])
    const redacao = p?.redacao_uuid ? await buscarRedacao(p.redacao_uuid) : null
    setProva(p)
    setMateriasEnem(m ?? [])
    setGabarito(g ?? [])
    setRedacaoVinculada(redacao)
    setCarregando(false)
  }

  useEffect(() => {
    if (provaUuid) carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provaUuid])

  useEffect(() => {
    if (!prova || !new URLSearchParams(window.location.search).has('modo')) return
    if (new URLSearchParams(window.location.search).get('modo') !== 'prova') return
    const chave = `sistema-pessoal:enem-fim:${prova.uuid}`
    const salvo = Number(localStorage.getItem(chave))
    const duracaoMinutos = prova.tempo_minutos ?? (prova.tipo === 'enem_dia1' ? 330 : 300)
    const fim = Number.isFinite(salvo) && salvo > 0 ? salvo : Date.now() + duracaoMinutos * 60_000
    localStorage.setItem(chave, String(fim))
    setFimProva(fim)
    setModoProva(true)
    setTentativaAutomatica(false)
    setAgora(Date.now())
  }, [prova])

  useEffect(() => {
    if (!modoProva || !fimProva) return
    const intervalId = window.setInterval(() => setAgora(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [fimProva, modoProva])

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
    const respondidasPersistidas = gabarito.filter((q) => q.letra_marcada !== null).length
    const respondidasSelecionadas = Object.keys(letrasSelecionadas)
      .map(Number)
      .filter((numero) => !numerosJaLancados.has(numero)).length
    const respondidas = respondidasPersistidas + respondidasSelecionadas
    const acertos = corrigidas.filter((q) => q.acertou === true).length
    const erros = corrigidas.filter((q) => q.acertou === false).length
    return { respondidas, emBranco: 90 - respondidas, acertos, erros, total: 90 }
  }, [corrigidas, gabarito, letrasSelecionadas, numerosJaLancados])

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

  async function handleSalvarLancamento(): Promise<boolean> {
    if (!prova) return false
    const respostas: RespostaLancamento[] = []
    for (let n = 1; n <= 90; n++) {
      if (numerosJaLancados.has(n)) continue
      respostas.push({ numero: n, letra_marcada: letrasSelecionadas[n] ?? null })
    }
    if (respostas.length === 0) return true

    setSalvandoLancamento(true)
    const salvo = await lancarRespostasGabarito(provaUuid, prova.data, respostas)
    setSalvandoLancamento(false)
    if (!salvo) {
      setErro('Não foi possível salvar o lançamento do gabarito.')
      return false
    }
    setErro('')
    setLetrasSelecionadas({})
    await carregar()
    return true
  }

  async function finalizarModoProva() {
    if (!prova || finalizandoTempo || salvandoLancamento) return
    setFinalizandoTempo(true)
    const redacaoSalva = await salvarRedacaoDaProva()
    if (!redacaoSalva) {
      setFinalizandoTempo(false)
      return
    }
    const salvo = await handleSalvarLancamento()
    if (!salvo) {
      setFinalizandoTempo(false)
      return
    }
    localStorage.removeItem(`sistema-pessoal:enem-fim:${prova.uuid}`)
    setModoProva(false)
    setFimProva(null)
    setFinalizandoTempo(false)
  }

  const segundosRestantes = fimProva ? Math.max(0, Math.ceil((fimProva - agora) / 1000)) : null

  useEffect(() => {
    if (modoProva && segundosRestantes === 0 && !tentativaAutomatica && !finalizandoTempo && !salvandoLancamento) {
      setTentativaAutomatica(true)
      void finalizarModoProva()
    }
    // finalizarModoProva usa o estado atual do gabarito; a guarda evita execução duplicada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoProva, segundosRestantes, tentativaAutomatica, finalizandoTempo, salvandoLancamento])

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
    const linhasPreenchidas = Object.entries(correcoes)
    const linhasIncompletas = linhasPreenchidas.filter(([, v]) => (
      !v.letra_correta || !v.materia_uuid || !v.conteudo_uuid ||
      !v.dificuldade || !v.motivo_erro.trim()
    ))

    if (linhasIncompletas.length > 0) {
      setErro('Complete letra certa, matéria, conteúdo, dificuldade e motivo em cada questão iniciada.')
      return
    }

    const payload = linhasPreenchidas
      .map(([uuid, v]) => {
        const questao = gabarito.find((q) => q.uuid === uuid)!
        return {
          uuid,
          letra_marcada: questao.letra_marcada,
          correcao: {
            letra_correta: v.letra_correta as Letra,
            materia_uuid: v.materia_uuid,
            conteudo_uuid: v.conteudo_uuid,
            motivo_erro: v.motivo_erro.trim(),
            dificuldade: v.dificuldade as Dificuldade,
          },
        }
      })

    if (payload.length === 0) return

    setSalvandoCorrecao(true)
    const salvo = await corrigirGabaritoEmLote(payload)
    setSalvandoCorrecao(false)
    if (!salvo) {
      setErro('Parte da correção não pôde ser salva. Recarregue antes de tentar novamente.')
      return
    }
    let aviso = ''
    if (!faltaLancar && payload.length === pendentesCorrecao.length) {
      const provaAtualizada = await atualizarProva(provaUuid, { feita: true })
      if (!provaAtualizada) {
        aviso = 'A correção foi salva, mas a prova não pôde ser marcada como concluída.'
      }
    }
    setErro(aviso)
    setCorrecoes({})
    await carregar()
  }

  function selecionarImagemRedacao(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0] ?? null
    e.target.value = ''
    if (!arquivo) return
    if (!arquivo.type.startsWith('image/')) {
      setImagemRedacao(null)
      setErro('Selecione uma imagem válida para a redação.')
      return
    }
    if (arquivo.size > 10 * 1024 * 1024) {
      setImagemRedacao(null)
      setErro('A imagem da redação deve ter no máximo 10 MB.')
      return
    }
    setErro('')
    setImagemRedacao(arquivo)
  }

  async function salvarRedacaoDaProva(): Promise<boolean> {
    if (!prova || (prova.tipo !== 'enem_dia1' && !prova.redacao_uuid)) return true
    if (!prova.redacao_uuid && !temaRedacao.trim() && !imagemRedacao) return true
    if (prova.redacao_uuid && !imagemRedacao) return true
    if (prova.redacao_uuid && !redacaoVinculada) {
      setErro('A redação vinculada não pôde ser carregada. Recarregue a página antes de enviar a imagem.')
      return false
    }

    let redacao = redacaoVinculada
    if (!redacao) {
      const nova = await criarRedacao({
        tema: temaRedacao.trim() || prova.titulo?.trim() || 'Redação do ENEM',
        texto: null,
        nota: null,
        comentario: null,
        data: prova.data,
        competencia_1: null,
        competencia_2: null,
        competencia_3: null,
        competencia_4: null,
        competencia_5: null,
        tempo_execucao_minutos: null,
        imagem_path: null,
      })
      if (!nova) {
        setErro('Não foi possível criar a redação desta prova.')
        return false
      }

      const provaAtualizada = await atualizarProva(provaUuid, { redacao_uuid: nova.uuid })
      if (!provaAtualizada) {
        await deletarRedacao(nova.uuid)
        setErro('Não foi possível vincular a redação à prova.')
        return false
      }
      redacao = nova
      setProva(provaAtualizada)
      setRedacaoVinculada(nova)
    }

    if (imagemRedacao) {
      const caminho = await uploadImagemRedacao(redacao.uuid, imagemRedacao, redacao.imagem_path)
      if (!caminho) {
        setErro('A redação foi vinculada, mas a imagem não pôde ser enviada. Tente novamente antes de finalizar.')
        return false
      }
      redacao = { ...redacao, imagem_path: caminho }
      setRedacaoVinculada(redacao)
      setImagemRedacao(null)
    }

    setTemaRedacao('')
    setErro('')
    return true
  }

  async function handleCriarRedacao() {
    if (!prova || (prova.redacao_uuid ? !imagemRedacao : !temaRedacao.trim() && !imagemRedacao)) return
    setCriandoRedacao(true)
    const salva = await salvarRedacaoDaProva()
    setCriandoRedacao(false)
    if (salva) await carregar()
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
        title={modoProva ? 'Fazer prova ENEM' : 'Gabarito digital'}
        description={modoProva ? 'O cronômetro usa a duração oficial do dia. Marque as respostas; questões sem letra serão salvas em branco ao finalizar.' : 'Marque a letra de cada questão, igual ao cartão-resposta oficial. Quem ficar sem clique é contado como em branco quando você salvar.'}
      />

      {modoProva && segundosRestantes !== null ? (
        <Card className="sticky top-2 z-30 mt-6 flex flex-wrap items-center gap-3 border-primary/35 bg-card/95 p-4 shadow-lg backdrop-blur">
          <Clock3 className="size-5 text-primary" />
          <div><MonoLabel>Tempo restante</MonoLabel><strong className="font-mono text-2xl tabular-nums">{formatarCronometro(segundosRestantes)}</strong></div>
          <p className="min-w-48 flex-1 text-xs text-muted-foreground">
            Dia {prova.tipo === 'enem_dia1' ? '1 · 5h30 · anexo da redação disponível abaixo' : '2 · 5h'}
          </p>
          <Button type="button" onClick={() => void finalizarModoProva()} disabled={finalizandoTempo || salvandoLancamento}>{finalizandoTempo || salvandoLancamento ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Finalizar prova</Button>
        </Card>
      ) : null}

      {erro ? (
        <p role="alert" className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      {/* Resumo */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-4xl sm:grid-cols-5">
        <Card className="p-4">
          <MonoLabel>Respondidas</MonoLabel>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{resumo.respondidas}</p>
        </Card>
        <Card className="p-4">
          <MonoLabel>Em branco</MonoLabel>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-muted-foreground">{resumo.emBranco}</p>
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
          <MonoLabel>Total</MonoLabel>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{resumo.total}</p>
        </Card>
      </div>

      {/* Redação — só dia 1 */}
      {(prova.tipo === 'enem_dia1' || prova.redacao_uuid) && (
        <Card className="mt-6 p-5">
          <div className="flex items-center gap-2">
            <PenLine className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">{modoProva ? 'Redação durante a prova' : 'Redação do dia'}</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {prova.redacao_uuid
              ? 'A redação já está vinculada a esta prova. Você pode anexar ou substituir a foto agora.'
              : 'Informe o tema e, se quiser, anexe a foto da folha. Ao finalizar, ela ficará disponível em Redações para correção.'}
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); void handleCriarRedacao() }}
            className="mt-4 flex flex-col gap-3"
          >
            {!prova.redacao_uuid ? (
              <Field label="Tema da redação" className="sm:flex-1">
                <Input
                  value={temaRedacao}
                  onChange={(e) => setTemaRedacao(e.target.value)}
                  placeholder="Ex: Desafios da educação no Brasil"
                />
              </Field>
            ) : (
              <p className="text-sm font-medium">{redacaoVinculada?.tema ?? 'Redação vinculada'}</p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground">
                <ImagePlus className="size-4" />
                {imagemRedacao?.name ?? (redacaoVinculada?.imagem_path ? 'Substituir imagem' : 'Anexar imagem')}
                <input type="file" accept="image/*" className="hidden" onChange={selecionarImagemRedacao} />
              </label>
              <Button
                type="submit"
                variant={modoProva ? 'outline' : 'default'}
                disabled={criandoRedacao || (prova.redacao_uuid ? !imagemRedacao : !temaRedacao.trim() && !imagemRedacao)}
              >
                {criandoRedacao ? <Loader2 className="size-4 animate-spin" /> : <PenLine className="size-4" />}
                {prova.redacao_uuid ? 'Salvar anexo' : 'Vincular redação'}
              </Button>
              {redacaoVinculada?.imagem_path && !imagemRedacao ? (
                <Badge variant="success">Imagem anexada</Badge>
              ) : null}
            </div>
            {modoProva ? (
              <p className="text-xs text-muted-foreground">O botão “Finalizar prova” também salva o tema e a imagem selecionados.</p>
            ) : null}
          </form>
          {prova.redacao_uuid ? (
            <a href="/estudos/redacoes" className="mt-3 inline-block text-sm underline underline-offset-4">
              Abrir em Redações para completar ou corrigir
            </a>
          ) : null}
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
            <Button size="lg" onClick={() => void (modoProva ? finalizarModoProva() : handleSalvarLancamento())} disabled={salvandoLancamento || finalizandoTempo}>
              {salvandoLancamento ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {modoProva ? 'Finalizar prova e salvar' : 'Salvar lançamento'}
            </Button>
          </div>
        </div>
      )}

      {/* FASE 2 — Corrigir (linha a linha: matéria, conteúdo, motivo, dificuldade) */}
      {pendentesCorrecao.length > 0 && !modoProva && (
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
                    <Field label="Conteúdo/assunto">
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
                    <Field label="Dificuldade">
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
                    <Field label="Motivo do erro">
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

function formatarCronometro(totalSegundos: number) {
  const horas = Math.floor(totalSegundos / 3600)
  const minutos = Math.floor((totalSegundos % 3600) / 60)
  const segundos = totalSegundos % 60
  return [horas, minutos, segundos].map((valor) => String(valor).padStart(2, '0')).join(':')
}
