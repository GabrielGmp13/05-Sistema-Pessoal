'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { buscarProva, Prova, atualizarProva } from '@/lib/provas'
import { buscarGabaritoProva, QuestaoIndividual, Letra } from '@/lib/questoes-individuais'
import { listarRedacoes, Redacao } from '@/lib/redacoes'
import { listarExecucoesEnem, iniciarExecucaoEnem, gravarExecucaoEnem, catalogarExecucaoEnem, TentativaEnem } from '@/lib/enem-tentativas'
import { sb } from '@/lib/supabase'
import { BackLink, PageShell, PageHeader } from './page-shell'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PrivateDocumentAction } from '@/components/PrivateDocumentAction'
import { GabaritoTentativas } from './gabarito-tentativas'
import { blocosRelogioProva } from '@/lib/relogio-prova'
import { estatisticasEnem } from '@/lib/enem-estatisticas'

export function TentativasEnem({ provaUuid }: { provaUuid: string }) {
  const [prova, setProva] = useState<Prova | null>(null)
  const [tentativas, setTentativas] = useState<TentativaEnem[]>([])
  const [gabarito, setGabarito] = useState<QuestaoIndividual[]>([])
  const [redacoes, setRedacoes] = useState<Redacao[]>([])
  const [vinculos, setVinculos] = useState<Record<string, string>>({})
  const [erro, setErro] = useState('')
  const [incerto, setIncerto] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [carregado, setCarregado] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const [relogioEmBlocos, setRelogioEmBlocos] = useState(false)
  const [agora, setAgora] = useState(() => Date.now())
  const operando = useRef(false)
  const ativa = tentativas.find((t) => t.estado === 'em_andamento')
  const restantes = ativa ? Math.max(0, Math.ceil((Date.parse(ativa.prazo_em) - agora) / 1000)) : null

  const carregar = useCallback(async () => {
    const [p, ts, gs, rs] = await Promise.all([buscarProva(provaUuid), listarExecucoesEnem(provaUuid), buscarGabaritoProva(provaUuid), listarRedacoes()])
    if (!p || !gs || !rs) throw new Error('Não foi possível carregar esta prova. Atualize a página.')
    setProva(p); setTentativas(ts); setGabarito(gs); setRedacoes(rs); setIncerto(false); setCarregado(true)
  }, [provaUuid])

  const executar = useCallback(async (acao: () => Promise<void>) => {
    if (operando.current) return
    operando.current = true; setOcupado(true); setErro('')
    try { await acao() } catch (e) { setErro((e as Error).message); setIncerto(true) }
    finally { operando.current = false; setOcupado(false) }
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => void executar(carregar), 0)
    const timer = window.setInterval(() => setAgora(Date.now()), 1000)
    return () => { clearTimeout(id); clearInterval(timer) }
  }, [carregar, executar])

  useEffect(() => {
    const subscription = sb.auth.onAuthStateChange((_evento, sessao) => {
      if (prova && sessao?.user.id !== prova.user_id) { setIncerto(true); setErro('A conta mudou. Recarregue a página.'); setTentativas([]); setProva(null) }
    }).data.subscription
    return () => subscription.unsubscribe()
  }, [prova])

  const substituir = useCallback((salva: TentativaEnem) => {
    setTentativas((atuais) => [salva, ...atuais.filter((t) => t.uuid !== salva.uuid)].sort((a, b) => b.numero - a.numero))
  }, [])

  const finalizar = useCallback(async (t: TentativaEnem) => {
    const salva = await gravarExecucaoEnem(t, t.respostas, true)
    substituir(salva); setConfirmar(false)
    // Esta segunda gravação não altera as respostas já encerradas.
    if (!await atualizarProva(provaUuid, { feita: true })) throw new Error('Tentativa finalizada. A marcação da prova na Agenda não foi confirmada; use Sincronizar conclusão.')
    setProva((p) => p ? { ...p, feita: true } : p)
  }, [provaUuid, substituir])

  useEffect(() => {
    if (!ativa || restantes !== 0 || incerto || ocupado) return
    const id = window.setTimeout(() => void executar(() => finalizar(ativa)), 0)
    return () => clearTimeout(id)
  }, [ativa, restantes, incerto, ocupado, executar, finalizar])

  async function marcar(numero: number, letra: Letra) {
    if (!ativa || incerto || restantes === 0 || operando.current) return
    const respostas = { ...ativa.respostas }
    if (respostas[numero] === letra) delete respostas[numero]
    else respostas[numero] = letra
    await executar(async () => substituir(await gravarExecucaoEnem(ativa, respostas)))
  }

  return <PageShell>
    <BackLink href="/estudos/enem">Voltar ao ENEM</BackLink>
    <PageHeader title={prova?.titulo || 'Tentativas ENEM'} description="Cada tentativa guarda suas respostas e seu prazo. Refazer preserva o histórico anterior." />
    {prova && <p className="my-2 text-sm text-muted-foreground">{[prova.tipo === 'enem_dia1' ? 'Dia 1' : 'Dia 2', prova.enem_ano, prova.enem_aplicacao, prova.enem_caderno, prova.enem_lingua].filter(Boolean).join(' · ')}</p>}
    {erro && <p role="alert" className="my-4 text-sm text-destructive">{erro}</p>}
    <Button variant="outline" disabled={ocupado} onClick={() => void executar(carregar)}>Conferir estado salvo</Button>
    {!carregado && <p role="status">Carregando prova…</p>}
    {prova && <div className="mt-4"><PrivateDocumentAction path={prova.arquivo_path} scope={`provas/${prova.uuid}`} onPersist={async (path) => {
      const salva = await atualizarProva(prova.uuid, { arquivo_path: path })
      if (!salva) return false
      setProva(salva); return true
    }} /></div>}
    {carregado && prova && !ativa && <div className="my-6 flex flex-wrap gap-3">
      <Button disabled={ocupado || incerto} onClick={() => void executar(async () => substituir(await iniciarExecucaoEnem(provaUuid, crypto.randomUUID())))}>Iniciar nova tentativa</Button>
      <Link className="underline" href={`/estudos/enem/gabarito/${provaUuid}`}>Gabarito e classificações da prova / histórico anterior</Link>
      {!prova.feita && tentativas.some((t) => t.estado !== 'em_andamento') && <Button variant="outline" disabled={ocupado} onClick={() => void executar(async () => {
        if (!await atualizarProva(provaUuid, { feita: true })) throw new Error('Não foi possível sincronizar a conclusão.')
        await carregar()
      })}>Sincronizar conclusão</Button>}
    </div>}
    {ativa && <section className="mt-6">
      <h2 className="text-lg font-semibold">Tentativa {ativa.numero}</h2>
      <p className="my-3 font-mono" role="timer">{Math.floor((restantes ?? 0) / 3600)}h {Math.floor(((restantes ?? 0) % 3600) / 60)}min {(restantes ?? 0) % 60}s · {Object.keys(ativa.respostas).length}/90 respondidas</p>
      <label className="text-sm"><input type="checkbox" checked={relogioEmBlocos} onChange={(e) => setRelogioEmBlocos(e.target.checked)} /> Mostrar relógio em blocos</label>
      {relogioEmBlocos && <ol className="my-3 flex flex-wrap gap-2">{blocosRelogioProva((Date.parse(ativa.prazo_em) - Date.parse(ativa.iniciada_em)) / 60000, restantes ?? 0).map((b) => <li key={b.inicio} className="rounded border border-border px-2 py-1 text-xs">{b.inicio}–{b.fim} min · {b.concluido ? 'concluído' : b.atual ? 'atual' : 'pendente'}</li>)}</ol>}
      {prova?.tipo === 'enem_dia1' && <p className="my-3 text-sm"><a href="/estudos/redacoes" target="_blank" rel="noopener noreferrer" className="underline">Registrar texto ou foto da redação em outra aba</a>. O relógio continua; vincule a redação ao encerrar.</p>}
      <p className="mb-3 text-sm text-muted-foreground">Cada resposta é confirmada no banco antes da próxima. Se a conexão falhar, confira o estado salvo. O prazo continua ao fechar a página.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 90 }, (_, i) => i + 1).map((numero) => <fieldset key={numero} disabled={ocupado || incerto || restantes === 0} className="flex gap-1 rounded-lg border border-border p-2">
          <legend className="px-1 text-sm">Questão {numero}</legend>
          {(['A', 'B', 'C', 'D', 'E'] as Letra[]).map((letra) => <Button key={letra} size="sm" variant={ativa.respostas[numero] === letra ? 'default' : 'outline'} aria-label={`Questão ${numero}: ${letra}`} aria-pressed={ativa.respostas[numero] === letra} onClick={() => void marcar(numero, letra)}>{letra}</Button>)}
        </fieldset>)}
      </div>
      <Button className="mt-4" disabled={ocupado || incerto} onClick={() => setConfirmar(true)}>Finalizar tentativa</Button>
    </section>}
    {!ativa && prova && <GabaritoTentativas prova={prova} questoes={gabarito} onAtualizar={carregar} />}
    {!ativa && tentativas.filter((t) => t.estado !== 'em_andamento').map((t) => {
      const resultado = estatisticasEnem(gabarito.map((q) => ({ ...q, letra_marcada: q.numero ? t.respostas[q.numero] ?? null : null })))
      return <section key={t.uuid} className="mt-6 rounded-lg border border-border p-4">
        <h2 className="font-semibold">Tentativa {t.numero} · {t.estado === 'catalogada' ? 'Catalogada' : 'Finalizada'}</h2>
        <p className="my-2 text-sm">{Object.keys(t.respostas).length} respondidas · {90 - Object.keys(t.respostas).length} em branco · {resultado.acertos} acertos em {resultado.corrigidas} questões com gabarito · {resultado.semCorrecao} pendentes de correção.</p>
        <p className="text-sm text-muted-foreground">{resultado.percentualCorrigidas !== null ? `${resultado.percentualCorrigidas.toFixed(1)}% nas questões com gabarito — não é TRI.` : 'Percentual indisponível até cadastrar o gabarito.'}</p>
        <details className="mt-2 text-sm"><summary className="cursor-pointer">Respostas desta tentativa</summary><div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{Array.from({ length: 90 }, (_, i) => i + 1).map((n) => <span key={n}>{n}: {t.respostas[n] ?? '—'} / {gabarito.find((q) => q.numero === n)?.letra_correta ?? '?'}</span>)}</div></details>
        {t.estado === 'finalizada' && <div className="mt-3 flex flex-wrap gap-2">
          {prova?.tipo === 'enem_dia1' && <Select aria-label={`Redação da tentativa ${t.numero}`} value={vinculos[t.uuid] ?? ''} onChange={(e) => setVinculos({ ...vinculos, [t.uuid]: e.target.value })}>
            <option value="">Sem redação vinculada</option>{redacoes.map((r) => <option key={r.uuid} value={r.uuid}>{r.tema} · {r.data}</option>)}
          </Select>}
          <Button disabled={ocupado || incerto} onClick={() => void executar(async () => substituir(await catalogarExecucaoEnem(t, vinculos[t.uuid] || null)))}>Catalogar com vínculo definitivo</Button>
          <Link className="underline" href="/estudos/redacoes">Registrar redação antes de catalogar</Link>
        </div>}
        {t.redacao_uuid && <p className="mt-2 text-sm">Redação: {redacoes.find((r) => r.uuid === t.redacao_uuid)?.tema ?? 'Registro indisponível'}</p>}
      </section>
    })}
    <ConfirmDialog open={confirmar} onOpenChange={setConfirmar} title="Finalizar tentativa?" description="As respostas ficarão imutáveis. Questões sem resposta permanecem em branco." confirmLabel="Finalizar" onConfirm={() => executar(async () => { if (ativa) await finalizar(ativa) })} />
  </PageShell>
}
