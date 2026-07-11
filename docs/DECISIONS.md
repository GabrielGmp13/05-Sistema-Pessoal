# DECISIONS.md

Registro de decisões arquiteturais relevantes. Cada decisão inclui contexto, alternativas consideradas e justificativa. Não reabrir sem nova informação relevante.

---

## DEC-001 — Migração de LAN para hospedagem online

**Data:** Fase 2 (pós-análise de migração)
**Status:** ✅ Aprovada · ✅ Executada (schema no ar, Vercel pendente)

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
Flask provê: CRUD genérico → Supabase JS client substitui. Sync → Supabase Realtime substitui. SM-2 → JavaScript no frontend, sem servidor necessário.

Manter Flask adicionaria: hospedagem com cold starts (Render free tier: 50s de cold start), manutenção de Python/Flask/dependências por anos, URL de API separada da URL do frontend, surface de falha adicional.

---

## DEC-003 — SM-2 migra para JavaScript no frontend

**Data:** Fase 2 (migração)
**Status:** ✅ Aprovada · ✅ Implementada (`sm2.js`)

### Decisão
O algoritmo SM-2 (revisão espaçada), que estava em Python no Flask, é reimplementado em JavaScript e roda no frontend.

### Justificativa
SM-2 é matemática pura: poucas linhas, sem dependências. Não requer estado no servidor. O resultado (próxima data de revisão, fator de facilidade) é salvo diretamente no Supabase via JS client. Elimina a necessidade de qualquer backend customizado.

---

## DEC-004 — Service Worker habilitado

**Data:** Fase 2 (migração)
**Status:** ✅ Aprovada · 🔄 Não implementada ainda (Fase M2)

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
- `style.css` tem mais de 1100 linhas de componentes prontos — reescrita seria desperdício.
- HTML puro pode ser hospedado em qualquer CDN (Vercel, Cloudflare Pages, etc.) sem build step.
- Supabase JS funciona perfeitamente em HTML puro com `<script>` tag.
- Menor curva de manutenção ao longo dos anos.

---

## DEC-007 — UUIDs gerados no cliente

**Data:** Fase 1 (original)
**Status:** ✅ Mantida após migração

### Decisão
`crypto.randomUUID()` sempre no frontend. PostgreSQL usa TEXT para uuid.

### Justificativa
Permite criar registros offline (sem round-trip ao servidor) e fazer upsert determinístico durante sync. PostgreSQL suporta UUID como tipo nativo — pode ser migrado de TEXT para UUID type sem quebrar dados, se necessário no futuro.

---

## DEC-008 — Soft delete universal

**Data:** Fase 1 (original)
**Status:** ✅ Mantida após migração · ✅ Implementada no schema

### Decisão
Toda tabela tem `deleted BOOLEAN DEFAULT FALSE`. Nunca DELETE físico.

### Justificativa
Permite sync sem perda de informação. Permite auditoria. Em PostgreSQL, `BOOLEAN` substitui `INTEGER DEFAULT 0` do SQLite.

---

## DEC-009 — Agenda manual (sem Google Calendar no MVP)

**Data:** Fase 2
**Status:** ✅ Aprovada · ✅ Tabela `agenda` já existe no schema

### Decisão
Google Calendar OAuth não será implementado no MVP. O sistema usa tabela `agenda` com entrada manual.

### Justificativa
OAuth 2.0 com Google exige redirect_uri HTTPS com domínio verificado, múltiplos endpoints, armazenamento seguro de refresh token, e tratamento de expiração. Complexidade desproporcional para uso pessoal onde o usuário pode criar a agenda manualmente em segundos.

### Revisão futura
Pode ser implementado em fase futura via Supabase Edge Functions.

---

## DEC-010 — Storage: 3 buckets privados, sem buckets públicos

**Data:** Fase M0 (revisão de escopo, consulta externa)
**Status:** ✅ Aprovada · ✅ Executada (`001_schema_inicial.sql`)

### Contexto
O plano original (ver versões anteriores deste documento e de ARCHITECTURE.md) previa um bucket de fotos público (`shape-photos`) por simplicidade de servir imagens via `getPublicUrl`. Revisão de escopo apontou que fotos pessoais e documentos não deveriam ser publicamente acessíveis mesmo sem divulgação da URL — segurança por padrão, não por obscuridade.

### Decisão
3 buckets, todos **privados**:

| Bucket | Conteúdo | Limite | Tipos aceitos |
|---|---|---|---|
| `shape` | Fotos de shape | 10MB | JPEG, PNG, WebP |
| `documentos` | PDFs de provas, apostilas, documentos pessoais | 50MB | PDF |
| `capas` | Capas de obras da Biblioteca sem cobertura de API | 2MB | JPEG, PNG, WebP |

Acesso exclusivamente via **signed URL** (expira em 1h por padrão), nunca via URL pública. Path de todo arquivo segue a convenção `{user_id}/nome-do-arquivo.ext`, e as Storage Policies usam `(storage.foldername(name))[1] = auth.uid()::text` para isolar o acesso por usuário.

### Alternativas consideradas

| Alternativa | Descartada por |
|---|---|
| Bucket de shape público | Mais simples de servir, mas expõe fotos pessoais via URL — mesmo que não divulgada, é acessível por qualquer um que descubra o link. |
| Bucket único para todos os tipos de arquivo | Mistura políticas de tamanho e mime-type, dificulta auditoria e manutenção. 3 buckets especializados são mais simples de raciocinar sobre. |

### Justificativa
Signed URL com expiração de 1h é suficiente para o uso real (exibir imagem/PDF na página) sem necessidade de link compartilhável permanente. Custo de complexidade adicional (gerar signed URL a cada exibição) é mínimo comparado ao ganho de segurança.

### Impacto
`supabase.js` usa `getSignedUrl()` em vez de `getPublicUrl()`. Toda página que exibe imagem ou PDF do Storage precisa chamar essa função antes de renderizar.

---

## DEC-011 — Biblioteca: catálogo de metadados, sem armazenamento de mídia

**Data:** Fase M0 (revisão de escopo, consulta externa)
**Status:** ✅ Aprovada (implementação ainda não iniciada — Fase 4)

### Contexto
O planejamento inicial do módulo Biblioteca (Fase 4) não definia limites claros sobre o que seria armazenado. Risco real: o módulo crescer para se tornar um hospedeiro de arquivos de mídia (livros, filmes, músicas), o que é desproporcional ao objetivo do sistema e traz problemas de custo de storage e ambiguidade de direitos autorais.

### Decisão
A Biblioteca funciona como **catálogo pessoal** (modelo Skoob / Letterboxd / MyAnimeList). Armazena apenas:
identificação da obra, metadados, notas, avaliações, datas, progresso, comentários, categorias, tags, e a capa da obra.

**Não armazena** arquivos de mídia (livros, filmes, séries, músicas) em nenhuma circunstância.

Capas seguem uma regra de prioridade:
1. Se a API de metadados (TMDB ou Google Books) retorna uma URL de capa → salva como **texto** (campo `capa_url`), sem upload.
2. Se a API não retorna capa (ex: mangás, podcasts, edições obscuras) → upload manual para o bucket `capas` (campo `capa_path`).

### Alternativas consideradas

| Alternativa | Descartada por |
|---|---|
| Permitir upload de arquivos de mídia para coleção pessoal completa | Escopo desproporcional ao objetivo do sistema; custo de storage crescente; ambiguidade legal de armazenar cópias de mídia protegida por direitos autorais. |
| Sempre salvar uma cópia local da capa, mesmo quando a API já fornece URL | Desperdício de storage quando o CDN da API (TMDB, Google Books) já é confiável, rápido e gratuito. |

### Justificativa
O valor real do módulo é o tracking pessoal — o que foi lido/assistido, quando, com qual nota — não a hospedagem do conteúdo em si. APIs de metadados já resolvem a exibição visual via CDN próprio.

### Impacto
As tabelas do módulo Biblioteca (a serem criadas em `supabase/migrations/003_biblioteca.sql`, ainda não executado) terão os campos `capa_url TEXT` e `capa_path TEXT` (nullable, mutuamente exclusivos na prática). O bucket `capas` permanece pequeno (2MB por arquivo) porque upload manual é exceção, não regra.

## DEC-012 — Sistema ENEM standalone integra ao Sistema Pessoal via Supabase

**Data:** Fase 3 (planejamento do módulo de Estudos)
**Status:** ✅ Aprovada

### Contexto
Existe um sistema ENEM standalone anterior ao projeto atual (`C:\Gabriel Oliveira\04-Educacional\Enem\`, 13 páginas com localStorage) usado para guardar provas antes da criação do Sistema Pessoal. O ROADMAP (Fase 3) deixava em aberto se esse sistema seria integrado ou manteria-se separado.

### Decisão
O sistema ENEM standalone não será mantido como projeto separado. Todo o conteúdo de estudos (matérias, questões, desempenho, documentos) passa a viver no Supabase, dentro do módulo de Estudos do Sistema Pessoal (schema `002_estudos.sql`).

### Alternativas consideradas

| Alternativa | Descartada por |
|---|---|
| Manter o sistema ENEM separado (localStorage) | Duplica esforço de manutenção, sem sync multi-dispositivo, sem backup real (localStorage é por navegador/dispositivo), fora do padrão arquitetural do Sistema Pessoal. |
| Importar dados do localStorage antigo automaticamente | Sem ferramenta/rotina de migração planejada; o volume é pequeno o suficiente para recriar manualmente conforme a necessidade. |

### Justificativa
Consistência arquitetural (um único backend, um único fluxo de sync) supera o custo de recriar o conteúdo manualmente. O sistema antigo era uma solução temporária pré-Supabase.

### Impacto
O sistema ENEM standalone é descontinuado como projeto ativo. Nenhuma migração automática de dados está planejada.

---

## DEC-013 — Módulo de Estudos: uma página única em vez de três

**Data:** Fase 3
**Status:** ✅ Aprovada

### Contexto
O ROADMAP original previa três arquivos separados — `enem.html`, `escola.html`, `olimpiadas.html` — cada um repetindo a mesma estrutura de CRUD (matérias, assuntos, anotações, documentos, sessões de questões), diferindo apenas no filtro de tipo de matéria.

### Decisão
Uma única página `estudos.html`, com filtro de tipo (pills: Todas | ENEM | Escola | Olimpíadas | Concurso) sobre a coluna `materias.tipo`.

### Alternativas consideradas

| Alternativa | Descartada por |
|---|---|
| Três arquivos separados | ~900 linhas de código quase idênticas replicadas 3x; qualquer correção precisaria ser aplicada em triplicado. |

### Justificativa
O schema já modela o tipo como um campo (`materias.tipo`), não como tabelas separadas — a camada de apresentação segue a mesma lógica. Uma página única também permite ver todas as matérias juntas quando necessário.

### Impacto
`ROADMAP.md` Fase 3 atualizado para refletir uma única página.

## DEC-014 — Biblioteca: tabelas separadas por tipo de mídia (não tabela única)

**Data:** Fase 4 (planejamento)
**Status:** ✅ Aprovada

### Contexto
DEC-013 (Estudos) usou tabela única + campo `tipo` porque as categorias tinham
estrutura idêntica. Biblioteca tem tipos com campos genuinamente distintos
(autor vs. diretor, páginas vs. temporada/episódio vs. volume).

### Decisão
Tabelas separadas: `livros`, `filmes`, `series`, `mangas`, `podcasts`, mais `tags`
compartilhada e uma tabela de junção many-to-many por tipo (`livros_tags`, etc.).

### Justificativa
Evita colunas nullable irrelevantes por tipo. Custo: 11 tabelas no total.

### Impacto
`003_biblioteca.sql`. Nenhuma FK genérica — tags usam junção por tipo porque as
tabelas de obra são fisicamente separadas.

---

**Atualização em DEC-011 (2026-07-11):** a premissa original de "mangás: sem API
definida, sempre manual" está superada. Mangás agora integram com a API
MyAnimeList/Jikan (gratuita, sem autenticação) — mesmo padrão de `capa_url` prioritária
sobre `capa_path` usado em livros/filmes/séries. Campo `mal_id` adicionado à tabela
`mangas` para permitir refresh futuro de metadados (volumes, sinopse, nota da
comunidade) buscados ao vivo na API, sem persistir no banco.