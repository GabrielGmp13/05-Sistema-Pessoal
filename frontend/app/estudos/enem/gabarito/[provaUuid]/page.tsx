'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { listarMaterias, Materia } from '../../../../../lib/materias'
import { listarConteudosPorMateria, Conteudo } from '../../../../../lib/conteudos'
import {
  registrarGabaritoProva,
  buscarGabaritoProva,
  QuestaoIndividual,
} from '../../../../../lib/questoes-individuais'

interface LinhaGabarito {
  numero: number
  acertou: boolean
  conteudo_uuid: string
  motivo_erro: string
}

export default function GabaritoProvaPage() {
  const params = useParams<{ provaUuid: string }>()
  const provaUuid = params.provaUuid

  const [materiasEnem, setMateriasEnem] = useState<Materia[]>([])
  const [materiaSelecionada, setMateriaSelecionada] = useState('')
  const [conteudos, setConteudos] = useState<Conteudo[]>([])
  const [quantidade, setQuantidade] = useState('45')
  const [linhas, setLinhas] = useState<LinhaGabarito[]>([])
  const [jaLancado, setJaLancado] = useState<QuestaoIndividual[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    const [m, g] = await Promise.all([
      listarMaterias('enem'),
      buscarGabaritoProva(provaUuid),
    ])
    setMateriasEnem(m ?? [])
    setJaLancado(g ?? [])
    setCarregando(false)
  }

  useEffect(() => {
    if (provaUuid) carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provaUuid])

  useEffect(() => {
    if (!materiaSelecionada) {
      setConteudos([])
      return
    }
    listarConteudosPorMateria(materiaSelecionada).then((c) => setConteudos(c ?? []))
  }, [materiaSelecionada])

  function gerarLinhas() {
    const n = Number(quantidade)
    if (!n || n <= 0) return
    setLinhas(
      Array.from({ length: n }, (_, i) => ({
        numero: i + 1,
        acertou: true,
        conteudo_uuid: '',
        motivo_erro: '',
      }))
    )
  }

  function atualizarLinha(index: number, campo: keyof LinhaGabarito, valor: string | boolean) {
    setLinhas((prev) => {
      const copia = [...prev]
      copia[index] = { ...copia[index], [campo]: valor } as LinhaGabarito
      return copia
    })
  }

  async function handleSalvar() {
    if (!materiaSelecionada || linhas.length === 0) return
    setSalvando(true)
    await registrarGabaritoProva(
      provaUuid,
      materiaSelecionada,
      new Date().toISOString().slice(0, 10),
      linhas.map((l) => ({
        numero: l.numero,
        acertou: l.acertou,
        conteudo_uuid: l.conteudo_uuid || undefined,
        motivo_erro: l.acertou ? undefined : l.motivo_erro || undefined,
      }))
    )
    setSalvando(false)
    setLinhas([])
    carregar()
  }

  if (carregando) return <p style={{ padding: '2rem' }}>Carregando...</p>

  const acertosJaLancados = jaLancado.filter((q) => q.acertou).length

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <Link href="/estudos/enem">← voltar</Link>
      <h1>Gabarito digital</h1>

      {jaLancado.length > 0 && (
        <section style={{ marginTop: '1rem' }}>
          <h2>Já lançado nesta prova</h2>
          <p>{jaLancado.length} questões registradas — {acertosJaLancados} acertos ({Math.round((acertosJaLancados / jaLancado.length) * 100)}%)</p>
        </section>
      )}

      <section style={{ marginTop: '1.5rem' }}>
        <h2>Lançar nova área</h2>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={materiaSelecionada} onChange={(e) => setMateriaSelecionada(e.target.value)}>
            <option value="">Selecione a área</option>
            {materiasEnem.map((m) => (
              <option key={m.uuid} value={m.uuid}>{m.nome}</option>
            ))}
          </select>
          <input
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="Qtd. questões"
            inputMode="numeric"
            style={{ width: 100 }}
          />
          <button onClick={gerarLinhas} disabled={!materiaSelecionada}>Gerar linhas</button>
        </div>

        {linhas.length > 0 && (
          <>
            <table style={{ marginTop: '1rem', borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Acertou</th>
                  <th style={thStyle}>Conteúdo (se errou)</th>
                  <th style={thStyle}>Motivo do erro</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l, i) => (
                  <tr key={l.numero}>
                    <td style={tdStyle}>{l.numero}</td>
                    <td style={tdStyle}>
                      <input
                        type="checkbox"
                        checked={l.acertou}
                        onChange={(e) => atualizarLinha(i, 'acertou', e.target.checked)}
                      />
                    </td>
                    <td style={tdStyle}>
                      {!l.acertou && (
                        <select
                          value={l.conteudo_uuid}
                          onChange={(e) => atualizarLinha(i, 'conteudo_uuid', e.target.value)}
                        >
                          <option value="">—</option>
                          {conteudos.map((c) => (
                            <option key={c.uuid} value={c.uuid}>{c.nome}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {!l.acertou && (
                        <input
                          value={l.motivo_erro}
                          onChange={(e) => atualizarLinha(i, 'motivo_erro', e.target.value)}
                          placeholder="ex: não sabia o conteúdo"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button onClick={handleSalvar} disabled={salvando} style={{ marginTop: '1rem' }}>
              {salvando ? 'Salvando...' : `Salvar gabarito (${linhas.length} questões)`}
            </button>
          </>
        )}
      </section>
    </div>
  )
}

const thStyle: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid #444', padding: '.25rem .5rem' }
const tdStyle: React.CSSProperties = { borderBottom: '1px solid #222', padding: '.25rem .5rem' }