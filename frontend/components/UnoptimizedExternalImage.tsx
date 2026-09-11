import type { ComponentProps } from 'react'

// URLs assinadas e provedores escolhidos pelo usuário não devem passar pelo
// otimizador do servidor, que não encaminha autenticação e exige allowlist.
type UnoptimizedExternalImageProps = Omit<ComponentProps<'img'>, 'alt'> & { alt: string }

export function UnoptimizedExternalImage({ alt, ...props }: UnoptimizedExternalImageProps) {
  // eslint-disable-next-line @next/next/no-img-element -- política centralizada acima
  return <img alt={alt} {...props} />
}
