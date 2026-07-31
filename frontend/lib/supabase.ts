import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// createBrowserClient (não createClient de @supabase/supabase-js) é obrigatório aqui:
// guarda a sessão via cookies, o que permite o middleware (rodando no servidor)
// ler a mesma sessão. createClient guardaria só em localStorage, invisível pro middleware.
export const sb = createBrowserClient(supabaseUrl, supabaseAnonKey);

export async function getSession() {
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user.id ?? null;
}

export function now(): string {
  return new Date().toISOString();
}

// Storage — buckets sempre privados, sempre via signed URL (DEC-010)
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
): Promise<string | null> {
  const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) {
    sbErr(error, `getSignedUrl(${bucket}, ${path})`);
    return null;
  }
  return data.signedUrl;
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string | null> {
  const { error } = await sb.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) {
    sbErr(error, `uploadFile(${bucket}, ${path})`);
    return null;
  }
  return path;
}

export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  const { error } = await sb.storage.from(bucket).remove([path]);
  if (error) {
    sbErr(error, `deleteFile(${bucket}, ${path})`);
    return false;
  }
  return true;
}

// Soft delete universal (DEC-008)
export async function softDelete(
  table: string,
  uuid: string
): Promise<boolean> {
  const { error } = await sb
    .from(table)
    .update({ deleted: true, updated_at: now() })
    .eq('uuid', uuid);
  if (error) {
    sbErr(error, `softDelete(${table}, ${uuid})`);
    return false;
  }
  return true;
}

// Log padronizado de erro do Supabase — retorna null para compatibilidade
// com o padrão "if (error) return sbErr(error, 'fn')" nos callers
export function sbErr<T = null>(error: unknown, context: string): T {
  console.error(`[Supabase Error] ${context}:`, error);
  return null as T;
}