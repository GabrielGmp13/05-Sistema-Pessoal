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

## DEC-033 — Nota volta de escala 1-5 (estrela) para 0-10 (reabre parte da DEC-023)

**Data:** 2026-07-19/20 (revisão de design da Biblioteca)
**Status:** ✅ Aprovada · 🔄 Migration criada (`014_nota_escala_dez.sql`), execução pendente

### Contexto
DEC-023 padronizou `nota` em `NUMERIC(2,1)`, escala 1-5 com meia estrela, para
as 6 tabelas de mídia da Biblioteca v2. Ao desenhar a referência visual nova
da Biblioteca (Figma, print trazido pelo usuário), o padrão de exibição
escolhido foi nota decimal de 0 a 10 (ex: "8.6", "8.9") — mesmo formato comum
em catálogos de referência (IMDb, etc.), não mais ícone de estrela.

### Decisão
`nota` passa a ser `NUMERIC(3,1)` (0.0 a 10.0, uma casa decimal) nas 6
tabelas: `livros`, `filmes`, `series`, `mangas`, `podcasts`, `animes`.
Constraint `CHECK (nota IS NULL OR (nota BETWEEN 0 AND 10))` adicionada em
cada tabela. Sem migração automática de dado — mesmo raciocínio de DEC-023
(sem uso real acumulado na v2 até agora).

### Justificativa
Decisão de design do usuário, não técnica — a escala 1-5 com meia estrela
fazia sentido pro layout antigo (ícone de estrela), o layout novo referencia
exibição numérica decimal, que só funciona bem numa escala mais granular.

### Impacto
`014_nota_escala_dez.sql` — aguardando execução no Supabase. Depois de
executada, `DATABASE.md` deve atualizar a definição de `nota` nas 6 tabelas
(hoje documentada como `NUMERIC(2,1)` desde `006_biblioteca_v2_base.sql`).
Frontend (cards, modais de avaliação) precisa trocar qualquer input/exibição
de estrela por input numérico decimal — parte do escopo do redesign visual
da Biblioteca, ver TASKS_NOW.md.

**Nota:** `favorito BOOLEAN` já existe desde DEC-023 — o coração do card novo
não exige schema novo, só exibição condicional no frontend.

## DEC-034 — Nova identidade visual do sistema (dourado/âmbar sobre preto), substitui a paleta verde-limão original

**Data:** 2026-07-20
**Status:** ✅ Aprovada · ✅ Aplicada (`globals.css`, `DESIGN.md`, Biblioteca)

### Contexto
O usuário desenhou uma referência de dashboard no Figma Make (export completo
recebido: `theme.css`, `App.tsx`) para a Biblioteca v2, com uma identidade
visual diferente da paleta original do projeto (verde-limão sobre preto,
`DESIGN.md` desde a v1). Ao revisar a referência, o usuário decidiu adotar
essa nova paleta em **todo o sistema**, não só na Biblioteca — decisão
tomada explicitamente quando perguntado sobre o escopo da mudança.

### Decisão
Paleta trocada de verde-limão para dourado/âmbar, valores extraídos direto
do `theme.css` do export do Figma:

```css
--bg:      #0c0c14
--surface: #13131f
--border:  rgba(255, 255, 255, 0.07)
--accent:  #c9a96e
--text:    #ede9e1
--texto-secundario: #8a8799
```

Trocado no `:root` de `globals.css` — como todo componente do projeto já
consome essas variáveis via CSS Modules (nunca cor solta), a mudança
cascateia automaticamente para Treino, Estudos e qualquer módulo futuro,
sem precisar editar CSS por página. `DESIGN.md` atualizado para refletir os
novos valores como fonte da verdade.

**Decisão de escopo dentro da mudança:** não foi copiado o rótulo "Premium"
que aparecia no protótipo do Figma abaixo do nome do usuário — é um rótulo
de plano pago, incompatível com o princípio de sistema pessoal sem
monetização (`PROJECT_PRINCIPLES.md` #2). Substituído por um subtítulo
neutro ("Sistema Pessoal").

**Decisão de fonte:** o Figma usa "Fraunces" para títulos em itálico — fonte
que não existe no projeto (só `Syne` e `JetBrains Mono`, self-hosted).
Mantido `Syne` em itálico como substituto, para não introduzir uma
dependência de fonte nova sem necessidade real (`PROJECT_PRINCIPLES.md` #6).
Se o usuário quiser a Fraunces de verdade no futuro, precisa ser baixada
como `.woff2` local, não carregada de CDN.

**Decisão sobre imagens de fundo:** o protótipo do Figma usava fotos do
Unsplash como placeholder (avatar de perfil, banner de categoria, capas dos
cards de exemplo). Nenhuma dessas URLs externas foi levada pro código de
produção — dependência externa desnecessária e risco de direito autoral
sobre fotos de terceiros. Resolvido assim:
- Banner de categoria: aceita uma imagem estática opcional por categoria em
  `public/biblioteca/banners/{categoria}.jpg` (arquivo local do projeto); na
  ausência dela, cai automaticamente num mosaico borrado das capas reais já
  cadastradas pelo usuário (`capa_url` de cada item); na ausência de capas
  também, cai num gradiente escuro liso
- Avatar/background de perfil: lido de `user_metadata` do Supabase Auth
  (`avatar_url`, `background_url`), sem tabela nova — cai em fallback de
  inicial do nome se vazio

### Alternativas consideradas
Nenhuma alternativa formal — decisão de design pura, e por princípio
(`PROJECT_PRINCIPLES.md`, seção de fluxo de trabalho) decisões de cor/visual
são prerrogativa do usuário, não pauta de análise técnica de trade-off.

### Impacto
- `DESIGN.md` → seção Paleta de cores reescrita com os valores acima, mais
  seção nova documentando os padrões de Sidebar (faixa de perfil), Banner
  (hero com transição) e Card, para reuso em módulos futuros
- `app/globals.css` → bloco `:root` atualizado
- Nenhum componente antigo (Treino, Estudos) foi tocado diretamente — a
  cascata de CSS Modules já resolve a atualização visual neles
- Biblioteca v2 recebeu, na mesma leva, um redesign de estrutura (não só de
  cor) para se aproximar da referência do Figma — ver `CHANGELOG.md` para o
  detalhamento de Sidebar/Banner/Card

## DEC-035 — Estudos v2: schema novo do zero, reaproveitando Revisão Espaçada existente (Fase 1 / núcleo)

**Data:** 2026-07-20 (planejamento Fase 7.3)
**Status:** ✅ Aprovada · 🔄 Migration criada (`015_estudos_v2.sql`), execução pendente

### Contexto
Usuário trouxe um rascunho de escopo amplo para Estudos v2 (hierarquia
Categoria → Área/Disciplina → Conteúdo, com flashcards próprios, integração
Anki, calendário acadêmico próprio, cursos, sistema de revisão por checklist
fixo paralelo à Revisão Espaçada já existente). Análise identificou 3
sobreposições reais com módulos já construídos ou planejados:
1. Checklist de revisão fixo (1/3/7/14/30 dias) duplicava, de forma pior
   (intervalos fixos vs. adaptativos), o SM-2 já implementado em
   `revisao_espacada`/`sm2.js`.
2. "Calendário acadêmico" duplicava o módulo Agenda (`VISION.md`, ainda não
   dedicado, mas já reconhecido como pendência própria).
3. Flashcards/Anki e Cursos são escopo de produto próprio, desproporcional
   ao módulo (princípio 11, `PROJECT_PRINCIPLES.md`).

Decisão de fasear: núcleo (Fase 1) cobre o que foi confirmado com o usuário;
Cursos, Flashcards/Anki, Redação versionada e Calendário próprio ficam
registrados como Fase 2 em `BACKLOG.md`/`VISION.md`, não descartados.

### Decisão
- **Revisão de conteúdo reaproveita `revisao_espacada` sem alteração de
  schema** — cada conteúdo pode ter um card associado (`modulo = 'estudos'`,
  `referencia_uuid = conteudos.uuid`). Diferente do uso original (flashcard
  pergunta→resposta), aqui o card funciona como **lembrete** ("revisar tal
  conteúdo"), sem resposta esperada — `pergunta` guarda o rótulo do
  conteúdo, `resposta` fica vazia. Nenhuma mudança de schema necessária, só
  de convenção de uso.
- **Categorias (ENEM/Escola/Olimpíada/Outro) continuam como campo `tipo`**
  em `materias`, não como hierarquia de tabela — mesmo raciocínio de
  DEC-013. `materias` é a única tabela da v1 mantida sem alteração.
- **Todas as demais tabelas da v1 (`assuntos`, `anotacoes`,
  `documentos_estudo`, `sessoes_questoes`) são substituídas por schema
  novo**, desenhado do zero para o v2, em vez de reaproveitadas — a pedido
  explícito do usuário, para não herdar limitações da v1:
  - `conteudos` substitui `assuntos`
  - `anotacoes_estudo` substitui `anotacoes`
  - `materiais_estudo` substitui `documentos_estudo` (mais amplo: cobre
    link/vídeo/livro, não só PDF)
  - `questoes_individuais` (novo, granularidade por questão) substitui
    `sessoes_questoes` (que só registrava agregado por sessão) — resolve a
    pendência já registrada em `BACKLOG.md` antes deste planejamento
  - `sessoes_estudo` (novo) — registra tempo de estudo (início/fim/duração),
    base literal das métricas de tempo do dashboard, que não existiam em
    nenhuma forma na v1
  - `simulados` (novo) — registro de prova completa, separado de questão
    individual
  - `redacoes` (novo) — versão leve (tema, texto, nota, comentário), sem
    versionamento — confirmado com o usuário que é uso frequente, entra na
    Fase 1
- Confirmado com o usuário: dado existente nas tabelas antigas de Estudos é
  só de teste — remoção segura, mesmo raciocínio já usado em DEC-020/DEC-023.

### Alternativas consideradas

| Alternativa | Descartada por |
|---|---|
| Checklist de revisão fixo próprio (rascunho original do usuário) | Duplicava SM-2 já implementado, com resultado pior (intervalos fixos não se adaptam à performance real por conteúdo) |
| Hierarquia de tabela por categoria (ENEM/Escola/Olimpíada como tabelas separadas) | Estrutura quase idêntica entre categorias — caso de DEC-013 (tabela única + tipo), não de DEC-014 (campos genuinamente distintos) |
| Reaproveitar `assuntos`/`anotacoes`/`documentos_estudo` da v1 sem alteração | Usuário pediu explicitamente para não se limitar à estrutura antiga — schema novo reflete melhor o escopo real do v2 |
| Incluir Cursos/Flashcards/Anki/Calendário na Fase 1 | Escopo desproporcional (princípio 11); Cursos e Flashcards são produtos próprios; Calendário duplicaria o módulo Agenda ainda por vir |

### Justificativa
Reaproveitar infraestrutura já validada (SM-2) evita reinventar um sistema
pior dentro de outro módulo. Fasear o restante mantém o princípio de escopo
proporcional sem descartar a visão de longo prazo do usuário — tudo que
ficou de fora está registrado, não perdido.

### Impacto
`015_estudos_v2.sql` — aguardando execução no Supabase. Depois de executada
e confirmada: `DATABASE.md` ganha a seção "Schema — 015_estudos_v2.sql";
`VISION.md` atualiza status de Estudos; `ROADMAP.md` Fase 7.3 passa de
"a planejar" para "planejamento concluído, schema pendente de execução".
Frontend (`app/estudos/`) só é gerado depois da confirmação de execução —
disciplina de schema-first do projeto.

**Fase 2 registrada (não descartada), ver `BACKLOG.md`:** Cursos (estrutura
própria), Flashcards/integração Anki, Redação versionada (múltiplas
versões, competências detalhadas), Calendário acadêmico próprio (absorvido
pelo módulo Agenda quando dedicado), metas/streak (avaliar sobreposição com
módulo Hábitos quando planejado), estatísticas avançadas (ranking de
conteúdos fracos/fortes, eficiência — dependem de volume real de dado),
upload de arquivo de prova/gabarito em simulados.

## DEC-036 — Estudos v2 Fase 1B: conteúdo compartilhado entre módulos, Curso com hierarquia própria, Prova vs. Simulado como estruturas distintas

**Data:** 2026-07-23 (planejamento detalhado de ENEM/Escola/Curso)
**Status:** ✅ Aprovada · ✅ Migration executada no Supabase (2026-07-23) · 🔄 Camada de dados (`lib/`) gerada e aplicada, páginas pendentes

### Contexto
Sessão de brainstorm estruturado (pergunta-resposta) sobre o funcionamento real
de ENEM, Escola e Curso dentro de Estudos v2, partindo de um rascunho amplo do
usuário (escrito originalmente como brainstorm livre, sem compromisso de
escopo). A sessão revelou 3 decisões estruturais que a Fase 1 (DEC-035) não cobria:

1. O mesmo conteúdo (ex: "Funções") pode ser estudado simultaneamente para
+   ENEM e Escola, com um único checklist/progresso — não duplicado por módulo.
2. **Prova** (evento oficial — Escola ou dia de ENEM, com gabarito
+   questão-a-questão) e **Simulado** (sessão informal por conteúdo, iniciada
+   livremente pelo usuário) são conceitos diferentes. Só o Simulado alimenta a
+   revisão espaçada (SM-2); Prova nunca influencia `revisao_espacada`.
3. Curso tem hierarquia própria (Curso → Módulo → Aula), diferente da
+   estrutura flat de ENEM/Escola (Matéria → Conteúdo direto).

### Decisão

**Conteúdo compartilhado (N:N):** `conteudos.materia_uuid` (FK direta,
`015_estudos_v2.sql`) é substituído por uma tabela de vínculo
`conteudos_materias`. Um conteúdo passa a existir de forma independente e se
vincula a 1 ou mais matérias. `sessoes_estudo` continua com `materia_uuid`
próprio (não muda) — permite registrar tempo de estudo separado por módulo
mesmo quando o conteúdo estudado é compartilhado.

**Curso com hierarquia própria:** nova tabela `modulos_curso` (Curso →
Módulo). `conteudos` ganha `modulo_curso_uuid` (nullable, só usado quando o
conteúdo é uma aula de curso). ENEM/Escola continuam sem agrupamento
intermediário, só `conteudos_materias` direto.

**Atividades (Escola e Curso):** nova tabela `atividades` — generalizada
desde o desenho original (que previa uma tabela só de Escola), pra também
cobrir exercícios/tarefas de Curso sem duplicar conceito.

**Prova (evento oficial) — nova tabela `provas`:** cobre Escola (matéria +
conteúdo + data + nota), ENEM (`tipo = 'enem_dia1'` | `'enem_dia2'`, sem
matéria única — a granularidade de área fica no gabarito) e Curso, se
necessário. Contagem regressiva é só da prova em si (sem outros eventos tipo
inscrição/resultado — decisão explícita do usuário).

**Gabarito digital do ENEM:** `questoes_individuais` (já existente, Fase 1)
ganha `prova_uuid` (vincula a questão a uma prova específica), `numero`
(posição da questão dentro da área) e `motivo_erro` (preenchido só quando
`acertou = false`). O dia de prova do ENEM vira ~90 linhas nesta tabela,
cada uma com sua `materia_uuid` (a área) e, se errada, `conteudo_uuid` +
`motivo_erro`.

**Simulado (sessão informal) alimenta SM-2:** `simulados` ganha
`conteudo_uuid` (nullable) — quando preenchido, o resultado do simulado
dispara o cálculo de SM-2 daquele conteúdo (mesma lógica de "avaliar card"
já usada em `revisao_espacada`, com a "qualidade" derivada do % de acerto).
`simulados` também ganha `redacao_uuid` (nullable) — só usado no dia 1 do
ENEM (simulado com redação).

**Redação por competência:** `redacoes` ganha 5 colunas
(`competencia_1`...`competencia_5`, 0-200 cada, mesmo critério do ENEM),
mantendo `nota` como nota geral/soma. Aplica-se também à Escola, mesmo que a
escala real de correção seja outra — campo fica de uso flexível.

**Curso — campos adicionais em `materias`:** `plataforma`,
`carga_horaria_total_horas`, `horas_dedicadas` (preenchido manualmente —
sem integração automática, ver seção seguinte), `certificado_path`
(upload PDF, bucket `documentos`), `concluido`, `data_conclusao`. Todos
nullable, usados só quando `materias.tipo = 'curso'`.

**Integração com YPT (Yeolpumta) — pesquisado e descartado por ora:** app
usado pelo usuário no celular pra cronometrar estudo não possui API pública
documentada (app fechado, sem portal de desenvolvedor). Mesmo raciocínio da
DEC-009 (Google Calendar): sem integração automática agora,
`horas_dedicadas` é preenchido manualmente. Revisitar se o app abrir API no
futuro.

**Explicitamente fora de escopo (decisão direta do usuário):**
- Nota TRI estimada do ENEM — "muito relativo"
- Peso por curso pretendido (Engenharia pesa Matemática, etc.) — decidir
  quando o curso pretendido estiver definido
- Avaliação pessoal do curso e data de expiração de acesso
- Campo de "nível de confiança/domínio" separado do progresso — taxa de
  acerto já serve como proxy de domínio
- Boletim agregado por bimestre e frequência/faltas na Escola
- Horário semanal de aula e calendário de provas — adiado pra fase de
  polimento (Fase 2)

### Alternativas consideradas

| Alternativa | Descartada por |
|---|---|
| Manter `conteudos.materia_uuid` 1:1, aceitar duplicação de conteúdo entre módulos | Usuário confirmou explicitamente que quer 1 checklist compartilhado, não duplicação |
| ENEM registrado como `simulado` único com notas por área numa mesma linha | Usuário esclareceu que Prova (ENEM) e Simulado são estruturas totalmente diferentes — prova usa gabarito questão-a-questão, simulado é só conteúdo+acertos e alimenta SM-2 |
| Curso como lista plana de conteúdos, igual Escola/ENEM | Usuário quer hierarquia Curso → Módulo → Aula explicitamente |
| Trazer TRI, peso por curso, avaliação pessoal do curso, nível de confiança, boletim, frequência para a Fase 1B | Usuário rejeitou cada um explicitamente — mantidos fora, não registrados nem em BACKLOG.md por não serem visão confirmada, só descartados |

### Justificativa
A separação Prova/Simulado reflete o uso real do usuário (prova é evento
oficial com gabarito; simulado é ferramenta de revisão ativa) — forçar os
dois na mesma estrutura geraria um schema ambíguo e queries confusas sobre
o que conta pra SM-2. O conteúdo compartilhado evita a alternativa pior
(duplicar entrada de conteúdo por módulo), consistente com o princípio de
simplicidade sem sacrificar corretude do dado.

### Impacto
`016_estudos_v2_fase1b.sql` — aguardando execução no Supabase. Depois de
executada e confirmada: `DATABASE.md` atualiza a seção de Estudos v2 (já
refletido abaixo neste mesmo commit de documentação, marcado como pendente
de confirmação); frontend de Estudos (`app/estudos/`) só é gerado depois —
disciplina de schema-first do projeto, agora bloqueado por **duas**
migrations pendentes (`015` já executada, `016` ainda não).

### Nota — Exceção pontual à disciplina schema-first (2026-07-23)
Por indisponibilidade do usuário para testar no momento, o frontend de
Estudos v2 (Fase 1 + Fase 1B) foi gerado **antes** da confirmação de
execução de `016_estudos_v2_fase1b.sql` no Supabase — decisão explícita e
consciente do usuário, não mudança na regra. Regra permanece em vigor:
risco assumido é de possível divergência de nome de coluna/constraint até a
migration ser efetivamente rodada e testada. Precedente conhecido: mesma
exceção ocorreu uma vez na v1 (`estudos.html`, ver `CHANGELOG.md`,
2026-07-09/10), corrigida depois sem maiores problemas.