'use strict';

// ================================================================
// supabase.js — Cliente Supabase + helpers globais
// Arquivo: frontend/assets/supabase.js
//
// Substitua os dois valores abaixo:
//   Supabase Dashboard → Settings → API
//   Project URL  →  SUPABASE_URL
//   anon public  →  SUPABASE_KEY
// ================================================================

const _SUPABASE_URL = 'https://lxzhdvhtujqydqndhiec.supabase.co';
const _SUPABASE_KEY = 'sb_publishable_iG1MUk21XpDM6MZZ5GfHlA_a5SeKQr7';

// ── Cliente global ───────────────────────────────────────────
// Todas as páginas acessam via window.sb
window.sb = supabase.createClient(_SUPABASE_URL, _SUPABASE_KEY);

// ── Auth helpers ─────────────────────────────────────────────

// Retorna a sessão atual completa (null se não autenticado)
window.getSession = async () => {
  const { data: { session } } = await window.sb.auth.getSession();
  return session;
};

// Retorna só o user_id (null se não autenticado)
window.getUserId = async () => {
  const session = await window.getSession();
  return session?.user?.id ?? null;
};

// ── Timestamp ────────────────────────────────────────────────

// ISO 8601 para updated_at em todo write
window.now = () => new Date().toISOString();

// ── Storage helpers ──────────────────────────────────────────
// Todos os buckets são privados.
// Convenção de path: {userId}/nome-do-arquivo.ext

// Gera URL assinada para exibir arquivo privado (expira em 1h por padrão)
window.getSignedUrl = async (bucket, path, expiresIn = 3600) => {
  const { data, error } = await window.sb.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) {
    console.error(`[storage] getSignedUrl ${bucket}/${path}:`, error.message);
    return null;
  }
  return data.signedUrl;
};

// Faz upload de um arquivo File/Blob para o Storage
// Retorna o path salvo ou null em caso de erro
window.uploadFile = async (bucket, path, file) => {
  const { data, error } = await window.sb.storage
    .from(bucket)
    .upload(path, file, { upsert: true });
  if (error) {
    console.error(`[storage] upload ${bucket}/${path}:`, error.message);
    return null;
  }
  return data.path;
};

// Remove arquivo do Storage
window.deleteFile = async (bucket, path) => {
  const { error } = await window.sb.storage
    .from(bucket)
    .remove([path]);
  if (error) console.error(`[storage] delete ${bucket}/${path}:`, error.message);
  return !error;
};

// ── Database helpers ─────────────────────────────────────────

// Soft delete genérico (usa updated_at para o sync)
// Retorna { error } para compatibilidade com desestruturação: const { error } = await window.softDelete(...)
window.softDelete = async (table, uuid) => {
  const { error } = await window.sb
    .from(table)
    .update({ deleted: true, updated_at: window.now() })
    .eq('uuid', uuid);
  if (error) console.error(`[db] softDelete ${table}/${uuid}:`, error.message);
  return { error };
};

// ── Error handler padronizado ────────────────────────────────
// Uso: const { data, error } = await ...; if (window.sbErr(error, 'contexto')) return;
window.sbErr = (error, context = '') => {
  if (!error) return false;
  console.error(`[Supabase] ${context}:`, error.message);
  return true;
};