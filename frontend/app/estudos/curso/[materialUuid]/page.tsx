'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { listarMaterias, atualizarMateria, Materia } from '../../../../lib/materias'
import { listarModulosCurso, criarModuloCurso, deletarModuloCurso, ModuloCurso } from '../../../../lib/modulos-curso'
import { criarConteudo, listarConteudosPorModuloCurso, atualizarConteudo, Conteudo } from '../../../../lib/conteudos'

export default function CursoDetalhePage() {
  const params = useParams<{ materiaUuid: string }>()
  const materiaUuid = params.materiaUuid

  const [curso, setCurso] = useState<Materia | null>(null)
  const [modulos, setModulos] = useState<ModuloCurso[]>([])
  const [conteudosPorModulo, setConteudosPorModulo] = useState<Record<string, Conteudo[]>>({})
  const [novoModuloNome, setNovoModuloNome] = useState('')
  const [novaAulaNome, setNovaAulaNome] = useState<Record<string, string>>({})
  const [carregando, setCarregando] = useState(true)

  async function carregar() {
    const [cursos, mods] = await Promise.all([
      listarMaterias('curso'),
      listarModulosCurso(materiaUuid),
    ])
    setCurso((cursos ?? []).find((c) => c.uuid === materiaUuid) ?? null)
    setModulos(mods ?? [])

    const mapa: Record<string, Conteudo[]> = {}
    for (const mod of mods ?? []) {
      mapa[mod.uuid] = (await listarConteudosPorModuloCurso(mod.uuid)) ?? []
    }
    setConteudosPorModulo(mapa)
    setCarregando(false)
  }

  useEffect(() => {
    if (materiaUuid) carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materiaUuid])

  async function handleCriarModulo() {
    if (!novoModuloNome.trim()) return
    await criarModuloCurso({
      materia_uuid: materiaUuid,
      nome: novoModuloNome,
      ordem: modulos.length,
    })
    setNovoModuloNome('')
    carregar()
  }

  async function handleDeletarModulo(uuid: string) {
    await deletarModuloCurso(uuid)
    carregar()
  }

  async function handleCriarAula(moduloUuid: string) {
    const nomeAula = novaAulaNome[moduloUuid]
    if (!nomeAula?.trim()) return
    await criarConteudo(
      { nome: nomeAula, progresso: 0, revisao_uuid: null, modulo_curso_uuid: moduloUuid },
      [materiaUuid]
    )
    setNovaAulaNome((prev) => ({ ...prev, [moduloUuid]: '' }))
    carregar()
  }

  async function handleMarcarConcluida(conteudoUuid: string) {
    await atualizarConteudo(conteudoUuid, { progresso: 100 })
    carregar()
  }

  async function handleMarcarCursoConcluido() {
    if (!curso) return
    await atualizarMateria(curso.uuid, {
      concluido: !curso.concluido,
      data_conclusao: !curso.concluido ? new Date().toISOString().slice(0, 10) : null,
    })
    carregar()
  }

  if (carregando) return <p style={{ padding: '2rem' }}>Carregando...</p>

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <Link href="/estudos/curso">← voltar</Link>
      <h1>{curso?.nome ?? 'Curso'}</h1>
      {curso?.plataforma && <p>Plataforma: {curso.plataforma}</p>}
      {curso?.carga_horaria_total_horas != null && (
        <p>Carga horária total: {curso.carga_horaria_total_horas}h</p>
      )}
      <button onClick={handleMarcarCursoConcluido}>
        {curso?.concluido ? '✅ Concluído — desmarcar' : 'Marcar curso como concluído'}
      </button>

      <section style={{ marginTop: '2rem' }}>
        <h2>Módulos</h2>
        {modulos.length === 0 && <p>Nenhum módulo cadastrado ainda.</p>}

        {modulos.map((mod) => (
          <div key={mod.uuid} style={{ border: '1px solid #444', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3>{mod.nome}</h3>
              <button onClick={() => handleDeletarModulo(mod.uuid)}>Apagar módulo</button>
            </div>

            <ul>
              {(conteudosPorModulo[mod.uuid] ?? []).map((aula) => (
                <li key={aula.uuid}>
                  {aula.nome} — progresso: {aula.progresso}%
                  {aula.progresso < 100 && (
                    <button onClick={() => handleMarcarConcluida(aula.uuid)} style={{ marginLeft: '.5rem' }}>
                      Marcar concluída
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <div style={{ marginTop: '.5rem' }}>
              <input
                value={novaAulaNome[mod.uuid] ?? ''}
                onChange={(e) => setNovaAulaNome((prev) => ({ ...prev, [mod.uuid]: e.target.value }))}
                placeholder="Nome da aula"
              />
              <button onClick={() => handleCriarAula(mod.uuid)}>+ Adicionar aula</button>
            </div>
          </div>
        ))}

        <div style={{ marginTop: '1rem' }}>
          <input
            value={novoModuloNome}
            onChange={(e) => setNovoModuloNome(e.target.value)}
            placeholder="Nome do módulo"
          />
          <button onClick={handleCriarModulo}>+ Adicionar módulo</button>
        </div>
      </section>
    </div>
  )
}