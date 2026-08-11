'use client'

import { useEffect, useMemo, useState } from 'react'
import { ImagePlus, Loader2, PenLine, Plus, TrendingUp, X } from 'lucide-react'

import { BackLink, PageHeader, PageShell } from '@/components/study/page-shell'
import { Section } from '@/components/study/section'
import { MonoLabel } from '@/components/study/mono-label'
import { EmptyState } from '@/components/study/empty-state'
import { Field } from '@/components/study/field'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/utils'

import {
  listarRedacoes,
  criarRedacao,
  atualizarRedacao,
  somaCompetencias,
  uploadImagemRedacao,
  getUrlImagemRedacao,
  removerImagemRedacao,
  Redacao,
} from '../../../lib/redacoes'

const COMP_LABELS = [
  'Domínio da norma culta',
  'Compreensão do tema',
  'Seleção de argumentos',
  'Mecanismos linguísticos',
  'Proposta de intervenção',
]

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function RedacoesPage() {
  const [redacoes, setRedacoes] = useState<Redacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [editandoUuid, setEditandoUuid] = useState<string | null>(null)

  const [form, setForm] = useState({
    tema: '',
    texto: '',
    data: '',
    c1: '',
    c2: '',
    c3: '',
    c4: '',
    c5: '',
  })

  async function carregar() {
    const r = await listarRedacoes()
    setRedacoes(r ?? [])
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  const scored = redacoes
    .map((r) => somaCompetencias(r))
    .filter((s): s is number => s != null)

  const stats = useMemo(() => {
    if (scored.length === 0) return { avg: null as number | null, best: null as number | null }
    return {
      avg: Math.round(scored.reduce((a, b) => a + b, 0) / scored.length),
      best: Math.max(...scored),
    }
  }, [scored])

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    // Texto agora é opcional — só tema e data são obrigatórios (permite
    // registrar a redação na hora da prova e completar depois com foto/texto).
    if (!form.tema.trim() || !form.data) return

    const competencias = {
      competencia_1: form.c1 ? Number(form.c1) : null,
      competencia_2: form.c2 ? Number(form.c2) : null,
      competencia_3: form.c3 ? Number(form.c3) : null,
      competencia_4: form.c4 ? Number(form.c4) : null,
      competencia_5: form.c5 ? Number(form.c5) : null,
    }

    const notaCalculada = somaCompetencias(competencias)

    await criarRedacao({
      tema: form.tema,
      texto: form.texto || null,
      data: form.data,
      nota: notaCalculada,
      comentario: null,
      imagem_path: null,
      ...competencias,
    })

    setForm({ tema: '', texto: '', data: '', c1: '', c2: '', c3: '', c4: '', c5: '' })
    await carregar()
  }

  function updateField(campo: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [campo]: value }))
  }

  return (
    <PageShell>
      <div className="mb-5">
        <BackLink href="/estudos">Voltar ao Hub</BackLink>
      </div>
      <PageHeader
        eyebrow="Mundo Redações"
        title="Redações"
        description="Registre suas redações com a nota de cada uma das cinco competências e acompanhe sua evolução."
      />

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Redações" value={String(redacoes.length)} icon={PenLine} />
        <StatCard
          label="Média"
          value={stats.avg != null ? String(stats.avg) : '—'}
          icon={TrendingUp}
        />
        <StatCard
          label="Melhor nota"
          value={stats.best != null ? String(stats.best) : '—'}
          icon={TrendingUp}
        />
        <StatCard label="Máx. possível" value="1000" icon={PenLine} />
      </div>

      <div className="mt-10 flex flex-col gap-10">
        <Section label="Nova" title="Registrar redação">
          <Card className="p-5">
            <form onSubmit={handleCriar} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
                <Field label="Tema">
                  <Input
                    value={form.tema}
                    onChange={(e) => updateField('tema', e.target.value)}
                    placeholder="Ex: Desafios da educação no Brasil"
                  />
                </Field>
                <Field label="Data">
                  <Input
                    type="date"
                    value={form.data}
                    onChange={(e) => updateField('data', e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Texto" optional>
                <textarea
                  value={form.texto}
                  onChange={(e) => updateField('texto', e.target.value)}
                  placeholder="Pode deixar em branco e completar depois — inclusive só com foto da folha manuscrita"
                  rows={6}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
                />
              </Field>

              <div>
                <MonoLabel>Competências (0 a 200) — opcional, preencha quando tiver a correção</MonoLabel>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {(['c1', 'c2', 'c3', 'c4', 'c5'] as const).map((campo, i) => (
                    <Field key={campo} label={`C${i + 1}`}>
                      <Input
                        value={form[campo]}
                        onChange={(e) => updateField(campo, e.target.value)}
                        placeholder="0"
                        inputMode="numeric"
                        aria-label={COMP_LABELS[i]}
                        title={COMP_LABELS[i]}
                      />
                    </Field>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="lg">
                  <Plus className="size-4" />
                  Salvar redação
                </Button>
              </div>
            </form>
          </Card>
        </Section>

        <Section label="Histórico" title="Minhas redações" count={redacoes.length}>
          {carregando ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : redacoes.length === 0 ? (
            <EmptyState
              icon={PenLine}
              title="Nenhuma redação registrada"
              description="Registre sua primeira redação no formulário acima."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {redacoes.map((r) => (
                <RedacaoCard
                  key={r.uuid}
                  redacao={r}
                  editando={editandoUuid === r.uuid}
                  onEditar={() => setEditandoUuid(r.uuid)}
                  onFecharEdicao={() => setEditandoUuid(null)}
                  onAtualizado={carregar}
                />
              ))}
            </div>
          )}
        </Section>
      </div>
    </PageShell>
  )
}

function RedacaoCard({
  redacao: r,
  editando,
  onEditar,
  onFecharEdicao,
  onAtualizado,
}: {
  redacao: Redacao
  editando: boolean
  onEditar: () => void
  onFecharEdicao: () => void
  onAtualizado: () => Promise<void>
}) {
  const score = somaCompetencias(r)
  const comps = [r.competencia_1, r.competencia_2, r.competencia_3, r.competencia_4, r.competencia_5]

  const [urlImagem, setUrlImagem] = useState<string | null>(null)
  const [enviandoImagem, setEnviandoImagem] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [confirmarRemocaoImagem, setConfirmarRemocaoImagem] = useState(false)

  const [textoEdit, setTextoEdit] = useState(r.texto ?? '')
  const [comentarioEdit, setComentarioEdit] = useState(r.comentario ?? '')
  const [compsEdit, setCompsEdit] = useState({
    c1: r.competencia_1?.toString() ?? '',
    c2: r.competencia_2?.toString() ?? '',
    c3: r.competencia_3?.toString() ?? '',
    c4: r.competencia_4?.toString() ?? '',
    c5: r.competencia_5?.toString() ?? '',
  })

  useEffect(() => {
    if (r.imagem_path) {
      getUrlImagemRedacao(r.imagem_path).then(setUrlImagem)
    } else {
      setUrlImagem(null)
    }
  }, [r.imagem_path])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setEnviandoImagem(true)
    await uploadImagemRedacao(r.uuid, file)
    setEnviandoImagem(false)
    await onAtualizado()
  }

  async function handleRemoverImagemConfirmada() {
    if (!r.imagem_path) return
    await removerImagemRedacao(r.uuid, r.imagem_path)
    setConfirmarRemocaoImagem(false)
    await onAtualizado()
  }

  async function handleSalvarEdicao() {
    setSalvando(true)
    const competencias = {
      competencia_1: compsEdit.c1 ? Number(compsEdit.c1) : null,
      competencia_2: compsEdit.c2 ? Number(compsEdit.c2) : null,
      competencia_3: compsEdit.c3 ? Number(compsEdit.c3) : null,
      competencia_4: compsEdit.c4 ? Number(compsEdit.c4) : null,
      competencia_5: compsEdit.c5 ? Number(compsEdit.c5) : null,
    }
    await atualizarRedacao(r.uuid, {
      texto: textoEdit || null,
      comentario: comentarioEdit || null,
      nota: somaCompetencias(competencias),
      ...competencias,
    })
    setSalvando(false)
    onFecharEdicao()
    await onAtualizado()
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-pretty font-medium">{r.tema}</span>
          <MonoLabel>{formatDate(r.data)}</MonoLabel>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {score != null ? (
            <Badge variant={score >= 800 ? 'success' : 'default'} className="text-sm">
              {score} / 1000
            </Badge>
          ) : (
            <Badge variant="warning">Incompleta</Badge>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={editando ? onFecharEdicao : onEditar}
          >
            {editando ? 'Fechar' : 'Editar'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {comps.map((c, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-secondary/40 py-2.5"
            title={COMP_LABELS[i]}
          >
            <MonoLabel>C{i + 1}</MonoLabel>
            <span
              className={cn(
                'text-sm font-semibold tabular-nums',
                c == null ? 'text-muted-foreground' : c >= 160 ? 'text-success-foreground' : 'text-foreground',
              )}
            >
              {c == null ? '—' : c}
            </span>
          </div>
        ))}
      </div>

      {/* Imagem da folha manuscrita */}
      <div>
        <MonoLabel>Foto da redação</MonoLabel>
        {urlImagem ? (
          <div className="relative mt-2 inline-block">
            <img src={urlImagem} alt={`Foto da redação: ${r.tema}`} className="max-h-64 rounded-lg border border-border" />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-2 top-2 bg-background/80"
              onClick={() => setConfirmarRemocaoImagem(true)}
              aria-label="Remover imagem"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ) : (
          <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground">
            {enviandoImagem ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {enviandoImagem ? 'Enviando…' : 'Adicionar foto'}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={enviandoImagem} />
          </label>
        )}
      </div>

      {!editando && r.comentario && (
        <div>
          <MonoLabel>Observação / correção do professor</MonoLabel>
          <p className="mt-1 text-sm text-pretty text-muted-foreground">{r.comentario}</p>
        </div>
      )}

      {!editando && r.texto && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Ver texto digitado</summary>
          <p className="mt-2 whitespace-pre-wrap text-pretty">{r.texto}</p>
        </details>
      )}

      {editando && (
        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <Field label="Texto" optional>
            <textarea
              value={textoEdit}
              onChange={(e) => setTextoEdit(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
            />
          </Field>
          <Field label="Observação / correção do professor" optional>
            <textarea
              value={comentarioEdit}
              onChange={(e) => setComentarioEdit(e.target.value)}
              rows={3}
              placeholder="Comentários do professor sobre a correção"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
            />
          </Field>
          <div>
            <MonoLabel>Competências (0 a 200)</MonoLabel>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {(['c1', 'c2', 'c3', 'c4', 'c5'] as const).map((campo, i) => (
                <Field key={campo} label={`C${i + 1}`}>
                  <Input
                    value={compsEdit[campo]}
                    onChange={(e) => setCompsEdit((s) => ({ ...s, [campo]: e.target.value }))}
                    placeholder="0"
                    inputMode="numeric"
                    aria-label={COMP_LABELS[i]}
                  />
                </Field>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={handleSalvarEdicao} disabled={salvando}>
              {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar alterações
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmarRemocaoImagem}
        title="Remover foto?"
        description="A foto anexada a esta redação será removida. O registro da redação continua salvo."
        confirmLabel="Remover"
        onOpenChange={setConfirmarRemocaoImagem}
        onConfirm={handleRemoverImagemConfirmada}
      />
    </Card>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof PenLine
}) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <Icon className="size-4 text-muted-foreground" />
      <span className="mt-1 text-2xl font-semibold tabular-nums">{value}</span>
      <MonoLabel>{label}</MonoLabel>
    </Card>
  )
}
