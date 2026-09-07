import type { User } from '@supabase/supabase-js'

export type PrivacyDatabaseExport = {
  versao: number
  gerado_em: string
  registros: Record<string, unknown[]>
  arquivos: Array<Record<string, unknown>>
  integracoes_google: Array<Record<string, unknown>>
}

export function buildPrivacyExport(user: User, database: PrivacyDatabaseExport) {
  return {
    formato: 'projeto-pessoal-exportacao',
    versao: 1,
    gerado_em: new Date().toISOString(),
    conta: {
      email: user.email ?? null,
      criada_em: user.created_at,
      ultimo_login_em: user.last_sign_in_at ?? null,
      perfil: {
        nome: user.user_metadata?.app_nome ?? null,
        descricao: user.user_metadata?.app_subtitulo ?? null,
        avatar_url: user.user_metadata?.app_avatar_url ?? null,
        background_url: user.user_metadata?.app_background_url ?? null,
      },
    },
    dados: database,
    observacoes: [
      'O arquivo contém os registros vinculados à sua conta no momento da geração.',
      'Credenciais, senhas, cookies e tokens de integrações não fazem parte da exportação.',
      'A seção arquivos é um inventário; os arquivos privados devem ser solicitados pelo protocolo quando necessário.',
    ],
  }
}

export function privacyExportFilename(date = new Date()) {
  return `projeto-pessoal-dados-${date.toISOString().slice(0, 10)}.json`
}

