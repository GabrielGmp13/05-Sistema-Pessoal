# AI_CONTEXT.md

> **Leia este arquivo primeiro.** Tudo que uma IA precisa para continuar o projeto sem reabrir decisões já tomadas.

---

## Projeto

**Sistema Pessoal** — gestão pessoal offline-first em LAN doméstica.  
**Desenvolvedor:** Gabriel, 18 anos, estudante (Pernambuco, BR).  
**Editor:** VS Code · Windows  
**Servidor LAN:** `http://10.0.0.188:5000`  
**Linguagem de comunicação:** Português · tom direto · sem rodeios

---

## Stack (imutável — não propor alterações)

| Camada | Tecnologia | Versão |
|---|---|---|
| Backend | Python | 3.14.3 |
| Web framework | Flask | 3.1.3 |
| CORS | flask-cors | 6.0.5 |
| Banco | SQLite | WAL mode |
| Frontend | HTML/CSS/JS puro | — |
| Persistência offline | IndexedDB | — |
| Gráficos | Chart.js | 4.5.0 (CDN) |
| Fontes | JetBrains Mono + Syne | self-hosted .woff2 |

**Sem:** framework JS · bundler · ORM · npm · TypeScript · Service Worker

---

## Identidade Visual (imutável)

```css
--bg:      #0d0d0d   /* fundo global */
--surface: #1a1a1a   /* cards */
--border:  #2a2a2a   /* bordas */
--accent:  #b8f566   /* destaque */
--text:    #e0e0e0   /* texto */

Dados / números : JetBrains Mono
Títulos         : Syne
Gráficos        : Chart.js
```

---

## Decisões Arquiteturais (bloqueadas)
1. **Offline-first:** celular usa IndexedDB autônomo na academia sem rede. Flask só para sync via WiFi.
2. **Sync bidirecional:** last-write-wins por `updated_at` ISO 8601. `POST /api/sync` implementado e funcional.
3. **IDs client-side:** `crypto.randomUUID()` sempre no frontend. Nunca gerado pelo servidor.
4. **Soft delete universal:** toda tabela tem `deleted INTEGER DEFAULT 0`. Nunca DELETE físico.
5. **Sem Service Worker:** HTTPS em LAN exige setup manual. Cache nativo do browser substitui.
6. **Flask serve estáticos:** `frontend/` é a raiz. Celular acessa `http://10.0.0.188:5000/pagina.html`.
7. **CRUD genérico:** 5 rotas (`/api/<table>`) cobrem todas as 20+ tabelas. Não criar rotas por entidade.
8. **Camadas frontend:**
   - `db.js` → única interface com IndexedDB
   - `api.js` → única interface com Flask (só `sync.js` chama)
   - `sync.js` → orquestra sync e injeta botão "Sincronizar" na `.nav`
   - Páginas HTML → **nunca** chamam `api.js` diretamente

---

## Estrutura de Arquivos

```
sistema-pessoal/
├── backend/
│   ├── app.py                  # 674+ linhas: 20 tabelas, CRUD genérico, sync, SM-2
│   └── requirements.txt        # flask==3.1.3, flask-cors==6.0.5
├── frontend/
│   ├── assets/
│   │   ├── style.css           # 1105+ linhas: componentes completos, mobile-first
│   │   ├── api.js              # wrapper HTTP — só sync.js usa
│   │   ├── db.js               # IndexedDB — window.db exposto globalmente
│   │   ├── sync.js             # sync + botão na nav
│   │   ├── fonts/              # 10 .woff2: JetBrains Mono (5 pesos) + Syne (5 pesos)
│   │   └── icons/              # icon-192.png + icon-512.png
│   ├── index.html              # Dashboard ✅
│   ├── treino-plano.html       # CRUD divisões/exercícios ✅
│   ├── treino-academia.html    # Modo Academia mobile ✅
│   ├── treino.html             # Hub calendário 🔄 pendente
│   ├── treino-shape.html       # Shape + peso 🔄 pendente
│   ├── manifest.json           # PWA
│   └── docs/                   # Esta pasta
└── iniciar.bat                 # Inicia Flask + abre browser
```

---

## Interface window.db

```javascript
await window.db.list(table)                   // → array com TODOS os registros (inclui deleted=1)
await window.db.create(table, record)         // → cria e retorna o registro
await window.db.update(table, uuid, changes)  // → comportamento ASSUMIDO: merge parcial
await window.db.delete(table, uuid)           // → comportamento ASSUMIDO: deleted=1 + updated_at=now
```

> ⚠️ **`window.db.update` não validado em produção.** Sempre passar `updated_at: new Date().toISOString()` explicitamente. Sempre filtrar `!deleted` ao listar — `list()` retorna tudo.

---

## API Flask

```
GET    /api/<table>                       lista (suporta ?campo=valor como filtro)
POST   /api/<table>                       cria (retorna 201 + registro)
GET    /api/<table>/<uuid>                busca um
PUT    /api/<table>/<uuid>                atualiza
DELETE /api/<table>/<uuid>                soft delete
POST   /api/sync                          sync bidirecional
GET    /api/revisao_espacada/hoje         cards SM-2 vencidos
POST   /api/revisao_espacada/<uuid>/avaliar  processa avaliação (body: {qualidade: 0-3})
GET    /api/dashboard                     resumo agregado
```

**Pendente (a implementar no app.py):**
```
POST   /api/upload/shape     upload de foto de shape
```

---

## Padrão de Página Nova

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

  <!-- Chart.js: incluir SOMENTE em páginas com gráficos e SOMENTE uso PC/WiFi -->
  <!-- NUNCA incluir em páginas offline-critical (ex: treino-academia.html) -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.0/chart.umd.min.js"></script>
  <script src="assets/db.js"></script>
  <script src="assets/api.js"></script>
  <script src="assets/sync.js"></script>
  <script>
    'use strict';
    document.addEventListener('DOMContentLoaded', inicializar);
    async function inicializar() { /* lógica da página */ }
  </script>
</body>
</html>
```

**Convenções obrigatórias:**
```javascript
uuid:       crypto.randomUUID()           // sempre client-side
updated_at: new Date().toISOString()      // sempre explícito em create/update
deleted:    0                             // sempre em create

// Soft delete (nunca window.db.delete diretamente para cascade)
await window.db.update(table, uuid, { deleted: 1, updated_at: new Date().toISOString() })

// HTML escape obrigatório em innerHTML (copiar esta função)
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

// parseInt/parseFloat com fallback null (nunca NaN no banco)
const v = parseInt(el.value, 10);
const result = isNaN(v) ? null : v;
```

---

## Como Adicionar Tabela Nova

1. Adicionar em `init_db()` no `app.py` com `uuid, ..., updated_at, deleted`
2. Adicionar store correspondente em `db.js`
3. Endpoint genérico `/api/<table>` já funciona automaticamente
4. `POST /api/sync` já sincroniza se a tabela seguir o padrão

---

## Regras de Geração de Código

1. Um arquivo completo por resposta — sem cortes, sem placeholders
2. Aguardar "funcionou" antes do próximo arquivo
3. Avisar se arquivo > 400 linhas antes de gerar
4. Validar lógica internamente antes de entregar
5. Comunicação em português, direto

---

## Status dos Módulos

| Módulo | Arquivo(s) | Status |
|---|---|---|
| Dashboard | `index.html` | ✅ Completo |
| Treino — Plano | `treino-plano.html` | ✅ Gerado, aguarda teste |
| Treino — Academia | `treino-academia.html` | ✅ Gerado, aguarda teste |
| Treino — Hub | `treino.html` | 🔄 Pendente |
| Treino — Shape | `treino-shape.html` | 🔄 Pendente |
| Backend Fase 2 | `app.py` updates | 🔄 Pendente |
| IndexedDB Fase 2 | `db.js` updates | 🔄 Pendente |
| Estudos | múltiplos | ⏳ Fase 3 |
| Biblioteca | `biblioteca.html` | ⏳ Fase 4 |
| Revisão Espaçada | `revisao.html` | ⏳ Fase 5 |

---

## Bugs Conhecidos e Resoluções

| Problema | Solução |
|---|---|
| Windows `UnicodeEncodeError` (cp1252) | `sys.stdout.reconfigure(encoding='utf-8')` no início do `app.py` |
| `window.db` undefined ao abrir HTML pelo sistema de arquivos | Abrir via `http://10.0.0.188:5000/pagina.html`, não pelo explorador |
| `treino-academia.html` inclui CDN Chart.js sem usar | Remover a tag — página é offline-critical |
