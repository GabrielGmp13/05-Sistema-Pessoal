'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { buscarUuidsImportados, importarLancamentosFinanceiros, type CategoriaFinanceira } from '@/lib/financas'
import { getUserId } from '@/lib/supabase'
import { lerCsvCartao, lerOfxConta, uuidImportacao, possivelPagamentoFatura, type MovimentoNubank, type OrigemNubank } from '@/lib/nubank-import'

type Previa = MovimentoNubank & { uuid: string; categoriaUuid: string; incluir: boolean; repetido: boolean }

export default function ImportarNubank({ categorias, onImportado }: { categorias: CategoriaFinanceira[]; onImportado: () => Promise<void> }) {
  const [origem, setOrigem] = useState<OrigemNubank>('conta-ofx')
  const [fatura, setFatura] = useState('')
  const [cartao, setCartao] = useState('principal')
  const [previa, setPrevia] = useState<Previa[]>([])
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [donoPrevia, setDonoPrevia] = useState('')

  async function selecionarArquivo(arquivo?: File) {
    setPrevia([]); setErro(''); setSucesso('')
    if (!arquivo) return
    if (origem === 'cartao-csv' && (!/^\d{4}-(0[1-9]|1[0-2])$/.test(fatura) || !cartao.trim())) return setErro('Informe o mês da fatura e o apelido do cartão antes de abrir o arquivo.')
    if (arquivo.size > 2_000_000) return setErro('Arquivo muito grande; limite de 2 MB por importação.')
    setOcupado(true)
    try {
      const buffer = await arquivo.arrayBuffer()
      const amostra = new TextDecoder('windows-1252').decode(buffer.slice(0, 500))
      const codificacao = /CHARSET:65001|ENCODING:UTF-8|encoding=["']utf-8/i.test(amostra) ? 'utf-8' : 'windows-1252'
      const texto = new TextDecoder(origem === 'conta-ofx' ? codificacao : 'utf-8').decode(buffer)
      const movimentos = origem === 'conta-ofx' ? lerOfxConta(texto) : lerCsvCartao(texto, `${cartao.trim()}:${fatura}`)
      const userId = await getUserId()
      if (!userId) throw new Error('Entre na sua conta antes de importar.')
      setDonoPrevia(userId)
      const uuids = await Promise.all(movimentos.map((movimento) => uuidImportacao(userId, movimento.chave)))
      const existentes = await buscarUuidsImportados(uuids)
      if (!existentes) throw new Error('Não foi possível conferir movimentos já importados.')
      setPrevia(movimentos.map((movimento, indice) => ({
        ...movimento, uuid: uuids[indice], repetido: existentes.has(uuids[indice]), incluir: !existentes.has(uuids[indice]) && !possivelPagamentoFatura(movimento.descricao),
        categoriaUuid: categorias.find((categoria) => categoria.tipo === movimento.tipo)?.uuid ?? '',
      })))
    } catch (error) { setErro(error instanceof Error ? error.message : 'Arquivo não reconhecido.') }
    finally { setOcupado(false) }
  }

  async function confirmar() {
    const escolhidos = previa.filter((item) => item.incluir && !item.repetido)
    if (!escolhidos.length) return setErro('Selecione pelo menos um movimento ainda não importado.')
    if (escolhidos.some((item) => !categorias.some((categoria) => categoria.uuid === item.categoriaUuid && categoria.tipo === item.tipo))) return setErro('Crie e selecione uma categoria correspondente para cada movimento.')
    setOcupado(true); setErro(''); setSucesso('')
    try {
      if (await getUserId() !== donoPrevia) throw new Error('A conta mudou. Reabra o arquivo para gerar uma nova prévia.')
      const encontrados = await buscarUuidsImportados(escolhidos.map((item) => item.uuid))
      if (!encontrados) throw new Error('Não foi possível conferir duplicatas antes de salvar.')
      if (encontrados.size) throw new Error('Alguns movimentos foram importados em outra aba. Reabra o arquivo para revisar.')
      const resultado = await importarLancamentosFinanceiros(escolhidos.map((item) => ({
        uuid: item.uuid, categoria_uuid: item.categoriaUuid, tipo: item.tipo, valor: item.valor, data: item.data,
        descricao: `[Nubank ${item.origem === 'conta-ofx' ? 'conta' : 'cartão'}] ${item.descricao}`,
      })), donoPrevia)
      if (!resultado) throw new Error('Não foi possível confirmar a gravação. Atualize e reabra o arquivo antes de tentar novamente.')
      setSucesso(`${resultado.length} movimento(s) importado(s).`)
      setPrevia([])
      await onImportado()
    } catch (error) { setErro(error instanceof Error ? error.message : 'Falha na importação.') }
    finally { setOcupado(false) }
  }

  const selecionados = previa.filter((item) => item.incluir && !item.repetido).length
  return <section className="mt-8 border-t border-border pt-5">
    <h2 className="text-xl font-semibold">Importar Nubank</h2>
    <p className="mt-2 text-sm text-muted-foreground">Selecione um arquivo exportado por você. Ele é lido neste navegador; apenas os lançamentos confirmados são salvos. Não informe senha bancária.</p>
    <fieldset disabled={ocupado} className="mt-4 flex flex-wrap gap-3">
      <label className="text-sm">Origem <select className="ml-2 rounded-md border border-border bg-background px-2 py-1" value={origem} onChange={(evento) => { setOrigem(evento.target.value as OrigemNubank); setPrevia([]); setErro('') }}><option value="conta-ofx">Conta · OFX</option><option value="cartao-csv">Fatura do cartão · CSV</option></select></label>
      {origem === 'cartao-csv' ? <><label className="text-sm">Mês da fatura <input type="month" className="ml-2 rounded-md border border-border bg-background px-2 py-1" value={fatura} onChange={(evento) => { setFatura(evento.target.value); setPrevia([]) }} /></label><label className="text-sm">Apelido do cartão <input className="ml-2 w-32 rounded-md border border-border bg-background px-2 py-1" value={cartao} maxLength={40} onChange={(evento) => { setCartao(evento.target.value); setPrevia([]) }} /></label></> : null}
      <label className="text-sm">Arquivo <input key={`${origem}:${fatura}:${cartao}`} type="file" accept={origem === 'conta-ofx' ? '.ofx' : '.csv'} disabled={ocupado} className="ml-2 max-w-64 text-sm" onChange={(evento) => void selecionarArquivo(evento.target.files?.[0])} /></label>
    </fieldset>
    {origem === 'cartao-csv' ? <p className="mt-2 text-xs text-muted-foreground">Aceita CSV de compras com colunas date,title,amount. Fatura em PDF não é importada. Confira compras parceladas e estornos na prévia.</p> : null}
    <p className="mt-2 text-xs text-muted-foreground">Se importar conta e cartão, desmarque o pagamento da fatura no extrato da conta para não somar a mesma despesa duas vezes. Movimentos já importados, inclusive apagados depois, não são importados de novo.</p>
    <p className="mt-2 text-xs text-muted-foreground">Descrições que parecem pagamento de fatura começam desmarcadas, tanto na conta quanto no cartão. Confira a seleção: pagamento não é estorno de compra nem receita. A identificação é apenas uma sugestão pelo texto. Lançamentos manuais e arquivos com descrições alteradas exigem revisão própria.</p>
    {erro ? <p role="alert" className="mt-3 text-sm text-destructive">{erro}</p> : null}
    {sucesso ? <p role="status" className="mt-3 text-sm text-success">{sucesso}</p> : null}
    {previa.length ? <><p className="mt-4 text-sm">{previa.length} movimentos encontrados; {previa.filter((item) => item.repetido).length} já importados. Confira antes de salvar:</p><div className="mt-2 max-h-96 overflow-auto rounded-md border border-border"><table className="w-full min-w-[650px] text-left text-xs"><thead><tr className="border-b border-border"><th className="p-2">Incluir</th><th className="p-2">Data</th><th className="p-2">Descrição</th><th className="p-2">Valor</th><th className="p-2">Categoria</th></tr></thead><tbody>{previa.map((item, indice) => <tr key={item.uuid} className="border-b border-border last:border-0"><td className="p-2"><input type="checkbox" aria-label={`Incluir ${item.descricao}`} checked={item.incluir} disabled={item.repetido} onChange={(evento) => setPrevia((atual) => atual.map((linha, i) => i === indice ? { ...linha, incluir: evento.target.checked } : linha))} />{item.repetido ? ' Já importado' : ''}</td><td className="p-2">{item.data}</td><td className="p-2">{item.descricao}</td><td className="p-2">{item.tipo === 'saida' ? '−' : '+'} R$ {item.valor.toFixed(2)}</td><td className="p-2"><select className="rounded border border-border bg-background p-1" value={item.categoriaUuid} disabled={item.repetido} onChange={(evento) => setPrevia((atual) => atual.map((linha, i) => i === indice ? { ...linha, categoriaUuid: evento.target.value } : linha))}><option value="">Selecione</option>{categorias.filter((categoria) => categoria.tipo === item.tipo).map((categoria) => <option key={categoria.uuid} value={categoria.uuid}>{categoria.nome}</option>)}</select></td></tr>)}</tbody></table></div><Button className="mt-3" disabled={ocupado || !selecionados} onClick={() => void confirmar()}>{ocupado ? 'Salvando…' : `Importar ${selecionados} selecionado(s)`}</Button></> : null}
  </section>
}
