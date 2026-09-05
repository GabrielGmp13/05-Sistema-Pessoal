// Toda rota nova nasce protegida. Prefixos parecidos com /login não são públicos.
export function unauthenticatedAction(pathname: string): 'allow' | 'json-401' | 'login' {
  if (pathname === '/login') return 'allow'
  if (pathname === '/api' || pathname.startsWith('/api/')) return 'json-401'
  return 'login'
}

export function loginDestination(requestUrl: string): URL {
  // Não transportar code/state OAuth, buscas ou identificadores para /login.
  return new URL('/login', requestUrl)
}
