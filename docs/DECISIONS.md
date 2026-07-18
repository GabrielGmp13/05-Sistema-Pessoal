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
**Status:** ⚠️ Superada pelo DEC-018 (2026-07-14) — ver justificativa lá. Mantida aqui como registro histórico, não reescrever o texto abaixo.

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

## DEC-015 — GRANT explícito obrigatório em toda migration

**Data:** 2026-07-11 (Fase 4, durante validação pós-execução de `003_biblioteca.sql`)
**Status:** ✅ Aprovada

### Contexto
Após executar `003_biblioteca.sql`, todas as 11 tabelas novas (e, na investigação, também as tabelas antigas de `001` e `002`) apareceram com o badge "API DISABLED" no dashboard do Supabase. Investigação revelou que o Supabase mudou o comportamento padrão para projetos criados a partir de 2026-05-30: GRANT para `anon`/`authenticated` deixou de ser automático. RLS e policies continuam funcionando normalmente, mas sem GRANT explícito a tabela fica inacessível via Data API (`supabase-js`, REST, GraphQL) — erro 42501 mesmo com policy válida.

### Decisão
Toda migration SQL do projeto passa a incluir, por tabela, além de `ENABLE ROW LEVEL SECURITY` e `CREATE POLICY`:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON <table> TO authenticated;
```
Nunca conceder GRANT para `anon` (o sistema exige login em toda tela).

### Justificativa
Sem essa linha, qualquer migration futura vai reproduzir o mesmo problema silenciosamente — a tabela existe, a policy existe, mas a API não responde, e o erro só aparece em teste real do frontend, não no SQL Editor (que roda como `postgres`, sem restrição).

### Impacto
`DATABASE.md` → Convenção universal atualizada. GRANT retroativo já aplicado nas tabelas existentes (`001`, `002`, `003`) em 2026-07-11.

## DEC-016 — Podcasts ganham API de metadados (iTunes Search API)

**Data:** 2026-07-13 (Fase 4, integração de APIs externas)
**Status:** ✅ Aprovada

### Contexto
DEC-011 registrava podcasts como o único tipo da Biblioteca sem API de metadados
definida, permanecendo 100% manual. Ao planejar a integração de TMDB/Google Books/
Jikan, identificou-se que a iTunes Search API (`itunes.apple.com/search`) cobre
podcasts sem necessidade de key, autenticação ou custo — mesmo padrão gratuito já
usado para Jikan/MAL (mangás).

### Decisão
Podcasts passam a integrar com a iTunes Search API. Campos retornados usados:
`trackId` (armazenado como `itunes_id`), `artworkUrl600` (armazenado como
`capa_url`), `artistName` (autor/produtora do podcast).

### Alternativas consideradas

| Alternativa | Descartada por |
|---|---|
| Taddy API | Exige API key e tem foco em transcrição/episódios — funcionalidade muito além do escopo de catálogo (ver PROJECT_PRINCIPLES.md #11, escopo proporcional). |
| Manter podcasts 100% manuais | Deixaria de aproveitar uma API gratuita já compatível com o padrão `capa_url` usado nos outros 4 tipos. |

### Justificativa
Mesmo padrão de prioridade já usado em livros/filmes/séries/mangás: `capa_url`
da API tem prioridade sobre `capa_path` manual. Nenhuma dependência nova, nenhum
custo, nenhuma autenticação.

### Impacto
`podcasts` ganha duas colunas novas via `004_podcasts_itunes.sql`: `itunes_id TEXT`
e `capa_url TEXT`. `capa_path` permanece como fallback para os casos raros em que
a iTunes API não retorna o podcast buscado.

**Atualização em DEC-011:** a premissa de "podcasts: sem API, sempre manual" está
superada, no mesmo espírito da atualização já feita para mangás em 2026-07-11.

**Atualização (2026-07-13):** a pendência "a definir na implementação do frontend"
sobre o campo `artistName` da iTunes API foi resolvida — `biblioteca.html` salva
automaticamente `artistName` em `comentario` (prefixado como "Produtora: ...") ao
selecionar um resultado de busca, apenas quando `comentario` está vazio. Nenhuma
coluna nova foi criada — decisão deliberada para não adicionar uma coluna dedicada
só para podcasts quando os outros 4 tipos não têm um campo equivalente de metadado
secundário.

## DEC-017 — Deep-link por tipo em estudos.html via querystring

**Data:** 2026-07-13
**Status:** ✅ Aprovada · ✅ Implementada

### Contexto
Os links "Enem", "Olimpíadas" e "Escola" no dashboard (`index.html`) apontavam
para arquivos separados (`enem.html`, `olimpiadas.html`, `escola.html`) que
nunca existiram — resíduo do plano original, descartado por DEC-013 em favor
de uma página única `estudos.html` com filtro por tipo. Isso causava erro
"não encontrado" ao clicar em qualquer um dos três links.

### Decisão
`estudos.html` passa a aceitar o parâmetro de URL `?tipo=` (`enem` | `olimpiada`
| `escola`), lido em `init()` para pré-selecionar a pill de filtro
correspondente. Sem parâmetro, ou com valor inválido, o comportamento
permanece o padrão (filtro "Todas") — nenhuma quebra de compatibilidade com
o uso direto da página.

`index.html` atualizado para linkar `estudos.html?tipo=enem`,
`estudos.html?tipo=olimpiada` e `estudos.html?tipo=escola` em vez dos arquivos
inexistentes.

### Alternativas consideradas

| Alternativa | Descartada por |
|---|---|
| Remover os 3 links do dashboard, deixando só um link genérico para `estudos.html` | Perde a conveniência de acesso direto por tipo a partir do dashboard, que era a intenção original da navegação. |
| Criar de fato 3 arquivos HTML separados | Contradiz DEC-013 diretamente — reabriria uma decisão já tomada sem justificativa nova. |

### Justificativa
Mantém DEC-013 intacta (uma página, um schema, um filtro) e resolve o problema
real (navegação quebrada) com a menor superfície de mudança possível — um
parâmetro de URL opcional, não um novo mecanismo de roteamento.

### Impacto
`estudos.html` → `init()` lê `window.location.search` e aplica o filtro antes

## DEC-018 — Migração do frontend para Next.js/React + API Routes (reabre DEC-006)

**Data:** 2026-07-14 (planejamento da v2)
**Status:** ✅ Aprovada

### Contexto
A v2 traz um conjunto de novidades (treino com módulos por categoria e imagens,
biblioteca com dados aninhados — temporadas dentro de anime/série, elenco,
trilha sonora —, sistema de nota por estrela + favoritagem reaproveitado entre
tipos, estudos separado em páginas próprias por sistema de revisão, agenda com
integração Google Calendar) que exigem dois tipos de coisa que HTML/JS puro
(DEC-006) não resolve bem:
1. **Componentes reutilizáveis com estado aninhado** (card de exercício, card
   de obra com lista de temporadas, widget de nota por estrela) — hoje isso é
   feito manipulando `innerHTML` na mão, o que já é difícil de manter em
   `biblioteca.html` e ficaria pior com dados aninhados.
2. **Segredo de API protegido do navegador** (ex: `TMDB_API_KEY`, hoje exposta
   no código-fonte de `biblioteca.html`; futuras integrações como Google
   Calendar OAuth também exigem isso).

Duas soluções foram avaliadas para o ponto 2 (Edge Functions do Supabase vs.
API Routes do Next.js) — ver comparação abaixo. Como quase todos os módulos já
vão ser reescritos por causa do ponto 1, decidiu-se resolver os dois problemas
com a mesma migração, evitando manter dois runtimes serverless diferentes
(Edge Functions do Supabase *e* API Routes do Next.js) fazendo o mesmo papel.

### Decisão
Frontend migra de HTML/CSS/JS puro para **Next.js (React) + TypeScript**.
Toda lógica que hoje exigiria esconder segredo passa pelas **API Routes do
Next.js** (funções serverless do próprio Next.js, rodando no Vercel) — não
serão usadas Edge Functions do Supabase. Supabase continua responsável por
100% do que já fazia bem: PostgreSQL, Auth, Storage, RLS, Realtime (quando/se
implementado). Esta migração não tem relação com DEC-002 (eliminação do
Flask) — não estamos voltando a manter servidor próprio; API Routes do
Next.js são serverless, hospedadas pelo Vercel, sem manutenção de infra.

### Alternativas consideradas

| Alternativa | Descartada por |
|---|---|
| Manter HTML puro + Edge Functions do Supabase só para o segredo (DEC-018 inicial cogitada) | Resolve só o problema de segredo, não resolve o problema de componentização que motivou boa parte da v2; deixaria o projeto com dois backends serverless (Edge Functions + API Routes) se o framework entrasse depois de qualquer forma |
| Backend próprio (Node/Express, FastAPI) com hospedagem separada | Reintroduz exatamente o que o DEC-002 eliminou: hospedagem própria, deploy separado, manutenção de servidor, cold start em free tier de terceiros |
| Manter tudo em HTML puro, aceitar `innerHTML` mais complexo | Sustentável hoje, mas as novidades da v2 (dados aninhados, widgets reutilizados entre 5 tipos de mídia) tornam a manutenção desproporcionalmente mais difícil sem componentização |

### Justificativa
Migração motivada por necessidade real de UI (componentização), não por
modismo — a segurança de segredo é resolvida "de graça" pela mesma mudança,
via API Routes.

### Impacto
- Reabre DEC-006 (frontend HTML/CSS/JS puro) — **superada por esta decisão**.
- `frontend/` deixa de ser HTML estático e passa a ser um projeto Next.js.
- Deploy no Vercel passa a ter build step (hoje não tem — ver ROADMAP.md → Fase M).
- `style.css` não é descartado: vira base de design tokens/CSS global do
  projeto Next.js (ver DESIGN.md — sem mudança de paleta/tipografia, só de
  onde o CSS é carregado).
- `supabase.js`/`auth.js`/`sm2.js` são reescritos como módulos TypeScript
  (`lib/supabase.ts`, `lib/auth.ts`, `lib/sm2.ts`), mesma responsabilidade.
- Migração é **incremental por módulo**, não um "big bang" — ver ROADMAP.md
  → Fase 7.

  ## DEC-019 — Fase 7.0: estrutura de pastas, router e estilização da v2

**Data:** 2026-07-14 (planejamento Fase 7)
**Status:** ✅ Aprovada

### Decisão
- Projeto Next.js nasce em `frontend-v2/`, pasta nova e independente de `frontend/`
  (v1). A v1 permanece intacta e em produção até a migração terminar módulo a
  módulo — nenhuma substituição in-place.
- Router: **App Router**.
- Estilização: **CSS Modules** nesta migração. `style.css` (~1100 linhas) serve
  de base, adaptado por componente. Tailwind é intenção registrada para uma
  v3 futura — não entra em escopo agora (ver `BACKLOG.md`).
- Deploy: **segundo projeto no Vercel**, apontando para `frontend-v2/`, com URL
  própria (ex: `sistemapessoal-v2.vercel.app`), rodando em paralelo ao projeto
  de produção (`frontend/`). Troca de domínio principal só acontece quando a
  v2 estiver pronta para substituir a v1 de vez.

### Justificativa
Migrar dentro de `frontend/` arriscaria quebrar a v1 em produção durante o
processo, que é incremental por módulo e pode levar tempo. Pasta + deploy
separados eliminam esse risco: v1 continua servindo o uso real do dia a dia
enquanto a v2 é construída e testada isoladamente.

### Impacto
- `ARCHITECTURE.md` e `AI_CONTEXT.md` atualizados para citar `frontend-v2/`.
- Dois projetos Vercel a partir de agora — atenção redobrada em qual variável
  de ambiente (`TMDB_API_KEY`, Supabase keys) está configurada em qual projeto.
- `frontend/` só é removida/descontinuada quando todos os módulos estiverem
  migrados e a v2 assumir o domínio principal — decisão futura, não agora.


## DEC-020 — Treino v2: hierarquia módulos → treinos → exercícios (força/cardio separados)

**Data:** 2026-07-15 (planejamento Fase 7.1)
**Status:** ✅ Aprovada · 🔄 Migration criada, execução pendente

### Contexto
A v1 tinha `treinos` → `exercicios` direto, sem camada de categorização, e uma
tabela `cardio` isolada que nunca ganhou tela. Ao planejar a v2, ficou claro que
o usuário pensa o condicionamento físico em categorias livres (Força, Cardio,
Flexibilidade, etc.) que agrupam treinos, e que exercícios de força (série/reps/
carga) e cardio (distância/duração) têm natureza de dado diferente o bastante
para não caber bem na mesma tabela.

### Decisão
Nova hierarquia: `modulos_treino` (CRUD livre do usuário) → `treinos` (ganha
`modulo_uuid`) → `exercicios_forca` **ou** `exercicios_cardio` (tabelas separadas
por natureza, não uma tabela genérica com campos nullable). Execução espelha a
mesma separação: `execucoes_forca` (série a série, com PR — mesma lógica da v1)
e `execucoes_cardio` (registro simples: concluído + tempo/km real opcional).
`cardio`, `exercicios` e `series_executadas` são descontinuadas.

+### Alternativas consideradas

| Alternativa | Descartada por |
|---|---|
| Uma tabela `exercicios` só, campos de força e cardio nullable | Rejeitada pelo usuário — natureza de dado divergente demais (mesmo raciocínio de DEC-014 na Biblioteca: tipos com campos genuinamente distintos ganham tabelas separadas). |
| Módulos fixos (enum) | Usuário quer criar módulos livremente; lista fixa reabriria a decisão sem necessidade real. |
| Seed de módulos via INSERT direto na migration com user_id fixo | Frágil — o projeto já perdeu dados por recriação de usuário (ver DATABASE.md → Gotchas, incidente de 2026-07-13). Seed fica a cargo do frontend no primeiro carregamento. |

### Justificativa
Espelha o próprio vocabulário do usuário ao descrever o uso real (módulo do dia
→ treino específico → exercícios), e separa por natureza de dado em vez de forçar
uma tabela genérica com muitos campos nulos — mesmo princípio já usado em DEC-014.

+### Impacto
`005_treino_v2.sql` criada (execução pendente). Bucket novo `exercicios` (privado,
5MB, aceita GIF). `treino-plano.html`/`treino-academia.html` (v1) não são
afetados — só a v2 (Next.js) usa o schema novo. Seed de 7 módulos (Cardio, Força,
Resistência, Hipertrofia, Flexibilidade, Mobilidade, Potência) implementado no
frontend, não na migration.

## DEC-021 — Proteção de rota via middleware do Next.js (não hook por página)

**Data:** 2026-07-15 (Fase 7.0, execução técnica)
**Status:** ✅ Aprovada · ✅ Implementada

### Contexto
`ARCHITECTURE.md` (DEC-018) deixava em aberto se `lib/auth.ts` seria um hook
chamado no topo de cada página (mesmo espírito do `window.authReady` da v1)
ou middleware do Next.js. Precisava fechar antes de gerar a primeira página
protegida.

### Decisão
Middleware (`middleware.ts`, raiz do projeto). Protege toda rota por padrão;
só as listadas explicitamente em `ROTAS_PUBLICAS` ficam de fora. Não existe
`lib/auth.ts` como módulo separado — o middleware cobre essa responsabilidade
sozinho.

### Alternativas consideradas

| Alternativa | Descartada por |
|---|---|
| Hook `useAuth()` chamado no topo de cada página | Opt-in por página — se uma página nova esquecer de chamar o hook, fica exposta sem redirect. Contraria PROJECT_PRINCIPLES.md #4 (segurança acima de conveniência): o padrão fail-safe (proteção por padrão, exceção explícita) é mais seguro que o padrão opt-in. |

### Justificativa
Middleware roda antes de qualquer página renderizar, sem exigir nenhuma ação
do código de cada página — impossível esquecer de proteger uma rota nova
por engano, o oposto do risco do hook.

### Impacto
`middleware.ts` implementado e testado (login + redirect confirmados
funcionando em 2026-07-15). `ARCHITECTURE.md` atualizado. Nenhuma página
precisa chamar nada para estar protegida — só rotas públicas precisam ser
adicionadas manualmente em `ROTAS_PUBLICAS`.

**Gotcha relacionado (não é decisão, é bug encontrado na implementação):**
`lib/supabase.ts` precisa usar `createBrowserClient` de `@supabase/ssr`, não
`createClient` de `@supabase/supabase-js` — o segundo guarda sessão em
`localStorage`, invisível ao middleware (que lê cookies). Ver `ARCHITECTURE.md`
→ lib/supabase.ts para o detalhe completo.


**Atualização (DEC-022, 2026-07-16):** a premissa de "módulos livres,
CRUD completo pelo usuário" foi revertida. Ver DEC-022 para o novo
comportamento — módulos passam a ser fixos.

---

## DEC-022 — Módulos de treino passam a ser fixos (reabre parte da DEC-020)

**Data:** 2026-07-16
**Status:** ✅ Aprovada · ✅ Implementada

### Contexto
DEC-020 definiu `modulos_treino` como CRUD livre do usuário, descartando
explicitamente a alternativa de módulos fixos ("usuário quer criar módulos
livremente"). Na prática, ao planejar as páginas da v2, ficou claro que essa
premissa estava errada: o usuário já definiu os 7 módulos como a divisão
completa e definitiva de como ele categoriza treino (Cardio, Força,
Resistência, Hipertrofia, Flexibilidade, Mobilidade, Potência) — não como
um ponto de partida editável.

### Decisão
Os 7 módulos são fixos. Não há CRUD de módulo na v2 (sem criar, editar,
renomear ou apagar módulo pela interface). A tabela `modulos_treino`
continua existindo (schema já executado, ver DEC-020/DATABASE.md) e é
populada automaticamente com as 7 linhas na primeira carga, caso esteja
vazia — sem botão, sem interação do usuário (`seedModulosSeNecessario()`
em `lib/modulos-treino.ts`).

Se o usuário quiser um módulo novo no futuro, o processo é fora do sistema:
contato direto com o desenvolvedor (que é o próprio usuário), que altera a
seed manualmente. Não é uma funcionalidade do produto.

**Decisão adicional de escopo (implementação):** um treino pode conter
exercícios de força e cardio simultaneamente — o tipo é escolhido por
exercício, não pelo módulo. O schema (`exercicios_forca`/`exercicios_cardio`)
não força essa exclusão, e travar isso na UI seria complexidade sem
necessidade real.

### Justificativa
O usuário chegou aos 7 módulos depois de já ter separado o que cada tipo de
treino resolve na prática — não é uma lista provisória. CRUD de módulo seria
complexidade sem uso real (princípio 3 e 11 de `PROJECT_PRINCIPLES.md`:
simplicidade acima de complexidade, escopo proporcional).

### Impacto
- Nenhuma mudança de schema — `modulos_treino` continua igual.
- `app/treino/page.tsx` não tem CRUD de módulo, só lista os 7 (funciona como hub/seleção).
- Seed automático (client-side, `lib/modulos-treino.ts`) resolve a pergunta
  em aberto sobre "seed automático vs. botão" — tabela vazia dispara o seed sozinha.

## DEC-023 — Biblioteca v2: gêneros estruturados substituem tags livres, nota vira estrela

**Data:** 2026-07-16
**Status:** ✅ Aprovada · ✅ Executada (`006_biblioteca_v2_base.sql`, `007_remover_tags.sql`)

### Contexto
Planejamento da Biblioteca v2 (motivado por DEC-018) trouxe uma lista extensa
de campos novos por tipo de mídia. Na base compartilhada (sub-fase B1),
surgiram duas mudanças de fundo que afetam todos os 5 tipos existentes:
1. Sistema de nota migra de escala 1-10 (inteiro) para 1-5 com meia estrela
   (`NUMERIC(2,1)`), sem conversão de dados antigos — v2 nasce zerada.
2. Sistema de gênero estruturado (`generos`, com campo de descrição/tooltip
   — necessário para gêneros japoneses como Shounen/Seinen) substitui o
   sistema de tags livres (`tags` + `*_tags`) herdado da DEC-014/v1.

### Decisão
- `nota` recriada como `NUMERIC(2,1)` em `livros`, `filmes`, `series`,
  `mangas`, `podcasts`. Dados antigos descartados (usuário confirmou não ter
  uso real acumulado ainda).
- Tabela `generos` criada (estruturada, com `descricao` para tooltip) +
  junções `livros_generos`, `filmes_generos`, `series_generos`,
  `mangas_generos`, `podcasts_generos`.
- Tags livres descontinuadas: `tags` e as 5 junções `*_tags` removidas do
  banco via `DROP TABLE`.
- Campos novos compartilhados adicionados às 5 tabelas: `favorito`,
  `vezes_consumido`, `onde_consumi`, `valor_pago`, `banner_url`,
  `banner_path`, `classificacao_indicativa`, `duracao_minutos`,
  `link_imdb`, `link_mal`, `link_anilist`, `link_oficial`.
- Deliberadamente fora de escopo (removido durante o planejamento):
  "onde está disponível" via API de streaming, e campo "recomendaria".

### Alternativas consideradas

| Alternativa | Descartada por |
|---|---|
| Manter tags livres coexistindo com gêneros | Usuário não via uso real para tag livre depois que gênero estruturado cobre a necessidade; simplicidade (princípio 3) venceu |
| Converter nota 1-10 para estrela via fórmula (nota/2) | Usuário optou por zerar — sem histórico real acumulado, conversão não trazia valor |
| "Onde está disponível" via TMDB watch/providers | Cobertura de streaming no Brasil é inconsistente e exige manutenção contínua — desproporcional ao uso pessoal (princípio 11) |

### Impacto
`campos comuns em livros/filmes/series/mangas/podcasts`. `classificacao_indicativa`
e `duracao_minutos` existem simetricamente nas 5 tabelas mesmo sabendo que
nunca serão preenchidos em `livros`/`podcasts` — decisão deliberada de manter
schema simétrico entre tipos em vez de criar exceção (princípio 7 — código
simples e óbvio). Este é o primeiro passo do fatiamento da Biblioteca v2 em
sub-fases B1–B6 — ver `ROADMAP.md` e `TASKS_NOW.md`.

## DEC-024 — Biblioteca v2 (B2): elenco/trilha sonora como tabelas polimórficas reutilizáveis

**Data:** 2026-07-16
**Status:** ✅ Aprovada · ✅ Executada (`008_biblioteca_v2_b2.sql`, 2026-07-17)

### Contexto
Filmes e séries compartilham exatamente a mesma estrutura de elenco (ator,
personagem, foto) e trilha sonora (nome, artista, links) — e a visão de
produto já prevê que Animes (B3) vai reaproveitar o mesmo formato.

### Decisão
`elenco` e `trilha_sonora` nascem como tabelas únicas com FK polimórfica
(`tipo_obra` + `obra_uuid`), mesmo padrão de exceção já documentado para
`revisao_espacada.referencia_uuid` (ver NAMING_CONVENTIONS.md). Validação de
`tipo_obra` fica no frontend, sem CHECK constraint — mesma convenção já usada
para `status` nas tabelas de mídia.

`series_temporadas` não guarda episódio por episódio — só contagem
(`numero_episodios`). Granularidade por episódio com marcação de filler é
exclusiva de Animes (B3), onde foi pedida explicitamente.

### Alternativas consideradas

| Alternativa | Descartada por |
|---|---|
| `elenco_filmes` + `elenco_series` (tabelas gêmeas, como DEC-014 fez pra tags) | DEC-014 usou tabelas separadas porque os *dados da obra* eram genuinamente distintos entre tipos; aqui a estrutura de elenco é idêntica entre filme/série/anime — duplicar a tabela só pra manter uma FK direta não compensa, dado que B3 vai precisar do mesmo formato de novo |
| Tabela de episódios por temporada em séries comuns | Usuário não pediu granularidade por episódio pra séries — só pra animes (fillers). Adicionar sem necessidade real contraria princípio 11 (escopo proporcional) |

### Impacto
`008_biblioteca_v2_b2.sql` — aguardando execução no Supabase.

## DEC-025 — Biblioteca v2 (B3): Animes como tabela própria, complementos viram filmes reais

**Data:** 2026-07-16
**Status:** ✅ Aprovada · ✅ Executada (`009_biblioteca_v2_b3.sql`, 2026-07-17)

### Contexto
B3 introduz a categoria Animes, com estrutura mais rica que qualquer outro
tipo: temporadas com episódios granulares (marcação de filler), openings/
endings, staff técnico de animação, dublagem (original + BR), complementos
(filme/OVA/ONA/Special) e ordem de consumo cronológica.

### Decisão
- `animes` é tabela própria, não reaproveita `series` — nomes original e
  traduzido, staff de animação (character designer, animador chefe,
  compositor) além dos campos de produção já usados em filme/série.
- `elenco` (criada na B2, DEC-024) ganha `dublador_original` e
  `dublador_br` — anime usa essas duas colunas em vez de `ator`.
- Complementos (filme/OVA/ONA/Special) **não são uma tabela própria**: são
  linhas reais em `filmes`, com `anime_uuid` (FK opcional) e
  `tipo_complemento` marcando a natureza. Um complemento é editável
  normalmente na tela de Filmes da Biblioteca, e aparece também na página
  do anime.
- `animes_episodios` guarda granularidade por episódio (numero, arco,
  filler, assistido) — diferente de `series_temporadas`, que só guarda
  contagem. % de filler é calculada no frontend, não persistida.
- `animes_ordem_consumo` usa referência polimórfica (`tipo_referencia` +
  `referencia_uuid`, apontando para `animes_temporadas` ou `filmes`) —
  mesmo padrão de exceção já usado em `elenco`/`trilha_sonora` (DEC-024).

### Alternativas consideradas

| Alternativa | Descartada por |
|---|---|
| Complementos como tabela própria (`animes_complementos`) | Contrariaria diretamente o pedido do usuário — ele quer que o complemento seja de fato um filme editável na tela de Filmes, não uma cópia paralela de dados |
| `elenco_animes` separada (em vez de estender `elenco`) | Duplicaria estrutura quase idêntica só por causa de 2 colunas divergentes; estender foi mais simples (princípio 3) |
| Guardar % de filler como coluna em `animes` | Valor derivado, recalculável a qualquer momento a partir de `animes_episodios` — persistir criaria risco de desatualização |

### Impacto
`009_biblioteca_v2_b3.sql` — aguardando execução no Supabase. `filmes` ganha
2 colunas novas (`anime_uuid`, `tipo_complemento`), ambas nulas por padrão —
filmes existentes não são afetados.