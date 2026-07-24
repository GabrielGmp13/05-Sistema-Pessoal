'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listarMaterias, criarMateria, Materia } from '../../../lib/materias'
import { listarProximasProvas, Prova } from '../../../lib/provas'
import { listarAtividadesPendentes, Atividade } from '../../../lib/atividades'

export default function EscolaPage() {
  const [materias, setMaterias] = useState<Materia[]>([])
  const [provas, setProvas] = useState<Prova[]>([])
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [novoNome, setNovoNome] = useState('')
  const [carregando, setCarregando] = useState(true)

  async function carregar() {
    const [m, p, a] = await Promise.all([
      listarMaterias('escola'),
      listarProximasProvas('escola'),
      listarAtividadesPendentes(),
    ])
    setMaterias(m ?? [])
    setProvas(p ?? [])
    setAtividades(a ?? [])
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  async function handleCriarMateria() {
    if (!novoNome.trim()) return
    await criarMateria({
      nome: novoNome,
      tipo: 'escola',
      cor: null,
      plataforma: null,
      carga_horaria_total_horas: null,
      horas_dedicadas: 0,
      certificado_path: null,
      concluido: false,
      data_conclusao: null,
    })
    setNovoNome('')
    carregar()
  }

  if (carregando) return <p style={{ padding: '2rem' }}>Carregando...</p>

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <Link href="/estudos">← voltar</Link>
      <h1>Escola</h1>

      <section>
        <h2>Matérias</h2>
        {materias.length === 0 && <p>Nenhuma matéria de Escola cadastrada.</p>}
        <ul>
          {materias.map((m) => (
            <li key={m.uuid}>
              <Link href={`/estudos/materia/${m.uuid}`}>{m.nome}</Link>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: '1rem' }}>
          <input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome da matéria (ex: Biologia)"
          />
          <button onClick={handleCriarMateria}>+ Adicionar matéria</button>
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Próximas provas</h2>
        {provas.length === 0 ? (
          <p>Nenhuma prova agendada.</p>
        ) : (
          <ul>
            {provas.map((p) => (
              <li key={p.uuid}>{p.data} — {p.titulo || 'sem título'}</li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Atividades pendentes</h2>
        {atividades.length === 0 ? (
          <p>Nenhuma atividade pendente.</p>
        ) : (
          <ul>
            {atividades.map((a) => (
              <li key={a.uuid}>
                {a.titulo} — entrega: {a.data_entrega ?? 'sem data'}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}