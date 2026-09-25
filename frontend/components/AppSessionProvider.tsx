'use client'

import type { Session } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { normalizarModulosOcultos } from '@/lib/modulos-visiveis'
import { ROTAS_MODULOS_PAUSADOS } from '@/lib/modulos-pausados'
import { logDiagnostic } from '@/lib/safe-diagnostics'
import { getSession, getSignedUrlForUser, sb } from '@/lib/supabase'

export type PerfilResumo = {
  nome: string
  email: string | null
  descricao: string | null
  avatarUrl: string | null
  backgroundUrl: string | null
}

type AppSessionContextValue = {
  perfil: PerfilResumo | null
  modulosOcultos: string[]
  recarregarPerfil: () => Promise<void>
}

const AppSessionContext = createContext<AppSessionContextValue | null>(null)

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<PerfilResumo | null>(null)
  const ativoRef = useRef(true)
  const chavePerfilRef = useRef<string | null>(null)

  const aplicarSessao = useCallback(async (session: Session | null, forcar = false) => {
    if (!ativoRef.current) return
    setSessao(session)
    if (!session) {
      chavePerfilRef.current = null
      setPerfil(null)
      return
    }

    const meta = session.user.user_metadata
    const chave = JSON.stringify([
      session.user.id,
      session.user.email,
      meta?.avatar_path,
      meta?.background_path,
      meta?.app_display_name,
      meta?.app_subtitle,
      meta?.app_avatar_url,
      meta?.app_background_url,
    ])
    if (!forcar && chavePerfilRef.current === chave) return
    chavePerfilRef.current = chave

    const [avatarResultado, backgroundResultado] = await Promise.allSettled([
      meta?.avatar_path ? getSignedUrlForUser('midias-pessoais', meta.avatar_path, session.user.id) : null,
      meta?.background_path ? getSignedUrlForUser('midias-pessoais', meta.background_path, session.user.id) : null,
    ])
    if (!ativoRef.current || chavePerfilRef.current !== chave) return
    const avatarSigned = avatarResultado.status === 'fulfilled' ? avatarResultado.value : null
    const backgroundSigned = backgroundResultado.status === 'fulfilled' ? backgroundResultado.value : null
    setPerfil({
      nome: meta?.app_display_name || meta?.full_name || meta?.name || session.user.email?.split('@')[0] || 'Usuário',
      email: session.user.email ?? null,
      descricao: meta?.app_subtitle || meta?.subtitle || null,
      avatarUrl: avatarSigned || meta?.app_avatar_url || meta?.avatar_url || null,
      backgroundUrl: backgroundSigned || meta?.app_background_url || meta?.background_url || null,
    })
  }, [])

  const recarregarPerfil = useCallback(async () => {
    try {
      await aplicarSessao(await getSession(), true)
    } catch (error) {
      logDiagnostic('sessao-global/recarregar-perfil', error)
    }
  }, [aplicarSessao])

  useEffect(() => {
    ativoRef.current = true
    let eventoRecebido = false
    const { data: { subscription } } = sb.auth.onAuthStateChange((_evento, session) => {
      eventoRecebido = true
      void aplicarSessao(session)
    })
    void getSession()
      .then((session) => { if (!eventoRecebido) void aplicarSessao(session) })
      .catch((error) => logDiagnostic('sessao-global/carregar', error))
    const atualizarPerfil = () => { void recarregarPerfil() }
    window.addEventListener('perfil-atualizado', atualizarPerfil)
    return () => {
      ativoRef.current = false
      subscription.unsubscribe()
      window.removeEventListener('perfil-atualizado', atualizarPerfil)
    }
  }, [aplicarSessao, recarregarPerfil])

  const modulosOcultos = useMemo(() => [...new Set([
    ...ROTAS_MODULOS_PAUSADOS,
    ...normalizarModulosOcultos(sessao?.user.user_metadata?.app_hidden_modules),
  ])], [sessao])

  return (
    <AppSessionContext.Provider value={{ perfil, modulosOcultos, recarregarPerfil }}>
      {children}
    </AppSessionContext.Provider>
  )
}

export function useAppSession() {
  const contexto = useContext(AppSessionContext)
  if (!contexto) throw new Error('useAppSession precisa estar dentro de <AppSessionProvider>')
  return contexto
}
