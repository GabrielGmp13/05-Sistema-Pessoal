'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getSession, sb } from '@/lib/supabase'
import { MODULOS_OPCIONAIS, normalizarModulosOcultos } from '@/lib/modulos-visiveis'

export function ModuleVisibilityForm() {
  const [ocultos, setOcultos] = useState<string[]>([])
  const [pronto, setPronto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  useEffect(() => {
    let ativo = true
    getSession().then((session) => {
      if (!ativo) return
      if (!session) { setMensagem('Entre novamente para alterar seus atalhos.'); return }
      setOcultos(normalizarModulosOcultos(session.user.user_metadata?.app_hidden_modules))
      setPronto(true)
    }).catch(() => { if (ativo) setMensagem('Não foi possível carregar suas preferências.') })
    return () => { ativo = false }
  }, [])

  async function salvar() {
    if (!pronto || salvando) return
    setSalvando(true)
    setMensagem('')
    try {
      const { error } = await sb.auth.updateUser({ data: { app_hidden_modules: normalizarModulosOcultos(ocultos) } })
      setMensagem(error ? 'Não foi possível salvar. Tente novamente.' : 'Atalhos atualizados para esta conta.')
    } catch { setMensagem('Não foi possível confirmar o salvamento. Reabra as configurações para conferir.') }
    finally { setSalvando(false) }
  }

  return <section className="mt-8 rounded-lg border border-border bg-card p-5" aria-label="Atalhos dos módulos">
    <h2 className="text-lg font-semibold">Atalhos dos módulos</h2>
    <p className="mt-2 text-sm text-muted-foreground">Escolha os atalhos da navegação e da lista de módulos do Início. Ocultar não apaga dados, não bloqueia links diretos e não remove registros dos resumos. Você pode reativar aqui a qualquer momento.</p>
    <fieldset disabled={!pronto || salvando} className="mt-4 grid gap-3 sm:grid-cols-2">
      {MODULOS_OPCIONAIS.map((item) => <label key={item.rota} className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!ocultos.includes(item.rota)} onChange={(event) => setOcultos((atuais) => event.target.checked ? atuais.filter((rota) => rota !== item.rota) : [...atuais, item.rota])} />{item.nome}
      </label>)}
    </fieldset>
    <div className="mt-4 flex flex-wrap gap-2"><Button disabled={!pronto || salvando} onClick={() => void salvar()}>{salvando ? 'Salvando…' : 'Salvar atalhos'}</Button><Button variant="outline" disabled={!pronto || salvando} onClick={() => setOcultos([])}>Selecionar todos</Button></div>
    {mensagem ? <p role="status" className="mt-3 text-sm">{mensagem}</p> : null}
  </section>
}
