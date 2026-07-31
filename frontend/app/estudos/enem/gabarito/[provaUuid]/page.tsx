'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Check, Loader2, Save, Sparkles, X } from 'lucide-react'
import { listarMaterias, Materia } from '../../../../../lib/materias'
import { listarConteudosPorMateria, Conteudo } from '../../../../../lib/conteudos'
import {
  registrarGabaritoProva,
  buscarGabaritoProva,
  QuestaoIndividual,
} from '../../../../../lib/questoes-individuais'
import { BackLink, PageHeader, PageShell } from '@/components/study/page-shell'
import { MonoLabel } from '@/components/study/mono-label'
import { Field } from '@/components/study/field'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface LinhaGabarito {
  numero: number
  acertou: boolean
  conteudo_uuid: string
  motivo_erro: string
}

export default function GabaritoProvaPage() {
  const params = useParams<{ provaUuid: string }>()
  const provaUuid = params.provaUuid

  const [materiasEnem, setMateriasEnem] = useState<Materia[]>([])
  const [materiaSelecionada, setMateriaSelecionada] = useState('')
  const [conteudos, setConteudos] = useState<Conteudo[]>([])
  const [quantidade, setQuantidade] = useState('45')
  const [linhas, setLinhas] = useState<LinhaGabarito[]>([])
  const [jaLancado, setJaLancado] = useState<QuestaoIndividual[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    const [m, g] = await Promise.all([
      listarMaterias('enem'),
      buscarGabaritoProva(provaUuid),
    ])
    setMateriasEnem(m ?? [])
    setJaLancado(g ?? [])
    setCarregando(false)
  }

  useEffect(() => {
    if (provaUuid) carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provaUuid])

  useEffect(() => {
    if (!materiaSelecionada) {
      setConteudos([])
      return
    }
    listarConteudosPorMateria(materiaSelecionada).then((c) => setConteudos(c ?? []))
  }, [materiaSelecionada])

  function gerarLinhas() {
    const n = Number(quantidade)
    if (!n || n <= 0) return
    setLinhas(
      Array.from({ length: n }, (_, i) => ({
        numero: i + 1,
        acertou: true,
        conteudo_uuid: '',
        motivo_erro: '',
      }))
    )
  }

  function atualizarLinha(index: number, campo: keyof LinhaGabarito, valor: string | boolean) {
    setLinhas((prev) => {
      const copia = [...prev]
      copia[index] = { ...copia[index], [campo]: valor } as LinhaGabarito
      return copia
    })
  }

  function toggleAcertou(index: number) {
    setLinhas((prev) => {
      const copia = [...prev]
      copia[index] = {
        ...copia[index],
        acertou: !copia[index].acertou,
        ...(copia[index].acertou ? {} : { conteudo_uuid: '', motivo_erro: '' }),
      }
      return copia
    })
  }

  async function handleSalvar() {
    if (!materiaSelecionada || linhas.length === 0) return
    setSalvando(true)
    await registrarGabaritoProva(
      provaUuid,
      materiaSelecionada,
      new Date().toISOString().slice(0, 10),
      linhas.map((l) => ({
        numero: l.numero,
        acertou: l.acertou,
        conteudo_uuid: l.conteudo_uuid || undefined,
        motivo_erro: l.acertou ? undefined : l.motivo_erro || undefined,
      }))
    )
    setSalvando(false)
    setLinhas([])
    carregar()
  }

  if (carregando) return (
    <PageShell>
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    </PageShell>
  )

  const acertosJaLancados = jaLancado.filter((q) => q.acertou).length
  const pctJaLancado = jaLancado.length > 0
    ? Math.round((acertosJaLancados / jaLancado.length) * 100)
    : 0

  return (
    <PageShell>
      <div className="mb-5">
        <BackLink href="/estudos/enem">Voltar ao ENEM</BackLink>
      </div>
      <PageHeader
        eyebrow="Lançamento em lote"
        title="Gabarito digital"
        description="Digite rapidamente o resultado da prova: marque acertos e erros, e detalhe apenas o que precisar."
      />

      {/* Resumo do gabarito já lançado */}
      {jaLancado.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-md">
          <Card className="p-4">
            <MonoLabel>Questões registradas</MonoLabel>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {jaLancado.length}
            </p>
          </Card>
          <Card className="p-4">
            <MonoLabel>Taxa de acerto</MonoLabel>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-success-foreground">
              {pctJaLancado}%
            </p>
          </Card>
        </div>
      )}

      {/* Seletor de área + quantidade */}
      <Card className="mt-6 p-5">
        <form
          onSubmit={(e) => { e.preventDefault(); gerarLinhas(); }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <Field label="Área do ENEM" className="sm:flex-1">
            <Select
              value={materiaSelecionada}
              onChange={(e) => setMateriaSelecionada(e.target.value)}
              aria-label="Área do ENEM"
            >
              <option value="">Selecione a área</option>
              {materiasEnem.map((m) => (
                <option key={m.uuid} value={m.uuid}>{m.nome}</option>
              ))}
            </Select>
          </Field>
          <Field label="Quantidade de questões" className="sm:w-48">
            <Input
              type="number"
              min={1}
              max={90}
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
          </Field>
          <Button type="submit" size="lg" disabled={!materiaSelecionada} className="shrink-0">
            <Sparkles className="size-4" />
            Gerar tabela
          </Button>
        </form>
      </Card>

      {linhas.length === 0 ? (
        <Card className="mt-4 flex flex-col items-center justify-center gap-2 border-dashed px-6 py-14 text-center">
          <p className="text-sm font-medium">Nenhuma tabela gerada ainda</p>
          <p className="max-w-sm text-pretty text-xs leading-relaxed text-muted-foreground">
            Escolha a área e a quantidade de questões acima e gere a tabela para
            começar o lançamento.
          </p>
        </Card>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <MonoLabel>
              {materiasEnem.find((m) => m.uuid === materiaSelecionada)?.nome ?? 'Área'} · {linhas.length} questões · {linhas.filter((l) => l.acertou).length} certas
            </MonoLabel>
            <button
              type="button"
              onClick={() => setLinhas([])}
              className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Limpar
            </button>
          </div>

          <Card className="divide-y divide-border overflow-hidden">
            {linhas.map((l, i) => (
              <div key={l.numero} className="flex flex-col gap-3 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary font-mono text-sm font-medium tabular-nums">
                    {l.numero}
                  </span>
                  <span className="text-sm text-muted-foreground">Questão {l.numero}</span>
                  <div
                    className="ml-auto inline-flex overflow-hidden rounded-lg border border-border"
                    role="group"
                    aria-label={`Resultado da questão ${l.numero}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!l.acertou) toggleAcertou(i)
                      }}
                      className={cn(
                        'inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors',
                        l.acertou
                          ? 'bg-success text-success-foreground'
                          : 'bg-card text-muted-foreground hover:bg-muted',
                      )}
                      aria-pressed={l.acertou}
                    >
                      <Check className="size-3.5" />
                      Certo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (l.acertou) toggleAcertou(i)
                      }}
                      className={cn(
                        'inline-flex items-center gap-1 border-l border-border px-3 py-1.5 text-xs font-medium transition-colors',
                        !l.acertou
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-card text-muted-foreground hover:bg-muted',
                      )}
                      aria-pressed={!l.acertou}
                    >
                      <X className="size-3.5" />
                      Errado
                    </button>
                  </div>
                </div>

                {!l.acertou ? (
                  <div className="grid grid-cols-1 gap-3 pl-11 sm:grid-cols-2">
                    <Field label="Conteúdo relacionado" optional>
                      <Select
                        value={l.conteudo_uuid}
                        onChange={(e) => atualizarLinha(i, 'conteudo_uuid', e.target.value)}
                        aria-label={`Conteúdo da questão ${l.numero}`}
                      >
                        <option value="">Selecione…</option>
                        {conteudos.map((c) => (
                          <option key={c.uuid} value={c.uuid}>{c.nome}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Motivo do erro" optional>
                      <Input
                        value={l.motivo_erro}
                        onChange={(e) => atualizarLinha(i, 'motivo_erro', e.target.value)}
                        placeholder="Ex: erro de cálculo"
                      />
                    </Field>
                  </div>
                ) : null}
              </div>
            ))}
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button size="lg" onClick={handleSalvar} disabled={salvando}>
              {salvando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {salvando ? 'Salvando…' : `Salvar gabarito (${linhas.length} questões)`}
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  )
}
