'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { BookOpen, ChevronRight, Medal, Plus, Trash2, University } from 'lucide-react'

import { BackLink, PageHeader, PageShell } from '@/components/study/page-shell'
import { EmptyState } from '@/components/study/empty-state'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { criarMateria, deletarMateria, listarMaterias, Materia, TipoMateria } from '@/lib/materias'

type AreaAdicional = 'olimpiada' | 'vestibular' | 'outro'

const CONFIG: Record<AreaAdicional, { titulo: string; descricao: string; icon: typeof Medal }> = {
  olimpiada: { titulo: 'Olimpíadas', descricao: 'Matérias e conteúdos para olimpíadas científicas.', icon: Medal },
  vestibular: { titulo: 'Vestibulares', descricao: 'Organização simples para vestibulares além do ENEM.', icon: University },
  outro: { titulo: 'Outros estudos', descricao: 'Assuntos independentes que ainda não pertencem a outra área.', icon: BookOpen },
}

function isAreaAdicional(valor: string): valor is AreaAdicional {
  return valor === 'olimpiada' || valor === 'vestibular' || valor === 'outro'
}

export default function AreaEstudosPage() {
  const params = useParams<{ tipo: string }>()
  const tipo = params.tipo
  const valido = isAreaAdicional(tipo)
  const config = valido ? CONFIG[tipo] : null
  const [materias, setMaterias] = useState<Materia[]>([])
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState('#7c9a72')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [materiaParaApagar, setMateriaParaApagar] = useState<Materia | null>(null)

  const carregar = useCallback(async () => {
    if (!valido) {
      setCarregando(false)
      return
    }
    const atuais = await listarMaterias(tipo as TipoMateria)
    if (atuais === null) setErro('Não foi possível carregar esta área de estudos.')
    setMaterias(atuais ?? [])
    setCarregando(false)
  }, [tipo, valido])

  useEffect(() => {
    // A área da rota determina a consulta assíncrona de matérias.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar()
  }, [carregar])

  async function adicionarMateria(event: React.FormEvent) {
    event.preventDefault()
    if (!valido || !nome.trim()) return
    const criada = await criarMateria({
      nome: nome.trim(),
      tipo,
      cor,
      mostra_escola: false,
      mostra_enem: false,
      area_enem: null,
      plataforma: null,
      carga_horaria_total_horas: null,
      horas_dedicadas: 0,
      certificado_path: null,
      concluido: false,
      data_conclusao: null,
    })
    if (!criada) return setErro('Não foi possível criar a matéria.')
    setNome('')
    setErro('')
    setMaterias((atuais) => [...atuais, criada].sort((a, b) => a.nome.localeCompare(b.nome)))
  }

  if (!config || !valido) {
    return <PageShell><BackLink href="/estudos">Voltar a Estudos</BackLink><div className="mt-8"><EmptyState title="Área não encontrada" description="Escolha uma das áreas disponíveis no Hub de Estudos." /></div></PageShell>
  }

  const Icon = config.icon
  return (
    <PageShell>
      <BackLink href="/estudos">Voltar a Estudos</BackLink>
      <div className="mt-5"><PageHeader eyebrow="Área de Estudos" title={config.titulo} description={config.descricao} /></div>

      {erro ? <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p> : null}

      <Card className="mt-7 p-4">
        <form onSubmit={adicionarMateria} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_auto] sm:items-end">
          <div className="space-y-2"><Label htmlFor="nova-materia">Nova matéria</Label><Input id="nova-materia" value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Nome da matéria" /></div>
          <div className="space-y-2"><Label htmlFor="cor-materia">Cor</Label><Input id="cor-materia" type="color" value={cor} onChange={(event) => setCor(event.target.value)} /></div>
          <Button type="submit"><Plus />Adicionar</Button>
        </form>
      </Card>

      {carregando ? <div className="mt-6 grid gap-3 sm:grid-cols-2"><Skeleton className="h-28" /><Skeleton className="h-28" /></div> : materias.length === 0 ? (
        <div className="mt-8"><EmptyState icon={Icon} title="Nenhuma matéria nesta área" description="Crie a primeira matéria para começar a organizar conteúdos e sessões." /></div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {materias.map((materia) => (
            <Card key={materia.uuid} className="group relative overflow-hidden p-4">
              <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: materia.cor ?? '#7c9a72' }} />
              <Link href={`/estudos/materia/${materia.uuid}?from=${tipo}`} className="block pr-9 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30">
                <Icon className="size-5 text-muted-foreground" />
                <h2 className="mt-3 font-semibold">{materia.nome}</h2>
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">Abrir conteúdos <ChevronRight className="size-3" /></span>
              </Link>
              <Button type="button" variant="ghost" size="icon-xs" className="absolute right-3 top-3" aria-label={`Apagar ${materia.nome}`} onClick={() => setMateriaParaApagar(materia)}><Trash2 /></Button>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog open={materiaParaApagar !== null} title="Apagar matéria?" description={materiaParaApagar ? `“${materiaParaApagar.nome}” deixará de aparecer nesta área. Conteúdos compartilhados permanecem nas outras matérias.` : ''} confirmLabel="Apagar" onOpenChange={(open) => { if (!open) setMateriaParaApagar(null) }} onConfirm={async () => { if (materiaParaApagar && await deletarMateria(materiaParaApagar.uuid)) setMaterias((atuais) => atuais.filter((materia) => materia.uuid !== materiaParaApagar.uuid)) }} />
    </PageShell>
  )
}
