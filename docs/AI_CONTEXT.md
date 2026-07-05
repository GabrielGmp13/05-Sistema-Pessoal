# AI_CONTEXT.md

> **Leia este arquivo primeiro.** Tudo que uma IA precisa para continuar o projeto sem reabrir decisões já tomadas. Para decisões detalhadas com alternativas consideradas, ver `DECISIONS.md`.

---

## Projeto

**Sistema Pessoal** — gestão pessoal online, multi-dispositivo.
**Desenvolvedor:** Gabriel, 18 anos, estudante (Pernambuco, BR).
**Editor:** VS Code · Windows
**Comunicação:** Português · tom direto · sem rodeios

---

## Fluxo de trabalho com IAs

Gabriel usa três ferramentas de IA em papéis distintos. Qualquer IA que retomar este projeto deve assumir o papel de **codificador principal** (o papel desta conversa), a menos que o usuário diga o contrário:

| Ferramenta | Papel |
|---|---|
| **Claude** (esta conversa / codificador principal) | Gera arquivos completos, decide arquitetura, escreve schema SQL, mantém esta documentação |
| **Cline + DeepSeek** (extensão VS Code) | Pequenos ajustes direto no editor — não usado para gerar arquivos novos do zero |
| **ChatGPT** | Dúvidas conceituais rápidas; respostas relevantes são trazidas de volta para o codificador principal antes de virarem decisão de projeto |

---

## Stack atual

| Camada | Tecnologia | Detalhe |
|---|---|---|
| Banco de dados | PostgreSQL | via Supabase (cloud) — ✅ schema executado |
| Auth | Supabase Auth | JWT, email+senha — ✅ funcionando |
| Storage de arquivos | Supabase Storage | 3 buckets privados (`shape`, `documentos`, `capas`) — ✅ criados, servidos via signed URL |
| Sync / Realtime | Supabase Realtime | Postgres Changes via WebSocket — 🔄 não implementado ainda |
| Frontend | HTML/CSS/JS puro | sem framework, sem bundler |
| Offline | Service Worker + IndexedDB | 🔄 não implementado ainda (Fase M2) |
| Gráficos | Chart.js | 4.5.0 via CDN (só em páginas online) |
| Fontes | JetBrains Mono + Syne | self-hosted .woff2 |
| Frontend hosting | Vercel | conta criada, deploy ainda não feito |
| SM-2 (revisão espaçada) | JavaScript puro | ✅ implementado em `sm2.js` |

**Arquivos mortos da arquitetura LAN (Flask/SQLite/IndexedDB) ainda presentes no disco, aguardando remoção:** `backend/app.py`, `backend/database.db`, `backend/requirements.txt`, `frontend/assets/db.js`, `frontend/assets/api.js`, `frontend/assets/sync.js`. Nenhum deles é mais importado ou referenciado por qualquer página.

---

## Identidade Visual (imutável)

```css
--bg:      #0d0d0d
--surface: #1a1a1a
--border:  #2a2a2a
--accent:  #b8f566
--text:    #e0e0e0

Dados/números : JetBrains Mono
Títulos       : Syne
Gráficos      : Chart.js
```

---

## Decisões arquiteturais (ver DECISIONS.md para detalhes completos)

1. **Supabase como backend completo** — PostgreSQL + Auth + Storage + Realtime. Flask eliminado.
2. **Frontend HTML/CSS/JS puro** — sem React, Vue, Next.js. `style.css` aproveitado 100%.
3. **UUIDs client-side** — `crypto.randomUUID()` sempre no frontend.
4. **Soft delete universal** — `deleted BOOLEAN DEFAULT FALSE` em toda tabela. Nunca DELETE físico.
5. **Service Worker habilitado** — HTTPS disponível com hosting online. SW para offline e cache.
6. **IndexedDB como cache** — não é mais fonte de verdade. SW gerencia.
7. **SM-2 em JavaScript** — sem backend customizado necessário.
8. **Agenda manual** — sem Google Calendar OAuth no MVP.
9. **Storage 100% privado** (DEC-010) — 3 buckets (`shape`, `documentos`, `capas`), sempre via signed URL, nunca URL pública.
10. **Biblioteca é catálogo, não hospedagem de mídia** (DEC-011) — apenas metadados, notas e capas. Nunca arquivos de livros/filmes/músicas.

---

## Estrutura de arquivos

```
sistema-pessoal/
├── frontend/
│   ├── assets/
│   │   ├── style.css           # Adicionado .container e .form-control como alias
│   │   ├── supabase.js         # softDelete retorna {error} (não boolean)
│   │   ├── auth.js             # inalterado
│   │   ├── sm2.js              # inalterado
│   │   ├── db.js                # 🗑️ morto — não é mais usado
│   │   ├── api.js               # 🗑️ morto — não é mais usado
│   │   ├── sync.js              # 🗑️ morto — não é mais usado
│   │   ├── fonts/               # imutável
│   │   └── icons/               # imutável
│   ├── login.html               # inalterado
│   ├── index.html               # ✅ migrado para Supabase + auth.js
│   ├── treino-plano.html        # ✅ migrado para Supabase + auth.js
│   ├── treino-academia.html     # ✅ corrigidos nomes de colunas + navbar
│   ├── manifest.json            # inalterado
│   └── docs/
│       ├── AI_CONTEXT.md        # este arquivo
│       ├── ARCHITECTURE.md
│       ├── ROADMAP.md
│       ├── TASKS.md
│       └── DECISIONS.md
├── backend/                     # 🗑️ morto — não é mais usado
│   ├── app.py
│   ├── database.db
│   └── requirements.txt
└── supabase/
    └── migrations/
        └── 001_schema_inicial.sql   # ✅ executado no Supabase
```

---

## Interface Supabase JS

```javascript
// Importado via CDN em cada página:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// <script src="assets/supabase.js"></script>
// window.sb é o cliente configurado

// CRUD básico
const { data, error } = await window.sb.from('treinos').select('*').eq('deleted', false)
const { data, error } = await window.sb.from('treinos').insert({ uuid, nome, user_id, updated_at: window.now() })
const { data, error } = await window.sb.from('treinos').update({ nome }).eq('uuid', uuid)
await window.softDelete('treinos', uuid)   // helper retorna { error }

// Auth
const session = await window.getSession()
const userId  = await window.getUserId()
const { error } = await window.sb.auth.signInWithPassword({ email, password })
await window.sb.auth.signOut()

// Storage — TODOS os buckets são privados. Nunca usar getPublicUrl.
const path = `${userId}/2024-01-15.jpg`
await window.uploadFile('shape', path, file)
const url = await window.getSignedUrl('shape', path) // expira em 1h
await window.deleteFile('shape', path)

// Realtime (Fase M3)
window.sb.channel('treinos').on('postgres_changes', { event: '*', schema: 'public', table: 'treinos' }, callback).subscribe()
```

---

## Schema PostgreSQL (convenções)

```sql
uuid       TEXT PRIMARY KEY,   -- crypto.randomUUID() no cliente
user_id    UUID NOT NULL REFERENCES auth.users(id),
updated_at TIMESTAMPTZ DEFAULT NOW(),
deleted    BOOLEAN DEFAULT FALSE

ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON <table> FOR ALL USING (auth.uid() = user_id);
```

Tabelas existentes: `treinos`, `exercicios`, `sessoes_treino`, `series_executadas`, `shape`, `cardio`, `agenda`, `revisao_espacada`.

**ATENÇÃO — nomes de colunas no schema SQL (corrigido após auditoria):**
- `exercicios.treino_uuid` (não `treino_id`)
- `sessoes_treino.treino_uuid` e `data_inicio` (não `treino_id` nem `data`)
- `series_executadas.exercicio_uuid`, `sessao_uuid`, `serie_numero`, `carga_real`, `reps_real` (não `exercicio_id`, `sessao_id`, `serie_num`, `peso`, `repeticoes`)

---

## Padrão de página nova

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Título — Sistema Pessoal</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <nav class="nav"><!-- copiar de página existente --></nav>
  <main class="main-content"><!-- conteúdo --></main>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.0/chart.umd.min.js"></script>
  <script src="assets/supabase.js"></script>
  <script src="assets/auth.js"></script>
  <script>
    'use strict';
    document.addEventListener('DOMContentLoaded', async () => {
      const session = await window.authReady;
      if (!session) return;
      await inicializar(session.user.id);
    });
    async function inicializar(userId) { /* lógica da página */ }
  </script>
</body>
</html>
```

---

## Convenções de código

```javascript
uuid: crypto.randomUUID()
updated_at: window.now()
await window.softDelete('treinos', uuid)           // retorna { error }
const { data } = await window.sb.from('treinos')
  .select('*').eq('deleted', false).eq('user_id', userId)
```

---

## Resumo das correções aplicadas nesta tarefa (auditoria M1)

### Problemas encontrados e corrigidos:

| # | Arquivo | Problema | Correção |
|---|---------|----------|----------|
| 1 | `supabase.js` | `softDelete` retornava `boolean` | Agora retorna `{ error }` |
| 2 | `treino-academia.html` | 6 nomes de colunas errados (`treino_id`, `data`, `exercicio_id`, `sessao_id`, `serie_num`, `peso`, `repeticoes`) | Corrigidos para `treino_uuid`, `data_inicio`, `exercicio_uuid`, `sessao_uuid`, `serie_numero`, `carga_real`, `reps_real` |
| 3 | `treino-academia.html` | Referência a `grupo_muscular` (coluna inexistente) | Removido |
| 4 | `treino-academia.html` | Navbar usava classes `.nav-logo`/`.nav-links` (inexistentes no CSS) | Substituída por `.nav-brand`/`.nav-link` padrão |
| 5 | `treino-academia.html` | `window.sbErr` passado como argumento para `toast()` | Substituído por `console.error` |
| 6 | `index.html` | Carregava `db.js`/`api.js`/`sync.js` (inexistentes) + sem auth | Migrado para Supabase + `auth.js` |
| 7 | `treino-plano.html` | Carregava `db.js`/`api.js`/`sync.js` + usava `window.db.*` + sem auth | Migrado para Supabase + `auth.js` |
| 8 | `treino-plano.html` | Inputs usavam classe `.form-control` (inexistente no CSS) | Substituída por `.form-input`/`.form-textarea` |
| 9 | `style.css` | Classes `.container` e `.form-control` faltando | Adicionadas |

### Status dos módulos após correções:

| Módulo | Arquivo(s) | Status |
|---|---|---|
| Schema PostgreSQL | `001_schema_inicial.sql` | ✅ Executado e verificado |
| Storage (buckets) | `shape`, `documentos`, `capas` | ✅ Criados, todos privados |
| Cliente Supabase | `supabase.js` | ✅ Completo |
| Auth | `auth.js` | ✅ Completo |
| SM-2 | `sm2.js` | ✅ Completo |
| Login | `login.html` | ✅ Testado e funcionando |
| Dashboard | `index.html` | ✅ Migrado para Supabase + auth |
| Treino — Plano | `treino-plano.html` | ✅ Migrado para Supabase + auth |
| Treino — Academia | `treino-academia.html` | ✅ Corrigido e migrado |
| Treino — Hub | `treino.html` | 🔄 Pendente |
| Treino — Shape | `treino-shape.html` | 🔄 Pendente (Fase M2) |
| Service Worker | `sw.js` | 🔄 Pendente (Fase M2) |
| Vercel (deploy) | — | 🔄 Pronto para deploy |
| Estudos | múltiplos | ⏳ Fase 3 |
| Biblioteca | `biblioteca.html` | ⏳ Fase 4 |
| Revisão Espaçada (UI) | `revisao.html` | ⏳ Fase 5 |

---

## Notas Operacionais / Bugs Conhecidos

| Situação | Causa | Resolução |
|---|---|---|
| Live Server serve da raiz em vez de `frontend/` | Config padrão da extensão Live Server | `Ctrl+,` → `liveServer.settings.root` = `/frontend`. ✅ Resolvido. |
| `window.softDelete` agora retorna `{ error }` | Retorno foi corrigido na auditoria | ✅ `const { error } = await window.softDelete(...)` funciona |
| `treino-academia.html` importava Chart.js sem usar | Cópia de template | ✅ Removido na correção |
| Arquivos LAN antigos ainda no disco | `db.js`, `api.js`, `sync.js`, `backend/` | 🗑️ Podem ser deletados — nenhuma página os referencia mais |

---

## Regras de geração de código

1. Um arquivo completo por resposta — sem cortes, sem placeholders
2. Aguardar "funcionou" antes do próximo arquivo
3. Avisar se arquivo > 400 linhas antes de gerar
4. Validar lógica internamente antes de entregar
5. Não propor alterações de stack sem nova informação relevante