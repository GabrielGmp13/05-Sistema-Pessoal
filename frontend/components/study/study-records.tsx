'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Clock3, ExternalLink, FileText, FileUp, Library, Loader2, Plus, Trash2 } from 'lucide-react'

import { Conteudo } from '@/lib/conteudos'
import {
  AnotacaoEstudo,
  criarAnotacaoEstudo,
  deletarAnotacaoEstudo,
  listarAnotacoesPorMateria,
} from '@/lib/anotacoes-estudo'
import {
  criarMaterialEstudo,
  criarMaterialComArquivo,
  deletarMaterialEstudo,
  getUrlArquivoMaterial,
  listarMateriaisPorConteudos,
  MaterialEstudo,
  TipoMaterialEstudo,
} from '@/lib/materiais-estudo'
import {
  criarSessaoEstudo,
  deletarSessaoEstudo,
  listarSessoesPorMateria,
  SessaoEstudo,
} from '@/lib/sessoes-estudo'
import { EmptyState } from '@/components/study/empty-state'
import { Field } from '@/components/study/field'
import { MonoLabel } from '@/components/study/mono-label'
import { Section } from '@/components/study/section'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

const MATERIAL_LABELS: Record<TipoMaterialEstudo, string> = {
  link: 'Link',
  pdf: 'PDF',
  video: 'Vídeo',
  livro: 'Livro',
  outro: 'Outro',
}

interface Confirmacao {
  title: string
  description: string
  action: () => Promise<void>
}

function agoraLocal() {
  const agora = new Date()
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset())
  return agora.toISOString().slice(0, 16)
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function normalizarUrl(valor: string | null) {
  if (!valor?.trim()) return null
  try {
    const url = new URL(valor.trim())
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

function formatarDuracao(minutos: number) {
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const restante = minutos % 60
  return restante > 0 ? `${horas}h ${restante}min` : `${horas}h`
}

export function StudyRecords({
  materiaUuid,
  conteudos,
}: {
  materiaUuid: string
  conteudos: Conteudo[]
}) {
  const [materiais, setMateriais] = useState<MaterialEstudo[]>([])
  const [anotacoes, setAnotacoes] = useState<AnotacaoEstudo[]>([])
  const [sessoes, setSessoes] = useState<SessaoEstudo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [confirmacao, setConfirmacao] = useState<Confirmacao | null>(null)
  const [urlsArquivos, setUrlsArquivos] = useState<Record<string, string>>({})
  const [arquivoMaterial, setArquivoMaterial] = useState<File | null>(null)
  const [enviandoMaterial, setEnviandoMaterial] = useState(false)

  const [novoMaterial, setNovoMaterial] = useState({
    conteudo_uuid: '',
    tipo: 'link' as TipoMaterialEstudo,
    titulo: '',
    url: '',
    origem: 'url' as 'url' | 'arquivo',
  })
  const [novaAnotacao, setNovaAnotacao] = useState({
    conteudo_uuid: '',
    titulo: '',
    corpo: '',
  })
  const [novaSessao, setNovaSessao] = useState({
    conteudo_uuid: '',
    inicio: agoraLocal(),
    duracao_minutos: '',
    observacoes: '',
  })

  const conteudoUuids = useMemo(() => conteudos.map((conteudo) => conteudo.uuid), [conteudos])
  const conteudosPorUuid = useMemo(
    () => new Map(conteudos.map((conteudo) => [conteudo.uuid, conteudo.nome])),
    [conteudos],
  )

  const carregar = useCallback(async () => {
    const [materiaisAtuais, anotacoesAtuais, sessoesAtuais] = await Promise.all([
      listarMateriaisPorConteudos(conteudoUuids),
      listarAnotacoesPorMateria(materiaUuid),
      listarSessoesPorMateria(materiaUuid),
    ])

    if (materiaisAtuais === null || anotacoesAtuais === null || sessoesAtuais === null) {
      setErro('Não foi possível carregar os registros de estudo.')
    } else {
      setErro('')
    }
    setMateriais(materiaisAtuais ?? [])
    setAnotacoes(anotacoesAtuais ?? [])
    setSessoes(sessoesAtuais ?? [])

    const materiaisComArquivo = (materiaisAtuais ?? []).filter((material) => material.arquivo_path)
    const urls = await Promise.all(
      materiaisComArquivo.map(async (material) => [
        material.uuid,
        await getUrlArquivoMaterial(material.arquivo_path!),
      ] as const),
    )
    setUrlsArquivos(Object.fromEntries(urls.filter((item): item is readonly [string, string] => Boolean(item[1]))))
    setCarregando(false)
  }, [conteudoUuids, materiaUuid])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregar()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [carregar])

  async function handleCriarMaterial(event: React.FormEvent) {
    event.preventDefault()
    if (!novoMaterial.conteudo_uuid || !novoMaterial.titulo.trim()) return

    if (novoMaterial.origem === 'arquivo') {
      if (!arquivoMaterial) {
        setErro('Selecione um arquivo para enviar.')
        return
      }
      if (arquivoMaterial.size > 50 * 1024 * 1024) {
        setErro('O arquivo deve ter no máximo 50 MB.')
        return
      }

      setEnviandoMaterial(true)
      const criado = await criarMaterialComArquivo({
        conteudo_uuid: novoMaterial.conteudo_uuid,
        tipo: novoMaterial.tipo,
        titulo: novoMaterial.titulo.trim(),
        file: arquivoMaterial,
      })
      setEnviandoMaterial(false)
      if (!criado) {
        setErro('Não foi possível enviar o arquivo.')
        return
      }

      setArquivoMaterial(null)
      setNovoMaterial({ conteudo_uuid: '', tipo: 'link', titulo: '', url: '', origem: 'url' })
      await carregar()
      return
    }

    const exigeUrl = ['link', 'pdf', 'video'].includes(novoMaterial.tipo)
    const url = normalizarUrl(novoMaterial.url)
    if ((exigeUrl && !url) || (novoMaterial.url.trim() && !url)) {
      setErro('Informe uma URL válida iniciada por http:// ou https://.')
      return
    }

    const criado = await criarMaterialEstudo({
      conteudo_uuid: novoMaterial.conteudo_uuid,
      tipo: novoMaterial.tipo,
      titulo: novoMaterial.titulo.trim(),
      url,
      arquivo_path: null,
    })
    if (!criado) {
      setErro('Não foi possível adicionar o material.')
      return
    }

    setNovoMaterial({ conteudo_uuid: '', tipo: 'link', titulo: '', url: '', origem: 'url' })
    await carregar()
  }

  async function handleCriarAnotacao(event: React.FormEvent) {
    event.preventDefault()
    if (!novaAnotacao.corpo.trim()) return

    const criada = await criarAnotacaoEstudo({
      materia_uuid: materiaUuid,
      conteudo_uuid: novaAnotacao.conteudo_uuid || null,
      titulo: novaAnotacao.titulo.trim() || null,
      corpo: novaAnotacao.corpo.trim(),
    })
    if (!criada) {
      setErro('Não foi possível adicionar a anotação.')
      return
    }

    setNovaAnotacao({ conteudo_uuid: '', titulo: '', corpo: '' })
    await carregar()
  }

  async function handleCriarSessao(event: React.FormEvent) {
    event.preventDefault()
    const duracao = Number(novaSessao.duracao_minutos)
    const inicio = new Date(novaSessao.inicio)
    if (!novaSessao.inicio || !Number.isInteger(duracao) || duracao <= 0 || Number.isNaN(inicio.getTime())) {
      setErro('Informe um início válido e a duração em minutos inteiros.')
      return
    }

    const fim = new Date(inicio.getTime() + duracao * 60_000)
    const criada = await criarSessaoEstudo({
      materia_uuid: materiaUuid,
      conteudo_uuid: novaSessao.conteudo_uuid || null,
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
      duracao_minutos: duracao,
      observacoes: novaSessao.observacoes.trim() || null,
    })
    if (!criada) {
      setErro('Não foi possível registrar a sessão.')
      return
    }

    setNovaSessao({
      conteudo_uuid: '',
      inicio: agoraLocal(),
      duracao_minutos: '',
      observacoes: '',
    })
    await carregar()
  }

  function pedirExclusao(
    title: string,
    description: string,
    action: () => Promise<boolean>,
  ) {
    setConfirmacao({
      title,
      description,
      action: async () => {
        const apagado = await action()
        if (!apagado) {
          setErro('Não foi possível apagar o registro.')
          return
        }
        await carregar()
      },
    })
  }

  const totalMinutos = sessoes.reduce(
    (total, sessao) => total + (sessao.duracao_minutos ?? 0),
    0,
  )

  if (carregando) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      {erro ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      <Section label="Acervo" title="Materiais" count={materiais.length}>
        <div className="flex flex-col gap-4">
          {materiais.length === 0 ? (
            <EmptyState icon={Library} title="Nenhum material adicionado" compact />
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {materiais.map((material) => {
                const materialUrl = normalizarUrl(material.url) ?? urlsArquivos[material.uuid]
                return (
                  <li key={material.uuid} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium">{material.titulo}</span>
                        <Badge variant="outline">{MATERIAL_LABELS[material.tipo]}</Badge>
                      </div>
                      <MonoLabel>{conteudosPorUuid.get(material.conteudo_uuid) ?? 'Conteúdo removido'}</MonoLabel>
                    </div>
                    {materialUrl ? (
                      <Button variant="ghost" size="icon-sm" render={<a href={materialUrl} target="_blank" rel="noreferrer" />} aria-label="Abrir material">
                        <ExternalLink className="size-3.5" />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => pedirExclusao(
                        'Apagar material?',
                        `O material "${material.titulo}" será removido deste conteúdo.`,
                        () => deletarMaterialEstudo(material.uuid),
                      )}
                      aria-label="Apagar material"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}

          <Card className="p-4">
            <form onSubmit={handleCriarMaterial} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Conteúdo">
                <Select
                  value={novoMaterial.conteudo_uuid}
                  onChange={(event) => setNovoMaterial((atual) => ({ ...atual, conteudo_uuid: event.target.value }))}
                  disabled={conteudos.length === 0}
                >
                  <option value="">Selecione um conteúdo</option>
                  {conteudos.map((conteudo) => <option key={conteudo.uuid} value={conteudo.uuid}>{conteudo.nome}</option>)}
                </Select>
              </Field>
              <Field label="Tipo">
                <Select
                  value={novoMaterial.tipo}
                  onChange={(event) => setNovoMaterial((atual) => ({ ...atual, tipo: event.target.value as TipoMaterialEstudo }))}
                >
                  {Object.entries(MATERIAL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </Field>
              <Field label="Origem">
                <Select
                  value={novoMaterial.origem}
                  onChange={(event) => setNovoMaterial((atual) => ({ ...atual, origem: event.target.value as 'url' | 'arquivo' }))}
                >
                  <option value="url">URL</option>
                  <option value="arquivo">Arquivo privado</option>
                </Select>
              </Field>
              <Field label="Título">
                <Input value={novoMaterial.titulo} onChange={(event) => setNovoMaterial((atual) => ({ ...atual, titulo: event.target.value }))} />
              </Field>
              {novoMaterial.origem === 'url' ? (
                <Field label="URL" optional={!['link', 'pdf', 'video'].includes(novoMaterial.tipo)}>
                  <Input type="url" value={novoMaterial.url} onChange={(event) => setNovoMaterial((atual) => ({ ...atual, url: event.target.value }))} placeholder="https://" />
                </Field>
              ) : (
                <Field label="Arquivo">
                  <Input
                    type="file"
                    accept=".pdf,.epub,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.json"
                    onChange={(event) => setArquivoMaterial(event.target.files?.[0] ?? null)}
                  />
                </Field>
              )}
              <Button type="submit" size="sm" className="sm:col-span-2 sm:justify-self-start" disabled={conteudos.length === 0 || enviandoMaterial}>
                {enviandoMaterial ? <Loader2 className="size-3.5 animate-spin" /> : novoMaterial.origem === 'arquivo' ? <FileUp className="size-3.5" /> : <Plus className="size-3.5" />}
                {enviandoMaterial ? 'Enviando...' : 'Adicionar material'}
              </Button>
            </form>
          </Card>
        </div>
      </Section>

      <Section label="Registro" title="Anotações" count={anotacoes.length}>
        <div className="flex flex-col gap-4">
          {anotacoes.length === 0 ? (
            <EmptyState icon={FileText} title="Nenhuma anotação registrada" compact />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {anotacoes.map((anotacao) => (
                <li key={anotacao.uuid} className="flex min-w-0 flex-col gap-2 rounded-lg border border-border p-4">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{anotacao.titulo ?? 'Anotação'}</p>
                      <MonoLabel>
                        {anotacao.conteudo_uuid ? conteudosPorUuid.get(anotacao.conteudo_uuid) ?? 'Conteúdo removido' : 'Geral da matéria'}
                      </MonoLabel>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => pedirExclusao(
                        'Apagar anotação?',
                        `A anotação "${anotacao.titulo ?? 'sem título'}" será removida.`,
                        () => deletarAnotacaoEstudo(anotacao.uuid),
                      )}
                      aria-label="Apagar anotação"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{anotacao.corpo}</p>
                </li>
              ))}
            </ul>
          )}

          <Card className="p-4">
            <form onSubmit={handleCriarAnotacao} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Título" optional>
                <Input value={novaAnotacao.titulo} onChange={(event) => setNovaAnotacao((atual) => ({ ...atual, titulo: event.target.value }))} />
              </Field>
              <Field label="Conteúdo" optional>
                <Select value={novaAnotacao.conteudo_uuid} onChange={(event) => setNovaAnotacao((atual) => ({ ...atual, conteudo_uuid: event.target.value }))}>
                  <option value="">Geral da matéria</option>
                  {conteudos.map((conteudo) => <option key={conteudo.uuid} value={conteudo.uuid}>{conteudo.nome}</option>)}
                </Select>
              </Field>
              <Field label="Anotação" className="sm:col-span-2">
                <Textarea value={novaAnotacao.corpo} onChange={(event) => setNovaAnotacao((atual) => ({ ...atual, corpo: event.target.value }))} />
              </Field>
              <Button type="submit" size="sm" className="sm:col-span-2 sm:justify-self-start">
                <Plus className="size-3.5" />
                Adicionar anotação
              </Button>
            </form>
          </Card>
        </div>
      </Section>

      <Section
        label="Tempo"
        title="Sessões de estudo"
        count={sessoes.length}
        actions={totalMinutos > 0 ? <Badge variant="outline">{formatarDuracao(totalMinutos)} no total</Badge> : undefined}
      >
        <div className="flex flex-col gap-4">
          {sessoes.length === 0 ? (
            <EmptyState icon={Clock3} title="Nenhuma sessão registrada" compact />
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {sessoes.map((sessao) => (
                <li key={sessao.uuid} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-medium tabular-nums">{formatarDuracao(sessao.duracao_minutos ?? 0)}</span>
                      <MonoLabel>{formatarDataHora(sessao.inicio)}</MonoLabel>
                    </div>
                    <span className="truncate text-sm text-muted-foreground">
                      {sessao.conteudo_uuid ? conteudosPorUuid.get(sessao.conteudo_uuid) ?? 'Conteúdo removido' : 'Estudo geral'}
                      {sessao.observacoes ? ` · ${sessao.observacoes}` : ''}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => pedirExclusao(
                      'Apagar sessão?',
                      `O registro de ${formatarDuracao(sessao.duracao_minutos ?? 0)} será removido.`,
                      () => deletarSessaoEstudo(sessao.uuid),
                    )}
                    aria-label="Apagar sessão de estudo"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <Card className="p-4">
            <form onSubmit={handleCriarSessao} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Início">
                <Input type="datetime-local" value={novaSessao.inicio} onChange={(event) => setNovaSessao((atual) => ({ ...atual, inicio: event.target.value }))} />
              </Field>
              <Field label="Duração (minutos)">
                <Input type="number" min="1" step="1" inputMode="numeric" value={novaSessao.duracao_minutos} onChange={(event) => setNovaSessao((atual) => ({ ...atual, duracao_minutos: event.target.value }))} />
              </Field>
              <Field label="Conteúdo" optional>
                <Select value={novaSessao.conteudo_uuid} onChange={(event) => setNovaSessao((atual) => ({ ...atual, conteudo_uuid: event.target.value }))}>
                  <option value="">Estudo geral</option>
                  {conteudos.map((conteudo) => <option key={conteudo.uuid} value={conteudo.uuid}>{conteudo.nome}</option>)}
                </Select>
              </Field>
              <Field label="Observações" optional>
                <Input value={novaSessao.observacoes} onChange={(event) => setNovaSessao((atual) => ({ ...atual, observacoes: event.target.value }))} />
              </Field>
              <Button type="submit" size="sm" className="sm:col-span-2 sm:justify-self-start">
                <Plus className="size-3.5" />
                Registrar sessão
              </Button>
            </form>
          </Card>
        </div>
      </Section>

      <ConfirmDialog
        open={confirmacao !== null}
        title={confirmacao?.title ?? ''}
        description={confirmacao?.description ?? ''}
        confirmLabel="Apagar"
        onOpenChange={(open) => {
          if (!open) setConfirmacao(null)
        }}
        onConfirm={async () => {
          await confirmacao?.action()
        }}
      />
    </div>
  )
}
