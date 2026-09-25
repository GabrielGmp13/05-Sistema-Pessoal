'use client'

import { useEffect, useState } from 'react'
import { sb } from '@/lib/supabase'
import { normalizarModulosOcultos } from '@/lib/modulos-visiveis'

export function useModulosVisiveis() {
  const [ocultos, setOcultos] = useState<string[]>([])
  useEffect(() => {
    let ativo = true
    let eventoRecebido = false
    const { data: { subscription } } = sb.auth.onAuthStateChange((_evento, session) => {
      eventoRecebido = true
      if (ativo) setOcultos(normalizarModulosOcultos(session?.user.user_metadata?.app_hidden_modules))
    })
    void sb.auth.getSession().then(({ data }) => {
      if (ativo && !eventoRecebido) setOcultos(normalizarModulosOcultos(data.session?.user.user_metadata?.app_hidden_modules))
    }).catch(() => { /* Falha mantém todos os atalhos disponíveis. */ })
    return () => { ativo = false; subscription.unsubscribe() }
  }, [])
  return ocultos
}
