'use client'

import { useEffect, useState } from 'react'
import { sb } from '@/lib/supabase'
import { rotuloAcademico } from '@/lib/contexto-academico'

export function useContextoAcademico() {
  const [rotulo, setRotulo] = useState<'Escola' | 'Faculdade'>('Escola')
  useEffect(() => {
    let ativo = true
    let atualizado = false
    const { data: { subscription } } = sb.auth.onAuthStateChange((_evento, sessao) => {
      atualizado = true
      if (ativo) setRotulo(rotuloAcademico(sessao?.user.user_metadata?.app_contexto_academico))
    })
    void sb.auth.getSession().then(({ data }) => {
      if (ativo && !atualizado) setRotulo(rotuloAcademico(data.session?.user.user_metadata?.app_contexto_academico))
    })
    return () => { ativo = false; subscription.unsubscribe() }
  }, [])
  return rotulo
}
