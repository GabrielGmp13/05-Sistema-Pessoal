'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sb } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const { error } = await sb.auth.signInWithPassword({ email, password: senha });

    setCarregando(false);

    if (error) {
      setErro('E-mail ou senha incorretos.');
      return;
    }

    router.push('/');
    router.refresh(); // força o middleware a reavaliar a sessão nova
  }

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h1>Sistema Pessoal</h1>

        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          autoComplete="current-password"
        />

        {erro && <p className="erro">{erro}</p>}

        <button type="submit" disabled={carregando} className="btn-salvar">
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}