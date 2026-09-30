'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { atualizarMateria, criarMateriaEnem, type AreaEnem, type Materia } from '@/lib/materias'

export function GerenciarMateriasEnem({ area, materias, recarregar }: {
  area: AreaEnem
  materias: Materia[]
  recarregar: () => Promise<void>
}) {
  const [nome, setNome] = useState('')
  const [existenteUuid, setExistenteUuid] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [precisaRecarregar, setPrecisaRecarregar] = useState(false)
  const [erro, setErro] = useState('')
  const trava = useRef(false)
  const disponiveis = materias.filter((materia) => !materia.mostra_enem)
  const bloqueado = ocupado || precisaRecarregar

  async function conferirEstado() {
    if (trava.current) return
    trava.current = true
    setOcupado(true)
    try {
      await recarregar()
      setPrecisaRecarregar(false)
      setErro('')
    } catch {
      setErro('Ainda não foi possível conferir as matérias. Verifique a conexão e tente atualizar novamente.')
    } finally {
      trava.current = false
      setOcupado(false)
    }
  }

  async function executar(acao: () => Promise<boolean>) {
    if (trava.current || precisaRecarregar) return
    trava.current = true
    setOcupado(true)
    setErro('')
    try {
      if (!await acao()) throw new Error('gravação não confirmada')
      await recarregar()
      setNome('')
      setExistenteUuid('')
    } catch {
      setPrecisaRecarregar(true)
      setErro('Não foi possível confirmar a operação. Ela pode ter sido salva. Atualize os dados antes de tentar novamente para evitar duplicatas.')
    } finally {
      trava.current = false
      setOcupado(false)
    }
  }

  function criar() {
    const limpo = nome.trim()
    if (!limpo) { setErro('Informe o nome da matéria.'); return }
    if (materias.some((materia) => materia.nome.trim().toLocaleLowerCase('pt-BR') === limpo.toLocaleLowerCase('pt-BR'))) {
      setErro('Essa matéria já existe. Se ela aparece na lista abaixo, use “Adicionar existente”.')
      return
    }
    void executar(async () => Boolean(await criarMateriaEnem(limpo, area)))
  }

  function adicionarExistente() {
    if (!disponiveis.some((materia) => materia.uuid === existenteUuid)) {
      setErro('Selecione uma matéria existente.')
      return
    }
    void executar(async () => Boolean(await atualizarMateria(existenteUuid, { mostra_enem: true, area_enem: area })))
  }

  return (
    <section aria-label="Gerenciar matérias do ENEM" className="space-y-4 rounded-xl border border-border p-4">
      <div>
        <h2 className="font-semibold">Gerenciar matérias desta área</h2>
        <p className="mt-1 text-sm text-muted-foreground">Crie uma matéria exclusiva do ENEM ou aproveite uma já cadastrada em Escola/Faculdade. Os registros existentes são preservados.</p>
      </div>
      {erro ? <p role="alert" className="text-sm text-destructive">{erro}</p> : null}
      {precisaRecarregar ? <Button type="button" variant="outline" disabled={ocupado} onClick={() => void conferirEstado()}>Atualizar dados</Button> : null}
      <form className="flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); criar() }}>
        <Input aria-label="Nome da nova matéria" placeholder="Nome da nova matéria" maxLength={120} value={nome} onChange={(event) => setNome(event.target.value)} disabled={bloqueado} required className="min-w-48 flex-1" />
        <Button type="submit" disabled={bloqueado}>Criar matéria</Button>
      </form>
      {disponiveis.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <select aria-label="Matéria existente" value={existenteUuid} onChange={(event) => setExistenteUuid(event.target.value)} disabled={bloqueado} className="min-h-9 min-w-48 flex-1 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="">Selecione uma matéria existente</option>
            {disponiveis.map((materia) => <option key={materia.uuid} value={materia.uuid}>{materia.nome}</option>)}
          </select>
          <Button type="button" variant="outline" disabled={bloqueado || !existenteUuid} onClick={adicionarExistente}>Adicionar existente</Button>
        </div>
      ) : null}
    </section>
  )
}
