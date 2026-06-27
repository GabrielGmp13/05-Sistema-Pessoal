# AI_CONTEXT.md

> **Leia este arquivo primeiro.** Tudo que uma IA precisa para continuar o projeto sem reabrir decisões já tomadas. Para decisões detalhadas com alternativas consideradas, ver `DECISIONS.md`.

---

## Projeto

**Sistema Pessoal** — gestão pessoal online, multi-dispositivo.
**Desenvolvedor:** Gabriel, 18 anos, estudante (Pernambuco, BR).
**Editor:** VS Code · Windows
**Comunicação:** Português · tom direto · sem rodeios

---

## Stack atual (pós-migração — não propor alterações)

| Camada | Tecnologia | Detalhe |
|---|---|---|
| Banco de dados | PostgreSQL | via Supabase (cloud) |
| Auth | Supabase Auth | JWT, email+senha |
| Storage de arquivos | Supabase Storage | imagens, PDFs |
| Sync / Realtime | Supabase Realtime | Postgres Changes via WebSocket |
| Frontend | HTML/CSS/JS puro | sem framework, sem bundler |
| Offline | Service Worker + IndexedDB | SW gerencia cache; IndexedDB é cache, não primário |
| Gráficos | Chart.js | 4.5.0 via CDN (só em páginas online) |
| Fontes | JetBrains Mono + Syne | self-hosted .woff2 |
| Frontend hosting | Vercel ou Cloudflare Pages | HTTPS automático, CDN global |
| SM-2 (revisão espaçada) | JavaScript puro | ~25 linhas, roda no frontend |

**Eliminados:** Flask · SQLite · `app.py` · `iniciar.bat` · `db.js` · `api.js` · `sync.js` · `requirements.txt`

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

## Decisões arquiteturais (ver DECISIONS.md para detalhes)

1. **Supabase como backend completo** — PostgreSQL + Auth + Storage + Realtime. Flask eliminado.
2. **Frontend HTML/CSS/JS puro** — sem React, Vue, Next.js. `style.css` aproveitado 100%.
3. **UUIDs client-side** — `crypto.randomUUID()` sempre no frontend.
4. **Soft delete universal** — `deleted BOOLEAN DEFAULT FALSE` em toda tabela. Nunca DELETE físico.
5. **Service Worker habilitado** — HTTPS disponível com hosting online. SW para offline e cache.
6. **IndexedDB como cache** — não é mais fonte de verdade. SW gerencia.
7. **SM-2 em JavaScript** — sem backend customizado necessário.
8. **Agenda manual** — sem Google Calendar OAuth no MVP.

---

## Estrutura de arquivos (estado pós-migração)

```
sistema-pessoal/
├── frontend/
│   ├── assets/
│   │   ├── style.css           # 1105+ linhas — IMUTÁVEL, zero mudança na migração
│   │   ├── supabase.js         # NEW: cliente Supabase + helpers globais
│   │   ├── auth.js             # NEW: verificação de sessão, redirect para login
│   │   ├── sm2.js              # NEW: algoritmo SM-2 em JavaScript puro
│   │   ├── fonts/              # 10 .woff2 — imutável
│   │   └── icons/              # icon-192.png + icon-512.png
│   ├── sw.js                   # NEW: Service Worker (cache + offline queue)
│   ├── login.html              # NEW: tela de autenticação
│   ├── index.html              # atualizado: usa Supabase JS
│   ├── treino-plano.html       # atualizado: usa Supabase JS
│   ├── treino-academia.html    # atualizado: usa Supabase JS + SW cache
│   ├── treino.html             # pendente
│   ├── treino-shape.html       # pendente
│   ├── manifest.json           # atualizado: registro do SW
│   └── docs/
│       ├── AI_CONTEXT.md       # este arquivo
│       ├── ARCHITECTURE.md
│       ├── ROADMAP.md
│       ├── FEATURES.md
│       ├── TASKS.md
│       └── DECISIONS.md
└── supabase/
    └── migrations/
        └── 001_schema_inicial.sql   # schema PostgreSQL completo
```

---

## Interface Supabase JS (substitui window.db)

```javascript
// Importado via CDN em cada página:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// <script src="assets/supabase.js"></script>
// window.sb é o cliente configurado

// CRUD básico
const { data, error } = await window.sb.from('treinos').select('*').eq('deleted', false)
const { data, error } = await window.sb.from('treinos').insert({ uuid, nome, user_id, ... })
const { data, error } = await window.sb.from('treinos').update({ nome }).eq('uuid', uuid)
const { data, error } = await window.sb.from('treinos').update({ deleted: true }).eq('uuid', uuid)

// Auth
const { data: { session } } = await window.sb.auth.getSession()
const { error } = await window.sb.auth.signInWithPassword({ email, password })
await window.sb.auth.signOut()

// Storage
const { data, error } = await window.sb.storage.from('shape-photos').upload(path, file)
const { data } = window.sb.storage.from('shape-photos').getPublicUrl(path)

// Realtime
window.sb.channel('treinos').on('postgres_changes', { event: '*', schema: 'public', table: 'treinos' }, callback).subscribe()
```

---

## Schema PostgreSQL (convenções)

```sql
-- Todo registro tem obrigatoriamente:
uuid       TEXT PRIMARY KEY,   -- gerado no cliente com crypto.randomUUID()
user_id    UUID NOT NULL REFERENCES auth.users(id),
updated_at TIMESTAMPTZ DEFAULT NOW(),
deleted    BOOLEAN DEFAULT FALSE

-- RLS obrigatório em toda tabela:
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON <table> FOR ALL USING (auth.uid() = user_id);
```

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
  <main class="container"><!-- conteúdo --></main>

  <!-- Supabase JS (CDN — ok em páginas online) -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <!-- Chart.js SOMENTE em páginas com gráficos -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.0/chart.umd.min.js"></script>
  <script src="assets/supabase.js"></script>  <!-- window.sb configurado aqui -->
  <script src="assets/auth.js"></script>       <!-- redireciona para login se sem sessão -->
  <script>
    'use strict';
    document.addEventListener('DOMContentLoaded', inicializar);
    async function inicializar() {
      // auth.js já verificou sessão antes de chegar aqui
    }
  </script>
</body>
</html>
```

---

## Convenções de código

```javascript
// IDs: sempre client-side
uuid: crypto.randomUUID()

// user_id: sempre da sessão
const { data: { session } } = await window.sb.auth.getSession()
user_id: session.user.id

// Soft delete
await window.sb.from('treinos').update({ deleted: true, updated_at: new Date().toISOString() }).eq('uuid', uuid)

// Listar (sempre filtrar deleted)
const { data } = await window.sb.from('treinos').select('*').eq('deleted', false).eq('user_id', userId)

// HTML escape (obrigatório em innerHTML)
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

// Inputs numéricos
function intOrNull(id) {
  const v = parseInt(document.getElementById(id).value, 10);
  return isNaN(v) ? null : v;
}
```

---

## Status dos módulos

| Módulo | Arquivo(s) | Status |
|---|---|---|
| Dashboard | `index.html` | ✅ Completo (precisa adaptar para Supabase JS) |
| Treino — Plano | `treino-plano.html` | ✅ Gerado (precisa adaptar para Supabase JS) |
| Treino — Academia | `treino-academia.html` | ✅ Gerado (precisa adaptar para Supabase JS) |
| Treino — Hub | `treino.html` | 🔄 Pendente |
| Treino — Shape | `treino-shape.html` | 🔄 Pendente |
| Auth | `login.html` + `auth.js` | 🔄 Pendente (Fase M1) |
| Supabase client | `supabase.js` | 🔄 Pendente (Fase M1) |
| SM-2 | `sm2.js` | 🔄 Pendente (Fase M1) |
| Service Worker | `sw.js` | 🔄 Pendente (Fase M2) |
| Estudos | múltiplos | ⏳ Fase 3 |
| Biblioteca | `biblioteca.html` | ⏳ Fase 4 |
| Revisão Espaçada | `revisao.html` | ⏳ Fase 5 |

---

## Regras de geração de código

1. Um arquivo completo por resposta — sem cortes, sem placeholders
2. Aguardar "funcionou" antes do próximo arquivo
3. Avisar se arquivo > 400 linhas antes de gerar
4. Validar lógica internamente antes de entregar
5. Não propor alterações de stack sem nova informação relevante
