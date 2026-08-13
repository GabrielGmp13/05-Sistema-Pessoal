'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BedDouble, Check, Droplets, Dumbbell, HeartPulse, Package, Pencil, Pill, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { dataLocalIso } from '@/lib/date'
import {
  buscarUltimoPeso,
  deletarHidratacao,
  deletarHumor,
  deletarMedicamento,
  deletarSono,
  listarHidratacao,
  listarHumor,
  listarMedicamentos,
  listarRegistrosMedicamentos,
  listarSono,
  Medicamento,
  PesoShape,
  RegistroHidratacao,
  RegistroHumor,
  RegistroMedicamento,
  RegistroSono,
  salvarHidratacao,
  salvarHumor,
  salvarMedicamento,
  salvarRegistroMedicamento,
  salvarSono,
} from '@/lib/saude'

type Exclusao = { tipo: 'sono' | 'hidratacao' | 'humor' | 'medicamento'; uuid: string; nome: string }

export default function SaudePage() {
  const hoje = dataLocalIso()
  const [dataRegistro, setDataRegistro] = useState(hoje)
  const [sono, setSono] = useState<RegistroSono[]>([])
  const [hidratacao, setHidratacao] = useState<RegistroHidratacao[]>([])
  const [humor, setHumor] = useState<RegistroHumor[]>([])
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [registrosMedicamentos, setRegistrosMedicamentos] = useState<RegistroMedicamento[]>([])
  const [peso, setPeso] = useState<PesoShape | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [exclusao, setExclusao] = useState<Exclusao | null>(null)

  const [horasSono, setHorasSono] = useState('')
  const [dormir, setDormir] = useState('')
  const [acordar, setAcordar] = useState('')
  const [qualidade, setQualidade] = useState('3')
  const [copos, setCopos] = useState('0')
  const [metaCopos, setMetaCopos] = useState('8')
  const [nivelHumor, setNivelHumor] = useState('3')
  const [energia, setEnergia] = useState('3')
  const [observacoes, setObservacoes] = useState('')
  const [medicamentoEditando, setMedicamentoEditando] = useState<Medicamento | null>(null)
  const [nomeMedicamento, setNomeMedicamento] = useState('')
  const [dosagem, setDosagem] = useState('')
  const [horario, setHorario] = useState('')
  const [estoque, setEstoque] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    const resultados = await Promise.all([
      listarSono(), listarHidratacao(), listarHumor(), listarMedicamentos(),
      listarRegistrosMedicamentos(), buscarUltimoPeso(),
    ])
    if (resultados.slice(0, 5).some((item) => item === null)) setErro('Parte dos dados de saúde não pôde ser carregada.')
    setSono(resultados[0] ?? [])
    setHidratacao(resultados[1] ?? [])
    setHumor(resultados[2] ?? [])
    setMedicamentos(resultados[3] ?? [])
    setRegistrosMedicamentos(resultados[4] ?? [])
    setPeso(resultados[5])
    setCarregando(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void carregar(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [carregar])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const registroSono = sono.find((item) => item.data === dataRegistro)
      setHorasSono(registroSono ? String(registroSono.horas_dormidas) : '')
      setDormir(registroSono?.horario_dormir?.slice(0, 5) ?? '')
      setAcordar(registroSono?.horario_acordar?.slice(0, 5) ?? '')
      setQualidade(String(registroSono?.qualidade ?? 3))
      const registroAgua = hidratacao.find((item) => item.data === dataRegistro)
      setCopos(String(registroAgua?.copos ?? 0))
      setMetaCopos(String(registroAgua?.meta_copos ?? 8))
      const registroHumor = humor.find((item) => item.data === dataRegistro)
      setNivelHumor(String(registroHumor?.humor ?? 3))
      setEnergia(String(registroHumor?.energia ?? 3))
      setObservacoes(registroHumor?.observacoes ?? '')
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [dataRegistro, sono, hidratacao, humor])

  const sonoHoje = sono.find((item) => item.data === hoje)
  const aguaHoje = hidratacao.find((item) => item.data === hoje)
  const humorHoje = humor.find((item) => item.data === hoje)
  const ativos = medicamentos.filter((item) => item.ativo)

  async function executar(acao: () => Promise<unknown>) {
    setSalvando(true)
    setErro(null)
    const resultado = await acao()
    if (!resultado) setErro('Não foi possível salvar. Revise os dados e tente novamente.')
    else await carregar()
    setSalvando(false)
  }

  async function salvarRegistroDiario() {
    if (!horasSono || Number(horasSono) <= 0) {
      setErro('Informe as horas dormidas para salvar o registro do dia.')
      return
    }
    setSalvando(true)
    setErro(null)
    const atualSono = sono.find((item) => item.data === dataRegistro)
    const atualAgua = hidratacao.find((item) => item.data === dataRegistro)
    const atualHumor = humor.find((item) => item.data === dataRegistro)
    const resultados = await Promise.all([
      salvarSono({ data: dataRegistro, horas_dormidas: Number(horasSono), horario_dormir: dormir || null, horario_acordar: acordar || null, qualidade: Number(qualidade) }, atualSono?.uuid),
      salvarHidratacao({ data: dataRegistro, copos: Number(copos), meta_copos: Number(metaCopos) }, atualAgua?.uuid),
      salvarHumor({ data: dataRegistro, humor: Number(nivelHumor), energia: Number(energia), observacoes: observacoes.trim() || null }, atualHumor?.uuid),
    ])
    if (resultados.some((item) => !item)) setErro('Um dos registros não pôde ser salvo. Confira os valores.')
    await carregar()
    setSalvando(false)
  }

  async function salvarFormularioMedicamento() {
    if (!nomeMedicamento.trim()) return setErro('Informe o nome do medicamento.')
    await executar(() => salvarMedicamento({
      nome: nomeMedicamento.trim(), dosagem: dosagem.trim() || null, horario: horario || null,
      ativo: medicamentoEditando?.ativo ?? true, estoque: estoque ? Number(estoque) : null,
    }, medicamentoEditando?.uuid))
    setMedicamentoEditando(null)
    setNomeMedicamento('')
    setDosagem('')
    setHorario('')
    setEstoque('')
  }

  function editarMedicamento(item: Medicamento) {
    setMedicamentoEditando(item)
    setNomeMedicamento(item.nome)
    setDosagem(item.dosagem ?? '')
    setHorario(item.horario?.slice(0, 5) ?? '')
    setEstoque(item.estoque === null ? '' : String(item.estoque))
  }

  async function alternarTomado(item: Medicamento) {
    const registro = registrosMedicamentos.find((valor) => valor.medicamento_uuid === item.uuid && valor.data === hoje)
    await executar(() => salvarRegistroMedicamento(item.uuid, hoje, !registro?.tomado, registro?.uuid))
  }

  async function confirmarExclusao() {
    if (!exclusao) return
    const acoes = { sono: deletarSono, hidratacao: deletarHidratacao, humor: deletarHumor, medicamento: deletarMedicamento }
    await executar(() => acoes[exclusao.tipo](exclusao.uuid))
    setExclusao(null)
  }

  const historico = useMemo(() => {
    const itens = [
      ...sono.map((item) => ({ tipo: 'sono' as const, uuid: item.uuid, data: item.data, texto: `${item.horas_dormidas}h de sono` })),
      ...hidratacao.map((item) => ({ tipo: 'hidratacao' as const, uuid: item.uuid, data: item.data, texto: `${item.copos}/${item.meta_copos} copos` })),
      ...humor.map((item) => ({ tipo: 'humor' as const, uuid: item.uuid, data: item.data, texto: `Humor ${item.humor}/5 · energia ${item.energia}/5` })),
    ]
    return itens.sort((a, b) => b.data.localeCompare(a.data)).slice(0, 9)
  }, [sono, hidratacao, humor])

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <header><p className="font-mono text-xs uppercase text-muted-foreground">Bem-estar</p><h1 className="mt-2 text-3xl font-semibold">Saúde</h1><p className="mt-2 text-muted-foreground">Registros manuais para acompanhar o que muda no dia a dia.</p></header>
        {erro ? <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">{erro}</p> : null}

        <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Resumo de saúde">
          <Resumo icon={Dumbbell} label="Último peso" value={peso?.peso ? `${peso.peso} kg` : '--'} detail={peso?.data ?? 'Shape'} />
          <Resumo icon={BedDouble} label="Sono hoje" value={sonoHoje ? `${sonoHoje.horas_dormidas}h` : '--'} detail={sonoHoje ? `Qualidade ${sonoHoje.qualidade}/5` : 'Sem registro'} />
          <Resumo icon={Droplets} label="Hidratação" value={aguaHoje ? `${aguaHoje.copos}/${aguaHoje.meta_copos}` : '--'} detail="copos hoje" />
          <Resumo icon={HeartPulse} label="Humor" value={humorHoje ? `${humorHoje.humor}/5` : '--'} detail={humorHoje ? `Energia ${humorHoje.energia}/5` : 'Sem registro'} />
          <Resumo icon={Pill} label="Medicamentos" value={String(ativos.length)} detail="ativos" />
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)]">
          <section className="border-t border-border pt-5">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-xs uppercase text-muted-foreground">Rotina</p><h2 className="mt-1 text-xl font-semibold">Registro do dia</h2></div><div><Label htmlFor="data-saude">Data</Label><Input id="data-saude" type="date" value={dataRegistro} onChange={(e) => setDataRegistro(e.target.value)} className="mt-1 w-40" /></div></div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <fieldset className="space-y-3"><legend className="font-medium">Sono</legend><Campo label="Horas dormidas"><Input type="number" min="0.25" max="24" step="0.25" value={horasSono} onChange={(e) => setHorasSono(e.target.value)} /></Campo><div className="grid grid-cols-2 gap-2"><Campo label="Dormiu"><Input type="time" value={dormir} onChange={(e) => setDormir(e.target.value)} /></Campo><Campo label="Acordou"><Input type="time" value={acordar} onChange={(e) => setAcordar(e.target.value)} /></Campo></div><Escala label="Qualidade" value={qualidade} onChange={setQualidade} /></fieldset>
              <fieldset className="space-y-3"><legend className="font-medium">Hidratação e humor</legend><div className="grid grid-cols-2 gap-2"><Campo label="Copos"><Input type="number" min="0" value={copos} onChange={(e) => setCopos(e.target.value)} /></Campo><Campo label="Meta"><Input type="number" min="1" value={metaCopos} onChange={(e) => setMetaCopos(e.target.value)} /></Campo></div><Progress value={Math.min(100, (Number(copos) / Math.max(1, Number(metaCopos))) * 100)} /><div className="grid grid-cols-2 gap-2"><Escala label="Humor" value={nivelHumor} onChange={setNivelHumor} /><Escala label="Energia" value={energia} onChange={setEnergia} /></div><Campo label="Observações"><Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} /></Campo></fieldset>
            </div>
            <Button className="mt-5" onClick={() => void salvarRegistroDiario()} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar registro do dia'}</Button>
          </section>

          <section className="border-t border-border pt-5"><p className="font-mono text-xs uppercase text-muted-foreground">Peso</p><h2 className="mt-1 text-xl font-semibold">Fonte única no Shape</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">O peso continua no histórico visual já existente, sem duplicar registros.</p><Link href="/treino/shape" className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-sm font-medium hover:bg-muted"><Dumbbell className="size-4" /> Abrir Shape</Link></section>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section className="border-t border-border pt-5"><p className="font-mono text-xs uppercase text-muted-foreground">Cuidados</p><h2 className="mt-1 text-xl font-semibold">Medicamentos</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><Campo label="Nome"><Input value={nomeMedicamento} onChange={(e) => setNomeMedicamento(e.target.value)} /></Campo><Campo label="Dosagem"><Input value={dosagem} onChange={(e) => setDosagem(e.target.value)} /></Campo><Campo label="Horário"><Input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} /></Campo><Campo label="Estoque"><Input type="number" min="0" value={estoque} onChange={(e) => setEstoque(e.target.value)} /></Campo></div><div className="mt-3 flex gap-2"><Button onClick={() => void salvarFormularioMedicamento()} disabled={salvando}><Plus /> {medicamentoEditando ? 'Salvar edição' : 'Adicionar'}</Button>{medicamentoEditando ? <Button variant="outline" onClick={() => { setMedicamentoEditando(null); setNomeMedicamento(''); setDosagem(''); setHorario(''); setEstoque('') }}>Cancelar</Button> : null}</div>
            <ul className="mt-5 divide-y divide-border border-y border-border">{medicamentos.length === 0 ? <li className="py-4 text-sm text-muted-foreground">Nenhum medicamento cadastrado.</li> : medicamentos.map((item) => { const tomado = registrosMedicamentos.find((r) => r.medicamento_uuid === item.uuid && r.data === hoje)?.tomado; return <li key={item.uuid} className="flex items-center gap-2 py-3"><button type="button" onClick={() => void alternarTomado(item)} className={`flex size-8 items-center justify-center rounded-lg border ${tomado ? 'bg-success text-success-foreground' : 'border-border'}`} aria-label={tomado ? `Desmarcar ${item.nome} hoje` : `Marcar ${item.nome} como tomado hoje`}>{tomado ? <Check className="size-4" /> : <Pill className="size-4" />}</button><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.nome}</strong><span className="text-xs text-muted-foreground">{[item.dosagem, item.horario?.slice(0, 5), item.estoque === null ? null : `${item.estoque} em estoque`].filter(Boolean).join(' · ') || 'Sem detalhes'}</span></div><Button size="icon-xs" variant="ghost" onClick={() => editarMedicamento(item)} aria-label={`Editar ${item.nome}`}><Pencil /></Button><Button size="icon-xs" variant="ghost" onClick={() => setExclusao({ tipo: 'medicamento', uuid: item.uuid, nome: item.nome })} aria-label={`Excluir ${item.nome}`}><Trash2 /></Button></li> })}</ul>
          </section>

          <section className="border-t border-border pt-5"><p className="font-mono text-xs uppercase text-muted-foreground">Histórico</p><h2 className="mt-1 text-xl font-semibold">Registros recentes</h2><ul className="mt-4 divide-y divide-border border-y border-border">{carregando ? <li className="py-4 text-sm text-muted-foreground">Carregando...</li> : historico.length === 0 ? <li className="py-4 text-sm text-muted-foreground">Nenhum registro diário.</li> : historico.map((item) => <li key={`${item.tipo}-${item.uuid}`} className="flex items-center gap-3 py-3"><Package className="size-4 text-muted-foreground" /><div className="min-w-0 flex-1"><strong className="block text-sm">{item.texto}</strong><span className="text-xs text-muted-foreground">{new Date(`${item.data}T00:00:00`).toLocaleDateString('pt-BR')}</span></div><Button size="icon-xs" variant="ghost" onClick={() => setExclusao({ tipo: item.tipo, uuid: item.uuid, nome: item.texto })} aria-label={`Excluir ${item.texto}`}><Trash2 /></Button></li>)}</ul></section>
        </div>
      </div>
      <ConfirmDialog open={Boolean(exclusao)} onOpenChange={(open) => !open && setExclusao(null)} title="Excluir registro?" description={`“${exclusao?.nome ?? ''}” sairá das listas, mas permanecerá recuperável no banco.`} confirmLabel="Excluir" onConfirm={confirmarExclusao} />
    </main>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm"><span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>{children}</label> }
function Escala({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <Campo label={`${label}: ${value}/5`}><input type="range" min="1" max="5" value={value} onChange={(e) => onChange(e.target.value)} className="w-full accent-current" /></Campo> }
function Resumo({ icon: Icon, label, value, detail }: { icon: typeof BedDouble; label: string; value: string; detail: string }) { return <div className="rounded-lg border border-border bg-card p-4"><Icon className="size-4 text-muted-foreground" /><strong className="mt-3 block text-xl">{value}</strong><span className="mt-1 block text-xs font-medium">{label}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{detail}</span></div> }
