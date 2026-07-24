'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { listarMaterias, Materia } from '../../../../lib/materias'
import { criarConteudo, listarConteudosPorMateria, atualizarConteudo, deletarConteudo, vincularConteudoAMateria, Conteudo } from '../../../../lib/conteudos'
import { listarProvasPorMateria, criarProva, deletarProva, Prova, TipoProva } from '../../../../lib/provas'
import { listarAtividades, criarAtividade, atualizarAtividade, deletarAtividade, Atividade } from '../../../../lib/atividades'
import { registrarQuestao, taxaDeAcertoRecente } from '../../../../lib/questoes-individuais'
import { listarSimuladosPorMateria, registrarSimulado, Simulado } from '../../../../lib/simulados'

export default function MateriaDetalhePage() {
  const params = useParams<{ materiaUuid: string }>()
  const materiaUuid = params.materiaUuid

  const [materia, setMateria] = useState<Materia | null>(null)
  const [conteudos, setConteudos] = useState<Conteudo[]>([])
  const [provas, setProvas] = useState<Prova[]>([])
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [simulados, setSimulados] = useState<Simulado[]>([])
  const [taxaAcerto, setTaxaAcerto] = useState<number | null>(null)
  const [carregando, setCarregando] = useState(true)

  // forms
  const [novoConteudoNome, setNovoConteudoNome] = useState('')
  const [novaProva, setNovaProva] = useState({ titulo: '', data: '', tipo: 'escola' as TipoProva })
  const [novaAtividade, setNovaAtividade] = useState({ titulo: '', data_entrega: '' })
  const [novaQuestao, setNovaQuestao] = useState({ acertou: true, conteudo_uuid: '' })
  const [novoSimulado, setNovoSimulado] = useState({ total_questoes: '', total_acertos: '', conteudo_uuid: '' })

  async function carregar() {
    const [todasMaterias, cont, prov, ativ, sim, taxa] = await Promise.all([
      listarMaterias(),
      listarConteudosPorMateria(materiaUuid),
      listarProvasPorMateria(materiaUuid),
      listarAtividades(materiaUuid),
      listarSimuladosPorMateria(materiaUuid),
      taxaDeAcertoRecente(30, materiaUuid),
    ])
    setMateria((todasMaterias ?? []).find((m) => m.uuid === materiaUuid) ?? null)
    setConteudos(cont ?? [])
    setProvas(prov ?? [])
    setAtividades(ativ ?? [])
    setSimulados(sim ?? [])
    setTaxaAcerto(taxa)
    setCarregando(false)
  }

  useEffect(() => {
    if (materiaUuid) carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materiaUuid])

  async function handleCriarConteudo() {
    if (!novoConteudoNome.trim()) return
    await criarConteudo(
      { nome: novoConteudoNome, progresso: 0, revisao_uuid: null, modulo_curso_uuid: null },
      [materiaUuid]
    )
    setNovoConteudoNome('')
    carregar()
  }

  async function handleAtualizarProgresso(uuid: string, progresso: number) {
    await atualizarConteudo(uuid, { progresso })
    carregar()
  }

  async function handleApagarConteudo(uuid: string) {
    await deletarConteudo(uuid)
    carregar()
  }

  async function handleVincularOutraMateria(conteudoUuid: string) {
    const alvoUuid = window.prompt('UUID da outra matéria pra vincular este conteúdo (ex: mesma matéria no Escola):')
    if (!alvoUuid) return
    await vincularConteudoAMateria(conteudoUuid, alvoUuid)
    carregar()
  }

  async function handleCriarProva() {
    if (!novaProva.titulo.trim() || !novaProva.data) return
    await criarProva({
      materia_uuid: materiaUuid,
      tipo: novaProva.tipo,
      conteudo_uuid: null,
      titulo: novaProva.titulo,
      data: novaProva.data,
      tempo_minutos: null,
      redacao_uuid: null,
      nota: null,
      feita: false,
      observacoes: null,
    })
    setNovaProva({ titulo: '', data: '', tipo: 'escola' })
    carregar()
  }

  async function handleCriarAtividade() {
    if (!novaAtividade.titulo.trim()) return
    await criarAtividade({
      materia_uuid: materiaUuid,
      titulo: novaAtividade.titulo,
      data_entrega: novaAtividade.data_entrega || null,
      feita: false,
      entregue: false,
      observacoes: null,
    })
    setNovaAtividade({ titulo: '', data_entrega: '' })
    carregar()
  }

  async function handleToggleAtividade(a: Atividade, campo: 'feita' | 'entregue') {
    await atualizarAtividade(a.uuid, { [campo]: !a[campo] })
    carregar()
  }

  async function handleApagarAtividade(uuid: string) {
    await deletarAtividade(uuid)
    carregar()
  }

  async function handleApagarProva(uuid: string) {
    await deletarProva(uuid)
    carregar()
  }

  async function handleRegistrarQuestao() {
    await registrarQuestao({
      materia_uuid: materiaUuid,
      conteudo_uuid: novaQuestao.conteudo_uuid || null,
      acertou: novaQuestao.acertou,
      data: new Date().toISOString().slice(0, 10),
      prova_uuid: null,
      numero: null,
      motivo_erro: null,
    })
    carregar()
  }

  async function handleRegistrarSimulado() {
    const total = Number(novoSimulado.total_questoes)
    const acertos = Number(novoSimulado.total_acertos)
    if (!total) return
    await registrarSimulado({
      materia_uuid: materiaUuid,
      data: new Date().toISOString().slice(0, 10),
      total_questoes: total,
      total_acertos: acertos,
      tempo_minutos: null,
      observacoes: null,
      conteudo_uuid: novoSimulado.conteudo_uuid || null,
      redacao_uuid: null,
    })
    setNovoSimulado({ total_questoes: '', total_acertos: '', conteudo_uuid: '' })
    carregar()
  }

  if (carregando) return <p style={{ padding: '2rem' }}>Carregando...</p>

  const voltarPara = materia?.tipo === 'enem' ? '/estudos/enem' : '/estudos/escola'

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <Link href={voltarPara}>← voltar</Link>
      <h1>{materia?.nome ?? 'Matéria'}</h1>
      {taxaAcerto != null && <p>Taxa de acerto (últimos 30 dias): {taxaAcerto}%</p>}

      {/* Conteúdos */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Conteúdos</h2>
        {conteudos.length === 0 && <p>Nenhum conteúdo cadastrado.</p>}
        <ul>
          {conteudos.map((c) => (
            <li key={c.uuid}>
              {c.nome} — progresso: {c.progresso}%{' '}
              <button onClick={() => handleAtualizarProgresso(c.uuid, Math.min(100, c.progresso + 25))}>
                +25%
              </button>{' '}
              <button onClick={() => handleVincularOutraMateria(c.uuid)}>vincular a outra matéria</button>{' '}
              <button onClick={() => handleApagarConteudo(c.uuid)}>apagar</button>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: '.5rem' }}>
          <input
            value={novoConteudoNome}
            onChange={(e) => setNovoConteudoNome(e.target.value)}
            placeholder="Nome do conteúdo (ex: Funções)"
          />
          <button onClick={handleCriarConteudo}>+ Adicionar conteúdo</button>
        </div>
      </section>

      {/* Provas */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Provas</h2>
        {provas.length === 0 && <p>Nenhuma prova cadastrada.</p>}
        <ul>
          {provas.map((p) => (
            <li key={p.uuid}>
              {p.data} — {p.titulo} — {p.feita ? 'feita' : 'pendente'}
              {p.nota != null ? ` — nota: ${p.nota}` : ''}{' '}
              <button onClick={() => handleApagarProva(p.uuid)}>apagar</button>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: '.5rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <input
            value={novaProva.titulo}
            onChange={(e) => setNovaProva((p) => ({ ...p, titulo: e.target.value }))}
            placeholder="Título da prova"
          />
          <input
            type="date"
            value={novaProva.data}
            onChange={(e) => setNovaProva((p) => ({ ...p, data: e.target.value }))}
          />
          <select
            value={novaProva.tipo}
            onChange={(e) => setNovaProva((p) => ({ ...p, tipo: e.target.value as TipoProva }))}
          >
            <option value="escola">Escola</option>
            <option value="enem_dia1">ENEM Dia 1</option>
            <option value="enem_dia2">ENEM Dia 2</option>
            <option value="outro">Outro</option>
          </select>
          <button onClick={handleCriarProva}>+ Adicionar prova</button>
        </div>
      </section>

      {/* Atividades */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Atividades</h2>
        {atividades.length === 0 && <p>Nenhuma atividade cadastrada.</p>}
        <ul>
          {atividades.map((a) => (
            <li key={a.uuid}>
              {a.titulo} — entrega: {a.data_entrega ?? 'sem data'}{' '}
              <button onClick={() => handleToggleAtividade(a, 'feita')}>
                {a.feita ? '✓ feita' : 'marcar feita'}
              </button>{' '}
              <button onClick={() => handleToggleAtividade(a, 'entregue')}>
                {a.entregue ? '✓ entregue' : 'marcar entregue'}
              </button>{' '}
              <button onClick={() => handleApagarAtividade(a.uuid)}>apagar</button>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: '.5rem' }}>
          <input
            value={novaAtividade.titulo}
            onChange={(e) => setNovaAtividade((a) => ({ ...a, titulo: e.target.value }))}
            placeholder="Título da atividade"
          />
          <input
            type="date"
            value={novaAtividade.data_entrega}
            onChange={(e) => setNovaAtividade((a) => ({ ...a, data_entrega: e.target.value }))}
          />
          <button onClick={handleCriarAtividade}>+ Adicionar atividade</button>
        </div>
      </section>

      {/* Questões avulsas */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Registrar questão avulsa</h2>
        <select
          value={novaQuestao.conteudo_uuid}
          onChange={(e) => setNovaQuestao((q) => ({ ...q, conteudo_uuid: e.target.value }))}
        >
          <option value="">(sem conteúdo específico)</option>
          {conteudos.map((c) => (
            <option key={c.uuid} value={c.uuid}>{c.nome}</option>
          ))}
        </select>
        <select
          value={novaQuestao.acertou ? '1' : '0'}
          onChange={(e) => setNovaQuestao((q) => ({ ...q, acertou: e.target.value === '1' }))}
        >
          <option value="1">Acertou</option>
          <option value="0">Errou</option>
        </select>
        <button onClick={handleRegistrarQuestao}>Registrar</button>
      </section>

      {/* Simulados */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Simulados</h2>
        {simulados.length === 0 && <p>Nenhum simulado registrado.</p>}
        <ul>
          {simulados.map((s) => (
            <li key={s.uuid}>{s.data} — {s.total_acertos}/{s.total_questoes}</li>
          ))}
        </ul>
        <div style={{ marginTop: '.5rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <input
            value={novoSimulado.total_questoes}
            onChange={(e) => setNovoSimulado((s) => ({ ...s, total_questoes: e.target.value }))}
            placeholder="Total de questões"
            inputMode="numeric"
          />
          <input
            value={novoSimulado.total_acertos}
            onChange={(e) => setNovoSimulado((s) => ({ ...s, total_acertos: e.target.value }))}
            placeholder="Total de acertos"
            inputMode="numeric"
          />
          <select
            value={novoSimulado.conteudo_uuid}
            onChange={(e) => setNovoSimulado((s) => ({ ...s, conteudo_uuid: e.target.value }))}
          >
            <option value="">(sem conteúdo — não dispara revisão)</option>
            {conteudos.map((c) => (
              <option key={c.uuid} value={c.uuid}>{c.nome} (dispara SM-2)</option>
            ))}
          </select>
          <button onClick={handleRegistrarSimulado}>Registrar simulado</button>
        </div>
      </section>
    </div>
  )
}