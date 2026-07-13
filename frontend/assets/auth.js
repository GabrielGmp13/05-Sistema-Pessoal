'use strict';

// ================================================================
// auth.js — Verificação de sessão Supabase
// Arquivo: frontend/assets/auth.js
//
// Carregue DEPOIS de supabase.js em toda página protegida.
// NÃO carregue em login.html.
//
// Padrão de uso em cada página:
//
//   document.addEventListener('DOMContentLoaded', async () => {
//     const session = await window.authReady;
//     if (!session) return; // auth.js já está redirecionando para login
//     await inicializar();
//   });
// ================================================================

window.authReady = (async () => {
  const { data: { session }, error } = await window.sb.auth.getSession();

  if (error || !session) {
    window.location.replace('../login.html');
    return null;
  }

  // Disponível globalmente em todas as páginas após authReady resolver
  window.currentUser = session.user;
  return session;
})();