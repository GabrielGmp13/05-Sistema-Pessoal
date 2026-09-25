'use client'

import { useState } from 'react'
import { sb, getUserId } from '@/lib/supabase'
import { QuestaoIndividual, Letra } from '@/lib/questoes-individuais'
import { Prova } from '@/lib/provas'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

/** Editor do gabarito da prova, separado das respostas imutáveis das tentativas. */
export function GabaritoTentativas({ prova, questoes, onAtualizar }: { prova: Prova; questoes: QuestaoIndividual[]; onAtualizar: () => Promise<void> }) {
  const [numero, setNumero] = useState('1')
  const [letra, setLetra] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [incerto, setIncerto] = useState(false)
  const atual = questoes.find((q) => q.numero === Number(numero))

  return <details className="my-5 rounded-lg border border-border p-4">
    <summary className="cursor-pointer font-medium">Cadastrar ou corrigir gabarito das tentativas</summary>
    <p className="my-3 text-sm text-muted-foreground">Informe a alternativa correta do caderno utilizado. Esta correção recalcula a consulta das tentativas e preserva suas respostas. Classificações por matéria continuam na tela de gabarito da prova.</p>
    {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
    <form className="flex flex-wrap items-end gap-3" onSubmit={async (e) => {
      e.preventDefault(); if (ocupado || incerto || !letra) return
      setOcupado(true); setErro('')
      try {
        const userId = await getUserId()
        if (userId !== prova.user_id) throw new Error('A conta mudou. Recarregue a página.')
        const valor = letra as Letra
        const query = atual ? sb.from('questoes_individuais').update({
          letra_correta: valor, acertou: atual.letra_marcada === null ? null : atual.letra_marcada === valor, updated_at: new Date().toISOString(),
        }).eq('uuid', atual.uuid).eq('user_id', userId).eq('updated_at', atual.updated_at).eq('deleted', false)
        : sb.from('questoes_individuais').insert({ uuid: `gabarito:${prova.uuid}:${numero}`, user_id: userId,
          prova_uuid: prova.uuid, numero: Number(numero), data: prova.data, letra_correta: valor,
          letra_marcada: null, acertou: null, materia_uuid: null, conteudo_uuid: null,
        })
        const { data, error } = await query.select('uuid').single()
        if (error || !data) throw new Error('Correção não confirmada. Atualize antes de reenviar.')
        await onAtualizar(); setLetra('')
      } catch (e) { setErro((e as Error).message); setIncerto(true) }
      finally { setOcupado(false) }
    }}>
      <label className="text-sm">Questão<Select aria-label="Número da questão para corrigir" value={numero} disabled={ocupado || incerto} onChange={(e) => { setNumero(e.target.value); setLetra('') }}>{Array.from({ length: 90 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</Select></label>
      <label className="text-sm">Alternativa correta<Select aria-label="Alternativa correta" required value={letra} disabled={ocupado || incerto} onChange={(e) => setLetra(e.target.value)}><option value="">{atual?.letra_correta ? `Atual: ${atual.letra_correta}` : 'Selecione'}</option>{['A','B','C','D','E'].map((v) => <option key={v}>{v}</option>)}</Select></label>
      <Button type="submit" disabled={ocupado || incerto}>Salvar gabarito</Button>
      {incerto && <Button type="button" variant="outline" disabled={ocupado} onClick={async () => {
        setOcupado(true)
        try { await onAtualizar(); setIncerto(false); setErro('') } catch { setErro('Não foi possível atualizar.') }
        finally { setOcupado(false) }
      }}>Atualizar gabarito</Button>}
    </form>
  </details>
}
