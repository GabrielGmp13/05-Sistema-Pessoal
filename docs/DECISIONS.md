# DECISIONS.md

Registro de decisões arquiteturais relevantes. Cada decisão inclui contexto, alternativas consideradas e justificativa. Não reabrir sem nova informação relevante.

---

## DEC-001 — Migração de LAN para hospedagem online

**Data:** Fase 2 (pós-análise de migração)  
**Status:** ✅ Aprovada

### Contexto
O sistema foi desenvolvido inicialmente para rodar em LAN doméstica (Flask + SQLite + IndexedDB + sync manual). Após análise, decidiu-se migrar para hospedagem na internet antes de continuar o desenvolvimento dos módulos.

### Decisão
Migrar para Supabase (PostgreSQL + Auth + Storage + Realtime) + Vercel (frontend estático).

### Alternativas consideradas

| Alternativa | Descartada por |
|---|---|
| Manter Flask + hospedar em Railway/Render | Adiciona custo operacional, manutenção de servidor, deployment separado. Flask não adiciona valor quando Supabase cobre tudo. |
| Flask + Neon (PostgreSQL serverless) | Mesma razão acima. |
| Firebase | NoSQL não se adapta ao schema relacional do projeto. Vendor lock-in sem escape (não é open source). |
| Turso (cloud SQLite) | Menos maduro. Menos recursos. Sem benefício sobre PostgreSQL. |
| Manter arquitetura LAN | Não cobre o requisito de acesso multi-dispositivo e multi-local. |

### Justificativa
- PostgreSQL é o padrão de mercado para dados relacionais. Open source. Exportável.
- Supabase fornece auth, storage, realtime e dashboard sem servidor customizado.
- Free tier cobre uso pessoal por anos (500MB banco, 1GB storage).
- HTTPS gratuito habilita Service Worker (impossível na LAN sem configuração complexa).
- Zero manutenção de servidor ao longo dos anos.
- Custo: $0/mês.

### Impacto
- Flask e SQLite são eliminados.
- `api.js`, `sync.js`, `db.js` são eliminados ou reescritos.
- `iniciar.bat` é eliminado.
- `style.css`, fontes, ícones, estrutura HTML das páginas: 100% aproveitados.
- Lógica de negócio das páginas: ~80% aproveitada.

---

## DEC-002 — Eliminar Flask completamente

**Data:** Fase 2 (migração)  
**Status:** ✅ Aprovada

### Decisão
Flask não será migrado para cloud. É eliminado.

### Justificativa
Flask provê: CRUD genérico → Supabase JS client substitui. Sync → Supabase Realtime substitui. SM-2 → 25 linhas de JavaScript, sem servidor necessário.

Manter Flask adicionaria: hospedagem com cold starts (Render free tier: 50s de cold start), manutenção de Python/Flask/dependências por anos, URL de API separada da URL do frontend, surface de falha adicional.

---

## DEC-003 — SM-2 migra para JavaScript no frontend

**Data:** Fase 2 (migração)  
**Status:** ✅ Aprovada

### Decisão
O algoritmo SM-2 (revisão espaçada), que estava em Python no Flask, é reimplementado em JavaScript e roda no frontend.

### Justificativa
SM-2 é matemática pura: ~25 linhas sem dependências. Não requer estado no servidor. O resultado (próxima data de revisão, fator de facilidade) é salvo diretamente no Supabase via JS client. Elimina a necessidade de qualquer backend customizado.

---

## DEC-004 — Service Worker habilitado

**Data:** Fase 2 (migração)  
**Status:** ✅ Aprovada

### Contexto
Na arquitetura LAN original, Service Worker foi excluído porque HTTPS em LAN exigia setup complexo. Com hosting online, HTTPS vem automaticamente.

### Decisão
Implementar Service Worker para:
- Cache de assets estáticos (CSS, JS, fontes, ícones)
- Cache de dados recentes para uso offline
- Fila de escrita offline (sync quando conexão retornar)

### Impacto
Modo Academia (celular na academia sem internet) continua funcionando via cache do SW.

---

## DEC-005 — IndexedDB muda de papel

**Data:** Fase 2 (migração)  
**Status:** ✅ Aprovada

### Decisão
IndexedDB não é mais a fonte de verdade. Passa a ser cache do Service Worker para suporte offline. A fonte de verdade é o PostgreSQL no Supabase.

### Impacto
`db.js` (atual interface com IndexedDB como primário) é eliminado. O SW gerencia IndexedDB internamente como cache.

---

## DEC-006 — Frontend: HTML/CSS/JS puro, sem framework

**Data:** Fase 1 (original)  
**Status:** ✅ Mantida após migração

### Decisão
Manter HTML/CSS/JS puro. Não migrar para React, Vue ou Next.js.

### Justificativa
- `style.css` tem 1105 linhas de componentes prontos — reescrita seria desperdício.
- HTML puro pode ser hospedado em qualquer CDN (Vercel, Cloudflare Pages, etc.) sem build step.
- Supabase JS funciona perfeitamente em HTML puro com `<script>` tag.
- Menor curva de manutenção ao longo dos anos.

---

## DEC-007 — UUIDs gerados no cliente

**Data:** Fase 1 (original)  
**Status:** ✅ Mantida após migração

### Decisão
`crypto.randomUUID()` sempre no frontend. PostgreSQL usa TEXT para uuid (ou UUID type nativo).

### Justificativa
Permite criar registros offline (sem round-trip ao servidor) e fazer upsert determinístico durante sync. PostgreSQL suporta UUID como tipo nativo — pode ser migrado de TEXT para UUID type sem quebrar dados.

---

## DEC-008 — Soft delete universal

**Data:** Fase 1 (original)  
**Status:** ✅ Mantida após migração

### Decisão
Toda tabela tem `deleted BOOLEAN DEFAULT FALSE`. Nunca DELETE físico.

### Justificativa
Permite sync sem perda de informação. Permite auditoria. Em PostgreSQL, `BOOLEAN` substitui `INTEGER DEFAULT 0` do SQLite.

---

## DEC-009 — Agenda manual (sem Google Calendar no MVP)

**Data:** Fase 2  
**Status:** ✅ Aprovada

### Decisão
Google Calendar OAuth não será implementado no MVP. O sistema usa tabela `agenda` com entrada manual.

### Justificativa
OAuth 2.0 com Google exige redirect_uri HTTPS com domínio verificado, múltiplos endpoints, armazenamento seguro de refresh token, e tratamento de expiração. Complexidade desproporcional para uso pessoal onde o usuário pode criar a agenda manualmente em 10 segundos.

### Revisão futura
Pode ser implementado na Fase 4+ com Supabase Edge Functions.
