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
**Pendências conhecidas** (ver BACKLOG.md): listas aninhadas só criam/apagam, não editam; sem reordenação manual. O menu "⋯" passou a fechar por clique externo, Escape e escolha de ação em 2026-08.

### DEC-028/029/030 — Biblioteca v2 B4 (Mangás), B5 (Livros), B6 (Podcasts)
**Status:** ✅ Aprovadas e executadas.
- **B4:** `mangas` ganha campos de publicação (`titulo_traduzido`, `editora`, `status_publicacao`, período); nova `mangas_volumes` (volume + `arco` texto livre + `cor` hex para agrupamento visual, sem tabela própria de arco).
- **B5:** `livros` ganha `editora`/`idioma`/`formato`/`ano_publicacao`; nova `livros_anotacoes` (anotação ou citação via campo `tipo`, com `pagina` opcional e `favorito`). Velocidade de leitura (páginas/hora) ficou **fora** desta migration — exigiria registro de sessão com data, não desenhado ainda.
- **B6:** `podcasts` ganha `produtora TEXT` — sai do prefixo solto em `comentario` (DEC-016). Sem migração automática de dados antigos (só teste).

### DEC-031 — v1 aposentada, frontend-v2 renomeada para frontend
**Status:** ✅ Aprovada e implementada.
Pasta `frontend/` (v1) removida do projeto (backup local, fora do Git). `frontend-v2/` renomeada para `frontend/`, único frontend ativo. Projeto Vercel reaproveitado (mesma URL, sem reconfigurar Auth Redirect). **No momento do cutover**, Estudos, Revisão Espaçada e Agenda dedicada ficaram deliberadamente ausentes da v2 — abordagem "camada por camada": schema intacto no Supabase, inicialmente sem tela. Depois do cutover, Estudos foi implementado e Revisão Espaçada e Agenda ganharam telas dedicadas; esse estado posterior não altera a decisão incremental original.
**Dois bugs de infra corrigidos no cutover:**
1. `middleware.ts` dava 500 (`__dirname is not defined`) — `@supabase/ssr`→`realtime-js` usa APIs Node incompatíveis com Edge Runtime. Resolvido migrando para `proxy.ts` (Next.js 16, roda em Node runtime por padrão) — rename de arquivo/função, sem mudança de lógica.
2. Vercel mantinha Framework Preset "Other" congelado no deployment antigo mesmo após trocar Project Settings — resolvido com um Redeploy forçado.

### DEC-032 — Biblioteca v2: página única com sidebar de categorias (reabre estrutura de rotas)
**Status:** ✅ Aprovada e implementada (código gerado via Cline+DeepSeek em 2026-07-19 — ver CHANGELOG.md).
As 6 rotas por tipo (`/biblioteca/filmes` etc.) são descontinuadas em favor de `app/biblioteca/page.tsx` única, com `app/biblioteca/layout.tsx` (sidebar 2/9 + conteúdo 7/9). Categoria ativa é `useState` no client, sem navegação de rota. A sidebar original reunia Filmes, Séries, Animes, Mangás, Livros e Podcasts; Vídeos e Artigos foram acrescentados em 2026-08, totalizando oito categorias na mesma composição. Toda lógica de dados (`lib/*.ts`) e componentes de painel (DEC-027) é reaproveitada — a decisão continua sendo página única com sidebar local.
Novo componente genérico `components/Sidebar.tsx`, pensado para reaproveite futuro em Treino/Estudos.
**Decidido também:** sem sidebar global de nível 1 por ora (dashboard ainda sem design definido) — cada módulo com navegação por categoria ganha sua própria sidebar local.

## DEC-033 — Nota volta de escala 1-5 (estrela) para 0-10 (reabre parte da DEC-023)

**Data:** 2026-07-19/20 (revisão de design da Biblioteca)
**Status:** ✅ Aprovada · ✅ Migration executada (confirmado no dump real do schema, 2026-08 — `nota NUMERIC(3,1)` com `CHECK` de faixa presente nas 6 tabelas de mídia)

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
`014_nota_escala_dez.sql` executada; o dump real de 2026-08 confirma
`NUMERIC(3,1)` e o `CHECK` de 0 a 10 nas 6 tabelas. `DATABASE.md` e o frontend
da Biblioteca já refletem a escala decimal de 0 a 10.

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
**Status:** ✅ Aprovada · ✅ Migration executada (confirmada pelo usuário em 2026-07-22, ver CHANGELOG.md; confirmada novamente no dump real do schema em 2026-08)

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
`015_estudos_v2.sql` — executada e confirmada em 2026-07-22. `DATABASE.md`
tem a seção "Schema — Estudos v2" com o schema final consolidado (`015`–`019`).
`VISION.md` reflete o status atual de Estudos; `ROADMAP.md` Fase 7.3 reflete
o estado avançado do módulo. Frontend (`app/estudos/`) foi gerado depois da
confirmação de execução, seguindo a disciplina de schema-first do projeto.

**Fase 2 registrada (não descartada), ver `BACKLOG.md`:** Cursos (estrutura
própria), Flashcards/integração Anki, Redação versionada (múltiplas
versões, competências detalhadas), Calendário acadêmico próprio (absorvido
pelo módulo Agenda quando dedicado), metas/streak (avaliar sobreposição com
módulo Hábitos quando planejado), estatísticas avançadas (ranking de
conteúdos fracos/fortes, eficiência — dependem de volume real de dado),
upload de arquivo de prova/gabarito em simulados.

## DEC-036 — Estudos v2 Fase 1B: conteúdo compartilhado entre módulos, Curso com hierarquia própria, Prova vs. Simulado como estruturas distintas

**Data:** 2026-07-23 (planejamento detalhado de ENEM/Escola/Curso)
**Status:** ✅ Aprovada, migration executada, camada de dados e páginas implementadas

### Contexto
Sessão de brainstorm estruturado (pergunta-resposta) sobre o funcionamento real
de ENEM, Escola e Curso dentro de Estudos v2, partindo de um rascunho amplo do
usuário (escrito originalmente como brainstorm livre, sem compromisso de
escopo). A sessão revelou 3 decisões estruturais que a Fase 1 (DEC-035) não cobria:

1. O mesmo conteúdo (ex: "Funções") pode ser estudado simultaneamente para
   ENEM e Escola, com um único checklist/progresso — não duplicado por módulo.
2. **Prova** (evento oficial — Escola ou dia de ENEM, com gabarito
   questão-a-questão) e **Simulado** (sessão informal por conteúdo, iniciada
   livremente pelo usuário) são conceitos diferentes. Só o Simulado alimenta a
   revisão espaçada (SM-2); Prova nunca influencia `revisao_espacada`.
3. Curso tem hierarquia própria (Curso → Módulo → Aula), diferente da
   estrutura flat de ENEM/Escola (Matéria → Conteúdo direto).

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
`016_estudos_v2_fase1b.sql` — executada e confirmada em 2026-07-23.
`DATABASE.md` reflete o schema final consolidado de Estudos v2. Frontend de
Estudos (`app/estudos/`) foi gerado depois da confirmação, seguindo a
disciplina de schema-first do projeto (com uma exceção pontual registrada
logo abaixo, referente só à ordem de geração de frontend vs. teste manual,
não à execução da migration em si).

### Nota — Exceção pontual à disciplina schema-first (2026-07-23)
Por indisponibilidade do usuário para testar no momento, o frontend de
Estudos v2 (Fase 1 + Fase 1B) foi gerado **antes** da confirmação de
execução de `016_estudos_v2_fase1b.sql` no Supabase — decisão explícita e
consciente do usuário, não mudança na regra. Regra permanece em vigor:
risco assumido é de possível divergência de nome de coluna/constraint até a
migration ser efetivamente rodada e testada. Precedente conhecido: mesma
exceção ocorreu uma vez na v1 (`estudos.html`, ver `CHANGELOG.md`,
2026-07-09/10), corrigida depois sem maiores problemas.

## DEC-037 — Nova paleta (verde-oliva/off-white, via v0.dev) vira padrão do sistema

**Data:** 2026-07-25
**Status:** ✅ Aprovada e implementada · exceção original da Biblioteca superada pela DEC-049

### Contexto
Durante o design de Estudos v2 no v0.dev, o usuário aprovou o resultado visual
das primeiras telas (Hub, ENEM, Gabarito, Escola) — paleta em tons de
verde-oliva sobre off-white (claro) e cinza neutro (escuro), diferente do
dourado/âmbar adotado em `DEC-034`.

### Decisão
A paleta do v0.dev substitui o dourado/âmbar como padrão do sistema
(Dashboard, Treino, Estudos e módulos futuros). **Biblioteca é exceção
explícita** — mantém a paleta dourada da DEC-034, por decisão do usuário
(incerteza declarada sobre se o dourado vibrante combina com o estilo novo,
resolvida por enquanto como "não mexe na Biblioteca").

### Impacto
- `globals.css`: valores de `--bg`/`--surface`/`--accent`/`--text`/
  `--texto-secundario` (nomenclatura DEC-034) atualizados para os novos
  tons, em vez de dourado — cascateia automaticamente pra Treino/Dashboard
  via CSS Modules, sem alteração de componente.
- Biblioteca (`app/biblioteca/layout.tsx`) ganha override local reafirmando
  os valores dourados da DEC-034 dentro da própria subárvore — única
  exceção de tema no sistema até agora.
- `DESIGN.md` precisa de nova seção de paleta (substituindo a tabela da
  DEC-034 como padrão, com a DEC-034 rebaixada a "exceção — só Biblioteca").

## DEC-038 — Adoção antecipada de Tailwind v4 + shadcn/ui, escopo inicial: só Estudos (reabre parcialmente o item de v3 do BACKLOG)

**Data:** 2026-07-25
**Status:** ✅ Aprovada e implementada

### Contexto
O design de Estudos v2 foi gerado no v0.dev, que produz Tailwind v4 +
shadcn/ui por padrão. O usuário aprovou 100% do resultado visual e decidiu
manter a stack gerada em vez de portar pixel-a-pixel pra CSS Modules.
`BACKLOG.md` já registrava migração de CSS Modules pra Tailwind como item
de "v3 (futuro distante)" — decisão tomada durante o planejamento da v2
(2026-07-14) de não empilhar duas mudanças de stack de uma vez.

### Decisão
Tailwind + shadcn/ui é adotado **agora**, escopo inicial limitado ao módulo
Estudos. Treino e Biblioteca continuam em CSS Modules — **stack mista
aceita conscientemente**, não é inconsistência não intencional. Migração do
restante do sistema (Treino, Biblioteca) pra Tailwind fica em aberto, sem
data — pode acontecer módulo a módulo no futuro ou nunca, a decidir.

Os dois vocabulários de variável de cor (CSS Modules: `--bg`/`--surface`/
`--accent`; shadcn: `--background`/`--card`/`--primary`) coexistem no mesmo
`:root` de `globals.css`, ambos apontando pros mesmos valores (DEC-037) —
garante que a paleta seja uma fonte única da verdade, mesmo consumida por
dois sistemas de estilização diferentes.

### Justificativa
Atende PROJECT_PRINCIPLES.md #9 (stack só muda com justificativa forte): a
justificativa aqui é decisão direta do usuário sobre resultado visual já
aprovado, não preferência técnica não fundamentada — mesmo padrão de
"decisão de design é prerrogativa do usuário" já usado na DEC-034.

### Impacto
- O projeto ganhou Tailwind v4, `lucide-react`, `tw-animate-css` e componentes
  `components/ui/*` gerados segundo o padrão shadcn. A CLI `shadcn` não é
  dependência de runtime e foi removida do `package.json` durante a consolidação
  de reprodutibilidade de 2026-08-08. `components.json` e os componentes gerados
  permanecem.
- `app/estudos/**` passa a usar classes Tailwind + componentes de
  `components/ui/*` (shadcn) em vez de CSS Modules
- `BACKLOG.md` → item "Migrar estilização de CSS Modules para Tailwind"
  sai da seção "v3 (futuro distante)" — parte disso já está em andamento
- `ARCHITECTURE.md` → seção Frontend ganha nota sobre stack mista
  (CSS Modules em Treino/Biblioteca, Tailwind+shadcn em Estudos)

## DEC-039 — Toggle claro/escuro no sistema

**Data:** 2026-07-25
**Status:** ✅ Aprovada e implementada · exceção original da Biblioteca superada pela DEC-049

### Contexto
O site hoje não tem modo claro — `:root` único, sempre escuro, sem mecanismo
de troca. O design aprovado do v0.dev (DEC-037) inclui variante clara e
escura completas. Usuário decidiu que quer as duas de verdade, com toggle
funcional, no sistema inteiro.

### Decisão
Dashboard, Treino e Estudos ganham toggle claro/escuro real, com preferência
persistida (`localStorage`, sem lib nova — implementação própria simples,
ver `PROJECT_PRINCIPLES.md` #6/#7). **Biblioteca fica de fora**: continua
fixa no tema dourado/escuro da DEC-034, sem toggle — o controle de troca
fica oculto nas rotas `/biblioteca/*` pra não sugerir uma opção que não faz
nada ali.

Mecanismo: classe `.dark`/ausência dela na tag `<html>`, controlada por um
`ThemeProvider` próprio (contexto React + `localStorage`), sem adicionar
`next-themes` ou lib equivalente — o projeto já usa poucas dependências por
princípio. Script inline no `<head>` evita flash de tema errado no
carregamento (lê `localStorage` antes do React hidratar).

A exceção de tema da Biblioteca (override local de `--bg`/`--surface`/
`--accent` no `layout.tsx` dela, ver DEC-037) já resolve isso sozinha: como
são variáveis CSS locais, elas ganham de qualquer `.dark`/ausência de `.dark`
herdada do `<html>`, então a Biblioteca nunca muda de cor mesmo que o toggle
global seja acionado em outra aba/rota.

### Impacto
- Novo componente `components/ThemeProvider.tsx` + `components/ThemeToggle.tsx`
- `app/layout.tsx` ganha o provider + script anti-flash + botão de toggle
  (oculto condicionalmente em `/biblioteca/*` via `usePathname`)
- `globals.css` ganha bloco `.dark` completo ao lado do `:root` (claro),
  nos dois vocabulários de variável (CSS Modules antigo + shadcn novo)

## DEC-040 — Matéria é linha única, compartilhada entre Escola e ENEM (corrige modelagem errada da mesma sessão)

**Data:** 2026-08
**Status:** ✅ Aprovada e executada (migration 018)

### Contexto
Ao desenhar o gabarito ENEM com hierarquia Área→Matéria→Conteúdo, uma
primeira tentativa modelou matéria como duas linhas (`tipo='escola'` /
`tipo='enem'`) pra separar o que cada módulo mostra. O usuário corrigiu:
matéria (ex: "Física") é uma única entidade — o que muda entre os módulos é
só o que a tela decide exibir (Escola mostra Provas+Atividades+Simulados;
ENEM mostra só Conteúdos+Simulados), não o dado em si.

### Decisão
`materias.tipo` perde os valores `'enem'`/`'escola'`, ganha `'academica'`
(cobre ambos os módulos). Duas colunas booleanas novas — `mostra_escola`,
`mostra_enem` — controlam em qual(is) tela(s) a matéria aparece; não são
mutuamente exclusivas. `area_enem` continua existindo, significativa só
quando `mostra_enem = true`. Página de Matéria
(`app/estudos/materia/[materiaUuid]/page.tsx`) decide o que renderizar pelo
parâmetro `?from=escola|enem` da URL, não por um campo da matéria.

### Impacto
Migration `018` limpa as matérias duplicadas de teste (cascata manual — ver
`DATABASE.md` → Gotchas) e adiciona as duas flags. `lib/materias.ts`
reescrito: seed cria uma linha por matéria (não duas), funções novas
`listarMateriasEscola()`, `listarTodasMateriasEnem()`,
`listarMateriasPorAreaEnem()`, `buscarMateria()`.

---

## DEC-041 — Gabarito ENEM: fluxo em 2 fases (lançar / corrigir), matéria decidida só na correção

**Data:** 2026-08
**Status:** ✅ Aprovada e executada (migrations 017 + 019)

### Contexto
O usuário descreveu o uso real: durante a prova, só dá tempo de marcar a
letra escolhida (como o cartão-resposta oficial do ENEM — 6 blocos de 15
questões, círculos A-E). Matéria, conteúdo/assunto, motivo do erro e
dificuldade só são classificados depois, com calma, na correção — e nem
sempre a correção acontece no mesmo momento em que a prova termina (pode
ficar pendente por dias).

### Decisão
- **Fase lançar:** grade visual (não formulário linha-a-linha) — clicar na
  letra de cada questão. Sem select de "em branco": questão sem clique vira
  `letra_marcada = NULL` automaticamente ao salvar, nunca escolha manual.
  Sem matéria nesta fase.
- **Fase corrigir:** volta a ser lista linha-a-linha, mas agora pede
  **matéria + conteúdo + dificuldade + motivo em toda questão**, não só nas
  erradas (necessário pra estatística de desempenho por matéria/conteúdo
  incluir as questões certas também). `letra_correta` obrigatória por linha;
  `acertou` é sempre derivado (nunca campo manual): `letra_marcada IS NULL`
  → permanece `NULL` (perdida — ficou em branco e o tempo acabou, nem certo
  nem errado); senão, compara `letra_marcada` com `letra_correta`.
- `letra_correta IS NULL` é o sinal de "correção pendente" — cobre tanto
  "ainda não corrigida" quanto, quando preenchida com `acertou = NULL`,
  "perdida de fato". Sem coluna de status redundante.
- `questoes_individuais.materia_uuid` vira nullable (só é preenchida na
  correção). Questão avulsa (fora de gabarito) continua preenchendo tudo na
  hora, sem essa fase dupla.

### Fora de escopo desta leva (registrado, não perdido)
Modo "fazer prova na hora" com upload do PDF, cronômetro (dia 1: 5h30 / dia
2: 5h, a confirmar minutos exatos), trava de edição quando o tempo acaba,
dois modos de exibição de cronômetro (contagem regressiva simples + estilo
"relógio de aplicador" com blocos de 30 em 30 min riscados). Tratado como
módulo/feature própria, grande demais pra entrar junto — ver `BACKLOG.md`.

---

## DEC-042 — Domínio de conteúdo: sem número solto, calculado a partir de repetições + override manual

**Data:** 2026-08
**Status:** ✅ Aprovada e executada (migration 019)

### Contexto
`conteudos.progresso` (0-100, incrementado manualmente em saltos de 25% via
botão "+25%") não tinha critério claro — o usuário não entendia o que ele
representava. Inspirado em uma tabela pessoal (Notion) e no site
Planejativo, o usuário quer dois sinais separados: "já vi a teoria"
(primeiro contato) e "domínio" (baseado em quantas vezes revisou com
sucesso, não um número arbitrário).

### Decisão
- `conteudos.progresso` **removido** (migration 019, `DROP COLUMN`).
- `conteudos.teoria_vista` (novo) — toggle simples de primeiro contato
  (aula/leitura), independente de revisão.
- `conteudos.dominado_manual` (novo) — override manual do usuário.
- **"Dominado" não é gravado, é calculado:** `dominado_manual = true OU
  revisao_espacada.repeticoes >= 5`. `repeticoes` já existe e já conta
  repetições bem-sucedidas via SM-2 (`lib/revisao.ts` — zera no erro,
  incrementa no acerto) — nenhuma coluna de contagem nova foi necessária.
- **Desempenho de questões** por conteúdo também não ganhou coluna nova —
  calculado sob demanda a partir de `questoes_individuais` filtradas por
  `conteudo_uuid` (`lib/questoes-individuais.ts` → `taxaDeAcertoPorConteudo()`).

### Alternativa descartada
Reabrir a DEC-035 e substituir o SM-2 por um checklist fixo de intervalos
(1/3/7/14/30 dias, como no rascunho original do Notion). Descartado porque
o SM-2 adaptativo já é estritamente melhor (intervalo cresce/encolhe
conforme desempenho real, não é fixo) — a real lacuna não era o algoritmo de
revisão, era a ausência de um indicador de "primeiro contato" e de um
critério claro de "domínio", que este DEC resolve sem tocar no SM-2.

---

## DEC-043 — Calendário de revisões no Hub fica simples por ora (sem horário/duração) — reafirma DEC-035

**Data:** 2026-08
**Status:** ✅ Aprovada e implementada

### Contexto
O usuário pediu visibilidade rápida do que precisa revisar ("não adianta a
matéria ter 'próxima revisão em X' se eu não vejo isso de forma rápida") e,
na sequência, pediu também poder escolher horário e duração pra cada
revisão — uma "agenda própria" dentro de Estudos.

### Decisão
A parte 1 (visibilidade) foi resolvida com um card "Revisões pendentes" no
Hub (`app/estudos/page.tsx`), listando os cards de `revisao_espacada`
(`modulo='estudos'`) vencidos ou a vencer nos próximos 7 dias — sem coluna
nova, `pergunta` já guarda o nome do conteúdo. A parte 2 (horário/duração,
agendamento) foi **recusada por ora**: isso é escopo do módulo Agenda (ainda
não iniciado, ver `VISION.md`), e DEC-035 já havia decidido explicitamente
não duplicar essa responsabilidade dentro de Estudos. O usuário concordou em
manter a lista simples até a Agenda existir de verdade.

### Impacto
`lib/revisao.ts` ganha `listarRevisoesPendentes(diasNoFuturo)`. Nenhuma
tabela nova, nenhum campo de horário/duração em `revisao_espacada` ou
`conteudos`.

---

## DEC-044 — Baseline híbrida e adoção do histórico Supabase CLI

**Data:** 2026-08-07/08
**Status:** ✅ Aprovada, replay validado e histórico adotado em produção

### Contexto

O banco evoluiu por `001`–`019` aplicadas manualmente no SQL Editor, sem
`supabase_migrations.schema_migrations`. Parte dos SQLs locais foi perdida,
reconstruída ou alterada depois da execução, tornando impossível provar a
cadeia literal e reproduzi-la com segurança. Produção, porém, pôde ser
capturada por dump e consultas somente leitura.

### Decisão

- `history/legacy-migrations/` preserva `001`–`019` byte a byte como acervo,
  todos com `replay_supported: false`.
- `snapshots/2026-08-07-production/` preserva a evidência do estado remoto,
  sem dados pessoais.
- A cadeia ativa começa em três baselines timestamped: `public`, guard de RLS
  e Storage.
- As baselines reproduzem o estado observado, inclusive imperfeições e
  hardenings pendentes; não reescrevem o passado.
- Depois de dois replays locais completos e ensaio remoto descartável,
  produção registrou as três versões como `applied` por `migration repair`,
  sem executar seus SQLs. `db push --dry-run` confirmou cadeia alinhada.
- Toda alteração futura será migration timestamped incremental. Baseline já
  aplicada é imutável.

### Operação remota

A produção não fica vinculada ao CLI. Enquanto `supabase link` da versão
`2.112.0` permanecer incompatível com o formato atual da Management API,
operações remotas especificamente autorizadas podem usar `--db-url` com
variável de ambiente da sessão. Credenciais, tokens, connection strings e
project refs temporários nunca são versionados ou documentados.

### Estado preservado

`GRANT ALL` nas 44 tabelas, policies atuais de `redacoes` e `exercicios`,
`materias.user_id` sem cascade, ausência de `materias_tipo_check` e demais
hardenings conhecidos permanecem como estado atual. Qualquer alteração nesses
pontos exige migration futura separada; nunca edição retroativa das baselines.

---

## DEC-045 — Toolchain reproduzível e CI mínima do frontend

**Data:** 2026-08-08
**Status:** ✅ Aprovada e implementada

### Decisão

- Node.js `24.15.0` e npm `12.0.1` são o toolchain local/CI fixado para todo o
  repositório. `.nvmrc` fixa o patch; `engines.node = 24.x` seleciona a major
  suportada na Vercel, que atualiza patches automaticamente; `packageManager`
  fixa o npm.
- `npm ci` é o único fluxo normal de instalação; lockfiles não são atualizados
  oportunisticamente.
- A CI executa instalação, typecheck e build como etapas bloqueantes, sem
  segredos ou deploy. Lint permanece informativo enquanto a dívida catalogada
  de 43 achados existir.
- Não se adiciona framework de testes só para criar cobertura nominal. Hoje os
  testes automatizados são os testes SQL locais da baseline; a ausência de
  testes de frontend fica explícita no backlog.

### Justificativa

Next.js 16 exige Node.js 20.9 ou superior; a linha 24 é LTS, é suportada pela
Vercel e o patch local escolhido é o ambiente em que a instalação limpa, o
typecheck e o build foram validados.
Fixar também o npm evita comportamento divergente do npm 12 sobre scripts de
instalação e lockfile. O lint não pode ser bloqueante sem manter a CI
permanentemente vermelha nem pode ser silenciado sem resolver a dívida.

---

## DEC-046 — Agenda é dona do planejamento temporal

**Data:** 2026-08-11
**Status:** ✅ Aprovada, migration aplicada em produção e frontend implementado

### Decisão

- Agenda organiza quando compromissos e estudos devem acontecer.
- Estudos permanece fonte de verdade de matérias, conteúdos e provas; a
  Agenda referencia essas entidades e lê `provas` sem duplicar registros.
- Treinos podem ser vinculados pelo `treino_uuid` já existente.
- Google Calendar, OAuth, sincronização externa e criação automática de
  compromissos a partir da Revisão Espaçada ficam fora desta fase.
- A tabela `agenda` evolui incrementalmente pela migration
  `20260811000100_agenda_v2.sql`; nenhuma baseline é alterada.

### Estado operacional

O frontend e a migration foram preparados e validados localmente por reset,
teste consolidado e teste específico. A migration foi aplicada em produção
pela cadeia ativa em 2026-08-11, com pós-check remoto sem pendências; `/agenda`
está liberada para publicação.

---

## DEC-047 — Vídeos e Artigos são categorias próprias da Biblioteca

**Data:** 2026-08-11
**Status:** ✅ Aprovada, migration aplicada em produção e frontend implementado

### Decisão

- Vídeos e Artigos entram na página única e sidebar da Biblioteca (DEC-032).
- Cada entidade possui tabela própria, seguindo a separação por tipo de mídia
  da DEC-014 e evitando uma tabela genérica com muitos campos nulos.
- O primeiro fluxo é cadastro manual. YouTube API, extensão, scraping,
  importação automática e API Routes ficam fora desta etapa inicial. A
  evolução posterior está registrada na DEC-051.
- `videos.youtube_id` é metadado opcional extraído localmente de URLs
  reconhecidas; não representa integração externa.
- A conversão de Vídeo em Curso de Estudos será desenhada em etapa própria;
  nenhuma FK prematura foi criada.

### Estado operacional

A migration `20260811000200_biblioteca_videos_artigos.sql` foi aplicada em
produção em 2026-08-11. O frontend das duas categorias está validado e pode
ser publicado quando não houver outra migration dependente pendente no lote.

---

## DEC-048 — Vídeo da Biblioteca pode originar conteúdo de Curso por FK opcional

**Data:** 2026-08-11
**Status:** ✅ Aprovada, migration aplicada em produção e frontend implementado

### Decisão

- `conteudos.video_uuid` referencia opcionalmente `videos.uuid`; o vídeo
  permanece na Biblioteca e o conteúdo continua pertencendo ao Curso.
- O usuário escolhe explicitamente um curso e um módulo existente ou novo.
- O mesmo vídeo não é adicionado duas vezes ao mesmo curso pela interface.
- `videos.assistido` e `conteudos.teoria_vista`/`dominado_manual` permanecem
  independentes; não há sincronização implícita de progresso.
- A tela de Curso lê os metadados do vídeo pela FK e oferece apenas um link
  simples, sem player, API externa ou scraping.

### Justificativa

Copiar apenas título e URL perderia a origem e dificultaria evoluções futuras.
A FK nullable preserva rastreabilidade com uma alteração pequena, sem obrigar
conteúdos comuns a terem vídeo e sem misturar as responsabilidades dos dois
módulos.

### Estado operacional

A migration `20260811000300_conteudos_video.sql` foi validada por reset local,
teste consolidado e teste específico, aplicada em produção em 2026-08-12 e
confirmada por pós-check remoto sem pendências. O fluxo está liberado para
publicação.

---

## DEC-049 — Biblioteca adota o tema global e o perfil passa ao topo global

**Data:** 2026-08-12
**Status:** ✅ Aprovada pelo usuário e implementada

### Contexto

No teste manual final, a exceção dourada e escura da Biblioteca deixou de
ajudar: criava contraste diferente do restante do sistema, escondia o toggle
e contribuía para uma composição recortada entre navegação, perfil e sidebar.
O perfil dentro da sidebar também ficava cortado pela combinação de alturas e
rolagens internas. Esta é informação visual nova e supera somente as exceções
temporárias registradas nas DEC-037/039; a stack CSS Modules da DEC-038 e o
fluxo de página única da DEC-032 permanecem.

Após o primeiro deploy, o usuário esclareceu que o perfil não é uma identidade
visual exclusiva da Biblioteca: ele deve substituir a marca textual “Sistema
Pessoal” em toda a navegação global. O link “Início” já é o único caminho
visual necessário para a Home.

### Decisão

- Biblioteca passa a consumir os mesmos tokens claro/escuro globais dos
  demais módulos; o override `.bibliotecaTheme` é removido e o toggle aparece
  também nas rotas `/biblioteca`.
- Avatar, nome e background opcional de `user_metadata` ficam no início da
  navegação global em todas as rotas autenticadas, substituindo a marca textual
  “Sistema Pessoal”. A área não duplica o link para a Home. Desde 2026-08-12,
  ela abre `/configuracoes`, onde nome, descrição curta, avatar e background
  são persistidos em `user_metadata`, sem tabela própria.
- A sidebar fica dedicada a busca, categorias, gêneros e ação de adicionar.
- Mosaico de capas, banner e CRUD permanecem; não há mudança de schema nem de
  responsabilidade da Biblioteca.

### Impacto

O layout deixa de criar rolagem própria no conteúdo e calcula a sidebar abaixo
da navegação responsiva. Cores de texto e controles antes fixadas para fundo
escuro passam a usar tokens semânticos, preservando contraste nos dois temas.
O perfil é carregado uma vez pelo `GlobalNav`, independentemente do módulo
ativo; a sidebar da Biblioteca permanece sem duplicação. Após validação visual
em produção, o topo foi consolidado em uma única grade responsiva com áreas
explícitas para perfil, navegação e logout. A borda inferior pertence somente
ao `header`, e as camadas visuais do perfil ficam contidas na célula esquerda.

---

## DEC-050 — Projetos e Receitas começam como módulos locais simples

**Data:** 2026-08-12
**Status:** ✅ Implementada; migration aplicada em produção

### Decisão

- Projetos usa `projetos` e `projetos_tarefas`, com tarefas nos estados
  `a_fazer`, `fazendo` e `feito`. A movimentação inicial usa botões; não há
  drag-and-drop, colaboração ou automação.
- Receitas usa uma tabela `receitas`, com ingredientes e preparo em texto,
  favorito, estado feita/não feita e nota de 0 a 10.
- A foto de receita é apenas `foto_url`; não foi criado bucket ou upload.
- Ambos fazem CRUD direto pelo client Supabase sob RLS e GRANT, sem API Route,
  serviço externo ou dependência nova.
- Exclusões seguem o soft delete universal e passam por `ConfirmDialog`.

### Justificativa

O escopo entrega utilidade real com contratos pequenos e independentes. As
evoluções de colaboração, anexos, automações e integrações podem ser avaliadas
sem inflar o primeiro schema nem misturar responsabilidades de outros módulos.

---

## DEC-051 — Metadados externos da Biblioteca usam API Route unificada

**Data:** 2026-08-12
**Status:** ✅ Aprovada e implementada

### Decisão

- Uma API Route do Next.js centraliza as consultas de metadados e segue a
  responsabilidade serverless já aprovada na DEC-018.
- `YOUTUBE_API_KEY` e `TMDB_API_KEY` são variáveis exclusivas do servidor,
  nunca expostas com prefixo `NEXT_PUBLIC_`.
- Google Books, Jikan e iTunes Search também passam pela rota unificada para
  padronizar erros e contratos, embora não exijam segredo.
- Falha, limite externo ou chave ausente nunca bloqueia o CRUD: todos os
  formulários preservam o preenchimento manual.
- A consulta nasce do próprio campo de título após debounce, sem campo ou
  botão de busca paralelo. Em Vídeos, a URL do YouTube tem prioridade quando
  preenchida; sem URL, o título pode localizar vídeos quando a chave existe.
- Não há scraping, dependência nova, mudança de schema ou fonte de verdade;
  os resultados apenas preenchem colunas já existentes antes da confirmação
  do usuário.

---

## DEC-052 — Saúde, Finanças e Lugares começam como módulos manuais independentes

**Data:** 2026-08-13
**Status:** ✅ Implementada; migration aplicada em produção

### Decisão

- Saúde registra sono, hidratação, humor e medicamentos em tabelas próprias,
  mas não cria `saude_peso`: `shape` permanece a única fonte de verdade para
  peso e fotos corporais. `/saude` apenas consulta o último peso e aponta para
  `/treino/shape` para manutenção desse histórico.
- Finanças começa com categorias, lançamentos, orçamentos mensais e metas de
  economia. Não há recorrência, importação bancária nem cotação externa.
- Lugares começa com cadastro manual e link externo para Google Maps montado a
  partir de coordenadas ou endereço. Não há Maps API, Places API, upload ou
  Google Photos.
- Os três módulos usam acesso direto pelo cliente Supabase sob Auth/RLS/GRANT,
  UUID textual no padrão atual, `updated_at`, soft delete e `ConfirmDialog`.

### Justificativa

O lote entrega uso real com contratos pequenos e separa claramente os domínios.
Reutilizar `shape` evita duas fontes concorrentes para peso; integrações externas
e automações ficam para decisões próprias, com análise de segurança e custo.

---

## DEC-053 — Diário agrupa áreas cotidianas e módulos podem ter dashboards próprios

**Data:** 2026-08-13
**Status:** ✅ Aprovada pelo usuário e implementada

### Decisão

- `/diario` é um portal/dashboard de Saúde, Finanças, Lugares e Receitas; não
  possui tabela nem cria uma segunda fonte de verdade para esses módulos.
- As quatro rotas permanecem independentes para seus CRUDs, mas deixam de
  ocupar a navegação global. O item Diário fica ativo também dentro delas.
- Nesta fase, Diário não é editor de texto nem histórico cronológico livre. O
  nome representa a visão cotidiana integrada definida pelo usuário.
- O Hub global continua mostrando prioridades transversais. Módulos amplos
  podem ter dashboards próprios: `/treino` passa a resumir sessões, planos,
  exercícios e Shape antes de levar às rotas operacionais.
- A imagem real do background fica restrita ao bloco de perfil e desaparece
  com máscara antes da navegação. O restante da barra usa apenas manchas e
  fragmentos abstratos derivados dos tokens do tema, mais presentes até a
  região de “Início” e progressivamente mais discretos depois.

### Impacto

A mudança é somente de composição e leitura: usa tabelas, RLS e bibliotecas já
existentes. Não exige migration, Storage, API externa ou dependência nova.

---

## DEC-054 — Biblioteca volta à escala de 0-5 estrelas com meio ponto

**Data:** 2026-08-14
**Status:** ✅ Implementada, validada localmente e aplicada em produção em 2026-08-14; pós-check sem pendências

### Decisão

- Esta decisão reabre explicitamente a DEC-033. A nota principal de Filmes,
  Séries, Animes, Mangás, Livros, Podcasts e Vídeos passa de 0-10 decimal para
  0-5 estrelas em passos de 0.5.
- `artigos` permanece sem nota: a tabela não possui esse campo e a mudança não
  cria um contrato novo sem necessidade de produto.
- A migration incremental `20260813000200_biblioteca_nota_cinco_estrelas.sql`
  converte valores existentes dividindo por 2 e arredondando ao meio ponto mais
  próximo, altera as sete colunas para `NUMERIC(2,1)` e impõe faixa e passo por
  `CHECK`.
- Formulários usam um seletor visual de cinco estrelas, incluindo zero, meias
  estrelas e ausência de nota. Cards e painéis exibem a escala de cinco.
- A ordenação da coleção é local e pode usar recência, título, nota, favorito
  ou status; não cria preferência persistida nem coluna adicional.

### Justificativa

A referência visual aprovada e o uso pessoal favorecem a leitura direta por
estrelas. Como ainda não há volume relevante de dados reais, a conversão é
controlada e preserva proporcionalmente eventuais notas existentes. O teste
SQL local cobre tipo, constraints e exemplos de conversão antes de qualquer
operação remota.

---

## DEC-055 — Idiomas é domínio próprio; outras áreas reutilizam Estudos; Histórico é calculado

**Data:** 2026-08-15
**Status:** ✅ Implementada; migration aplicada em produção

### Contexto

O próximo lote precisava acomodar Idiomas, Olimpíadas, Vestibulares, Outros
estudos e uma retrospectiva anual. Forçar tudo em `materias` criaria campos
artificiais para vocabulário e prática; criar domínios separados para cada área
acadêmica duplicaria `conteudos`, sessões e vínculos já existentes. Persistir o
heatmap também duplicaria eventos cuja fonte de verdade já existe.

### Decisão

- Idiomas usa domínio próprio (`idiomas`, `idiomas_vocabulario` e
  `idiomas_praticas`) porque nível, objetivo, domínio de termos e prática têm
  ciclo de vida diferente de Matéria → Conteúdo. Não há Anki, IA, áudio ou API.
- Olimpíadas, Vestibulares e Outros estudos usam novos valores de
  `materias.tipo` e reaproveitam conteúdo, revisão, materiais, anotações,
  sessões, provas, atividades e simulados. Agenda continua dona do tempo.
- `/historico` calcula atividade por dia diretamente das tabelas existentes.
  Cada registro vale uma ocorrência dentro da própria área; duração, valor e
  nota não são somados entre domínios. Não existe tabela agregada.
- Idiomas e Histórico entram no Hub e na navegação global; o topo usa ícones no
  intervalo intermediário para não provocar overflow.

### Impacto

A migration incremental `20260814000100_idiomas.sql` adiciona somente as três
tabelas de Idiomas com RLS, policies, GRANTs, checks e índices. As áreas
acadêmicas e o heatmap não exigem schema novo nem integração externa.

---

## DEC-056 — Programação especializa Projetos; investimento separa posição de cotação; CSV/TSV é o limite do Anki leve

**Data:** 2026-08-15
**Status:** ✅ Implementada; migration aplicada em produção

### Contexto

Programação precisava de uma visão própria sem repetir o domínio de Projetos.
Finanças precisava registrar patrimônio sem transformar preço externo em fonte
de verdade local. Revisão podia absorver exportações tabuladas, mas `.apkg`
exigiria ZIP, SQLite, mídia e decisões de modelo fora do lote. A auditoria de
uploads também encontrou destinos e policies ainda incompletos.

### Decisão

- `/programacao` filtra e edita registros de `projetos` que tenham repositório
  ou linguagem principal; `destaque` ordena a visão e alimenta o Hub. Não há
  tabela paralela nem GitHub API.
- `financas_investimentos` persiste ticker, tipo, quantidade e preço médio. A
  cotação é consultada sob demanda por API Route server-side, usa
  `BRAPI_TOKEN` opcional e nunca é gravada. Sem token, o CRUD permanece íntegro.
- `/revisao` aceita CSV/TSV com cabeçalhos `pergunta`, `resposta` e `modulo`
  opcional, até 1 MB/500 cards, e ignora duplicados por pergunta/resposta do
  usuário. `.apkg` permanece backlog.
- O Histórico não conta posições: elas não possuem data de negócio e usar
  `updated_at` confundiria edição cadastral com atividade financeira. Os
  lançamentos continuam sendo a fonte retrospectiva de Finanças.
- Perfil, Receitas e Lugares continuam usando URL; `banner_path` segue sem
  destino definido; upload de exercício aguarda policy `WITH CHECK` segura.

### Impacto

A migration `20260815000100_programacao_investimentos.sql` adiciona três campos
a `projetos` e cria uma tabela com RLS, policy, GRANTs, checks e índices. Hub,
Diário e navegação leem os novos contratos sem dependência nova ou cache de API.

---

## DEC-057 — v2.1 prioriza melhorias locais e endurece contratos existentes

**Data:** 2026-08-15
**Status:** ✅ Implementada; migration aplicada em produção

### Decisão

- A Agenda mantém uma única fonte de dados e adiciona apenas a visão mensal.
- Histórico e Revisão evoluem no cliente, com resumo/exportação e prévia de
  importação, sem tabelas agregadas ou parser `.apkg`.
- Imagens de exercícios usam o bucket privado `exercicios`, path por usuário,
  signed URL e rollback quando o registro falha; não nasce bucket genérico.
- O domínio real de `materias.tipo`, sua FK de usuário e as policies de
  `exercicios`/`redacoes` são alinhados exclusivamente por migration incremental.
- Uploads sem destino inequívoco, recorrência financeira e integrações externas
  permanecem no backlog até possuírem contrato próprio.

### Impacto

`20260815000200_v21_hardening.sql` não cria tabelas: normaliza o tipo de
matéria, adiciona CHECK/default, cascade e policies completas para usuários
autenticados. O frontend ganha somente melhorias sobre dados e rotas existentes.

---

## DEC-058 — Fechamento da homologação amplia temas, Shape e execução do ENEM sem novos domínios

**Data:** 2026-08-20
**Status:** ✅ Implementada e publicada

### Decisão

- O seletor global preserva claro/escuro e acrescenta um tema claro suave no
  mesmo `ThemeProvider` e na mesma chave de `localStorage`, sem dependência.
- Botões primários de CSS Modules usam tokens semânticos de ação baseados em
  `primary`/`primary-foreground`; `accent` continua reservado a wash e destaque.
- Shape continua em sua tabela/bucket atuais. Edição, exclusão lógica e troca de
  foto usam `updated_at` para desempatar registros do mesmo dia; o dashboard
  assina as fotos existentes e calcula 10 pontos por sessão concluída, sem
  persistir pontuação artificial.
- A primeira versão de “Fazer prova ENEM” reutiliza `provas`, as 90 linhas do
  gabarito e `tempo_minutos`. O prazo fica localmente no navegador, usa 330
  minutos no Dia 1 e 300 no Dia 2, salva respostas em branco ao finalizar e
  deixa redação/correção para os fluxos já existentes. PDF e relógio de
  aplicador continuam no backlog.
- `redacoes.nota` deve comportar a soma válida de cinco competências de 200.
  A correção é `NUMERIC(5,1)` com faixa 0–1000 em migration incremental; não se
  descarta nem arredonda a nota para contornar o schema incorreto.

### Estado operacional

O frontend passou em typecheck e build. A migration passou reset e 12 testes
SQL; o dry-run remoto listou somente `20260820000100_redacoes_nota_mil.sql`,
aplicada com autorização explícita em 2026-08-20. O pós-check confirmou
`NUMERIC(5,1)`, faixa 0–1000, histórico alinhado e nenhuma migration pendente.

---

## DEC-059 — Redação cronometrada reutiliza o domínio e o Storage existentes

**Data:** 2026-08-20
**Status:** ✅ Implementada; migration aplicada em produção

### Decisão

- O tempo de execução pertence à própria `redacoes` e é persistido como total
  opcional em minutos. A interface recebe horas/minutos separados; não nasce
  tipo intervalar, cronômetro paralelo nem tabela de sessões de redação.
- As competências do ENEM são controladas na interface em passos de 40, com
  domínio 0–200 por competência e total derivado 0–1000.
- O modo “Fazer prova” continua gravando as 90 posições para preservar o
  cartão-resposta, mas o resumo conta como respondida somente a linha com
  `letra_marcada` preenchida e mostra os brancos separadamente.
- A redação do Dia 1 reutiliza `provas.redacao_uuid`, a tabela `redacoes` e o
  bucket privado `redacoes`. Tema e imagem podem ser salvos durante a prova;
  texto, competências, comentário e nota permanecem completáveis depois.
- Não foi criado bucket, tabela, API externa ou fluxo de correção automática.

### Estado operacional

`20260820000200_redacoes_tempo_execucao.sql` passou reset local e 13 testes
SQL. O dry-run remoto listou somente essa migration; a aplicação foi autorizada
e o pós-check confirmou coluna, constraint, histórico e dry-run final vazio.

---

## DEC-060 — Aparência global usa controlador meteorológico e perfil abre resumo

**Data:** 2026-08-20
**Status:** ✅ Implementada localmente; homologação visual pendente

### Decisão

- A preferência global mantém a mesma chave de `localStorage` e os valores
  anteriores `claro`, `suave` e `escuro`; `nublado` acrescenta uma paleta clara
  azulada e `estrelado` uma paleta escura azul-marinho.
- O topo exibe um único botão de aparência. Seu dropdown organiza os cinco
  estados numa linha meteorológica contínua e reserva apenas texto informativo
  para ajustes futuros, sem simular funcionalidade inexistente.
- Clicar em avatar/nome abre um resumo baseado em `user_metadata` e na sessão
  existente. Somente “Editar perfil” navega para `/configuracoes`; clique
  externo, Escape e troca de rota fecham o painel.
- Não há schema, bucket, API ou dependência nova. Prioridade da Agenda e uploads
  da Biblioteca permanecem adiados até terem contrato de produto/Storage.

### Impacto

`ThemeProvider`, aplicação pré-hidratação e tokens semânticos passam a aceitar
cinco temas. O `GlobalNav` centraliza os dois dropdowns e impede que perfil e
aparência permaneçam abertos simultaneamente. A validação manual nos cinco
temas, desktop e mobile, continua obrigatória antes de encerrar a homologação.

---

## DEC-061 — Atmosfera separa iluminação, decoração e cor ambiente

**Data:** 2026-08-20
**Status:** ✅ Implementada localmente; homologação visual pendente

### Decisão

- Os valores existentes de tema continuam compatíveis, mas são apresentados
  como iluminações: `claro`/Sol, `suave`, `nublado`, `estrelado` e `escuro`/Lua.
- A decoração é uma preferência local independente: Primavera, Verão, Outono,
  Inverno ou Nenhum. “Noite” foi removida porque não é estação do ano;
  `estrelado` continua pertencendo somente à iluminação. O valor local legado
  `noite` migra automaticamente para `nenhum`.
- A cor ambiente é persistida em `localStorage`, não em `user_metadata`. Isso
  evita escrita remota para uma preferência puramente visual e mantém o lote
  sem schema, API ou sincronização de conta.
- A imagem real de `background_url` permanece restrita ao bloco do perfil. O
  restante do topo recebe somente cor, brilho e partículas abstratas, com maior
  densidade à esquerda e dissipação progressiva para proteger a navegação.
- As iluminações não são fundos literais: cada uma define profundidade da
  página, cards, vidro, bordas, texto, header e sombras. As estações alteram
  forma, cor e movimento das partículas sem entrar nos módulos funcionais.

### Impacto

O `ThemeProvider` passa a coordenar três preferências locais e o script
pré-hidratação evita troca visual tardia. O dropdown “Atmosfera” controla duas
dimensões, enquanto o resumo do perfil controla a cor. `prefers-reduced-motion`
desativa animações; “Nenhum” remove a decoração. Não há mudança em dados de
negócio, Supabase, uploads, rotas funcionais ou dependências.

---

## DEC-062 — Prioridade da Agenda é manual e desempata a ordem cronológica

**Data:** 2026-08-20
**Status:** ✅ Aceita e aplicada em produção

### Decisão

- Eventos manuais de `agenda` têm prioridade `baixa`, `normal` ou `alta`, com
  `normal` como default. O banco rejeita qualquer outro valor.
- A Agenda continua cronológica: data e horário vêm primeiro; eventos no mesmo
  horário são desempatatados por alta, normal e baixa, depois por título/UUID.
  Eventos sem horário ficam após os horários definidos.
- A prioridade aparece de forma compacta nos cards e pode ser criada/editada no
  modal. Provas continuam pertencendo a Estudos, sem receber coluna paralela,
  edição ou cópia na Agenda.
- Recorrência/parcelamento financeiro não entra neste lote: antes do schema é
  necessário decidir vínculo do grupo, edição de uma parcela versus série e
  cancelamento reversível.

### Impacto

`20260820000300_agenda_prioridade.sql` adiciona uma coluna e um check, mantendo
RLS e GRANT existentes. A migration foi aplicada em 2026-08-21 após dry-run
exclusivo e pós-check remoto vazio; o frontend foi publicado somente depois.

## DEC-063 — Séries financeiras são lançamentos finitos e independentes

**Data:** 2026-08-21
**Status:** ✅ Implementada; homologação manual pendente

Parcelamento divide o valor total em centavos sem perder soma; recorrência repete o valor mensal. Ambos criam de 2 a 120 lançamentos reais em uma única inserção e identificam `N/total` na descrição. Não há grupo, cron ou recorrência infinita; edição e exclusão afetam somente o lançamento selecionado.

## DEC-064 — Capas privadas e integrações externas não simuladas

**Data:** 2026-08-21
**Status:** ✅ Migration aplicada em produção; homologação manual pendente

As oito categorias usam o bucket privado `capas`, paths iniciados por `auth.uid()`, signed URL, JPG/PNG/WebP até 3 MB, rollback e limpeza na substituição. URL externa de metadados continua fallback. YouTube/Calendar/Photos não exibem estado conectado antes de existir OAuth server-side com refresh token cifrado e revogável; a arquitetura está em `INTEGRACOES_EXTERNAS.md`.

## DEC-065 — OAuth Google fica em API Routes com cofre cifrado

**Data:** 2026-08-21
**Status:** ✅ Implementada e migration aplicada; credenciais/deploy pendem do Gabriel

### Decisão

- OAuth usa `state` HttpOnly, PKCE, callback server-side e escopos mínimos de
  identidade/e-mail, YouTube somente leitura e eventos do Calendar.
- Access/refresh tokens são cifrados integralmente por AES-256-GCM. A chave de
  32 bytes e `service_role` vivem somente no ambiente do servidor.
- `integracoes_google` tem RLS ativa e nenhuma policy de cliente; apenas API
  Routes que primeiro validam o usuário podem usar o service role.
- Calendar é unilateral e individual na v2.1. O ID remoto gravado em `agenda`
  torna reexportação uma atualização; provas de Estudos não entram nesse fluxo.
- A decisão DEC-009 continua histórica para o MVP e foi superada pela
  autorização explícita deste fechamento da v2.1.

### Impacto

Sem as variáveis, a UI permanece funcional em estado “não configurado”. A
produção não quebra nem simula conexão. Bidirecional, conflitos e exclusões
remotas continuam pós-v2.

## DEC-066 — Storage privado substitui Photos e `.apkg` tem contrato limitado

**Data:** 2026-08-21
**Status:** ✅ Implementada; homologação manual pendente

### Decisão

- `midias-pessoais` concentra imagens de Perfil/Receitas/Lugares e documentos
  de provas/simulados, mantendo subpastas por domínio abaixo de `auth.uid()`.
- O bucket `capas` também é o destino oficial de `banner_path`. Google Photos
  Picker não é fonte permanente e não entra no fluxo obrigatório da v2.1.
- `.apkg` é lido no servidor com `fflate` + `sql.js`, somente das collections
  reconhecidas, com limites de arquivo/base, deck, prévia e até 500 cards.
  Mídia e templates complexos não são interpretados; CSV/TSV continua fallback.
- Next.js e o pacote ESLint correspondente ficam em 16.3.2 para remover os
  avisos de segurança conhecidos encontrados no fechamento.
