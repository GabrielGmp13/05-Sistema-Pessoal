import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { loginDestination, unauthenticatedAction } from './lib/route-access';

// Rotas que NÃO exigem sessão. Tudo que não estiver aqui é protegido por padrão
// (fail-safe — ver PROJECT_PRINCIPLES.md #4, segurança acima de conveniência).

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // No servidor, getSession() apenas lê o cookie e não valida sua autenticidade.
  // getUser() confirma o token no Supabase Auth antes de liberar rotas protegidas.
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const action = unauthenticatedAction(request.nextUrl.pathname);
    if (action !== 'allow') {
      const denied = action === 'json-401'
        ? NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
        : NextResponse.redirect(loginDestination(request.url));
      // Preservar limpeza/renovação de cookies produzida pelo Supabase Auth.
      response.cookies.getAll().forEach((cookie) => denied.cookies.set(cookie));
      denied.headers.set('Cache-Control', 'private, no-store');
      return denied;
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Roda em tudo, exceto assets estáticos e internals do Next.js.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
