'use client'

import Script from 'next/script'
import { useCallback, useEffect, useRef } from 'react'

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

type Props = {
  onTokenChange: (token: string | null) => void
  resetKey?: number
}

export const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)

export function TurnstileWidget({ onTokenChange, resetKey = 0 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<string | null>(null)

  const renderWidget = useCallback(() => {
    const container = containerRef.current
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    if (!container || !sitekey || !window.turnstile || widgetRef.current) return

    widgetRef.current = window.turnstile.render(container, {
      sitekey,
      theme: 'auto',
      callback: (token: string) => onTokenChange(token),
      'expired-callback': () => onTokenChange(null),
      'error-callback': () => onTokenChange(null),
    })
  }, [onTokenChange])

  useEffect(() => {
    if (!turnstileEnabled) return
    if (widgetRef.current && window.turnstile) {
      window.turnstile.remove(widgetRef.current)
      widgetRef.current = null
      onTokenChange(null)
    }
    renderWidget()
  }, [onTokenChange, renderWidget, resetKey])

  if (!turnstileEnabled) return null

  return <div className="turnstile-area">
    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={renderWidget} />
    <div ref={containerRef} aria-label="Verificação contra robôs" />
  </div>
}
