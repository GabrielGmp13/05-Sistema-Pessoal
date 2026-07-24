'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listarRedacoes, criarRedacao, somaCompetencias, Redacao } from '../../../lib/redacoes'

export default function RedacoesPage() {
  const [redacoes, setRedacoes] = useState<Redacao[]>([])
  const [carregando, setCarregando] = useState(true)

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

  async function handleCriar() {
    if (!form.tema.trim() || !form.texto.trim() || !form.data) return

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
      texto: form.texto,
      data: form.data,
      nota: notaCalculada,
      comentario: null,
      ...competencias,
    })

    setForm({ tema: '', texto: '', data: '', c1: '', c2: '', c3: '', c4: '', c5: '' })
    carregar()
  }

  if (carregando) return <p style={{ padding: '2rem' }}>Carregando...</p>

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <Link href="/estudos">← voltar</Link>
      <h1>Redações</h1>

      {redacoes.length === 0 && <p>Nenhuma redação registrada.</p>}
      <ul>
        {redacoes.map((r) => (
          <li key={r.uuid} style={{ marginBottom: '.5rem' }}>
            <strong>{r.tema}</strong> — {r.data} {r.nota != null ? `— nota: ${r.nota}` : ''}
          </li>
        ))}
      </ul>

      <section style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.5rem', maxWidth: 500 }}>
        <input
          value={form.tema}
          onChange={(e) => setForm((f) => ({ ...f, tema: e.target.value }))}
          placeholder="Tema"
        />
        <textarea
          value={form.texto}
          onChange={(e) => setForm((f) => ({ ...f, texto: e.target.value }))}
          placeholder="Texto da redação"
          rows={6}
        />
        <input
          type="date"
          value={form.data}
          onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
        />
        <div style={{ display: 'flex', gap: '.5rem' }}>
          {(['c1', 'c2', 'c3', 'c4', 'c5'] as const).map((campo, i) => (
            <input
              key={campo}
              value={form[campo]}
              onChange={(e) => setForm((f) => ({ ...f, [campo]: e.target.value }))}
              placeholder={`C${i + 1}`}
              inputMode="numeric"
              style={{ width: 60 }}
            />
          ))}
        </div>
        <button onClick={handleCriar}>Salvar redação</button>
      </section>
    </div>
  )
}