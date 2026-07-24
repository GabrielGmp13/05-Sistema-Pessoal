'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listarMaterias, criarMateria, Materia } from '../../../lib/materias'

export default function CursoListaPage() {
  const [cursos, setCursos] = useState<Materia[]>([])
  const [nome, setNome] = useState('')
  const [plataforma, setPlataforma] = useState('')
  const [cargaHoraria, setCargaHoraria] = useState('')
  const [carregando, setCarregando] = useState(true)

  async function carregar() {
    const m = await listarMaterias('curso')
    setCursos(m ?? [])
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  async function handleCriarCurso() {
    if (!nome.trim()) return
    await criarMateria({
      nome,
      tipo: 'curso',
      cor: null,
      plataforma: plataforma || null,
      carga_horaria_total_horas: cargaHoraria ? Number(cargaHoraria) : null,
      horas_dedicadas: 0,
      certificado_path: null,
      concluido: false,
      data_conclusao: null,
    })
    setNome('')
    setPlataforma('')
    setCargaHoraria('')
    carregar()
  }

  if (carregando) return <p style={{ padding: '2rem' }}>Carregando...</p>

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <Link href="/estudos">← voltar</Link>
      <h1>Cursos</h1>

      {cursos.length === 0 && <p>Nenhum curso cadastrado.</p>}
      <ul>
        {cursos.map((c) => (
          <li key={c.uuid}>
            <Link href={`/estudos/curso/${c.uuid}`}>
              {c.nome} {c.plataforma ? `— ${c.plataforma}` : ''} {c.concluido ? '✅' : ''}
            </Link>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do curso" />
        <input value={plataforma} onChange={(e) => setPlataforma(e.target.value)} placeholder="Plataforma (ex: Udemy)" />
        <input
          value={cargaHoraria}
          onChange={(e) => setCargaHoraria(e.target.value)}
          placeholder="Carga horária total (h)"
          inputMode="decimal"
        />
        <button onClick={handleCriarCurso}>+ Adicionar curso</button>
      </div>
    </div>
  )
}