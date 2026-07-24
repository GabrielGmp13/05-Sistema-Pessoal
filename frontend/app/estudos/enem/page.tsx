'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listarMaterias, criarMateria, Materia } from '../../../lib/materias'
import { listarProximasProvas, criarProva, Prova, TipoProva } from '../../../lib/provas'

export default function EnemPage() {
  const [materias, setMaterias] = useState<Materia[]>([])
  const [provas, setProvas] = useState<Prova[]>([])
  const [novoNome, setNovoNome] = useState('')
  const [novaProva, setNovaProva] = useState({ titulo: '', data: '', tipo: 'enem_dia1' as TipoProva })
  const [carregando, setCarregando] = useState(true)

  async function carregar() {
    const [m, p] = await Promise.all([
      listarMaterias('enem'),
      listarProximasProvas(),
    ])
    setMaterias(m ?? [])
    setProvas((p ?? []).filter((pr) => pr.tipo === 'enem_dia1' || pr.tipo === 'enem_dia2'))
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  async function handleCriarMateria() {
    if (!novoNome.trim()) return
    await criarMateria({
      nome: novoNome,
      tipo: 'enem',
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

  async function handleCriarProva() {
    if (!novaProva.data) return
    await criarProva({
      materia_uuid: null, // ENEM cobre várias áreas — granularidade fica no gabarito
      tipo: novaProva.tipo,
      conteudo_uuid: null,
      titulo: novaProva.titulo || (novaProva.tipo === 'enem_dia1' ? 'ENEM — Dia 1' : 'ENEM — Dia 2'),
      data: novaProva.data,
      tempo_minutos: null,
      redacao_uuid: null,
      nota: null,
      feita: false,
      observacoes: null,
    })
    setNovaProva({ titulo: '', data: '', tipo: 'enem_dia1' })
    carregar()
  }

  if (carregando) return <p style={{ padding: '2rem' }}>Carregando...</p>

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <Link href="/estudos">← voltar</Link>
      <h1>ENEM</h1>

      <section>
        <h2>Matérias</h2>
        {materias.length === 0 && <p>Nenhuma matéria de ENEM cadastrada.</p>}
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
            placeholder="Nome da matéria (ex: Matemática)"
          />
          <button onClick={handleCriarMateria}>+ Adicionar matéria</button>
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Próximas provas (dia 1 / dia 2)</h2>
        {provas.length === 0 ? (
          <p>Nenhuma prova de ENEM agendada ainda.</p>
        ) : (
          <ul>
            {provas.map((p) => (
              <li key={p.uuid}>
                {p.data} — {p.tipo === 'enem_dia1' ? 'Dia 1' : 'Dia 2'} {p.titulo ? `— ${p.titulo}` : ''}{' '}
                <Link href={`/estudos/enem/gabarito/${p.uuid}`}>lançar gabarito</Link>
              </li>
            ))}
          </ul>
        )}

        <div style={{ marginTop: '.5rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <select
            value={novaProva.tipo}
            onChange={(e) => setNovaProva((p) => ({ ...p, tipo: e.target.value as TipoProva }))}
          >
            <option value="enem_dia1">Dia 1</option>
            <option value="enem_dia2">Dia 2</option>
          </select>
          <input
            type="date"
            value={novaProva.data}
            onChange={(e) => setNovaProva((p) => ({ ...p, data: e.target.value }))}
          />
          <input
            value={novaProva.titulo}
            onChange={(e) => setNovaProva((p) => ({ ...p, titulo: e.target.value }))}
            placeholder="Título (opcional)"
          />
          <button onClick={handleCriarProva}>+ Agendar prova ENEM</button>
        </div>
      </section>
    </div>
  )
}