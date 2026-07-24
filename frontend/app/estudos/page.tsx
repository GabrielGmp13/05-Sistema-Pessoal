'use client'

// Hub de Estudos v2 (Fase 1 + 1B, DEC-035/036). Navegação por ROTA real
// (não useState como Biblioteca/DEC-032) — decisão explícita do usuário:
// entra num módulo, volta pro hub, escolhe outro.
// Versão CRU intencional — sem estilização, só validar persistência. Design
// definitivo vem depois via Figma.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listarProximasProvas, Prova } from '../../lib/provas'
import { listarAtividadesPendentes, Atividade } from '../../lib/atividades'
import { listarUltimosSimulados, Simulado } from '../../lib/simulados'

export default function EstudosHubPage() {
  const [provas, setProvas] = useState<Prova[]>([])
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [simulados, setSimulados] = useState<Simulado[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      const [p, a, s] = await Promise.all([
        listarProximasProvas(),
        listarAtividadesPendentes(),
        listarUltimosSimulados(5),
      ])
      setProvas(p ?? [])
      setAtividades(a ?? [])
      setSimulados(s ?? [])
      setCarregando(false)
    }
    carregar()
  }, [])

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <h1>Estudos</h1>

      <nav style={{ display: 'flex', gap: '1rem', margin: '1.5rem 0' }}>
        <Link href="/estudos/enem" style={cardStyle}>ENEM</Link>
        <Link href="/estudos/escola" style={cardStyle}>Escola</Link>
        <Link href="/estudos/curso" style={cardStyle}>Curso</Link>
        <Link href="/estudos/redacoes" style={cardStyle}>Redações</Link>
      </nav>

      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <>
          <section style={{ marginTop: '2rem' }}>
            <h2>Próximas provas</h2>
            {provas.length === 0 ? (
              <p>Nenhuma prova agendada.</p>
            ) : (
              <ul>
                {provas.map((p) => (
                  <li key={p.uuid}>
                    {p.data} — {p.titulo || p.tipo} {p.materia_uuid ? `(matéria: ${p.materia_uuid})` : ''}
                  </li>
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
                    {a.titulo} — entrega: {a.data_entrega ?? 'sem data'} — feita: {a.feita ? 'sim' : 'não'}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={{ marginTop: '2rem' }}>
            <h2>Últimos simulados</h2>
            {simulados.length === 0 ? (
              <p>Nenhum simulado registrado ainda.</p>
            ) : (
              <ul>
                {simulados.map((s) => (
                  <li key={s.uuid}>
                    {s.data} — {s.total_acertos}/{s.total_questoes} acertos
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #444',
  padding: '1rem 1.5rem',
  textDecoration: 'none',
  color: 'inherit',
}