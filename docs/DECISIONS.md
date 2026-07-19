# DECISIONS.md

Registro de decisões arquiteturais. Cada decisão ativa inclui contexto, alternativas e justificativa — não reabrir sem informação nova. Decisões **superadas** ficam resumidas (o quê + por que foi superada + o que vale agora), sem manter a análise original completa — quem precisar do raciocínio histórico integral pode pedir para eu recuperar via `CHANGELOG.md`/versão anterior deste arquivo.

---

## Superadas / históricas (resumo)

- **DEC-001** — Migração de LAN (Flask+SQLite) para Supabase+Vercel. ✅ Executada. Motivo: zero manutenção de servidor, free tier cobre uso pessoal, HTTPS grátis habilita SW.
- **DEC-002** — Flask eliminado por completo (CRUD, sync e SM-2 viram responsabilidade do Supabase JS + JS puro).
- **DEC-003** — SM-2 reimplementado em JavaScript (`sm2.js`), sem dependência de servidor.
- **DEC-004** — Service Worker planejado para offline. Depois formalmente cortado do escopo v1 — ver Fase M2 em `ROADMAP.md`.
- **DEC-005** — IndexedDB deixa de ser fonte de verdade, vira só cache do SW (nunca implementado — SW não saiu do papel).
- **DEC-006** — ⚠️ **Superada pela DEC-018.** Decisão original: HTML/CSS/JS puro, sem framework. Superada quando a v2 passou a exigir componentização (dados aninhados) e segredo de API protegido.
- **DEC-007** — UUIDs gerados no cliente (`crypto.randomUUID()`), permite criação offline e upsert determinístico.
- **DEC-008** — Soft delete universal (`deleted BOOLEAN`), nunca DELETE físico.
- **DEC-009** — Sem Google Calendar OAuth no MVP — Agenda é manual. Complexidade de OAuth desproporcional ao uso pessoal.
- **DEC-010** — Storage: todos os buckets privados, acesso só via signed URL (nunca `getPublicUrl`), path `{user_id}/arquivo.ext`.
- **DEC-011** — Biblioteca é catálogo de metadados, nunca hospedagem de mídia. Capa: `capa_url` (API) com fallback `capa_path` (upload manual). **Atualizado 2x:** mangás (2026-07-11) e podcasts (2026-07-13) ganharam API própria, superando a premissa original de "sempre manual" — ver DEC-016.
- **DEC-012** — Sistema ENEM standalone (localStorage) descontinuado, absorvido pelo módulo de Estudos no Supabase.
- **DEC-013** — Estudos usa página única (`estudos.html`) + campo `tipo`, não 3 arquivos separados.
- **DEC-014** — Biblioteca usa tabelas separadas por tipo de mídia (não tabela única + campo tipo, ao contrário de Estudos) — campos genuinamente distintos entre livro/filme/série/manga/podcast.
- **DEC-017** — `estudos.html` aceita `?tipo=` na URL para deep-link do dashboard, sem reabrir DEC-013.
- **DEC-019** — Fase 7.0: `frontend-v2/` como pasta nova, App Router, CSS Modules (Tailwind adiado pra v3), segundo projeto Vercel em paralelo à v1.
- **DEC-020 (parte 1, superada pela DEC-022)** — Hierarquia `modulos_treino → treinos → exercicios_forca/cardio` com módulos de CRUD livre pelo usuário. A separação força/cardio por tabela **continua válida**; só a premissa de "módulos editáveis" foi revertida — ver DEC-022.
- **DEC-021** — Proteção de rota via middleware (fail-safe, protege tudo por padrão) em vez de hook por página. Ver DEC-031 para o rename para `proxy.ts`.
- **DEC-024/025** — Elenco/trilha sonora como tabelas polimórficas reutilizáveis entre filme/série/anime; Animes ganha tabela própria com granularidade de episódio (filler) que séries comuns não têm; complementos de anime são filmes reais, não tabela paralela.
- **DEC-026** — Campo `tecnologias` de `filmes` removido antes de qualquer frontend consumir (decisão direta do usuário, sem uso percebido).

---

## Ativas (detalhadas)

### DEC-015 — GRANT explícito obrigatório em toda migration
**Status:** ✅ Aprovada, regra permanente.
Supabase (projetos criados a partir de 2026-05-30) não dá GRANT automático a `authenticated`. Sem `GRANT SELECT, INSERT, UPDATE, DELETE ON <table> TO authenticated;` explícito por tabela, a Data API retorna 42501 mesmo com RLS e policy corretos — e o SQL Editor não acusa, porque roda como `postgres`. **Toda migration nova inclui essa linha por tabela.** Nunca conceder para `anon`.

### DEC-016 — Podcasts ganham API de metadados (iTunes Search)
**Status:** ✅ Aprovada e executada.
`itunes.apple.com/search` — gratuita, sem key. Campos: `trackId`→`itunes_id`, `artworkUrl600`→`capa_url`, `artistName`→ inicialmente prefixado em `comentario`, depois migrado para coluna própria `produtora` (DEC-030). Supera a premissa original de DEC-011 ("podcasts sempre manuais"), mesmo padrão já usado para mangás/Jikan.

### DEC-018 — Migração do frontend para Next.js/React + API Routes (reabre DEC-006)
**Status:** ✅ Aprovada e executada.
**Motivo real:** dois problemas que HTML puro parou de resolver bem — (1) componentes reutilizáveis com estado aninhado (biblioteca com temporadas/elenco, treino com módulos) que via `innerHTML` já era difícil e ficaria pior; (2) segredo de API (`TMDB_API_KEY`) exposto no frontend, uma vulnerabilidade real, não só estética.
**Decisão:** Next.js + TypeScript. API Routes do próprio Next.js resolvem o segredo — **não** Edge Functions do Supabase, para não manter dois runtimes serverless fazendo o mesmo papel. Supabase continua 100% responsável por PostgreSQL/Auth/Storage/RLS/Realtime.
**Não é volta ao DEC-002** — API Routes são serverless no Vercel, sem manutenção de infra própria.

### DEC-022 — Módulos de treino fixos (reabre parte da DEC-020)
**Status:** ✅ Aprovada e implementada.
Os 7 módulos (Cardio, Força, Resistência, Hipertrofia, Flexibilidade, Mobilidade, Potência) são fixos — sem CRUD de módulo pela interface. `modulos_treino` é populada automaticamente na primeira carga se vazia (`seedModulosSeNecessario()`). Módulo novo = ajuste manual do desenvolvedor, fora do produto.
**Decisão adicional:** um treino pode ter exercícios de força e cardio simultaneamente — tipo é escolhido por exercício, não por módulo.

### DEC-023 — Biblioteca v2: gêneros estruturados substituem tags, nota vira estrela
**Status:** ✅ Aprovada e executada.
`nota` recriada como `NUMERIC(2,1)` (escala 1-5, meia estrela) nas 5 tabelas de mídia originais — dados antigos descartados (sem uso real acumulado). Tabela `generos` (com `descricao`/tooltip, cobre termos como Shounen/Seinen) + 5 junções `*_generos` substituem `tags`/`*_tags` (removidas via `DROP TABLE`). Campos comuns novos: `favorito`, `vezes_consumido`, `onde_consumi`, `valor_pago`, `banner_url/path`, `classificacao_indicativa`, `duracao_minutos`, links externos. Fora de escopo deliberado: "onde está disponível" (streaming) e "recomendaria".

### DEC-027 — Padrão de UI da Biblioteca v2: painel de detalhe + menu "⋯"
**Status:** ✅ Aprovada e implementada.
Dois componentes de painel **somente leitura** (edição sempre via modal, nunca inline no painel): `PainelDetalheObra` (Filme/Série/Anime — sabe buscar elenco, trilha/openings-endings, temporadas) e `PainelSimples` (Mangá/Livro/Podcast — sem lógica de elenco/trilha embutida, recebe seção extra via `children`). Cards de listagem: clique no corpo abre o painel; botão "⋯" abre menu Editar/Apagar.
**Pendências conhecidas** (ver BACKLOG.md): menu "⋯" não fecha ao clicar fora; listas aninhadas só criam/apagam, não editam; sem reordenação manual.

### DEC-028/029/030 — Biblioteca v2 B4 (Mangás), B5 (Livros), B6 (Podcasts)
**Status:** ✅ Aprovadas e executadas.
- **B4:** `mangas` ganha campos de publicação (`titulo_traduzido`, `editora`, `status_publicacao`, período); nova `mangas_volumes` (volume + `arco` texto livre + `cor` hex para agrupamento visual, sem tabela própria de arco).
- **B5:** `livros` ganha `editora`/`idioma`/`formato`/`ano_publicacao`; nova `livros_anotacoes` (anotação ou citação via campo `tipo`, com `pagina` opcional e `favorito`). Velocidade de leitura (páginas/hora) ficou **fora** desta migration — exigiria registro de sessão com data, não desenhado ainda.
- **B6:** `podcasts` ganha `produtora TEXT` — sai do prefixo solto em `comentario` (DEC-016). Sem migração automática de dados antigos (só teste).

### DEC-031 — v1 aposentada, frontend-v2 renomeada para frontend
**Status:** ✅ Aprovada e implementada.
Pasta `frontend/` (v1) removida do projeto (backup local, fora do Git). `frontend-v2/` renomeada para `frontend/`, único frontend ativo. Projeto Vercel reaproveitado (mesma URL, sem reconfigurar Auth Redirect). **Estudos, Revisão Espaçada e Agenda dedicada ficam deliberadamente ausentes da v2** por ora — abordagem "camada por camada": schema intacto no Supabase, só sem tela.
**Dois bugs de infra corrigidos no cutover:**
1. `middleware.ts` dava 500 (`__dirname is not defined`) — `@supabase/ssr`→`realtime-js` usa APIs Node incompatíveis com Edge Runtime. Resolvido migrando para `proxy.ts` (Next.js 16, roda em Node runtime por padrão) — rename de arquivo/função, sem mudança de lógica.
2. Vercel mantinha Framework Preset "Other" congelado no deployment antigo mesmo após trocar Project Settings — resolvido com um Redeploy forçado.

### DEC-032 — Biblioteca v2: página única com sidebar de categorias (reabre estrutura de rotas)
**Status:** ✅ Aprovada · 🔄 Código pendente (outra sessão).
As 6 rotas por tipo (`/biblioteca/filmes` etc.) são descontinuadas em favor de `app/biblioteca/page.tsx` única, com `app/biblioteca/layout.tsx` (sidebar 2/9 + conteúdo 7/9). Categoria ativa é `useState` no client, sem navegação de rota. Sidebar: Filmes, Séries, Animes, Mangás, Livros, Podcasts + botão fixo "Adicionar obra". Toda lógica de dados (`lib/*.ts`) e componentes de painel (DEC-027) são 100% reaproveitados — mudança é só de composição/layout.
Novo componente genérico `components/Sidebar.tsx`, pensado para reaproveite futuro em Treino/Estudos.
**Decidido também:** sem sidebar global de nível 1 por ora (dashboard ainda sem design definido) — cada módulo com navegação por categoria ganha sua própria sidebar local.