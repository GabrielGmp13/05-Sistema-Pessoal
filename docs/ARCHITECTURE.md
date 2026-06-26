# ARCHITECTURE.md

## Diagrama do Sistema

```
┌─────────────────────────────┐     ┌───────────────────────────────────┐
│     Celular (academia)      │     │           PC (casa)               │
│                             │     │                                   │
│  HTML/CSS/JS (cacheado)     │     │  HTML/CSS/JS (servido pelo Flask) │
│  IndexedDB (autônomo)       │◄────►│  Flask + SQLite                  │
│  Offline-first              │ WiFi │  Fonte de verdade                 │
└─────────────────────────────┘     └───────────────────────────────────┘
          POST /api/sync (last-write-wins por updated_at)
```

O celular carrega o frontend **uma vez** via WiFi. O browser cacheia. Na academia opera 100% offline com IndexedDB. Ao retornar para WiFi, `sync.js` sincroniza automaticamente.

---

## Backend (app.py)

### Estrutura geral

```python
import sys
sys.stdout.reconfigure(encoding='utf-8')  # fix Windows cp1252

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3, uuid, json
from datetime import datetime

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

DB_PATH = 'dados.db'

def init_db():
    # Cria todas as tabelas com IF NOT EXISTS
    # WAL mode: PRAGMA journal_mode=WAL
    pass

# ── Rotas genéricas (cobrem todas as tabelas) ──
@app.route('/api/<table>', methods=['GET'])        # lista
@app.route('/api/<table>', methods=['POST'])       # cria
@app.route('/api/<table>/<uuid>', methods=['GET']) # busca um
@app.route('/api/<table>/<uuid>', methods=['PUT']) # atualiza
@app.route('/api/<table>/<uuid>', methods=['DELETE']) # soft delete

# ── Rotas especiais ──
@app.route('/api/sync', methods=['POST'])          # sync bidirecional
@app.route('/api/revisao_espacada/hoje')           # SM-2: cards vencidos
@app.route('/api/revisao_espacada/<uuid>/avaliar', methods=['POST'])  # SM-2: avalia
@app.route('/api/dashboard')                       # resumo agregado
```

### Algoritmo SM-2

Implementado em `app.py`. Campos nos registros de revisão:
- `easiness_factor` (float, começa em 2.5)
- `repetition_count` (int)
- `next_review_date` (ISO date)

Avaliação recebe `qualidade` (0–3). Qualidade < 2 reinicia a contagem.

---

## Banco de Dados

### Convenção universal

Todo registro em qualquer tabela tem obrigatoriamente:
```sql
uuid       TEXT PRIMARY KEY,   -- gerado no cliente com crypto.randomUUID()
updated_at TEXT NOT NULL,      -- ISO 8601: '2024-01-15T14:30:00.000Z'
deleted    INTEGER DEFAULT 0   -- 0 = ativo, 1 = soft deleted
```

**Nunca usar DELETE físico.** Sempre soft delete.

### Schema: tabelas documentadas

```sql
-- ── Treino ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS treinos (
  uuid        TEXT PRIMARY KEY,
  nome        TEXT NOT NULL,
  descricao   TEXT,
  updated_at  TEXT NOT NULL,
  deleted     INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS exercicios (
  uuid               TEXT PRIMARY KEY,
  treino_uuid        TEXT NOT NULL,
  nome               TEXT NOT NULL,
  series_alvo        INTEGER,
  reps_alvo          INTEGER,
  carga_alvo         REAL,
  descanso_segundos  INTEGER,
  ordem              INTEGER,
  updated_at         TEXT NOT NULL,
  deleted            INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessoes_treino (
  uuid        TEXT PRIMARY KEY,
  treino_uuid TEXT NOT NULL,
  data_inicio TEXT NOT NULL,   -- ISO 8601
  data_fim    TEXT,            -- NULL enquanto sessão em andamento
  observacoes TEXT,
  updated_at  TEXT NOT NULL,
  deleted     INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS series_executadas (
  uuid            TEXT PRIMARY KEY,
  sessao_uuid     TEXT NOT NULL,
  exercicio_uuid  TEXT NOT NULL,
  serie_numero    INTEGER,
  carga_real      REAL,
  reps_real       INTEGER,
  concluida       INTEGER DEFAULT 0,
  data_hora       TEXT,
  updated_at      TEXT NOT NULL,
  deleted         INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shape (
  uuid        TEXT PRIMARY KEY,
  data        TEXT NOT NULL,   -- YYYY-MM-DD
  peso        REAL,
  foto_path   TEXT,            -- caminho local do arquivo (MVP: texto livre)
  observacoes TEXT,
  updated_at  TEXT NOT NULL,
  deleted     INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cardio (
  uuid             TEXT PRIMARY KEY,
  data             TEXT NOT NULL,
  tipo             TEXT,        -- corrida, bike, natação, etc.
  duracao_minutos  INTEGER,
  distancia_km     REAL,
  observacoes      TEXT,
  updated_at       TEXT NOT NULL,
  deleted          INTEGER DEFAULT 0
);

-- ── Agenda (a criar no app.py — Fase 2) ────────────────────────

CREATE TABLE IF NOT EXISTS agenda (
  uuid             TEXT PRIMARY KEY,
  data             TEXT NOT NULL,    -- YYYY-MM-DD
  treino_uuid      TEXT,             -- NULL se dia sem treino ou não atribuído
  google_event_id  TEXT,             -- NULL no MVP (deferido)
  titulo           TEXT,
  updated_at       TEXT NOT NULL,
  deleted          INTEGER DEFAULT 0
);

-- ── Demais 13 tabelas ───────────────────────────────────────────
-- Pendente de documentação (estudos, biblioteca, revisão, etc.)
-- Schemas existem no app.py mas não foram documentados aqui ainda.
```

---

## Frontend

### Hierarquia de camadas

```
Página HTML
    │ usa exclusivamente
    ▼
window.db (db.js)          ← IndexedDB abstraction
    │ sincronizado por
    ▼
window.sync (sync.js)
    │ usa exclusivamente
    ▼
window.api (api.js)        ← HTTP abstraction
    │ chama
    ▼
Flask /api/*               ← REST endpoints
    │ persiste em
    ▼
SQLite (WAL mode)
```

**Regra cardinal:** páginas HTML **nunca** importam ou chamam `api.js`. Toda comunicação com Flask passa exclusivamente por `sync.js`.

### Sub-navegação de módulo

Páginas do módulo Treino usam uma sub-nav padrão:

```html
<nav class="sub-nav">
  <a class="sub-nav-link [active]" href="treino.html">Calendário</a>
  <a class="sub-nav-link [active]" href="treino-plano.html">Plano de Treino</a>
  <a class="sub-nav-link [active]" href="treino-academia.html">Modo Academia</a>
  <a class="sub-nav-link [active]" href="treino-shape.html">Shape</a>
</nav>
```

### Classes CSS principais (style.css)

```
Layout:     .container  .nav  .nav-link  .nav-brand  .nav-link.active
Cards:      .card
Botões:     .btn  .btn-primary  .btn-secondary
Formulário: .form-control  .label  .form-group
Tabela:     .table
```

---

## Sincronização

### Fluxo completo

```
1. Usuário clica "Sincronizar" (botão injetado por sync.js)
2. Para cada tabela:
   a. GET /api/<table> → registros do servidor
   b. window.db.list(table) → registros locais
   c. Merge por uuid:
      - updated_at servidor > local → atualizar IndexedDB
      - updated_at local > servidor → PUT /api/<table>/<uuid>
      - Existe no local, não no servidor → POST /api/<table>
      - deleted=1 no local → DELETE /api/<table>/<uuid>
3. Conflito → last-write-wins (maior updated_at prevalece)
```

### Garantias do padrão

- Toda operação de escrita inclui `updated_at: new Date().toISOString()`
- Soft deletes são sincronizados (o registro vai para o servidor com `deleted=1`)
- UUIDs client-side eliminam conflitos de chave primária

---

## Dependências Externas

| Dependência | Tipo | Necessária offline? | Onde |
|---|---|---|---|
| Chart.js 4.5.0 | CDN JS | **Não** — apenas páginas PC/WiFi | `<script>` em páginas com gráficos |
| JetBrains Mono | self-hosted .woff2 | **Sim** | `frontend/assets/fonts/` |
| Syne | self-hosted .woff2 | **Sim** | `frontend/assets/fonts/` |
| Google Calendar API | OAuth REST | Não | Deferido para Fase 4+ |
| TMDB API | REST + API key | Não | Deferido para Fase 4 |
| Google Books API | REST + API key | Não | Deferido para Fase 4 |

> ⚠️ **Regra:** nunca adicionar dependência CDN em páginas que o celular usa offline (`treino-academia.html` é o caso principal). Chart.js em CDN já foi incluído incorretamente nessa página — deve ser removido.

---

## Convenções de Código

```javascript
// ── IDs ──────────────────────────────────────────────────────────
uuid: crypto.randomUUID()                    // sempre no cliente

// ── Timestamps ───────────────────────────────────────────────────
updated_at: new Date().toISOString()         // sempre explícito

// ── Soft delete (preferir sobre window.db.delete) ────────────────
await window.db.update(table, uuid, {
  deleted: 1,
  updated_at: new Date().toISOString()
});

// ── Parsing de inputs numéricos ──────────────────────────────────
function intOrNull(id) {
  const v = parseInt(document.getElementById(id).value, 10);
  return isNaN(v) ? null : v;
}
function floatOrNull(id) {
  const v = parseFloat(document.getElementById(id).value);
  return isNaN(v) ? null : v;
}

// ── HTML escape (obrigatório em innerHTML) ────────────────────────
function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

// ── Filtrar deletados (list() retorna tudo) ───────────────────────
const ativos = (await window.db.list('treinos')).filter(t => !t.deleted);

// ── Inicialização de página ───────────────────────────────────────
'use strict';
document.addEventListener('DOMContentLoaded', inicializar);
async function inicializar() { /* ... */ }
```

---

## Performance

| Situação | Impacto | Mitigação atual |
|---|---|---|
| `window.db.list('series_executadas')` em usuário com histórico longo | Lento (scan completo) | Cache em memória (`maxCargas`) carregado uma vez por sessão |
| Múltiplas chamadas `window.db.update` em cascade delete | N writes sequenciais | Aceitável para volumes pequenos |
| Chart.js CDN em WiFi fraca | Timeout de carregamento | Usar apenas em páginas PC; nunca em `treino-academia.html` |

**Otimizações futuras (backlog):**
- Índice SQLite em `series_executadas.exercicio_uuid`
- `window.db.list` com filtro nativo (evitar scan completo + filtro JS)
- Cache de max cargas persistente em IndexedDB (evitar recalcular a cada sessão)
