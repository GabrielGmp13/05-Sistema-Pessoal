'use client'

import { useEffect, useState } from 'react'
import { sb } from '@/lib/supabase'
import { normalizarModulosOcultos } from '@/lib/modulos-visiveis'
import { ROTAS_MODULOS_PAUSADOS } from '@/lib/modulos-pausados'

export function useModulosVisiveis() {
  const [ocultos, setOcultos] = useState<string[]>(ROTAS_MODULOS_PAUSADOS)
  useEffect(() => {
    let ativo = true
    let eventoRecebido = false
    const { data: { subscription } } = sb.auth.onAuthStateChange((_evento, session) => {
      eventoRecebido = true
      if (ativo) setOcultos([...new Set([...ROTAS_MODULOS_PAUSADOS, ...normalizarModulosOcultos(session?.user.user_metadata?.app_hidden_modules)])])
    })
    void sb.auth.getSession().then(({ data }) => {
      if (ativo && !eventoRecebido) setOcultos([...new Set([...ROTAS_MODULOS_PAUSADOS, ...normalizarModulosOcultos(data.session?.user.user_metadata?.app_hidden_modules)])])
    }).catch(() => { /* Falha mantém todos os atalhos disponíveis. */ })
    return () => { ativo = false; subscription.unsubscribe() }
  }, [])
  return ocultos
}
