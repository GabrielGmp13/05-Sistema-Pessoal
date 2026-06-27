# TASKS.md

## Status geral

**Fase atual:** M (Migração para Supabase)
**Bloqueio:** nenhum. Pode-se começar a Fase M0 imediatamente.
**Próxima ação:** criar projeto no Supabase e executar o schema SQL.

---

## Fase M0 — Infraestrutura (sem código ainda)

### Supabase
- [ ] Criar conta em supabase.com
- [ ] Criar projeto (nome: `sistema-pessoal`, região: South America — São Paulo)
- [ ] Anotar `Project URL` e `anon public key` (Settings → API)
- [ ] Executar `supabase/migrations/001_schema_inicial.sql` no SQL Editor do Supabase
- [ ] Criar Storage bucket `shape-photos` (público)
- [ ] Criar Storage bucket `documentos` (privado)
- [ ] Criar primeiro usuário via Authentication → Users → Invite user

### Vercel
- [ ] Criar conta em vercel.com
- [ ] Conectar repositório GitHub (criar repo se não existir)
- [ ] Configurar root directory: `frontend/`
- [ ] Fazer deploy

### Arquivo de schema SQL a criar
Localização: `supabase/migrations/001_schema_inicial.sql`

Deve incluir:
- Todas as tabelas com `user_id`, `updated_at TIMESTAMPTZ`, `deleted BOOLEAN`
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` em todas
- `CREATE POLICY "user_own_data"` em todas
- Índices: `CREATE INDEX ON series_executadas(exercicio_uuid)` e `CREATE INDEX ON agenda(data)`

---

## Fase M1 — Auth + Core JS (primeiro código)

### Novos arquivos a criar

**`frontend/assets/supabase.js`**
- Inicializar `supabase.createClient(URL, KEY)`
- Exportar como `window.sb`
- Helper `window.getUserId()` → retorna `session.user.id`
- Helper `window.now()` → retorna `new Date().toISOString()`

**`frontend/assets/auth.js`**
- Verificar `window.sb.auth.getSession()` ao carregar
- Se sem sessão: `window.location.href = '/login.html'`
- Exportar `window.currentUser` com dados da sessão

**`frontend/assets/sm2.js`**
- Função `calcularSM2(ef, repeticoes, intervalo, qualidade)` → retorna novos valores
- Exportar como `window.calcularSM2`

**`frontend/login.html`**
- Campo email + campo senha
- Botão entrar (chama `window.sb.auth.signInWithPassword`)
- Feedback de erro
- Sem nav, sem sub-nav (é a tela pública)

### Arquivos a adaptar

**`frontend/index.html`**
- Substituir chamadas `window.db.list(...)` por `window.sb.from(...).select(...)`
- Adicionar `<script src="assets/supabase.js">` e `<script src="assets/auth.js">`
- Remover `<script src="assets/db.js">`, `api.js`, `sync.js`
- Botão "Sincronizar" removido da nav (Realtime substitui)

**`frontend/treino-plano.html`**
- Mesma adaptação de chamadas de dados
- CRUD: insert, update (soft delete) via Supabase JS
- Reordenação: update `{ ordem }` via Supabase JS

**`frontend/treino-academia.html`**
- Mesma adaptação
- Sessão salva incrementalmente via Supabase (network-first)
- Offline: escrita enfileirada no IndexedDB (SW processa depois)

### Arquivos a eliminar
- `frontend/assets/db.js` → deletar
- `frontend/assets/api.js` → deletar
- `frontend/assets/sync.js` → deletar
- `backend/` → deletar pasta inteira
- `iniciar.bat` → deletar

---

## Fase M2 — Service Worker + Storage

**`frontend/sw.js`**
- Cache First: CSS, fontes, ícones, Supabase JS, Chart.js
- Network First com fallback: dados da API Supabase
- Fila de escrita offline (IndexedDB) para `treino-academia.html`
- Background sync ao reconectar

**`frontend/manifest.json`**
- Adicionar `"service_worker": { "src": "/sw.js" }`
- Atualizar `"start_url"` para URL do Vercel

**Upload de arquivos**
- `treino-shape.html` → upload via `window.sb.storage.from('shape-photos').upload(...)`
- Salvar path retornado em `shape.foto_path`
- Exibir via `getPublicUrl(path)`

---

## Fase M3 — Realtime

**Em `treino-plano.html`**
```javascript
window.sb.channel('treinos').on('postgres_changes', {
  event: '*', schema: 'public', table: 'treinos'
}, () => renderTreinos()).subscribe()
```

**Em `treino-academia.html`**
- Não é prioridade para esta página (uso offline, single-device)
- Adicionar apenas na tela de seleção de treino

---

## Fase 2 — Continua após Fase M

| # | Arquivo | Dependências | Status |
|---|---|---|---|
| 1 | `treino.html` | Fase M completa + schema `agenda` | ⏳ |
| 2 | `treino-shape.html` | Fase M2 (Storage) | ⏳ |

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

## Bugs conhecidos (da fase LAN — verificar se persistem)

| Bug | Severidade | Ação |
|---|---|---|
| `window.db.update` comportamento incerto | 🔴 Irrelevante após migração | `db.js` será eliminado |
| `treino-academia.html` importa Chart.js CDN sem usar | 🟡 Fix ao adaptar para Supabase | Remover a tag na adaptação |
| `treino-academia.html` não testado no celular | 🔴 Alta | Testar após Fase M2 (com SW) |

---

## Checklist de conclusão da Fase M

```
[ ] URL pública acessível com HTTPS
[ ] Login funciona
[ ] index.html carrega dados do Supabase
[ ] treino-plano.html: criar divisão e exercício funcionam
[ ] treino-academia.html: funciona offline (Service Worker ativo)
[ ] Mudança no PC aparece no celular automaticamente (Realtime)
[ ] Upload de foto funciona no treino-shape.html
[ ] sm2.js: calcularSM2 retorna valores corretos para qualidade 0, 1, 2, 3
```
