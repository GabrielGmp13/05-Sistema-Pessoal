# ARCHITECTURE.md

## Diagrama do sistema

```
[Qualquer dispositivo — PC, celular, tablet]
         Browser (HTTPS)
              │
    ┌─────────┼──────────────┐
    │         │              │
    ▼         ▼              ▼
 Vercel   Supabase       Supabase
(frontend) (PostgreSQL   (Storage
  CDN      + Auth        privado —
           + Realtime)   signed URLs)
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

### Convenção universal

```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE

ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON <table>
  FOR ALL USING (auth.uid() = user_id);
```

### Schema executado (✅ verificado no Supabase) — `001_schema_inicial.sql`

```sql
CREATE TABLE treinos (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  descricao   TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);

CREATE TABLE exercicios (
  uuid               TEXT PRIMARY KEY,
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  treino_uuid        TEXT NOT NULL REFERENCES treinos(uuid),
  nome               TEXT NOT NULL,
  series_alvo        INTEGER,
  reps_alvo          INTEGER,
  carga_alvo         NUMERIC(6,2),
  descanso_segundos  INTEGER,
  ordem              INTEGER DEFAULT 0,
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  deleted            BOOLEAN DEFAULT FALSE
);

CREATE TABLE sessoes_treino (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  treino_uuid TEXT NOT NULL REFERENCES treinos(uuid),
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim    TIMESTAMPTZ,
  observacoes TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);

CREATE TABLE series_executadas (
  uuid            TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sessao_uuid     TEXT NOT NULL REFERENCES sessoes_treino(uuid),
  exercicio_uuid  TEXT NOT NULL REFERENCES exercicios(uuid),
  serie_numero    INTEGER,
  carga_real      NUMERIC(6,2),
  reps_real       INTEGER,
  concluida       BOOLEAN DEFAULT FALSE,
  data_hora       TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted         BOOLEAN DEFAULT FALSE
);

CREATE TABLE shape (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data        DATE NOT NULL,
  peso        NUMERIC(5,2),
  foto_path   TEXT,  -- path no bucket 'shape', ex: '{user_id}/2024-01-15.jpg'
  observacoes TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);

CREATE TABLE cardio (
  uuid             TEXT PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data             DATE NOT NULL,
  tipo             TEXT,
  duracao_minutos  INTEGER,
  distancia_km     NUMERIC(6,3),
  observacoes      TEXT,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted          BOOLEAN DEFAULT FALSE
);

CREATE TABLE agenda (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data        DATE NOT NULL,
  treino_uuid TEXT REFERENCES treinos(uuid),
  titulo      TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);

CREATE TABLE revisao_espacada (
  uuid            TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pergunta        TEXT NOT NULL,
  resposta        TEXT,
  modulo          TEXT,            -- 'treino', 'enem', 'olimpiadas', etc.
  referencia_uuid TEXT,
  ef              NUMERIC(4,2) DEFAULT 2.5,
  repeticoes      INTEGER DEFAULT 0,
  intervalo_dias  INTEGER DEFAULT 1,
  proxima_revisao DATE DEFAULT CURRENT_DATE,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted         BOOLEAN DEFAULT FALSE
);

-- Índices parciais (WHERE NOT deleted) já criados em todas as tabelas acima
-- Migrações futuras seguem a numeração: 002_estudos.sql, 003_biblioteca.sql
```

---

## Política de mídia — Biblioteca (DEC-011)

O módulo Biblioteca (Fase 4, ainda não implementado) é um **catálogo**, não um repositório de arquivos. Armazena identificação da obra, metadados, notas, avaliações, datas, progresso, comentários, categorias e tags — nunca o arquivo da obra em si (livro, filme, série, música).

Capas seguem regra de prioridade: se a API de metadados (TMDB, Google Books) fornece URL de capa, ela é salva como texto (`capa_url`). Só quando a API não tem capa disponível é feito upload manual para o bucket `capas` (`capa_path`). Isso mantém o uso de Storage mínimo mesmo com um catálogo grande.

---

## Frontend

### Hierarquia de camadas

```
Página HTML
    │ importa
    ▼
supabase.js       ← window.sb (Supabase JS client configurado)
    │ usa
    ▼
Supabase Cloud    ← PostgreSQL + Auth + Storage + Realtime
```

```
Página HTML (offline — ainda não implementado)
    │ servida por
    ▼
Service Worker    ← cache de assets + dados recentes
    │ usa como cache
    ▼
IndexedDB         ← dados em cache (não é fonte de verdade)
```

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
