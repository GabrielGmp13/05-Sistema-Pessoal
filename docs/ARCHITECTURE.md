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
(frontend) (PostgreSQL   (Storage)
  CDN      + Auth        imagens,
           + Realtime)   PDFs
```

**Sem servidor customizado.** O frontend (HTML/CSS/JS estático) é servido pelo CDN do Vercel. Todos os dados, auth, arquivos e sync em tempo real passam pelo Supabase.

Offline: Service Worker cacheia assets e dados recentes. Escritas offline são enfileiradas e sincronizadas quando a conexão retornar.

---

## Supabase: componentes utilizados

### PostgreSQL
Banco de dados relacional. Schema idêntico ao SQLite anterior, com adições:
- `user_id UUID` em toda tabela (para RLS)
- Tipos nativos: `BOOLEAN`, `TIMESTAMPTZ`, `UUID`
- Row Level Security ativa em todas as tabelas

### Supabase Auth
- Email + senha
- JWT gerado automaticamente
- `auth.uid()` disponível em políticas RLS
- `session.user.id` disponível no frontend via JS

### Supabase Storage
- Bucket `shape-photos` — fotos de shape (público ou privado)
- Bucket `documentos` — PDFs e arquivos pessoais
- CDN automático para servir arquivos

### Supabase Realtime
- Subscrições a `postgres_changes` por tabela
- Qualquer dispositivo recebe atualizações instantaneamente
- Substitui todo o sistema de sync manual anterior

---

## Schema PostgreSQL

### Convenção universal

```sql
-- Todo registro tem obrigatoriamente:
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id),
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE

-- RLS em toda tabela:
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON <table>
  FOR ALL USING (auth.uid() = user_id);
```

### Tabelas do módulo Treino

```sql
CREATE TABLE treinos (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  nome        TEXT NOT NULL,
  descricao   TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);

CREATE TABLE exercicios (
  uuid               TEXT PRIMARY KEY,
  user_id            UUID NOT NULL REFERENCES auth.users(id),
  treino_uuid        TEXT NOT NULL REFERENCES treinos(uuid),
  nome               TEXT NOT NULL,
  series_alvo        INTEGER,
  reps_alvo          INTEGER,
  carga_alvo         NUMERIC,
  descanso_segundos  INTEGER,
  ordem              INTEGER,
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  deleted            BOOLEAN DEFAULT FALSE
);

CREATE TABLE sessoes_treino (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  treino_uuid TEXT NOT NULL REFERENCES treinos(uuid),
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim    TIMESTAMPTZ,
  observacoes TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);

CREATE TABLE series_executadas (
  uuid            TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  sessao_uuid     TEXT NOT NULL REFERENCES sessoes_treino(uuid),
  exercicio_uuid  TEXT NOT NULL REFERENCES exercicios(uuid),
  serie_numero    INTEGER,
  carga_real      NUMERIC,
  reps_real       INTEGER,
  concluida       BOOLEAN DEFAULT FALSE,
  data_hora       TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted         BOOLEAN DEFAULT FALSE
);

CREATE TABLE shape (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  data        DATE NOT NULL,
  peso        NUMERIC,
  foto_path   TEXT,  -- path no Supabase Storage, ex: "shape-photos/2024-01-15.jpg"
  observacoes TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);

CREATE TABLE cardio (
  uuid             TEXT PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id),
  data             DATE NOT NULL,
  tipo             TEXT,
  duracao_minutos  INTEGER,
  distancia_km     NUMERIC,
  observacoes      TEXT,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted          BOOLEAN DEFAULT FALSE
);

CREATE TABLE agenda (
  uuid            TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  data            DATE NOT NULL,
  treino_uuid     TEXT REFERENCES treinos(uuid),
  titulo          TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted         BOOLEAN DEFAULT FALSE
);

-- Demais tabelas (estudos, biblioteca, revisão): pendente de documentação
-- Schemas existem na migração SQL mas não foram detalhados aqui ainda
```

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
Página HTML (offline)
    │ servida por
    ▼
Service Worker    ← cache de assets + dados recentes
    │ usa como cache
    ▼
IndexedDB         ← dados em cache (não é fonte de verdade)
```

### Carregamento de scripts em cada página

```html
<!-- Supabase JS (CDN) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<!-- Chart.js SOMENTE em páginas com gráficos -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.0/chart.umd.min.js"></script>
<!-- Config do cliente Supabase -->
<script src="assets/supabase.js"></script>
<!-- Verificação de auth (redireciona para login.html se sem sessão) -->
<script src="assets/auth.js"></script>
```

### supabase.js — responsabilidades

```javascript
// 1. Criar e exportar o cliente Supabase
const SUPABASE_URL = '...'
const SUPABASE_ANON_KEY = '...'
window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 2. Helper: userId da sessão ativa
window.getUserId = async () => {
  const { data: { session } } = await window.sb.auth.getSession()
  return session?.user?.id
}

// 3. Helper: timestamp ISO para updated_at
window.now = () => new Date().toISOString()
```

### auth.js — responsabilidades

```javascript
// Verificar sessão ao carregar qualquer página protegida
// Se sem sessão: redirecionar para login.html
// Se com sessão: continuar normalmente
```

---

## Service Worker

Estratégia de cache por tipo de recurso:

| Recurso | Estratégia | Motivo |
|---|---|---|
| CSS, fontes, ícones | Cache First | Assets estáticos que não mudam |
| Supabase JS, Chart.js | Cache First | Bibliotecas de terceiros estáveis |
| Dados do Supabase | Network First com fallback | Sempre preferir dado atualizado |
| Assets de Storage (fotos) | Stale While Revalidate | Fotos raramente mudam |

Fila de escrita offline:
- Operações de escrita offline são salvas em IndexedDB
- SW detecta reconexão e processa a fila
- Aplicável principalmente a `treino-academia.html` (uso sem internet)

---

## Realtime (sync multi-dispositivo)

```javascript
// Exemplo: qualquer mudança na tabela treinos atualiza a UI automaticamente
window.sb.channel('treinos-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'treinos',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    renderTreinos()  // re-render da lista
  })
  .subscribe()
```

Não é necessário polling, sync manual ou botão "Sincronizar". As mudanças propagam em tempo real.

---

## Armazenamento de arquivos

```javascript
// Upload de foto de shape
const filePath = `${userId}/${data}-shape.jpg`
const { error } = await window.sb.storage.from('shape-photos').upload(filePath, file)

// URL pública para exibir
const { data: urlData } = window.sb.storage.from('shape-photos').getPublicUrl(filePath)
const url = urlData.publicUrl  // usar em <img src="">
```

---

## SM-2 em JavaScript

```javascript
// sm2.js — algoritmo completo, sem servidor
function calcularSM2(ef, repeticoes, intervalo, qualidade) {
  // qualidade: 0 (blackout) → 3 (perfeito)
  if (qualidade >= 2) {
    if (repeticoes === 0)     intervalo = 1
    else if (repeticoes === 1) intervalo = 6
    else                       intervalo = Math.round(intervalo * ef)
    repeticoes++
  } else {
    repeticoes = 0
    intervalo = 1
  }
  ef = Math.max(1.3, ef + 0.1 - (3 - qualidade) * (0.08 + (3 - qualidade) * 0.02))
  const proxima = new Date()
  proxima.setDate(proxima.getDate() + intervalo)
  return { ef, repeticoes, intervalo, proxima_revisao: proxima.toISOString().split('T')[0] }
}
```

Resultado salvo diretamente na tabela de revisão via Supabase JS.

---

## Dependências externas

| Dependência | Tipo | Offline? | Onde |
|---|---|---|---|
| Supabase JS v2 | CDN script | SW cacheia | Todas as páginas |
| Chart.js 4.5.0 | CDN script | SW cacheia | Páginas com gráficos |
| JetBrains Mono | self-hosted .woff2 | SW cacheia | Todas as páginas |
| Syne | self-hosted .woff2 | SW cacheia | Todas as páginas |
| Supabase (PostgreSQL) | Cloud API | Dados em cache no SW | — |
| Supabase Storage | Cloud CDN | Fotos em cache no SW | Páginas com imagens |

---

## Custos (Supabase Free Tier)

| Recurso | Limite free | Estimativa de uso |
|---|---|---|
| Banco de dados | 500MB | Anos de dados pessoais |
| Storage | 1GB | Centenas de fotos de shape + PDFs |
| Bandwidth | 5GB/mês | Muito abaixo para uso pessoal |
| Auth | 50.000 MAU | 1 usuário |
| Realtime | 200 conexões simultâneas | 1-3 dispositivos |
| **Total** | **$0/mês** | — |
