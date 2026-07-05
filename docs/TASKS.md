# TASKS.md

## Status geral

**Fase atual:** M1 (Auth + Core JS) — todos os arquivos gerados, pendente testes
**Bloqueio:** nenhum.
**Próxima ação:** testar `treino-plano.html` e `treino-academia.html` com dados reais. Após confirmação: executar limpeza (remover arquivos LAN) e fazer deploy no Vercel.

---

## Fase M0 — Infraestrutura ✅ Supabase completo · 🔄 Vercel deferido

### Supabase
- [x] Criar conta em supabase.com
- [x] Criar projeto
- [x] Anotar `Project URL` e `anon public key`
- [x] Executar `supabase/migrations/001_schema_inicial.sql` no SQL Editor — **executado e verificado pelo usuário**
- [x] Buckets criados via SQL: `shape`, `documentos`, `capas` — **todos privados** (revisão de escopo, DEC-010 — substitui o plano original de `shape-photos` público)
- [x] Criar primeiro usuário (criado direto via email+senha; login testado e funcionando)

### GitHub
- [x] Repositório criado como privado
- [x] Projeto enviado (push feito)

### Vercel — deferido intencionalmente
- [ ] Criar conta em vercel.com
- [ ] Conectar repositório GitHub
- [ ] Configurar root directory: `frontend/`
- [ ] Fazer deploy

> Decisão do usuário: só fazer o deploy no Vercel depois que o núcleo da migração (M1) estiver validado localmente via Live Server. Não é um item esquecido — é sequenciamento deliberado.

---

## Fase M1 — Auth + Core JS 🔄 Em andamento

### Arquivos criados

- [x] **`frontend/assets/supabase.js`** — cliente Supabase + helpers (`getSession`, `getUserId`, `now`, `getSignedUrl`, `uploadFile`, `deleteFile`, `softDelete`, `sbErr`)
- [x] **`frontend/assets/auth.js`** — `window.authReady` (promise), redirect automático para `login.html`, expõe `window.currentUser`
- [x] **`frontend/assets/sm2.js`** — `calcularSM2()` (função pura) + `avaliarCard()` (integrado ao Supabase)
- [x] **`frontend/login.html`** — testado com conta real criada no Supabase. Login bem-sucedido.
- [x] **`frontend/index.html`** — dashboard com 4 cards (treinos na semana, revisões pendentes, peso atual, streak) + gráfico semanal de séries + botão de logout. **Gerado — pendente teste/confirmação do usuário.**

### Pendente

- [ ] **Testar `index.html`** end-to-end: login → redirect → dashboard carrega dados reais do Supabase
- [x] **`frontend/treino-plano.html`** — Supabase JS. CRUD de divisões e exercícios com reordenação por `ordem`. ✅ Gerado — aguardando teste/confirmação.
- [x] **`frontend/treino-academia.html`** — Supabase JS. Sessão salva incrementalmente, timer de descanso (90s), detecção de PR, sem Chart.js. ✅ Gerado — aguardando teste/confirmação.
  - ⚠️ Verificar: `window.softDelete` em `removerSerie` usa desestruturação `{error}` — checar se o helper retorna esse formato (ver `AI_CONTEXT.md` → Notas Operacionais)
  - Offline: sem fila de escrita por enquanto (Fase M2 com Service Worker)

### Limpeza — fazer só depois dos dois itens acima confirmados
- [ ] Deletar `frontend/assets/db.js`
- [ ] Deletar `frontend/assets/api.js`
- [ ] Deletar `frontend/assets/sync.js`
- [ ] Deletar pasta `backend/` inteira
- [ ] Deletar `iniciar.bat`

---

## Fase M2 — Service Worker + Storage 🔄 Pendente

**`frontend/sw.js`**
- Cache First: CSS, fontes, ícones, Supabase JS, Chart.js
- Network First com fallback: dados da API Supabase
- Fila de escrita offline (IndexedDB) para `treino-academia.html`
- Background sync ao reconectar

**`frontend/manifest.json`**
- Adicionar registro do Service Worker
- Atualizar `start_url` quando o Vercel estiver no ar

**Upload de arquivos**
- Bucket `shape` já existe — falta a UI de upload em `treino-shape.html`
- Fluxo: `window.uploadFile('shape', path, file)` → salvar `path` em `shape.foto_path` → exibir via `window.getSignedUrl('shape', path)`

---

## Fase M3 — Realtime 🔄 Pendente

**Em `treino-plano.html`**
```javascript
window.sb.channel('treinos').on('postgres_changes', {
  event: '*', schema: 'public', table: 'treinos'
}, () => renderTreinos()).subscribe()
```

**Em `treino-academia.html`**
- Não é prioridade (uso offline, single-device durante o treino)

---

## Fase 2 — Continua após Fase M

| # | Arquivo | Dependências | Status da dependência |
|---|---|---|---|
| 1 | `treino.html` | M1 completo | Tabela `agenda` já existe (não é mais bloqueio) |
| 2 | `treino-shape.html` | M2 (UI de upload) | Bucket `shape` já existe (não é mais bloqueio); falta só a página |

---

## Backlog (pós-MVP)

- [ ] Notificações push (Service Worker Push API) — lembrete de treino
- [ ] Exportação de dados CSV/JSON via Supabase
- [ ] Google Calendar OAuth via Supabase Edge Function
- [ ] Gráfico de evolução de carga por exercício
- [ ] Volume semanal por grupo muscular
- [ ] Dashboard analytics avançado
- [ ] Modo múltiplos usuários (RLS já suporta, basta criar contas)

---

## Bugs conhecidos

| Bug | Severidade | Status |
|---|---|---|
| Live Server serve da raiz em vez de `frontend/` (causava "Cannot GET /index.html") | 🔴 Alta | ✅ Resolvido — `liveServer.settings.root` = `/frontend` |
| `treino-academia.html` importa Chart.js CDN sem usar | 🟡 Média | 🔄 Corrigir durante adaptação para Supabase |
| `treino-academia.html` não testado em celular real | 🔴 Alta | 🔄 Testar depois da adaptação + Fase M2 |
| `window.db.update` tinha comportamento de merge não confirmado | — | Irrelevante — `db.js` será removido |

---

## Checklist de conclusão da Fase M

```
[ ] URL pública acessível com HTTPS (Vercel)
[x] Login funciona
[x] index.html: testado e confirmado pelo usuário
[ ] treino-plano.html: testado e confirmado pelo usuário
[ ] treino-academia.html (Supabase): testado e confirmado pelo usuário
[ ] treino-academia.html (offline): funciona com Service Worker ativo — Fase M2
[ ] Mudança no PC aparece no celular automaticamente (Realtime) — Fase M3
[ ] Upload de foto funciona no treino-shape.html — Fase M2
[x] sm2.js: calcularSM2 implementado e integrado via avaliarCard
```
