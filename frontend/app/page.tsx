import { sb } from '@/lib/supabase';

export default async function HomePage() {
  const { data: { user } } = await sb.auth.getUser();

  return (
    <div className="container" style={{ paddingTop: '3rem' }}>
      <h1>Sistema Pessoal — v2</h1>
      <p style={{ color: 'var(--texto-secundario)' }}>
        Fase 7.0 confirmada: login, middleware e CSS global funcionando.
      </p>
      <p>
        Sessão ativa: <strong>{user?.email ?? '(nenhuma — isso não deveria aparecer aqui)'}</strong>
      </p>
    </div>
  );
}
