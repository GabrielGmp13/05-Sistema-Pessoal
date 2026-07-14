# ARCHITECTURE.md

## Diagrama do sistema

```
[Qualquer dispositivo — PC, celular, tablet]
         Browser (HTTPS)  
                           │
    ┌──────────────────────┼──────────────┐
    │                      │              │
    ▼                      ▼              ▼
Vercel                  Supabase       Supabase
(frontend Next.js       (PostgreSQL    (Storage
 + API Routes)           + Auth)        privado)
```

**Sem servidor customizado.** O frontend (HTML/CSS/JS estático) é servido pelo CDN do Vercel. Todos os dados, auth, arquivos e sync em tempo real passam pelo Supabase.

Offline: Service Worker cacheia assets e dados recentes (ainda não implementado — Fase M2). Escritas offline serão enfileiradas e sincronizadas quando a conexão retornar.

**Status de implementação:** schema PostgreSQL ✅ executado. Auth ✅ funcionando. Storage ✅ buckets criados. Realtime 🔄 não implementado. Service Worker 🔄 não implementado. Vercel 🔄 deploy ainda não feito.

---

## Supabase: componentes utilizados

### PostgreSQL
Banco de dados relacional. ✅ Schema executado via `supabase/migrations/001_schema_inicial.sql` e verificado no dashboard do Supabase. Toda tabela segue a convenção:
- `user_id UUID` (para RLS)
- Tipos nativos: `BOOLEAN`, `TIMESTAMPTZ`, `UUID`, `NUMERIC`
- Row Level Security ativa em todas as tabelas

### Supabase Auth
- Email + senha — ✅ testado com usuário real, login funcionando
- JWT gerado automaticamente
- `auth.uid()` disponível em políticas RLS
- `session.user.id` disponível no frontend via `window.getUserId()`

### Supabase Storage

**Decisão (DEC-010): todos os buckets são privados.** Nenhum arquivo é publicamente acessível. Acesso exclusivo via signed URL com expiração de 1 hora.

| Bucket | Conteúdo | Limite | Tipos aceitos |
|---|---|---|---|
| `shape` | Fotos de shape | 10MB | JPEG, PNG, WebP |
| `documentos` | PDFs de provas, apostilas, documentos pessoais | 50MB | PDF |
| `capas` | Capas de obras da Biblioteca sem cobertura de API | 2MB | JPEG, PNG, WebP |

Convenção de path obrigatória: `{user_id}/nome-do-arquivo.ext`. Storage Policies usam `(storage.foldername(name))[1] = auth.uid()::text` para isolar o acesso — cada usuário só vê seus próprios arquivos, mesmo dentro do mesmo bucket.

### Supabase Realtime
- Subscrições a `postgres_changes` por tabela
- Qualquer dispositivo recebe atualizações instantaneamente
- Substitui todo o sistema de sync manual anterior
- **Status:** 🔄 não implementado em nenhuma página ainda (Fase M3)

---

## Schema PostgreSQL

Schema completo (tabelas, colunas, relacionamentos, RLS, convenções de migração) agora vive em `DATABASE.md`. Este documento cobre a arquitetura de componentes; `DATABASE.md` cobre a estrutura de dados em si.
---

## Política de mídia — Biblioteca

Ver DEC-011 em `DECISIONS.md` para o raciocínio completo e alternativas consideradas. Resumo prático: catálogo de metadados, nunca hospedagem de mídia. Capas via `capa_url` (quando a API fornece) ou upload manual em `capas`/`capa_path` (só quando não fornece).

---

## Frontend (Next.js/React — desde v2, ver DEC-018)

### Hierarquia de camadas

```
Página/Componente (React, .tsx)
│ importa
▼
lib/supabase.ts     ← client do Supabase, mesma responsabilidade do antigo supabase.js
│ usa (client-side, para CRUD direto sob RLS)
▼
Supabase Cloud       ← PostgreSQL + Auth + Storage + Realtime
Componente (React, .tsx)
│ chama via fetch()
▼
app/api/**/route.ts  ← API Routes (server-side, roda no Vercel)
│ usa segredo (env var server-only) + fala com API externa e/ou Supabase
▼
API externa (TMDB, Google Calendar, etc.) e/ou Supabase Cloud

```
**Regra de decisão:** se a operação não precisa de segredo nem lógica exclusiva
de servidor, o componente fala direto com o Supabase client (mesmo padrão de
hoje, só que dentro de um componente React). Se precisa de uma chave de API ou
processamento que não pode ser exposto no navegador, passa por uma API Route.

### lib/supabase.ts — substitui supabase.js
Mesmas funções, agora como módulo TypeScript importável: `getSession()`,
`getUserId()`, `getSignedUrl()`, `uploadFile()`, `deleteFile()`,
`softDelete()`, `sbErr()`.

### lib/auth.ts — substitui auth.js
Mesma responsabilidade (verificação de sessão + redirect), adaptado para
Next.js (middleware ou hook, a definir na implementação).

### API Routes — novo componente da arquitetura
Rodam como funções serverless no Vercel (mesmo runtime do build do Next.js —
não são Edge Functions do Supabase, ver DEC-018). Guardam segredo como
variável de ambiente **sem prefixo `NEXT_PUBLIC_`** (variáveis com esse
prefixo são expostas ao navegador — nunca usar para segredo).

Exemplo de uso planejado: `app/api/tmdb/search/route.ts` recebe o termo de
busca do componente React, chama `api.themoviedb.org` com a `TMDB_API_KEY`
guardada só no servidor, devolve o resultado já formatado.

### Carregamento de scripts em cada página

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.0/chart.umd.min.js"></script>
<script src="assets/supabase.js"></script>
<script src="assets/auth.js"></script>
```

### supabase.js — implementado

```javascript
window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

window.getSession   = async () => { /* retorna sessão completa ou null */ }
window.getUserId    = async () => { /* retorna session.user.id ou null */ }
window.now          = () => new Date().toISOString()

// Storage (buckets privados — sempre signed URL)
window.getSignedUrl = async (bucket, path, expiresIn = 3600) => { /* ... */ }
window.uploadFile   = async (bucket, path, file) => { /* retorna path ou null */ }
window.deleteFile   = async (bucket, path) => { /* retorna boolean */ }

window.softDelete   = async (table, uuid) => { /* update deleted:true, updated_at:now() */ }
window.sbErr         = (error, context) => { /* log padronizado, retorna boolean */ }
```

### auth.js — implementado

```javascript
// Promise resolvida uma vez ao carregar a página.
// Redireciona para login.html se não houver sessão.
window.authReady = (async () => {
  const { data: { session }, error } = await window.sb.auth.getSession();
  if (error || !session) {
    window.location.replace('/login.html');
    return null;
  }
  window.currentUser = session.user;
  return session;
})();

// Uso em qualquer página protegida:
// const session = await window.authReady;
// if (!session) return;
```

---

## Service Worker

🔄 **Não implementado ainda** (Fase M2). Estratégia planejada:

| Recurso | Estratégia | Motivo |
|---|---|---|
| CSS, fontes, ícones | Cache First | Assets estáticos que não mudam |
| Supabase JS, Chart.js | Cache First | Bibliotecas de terceiros estáveis |
| Dados do Supabase | Network First com fallback | Sempre preferir dado atualizado |
| Assets de Storage (fotos) | Stale While Revalidate | Fotos raramente mudam |

Fila de escrita offline: operações de escrita offline serão salvas em IndexedDB; o SW detecta reconexão e processa a fila. Aplicável principalmente a `treino-academia.html` (uso sem internet).

---

## Realtime (sync multi-dispositivo)

🔄 **Não implementado ainda** (Fase M3). Exemplo de uso planejado:

```javascript
window.sb.channel('treinos-changes')
  .on('postgres_changes', {
    event: '*', schema: 'public', table: 'treinos',
    filter: `user_id=eq.${userId}`
  }, (payload) => { renderTreinos(); })
  .subscribe()
```

---

## Armazenamento de arquivos

```javascript
// Upload de foto de shape — bucket privado, path por usuário
const filePath = `${userId}/${data}-shape.jpg`
const path = await window.uploadFile('shape', filePath, file)

// Exibir: NUNCA usar getPublicUrl (buckets são privados)
const url = await window.getSignedUrl('shape', filePath)
// usar `url` em <img src="">  — válida por 1 hora
```

---

## SM-2 em JavaScript

✅ Implementado em `sm2.js`:

```javascript
// Função pura — calcula os novos valores SM-2
window.calcularSM2(ef, repeticoes, intervaloDias, qualidade)
// retorna { ef, repeticoes, intervaloDias, proximaRevisao }

// Wrapper integrado ao Supabase — busca, calcula e persiste em um passo
window.avaliarCard(cardUuid, qualidade)
// busca o card em revisao_espacada, chama calcularSM2, salva o resultado
```

---

## Dependências externas

| Dependência | Tipo | Offline? | Onde |
|---|---|---|---|
| Supabase JS v2 | CDN script | SW cacheia (quando implementado) | Todas as páginas |
| Chart.js 4.5.0 | CDN script | SW cacheia (quando implementado) | Páginas com gráficos |
| JetBrains Mono | self-hosted .woff2 | SW cacheia (quando implementado) | Todas as páginas |
| Syne | self-hosted .woff2 | SW cacheia (quando implementado) | Todas as páginas |
| Supabase (PostgreSQL) | Cloud API | Dados em cache no SW (futuro) | — |
| Supabase Storage | Cloud, buckets privados | Fotos em cache no SW (futuro) | Páginas com imagens/PDFs |

---

## Custos (Supabase Free Tier)

| Recurso | Limite free | Estimativa de uso |
|---|---|---|
| Banco de dados | 500MB | Anos de dados pessoais |
| Storage | 1GB | Centenas de fotos de shape + PDFs (sem mídia da Biblioteca) |
| Bandwidth | 5GB/mês | Muito abaixo para uso pessoal |
| Auth | 50.000 MAU | 1 usuário |
| Realtime | 200 conexões simultâneas | 1-3 dispositivos |
| **Total** | **$0/mês** | — |
