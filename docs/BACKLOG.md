# BACKLOG.md

Ideias futuras e funcionalidades não priorizadas. Nada aqui é compromisso — é uma lista de possibilidades para quando o núcleo do sistema estiver estável. Ver também `ROADMAP.md` → Fase 6 (Integrações Externas) e `VISION.md` para módulos ainda mais distantes.

---

## Treino

- [ ] Notificações push (Service Worker Push API) — lembrete de treino — **depende de M2, fora de escopo v1**
- [ ] Gráfico de evolução de carga por exercício
- [ ] Volume semanal por grupo muscular
- [ ] Página dedicada para `cardio` — **adiado para v2**, módulo de Treino será revisado por completo

## Geral

- [ ] Exportação de dados CSV/JSON via Supabase
- [ ] Google Calendar OAuth via Supabase Edge Function (ver DEC-009 — decisão de não fazer isso no MVP)
- [ ] Dashboard analytics avançado
- [ ] Modo múltiplos usuários (RLS já suporta — bastaria criar contas; não é objetivo do projeto por princípio, ver PROJECT_PRINCIPLES.md)

## Estudos

- [x] ~~Questões individuais estruturadas~~ — resolvido no schema da Fase 1 do Estudos v2 (`questoes_individuais`, DEC-035)
- [ ] Importação de dados do sistema ENEM standalone antigo, se houver conteúdo relevante a resgatar
- [ ] Cursos (estrutura própria — módulos/aulas/certificado), adiado da Fase 1 de Estudos v2 (DEC-035)
- [ ] Flashcards / integração com Anki, adiado da Fase 1 de Estudos v2 (DEC-035) — escopo de produto próprio, avaliar necessidade real antes de construir
- [ ] Redação versionada (múltiplas versões, competências detalhadas), Fase 1 entrega só versão leve (DEC-035)
- [ ] Calendário acadêmico próprio — não deve ser construído isolado; absorver pelo módulo Agenda dedicado quando planejado, evitar duplicar dado de compromisso
- [ ] Metas diárias/semanais/mensais e sequência de dias estudando (streak) — avaliar sobreposição com o módulo Hábitos (ainda não iniciado) antes de construir algo específico de Estudos
- [ ] Estatísticas avançadas de Estudos (ranking de conteúdos fracos/fortes, eficiência de estudo) — depende de volume real de dado acumulado, sem sentido construir com o schema vazio
- [ ] Upload de arquivo de prova/gabarito em `simulados` — Fase 1 entrega só campos numéricos/observação, sem anexo

## Documentação / processo

- [ ] Revisar `NAMING_CONVENTIONS.md` de classes CSS  hoje há mistura de prefixo por página (`.rev-`, `.cal-`, `.ex-`) com nomes genéricos (`.btn-sm`, `.toast`); avaliar se vale padronizar
- [ ] Auditoria completa de `style.css` contra `DESIGN.md` para confirmar que todas as classes documentadas realmente existem

## Biblioteca

## Biblioteca v2 (B2–B6) — polimento

- [ ] Integrar o seletor de gênero (B1, `SeletorGenero`/`lib/generos.ts`) nas 6 telas novas (filmes, séries, animes, mangás, livros, podcasts) — deixado de fora deliberadamente ao gerar cada tela
- [ ] Upload de capa/banner — campos `capa_path`/`banner_path` existem no schema desde DEC-023, mas nenhum bucket de Storage nem UI de upload foi criado para eles; hoje só é possível usar `capa_url`/`banner_url` (link externo)
- [ ] Integração de busca por API externa (TMDB, Google Books, Jikan, iTunes) nas telas novas da Biblioteca v2 — a v1 (`biblioteca.html`) tinha essa integração, as 6 telas v2 geradas até agora são só cadastro manual
- [ ] Edição de itens já criados em listas aninhadas (elenco, trilha sonora, temporadas, openings/endings, volumes) — hoje só dá pra criar ou apagar; os únicos campos editáveis depois de criado são os toggles (`lido`, `filler`, `assistido`)
- [ ] Reordenação manual (drag-and-drop) do campo `ordem` em elenco/trilha sonora/openings-endings/volumes — hoje `ordem` só reflete sequência de criação
- [ ] `animes_generos` (schema já existe desde `009_biblioteca_v2_b3.sql`) sem `lib/` nem UI — nenhuma tela permite associar gênero a um anime ainda
- [ ] `confirm()` nativo do navegador usado em todas as 6 telas novas ao apagar item — mesma pendência já registrada para Treino v2 acima, contraria `DESIGN.md`
- [ ] Menu de ações "⋯" (Editar/Apagar) nos cards não fecha sozinho ao clicar fora — só fecha ao escolher uma opção ou clicar de novo no próprio botão
- [ ] Velocidade de leitura (páginas/hora) em Livros (B5) — `paginas_total`/`pagina_atual` permitem progresso, mas não velocidade; exigiria registro de sessões de leitura com data, não desenhado ainda (ver DEC-029)

## Treino v2

- [ ] Substituir `confirm()` nativo do navegador por modal de confirmação (padrão `.open`) ao apagar treino — inconsistência com `DESIGN.md` introduzida na geração inicial das páginas v2, adiada por decisão explícita (2026-07-16)
- [ ] Gráfico de evolução de peso em `app/treino/shape/page.tsx` — decisão de dependência (Chart.js via CDN solto vs. `react-chartjs-2`) ainda não tomada para v2
- [ ] Upload de imagem/GIF de exercício (`imagem_path`, bucket `exercicios`) — CRUD de exercício ficou só textual na primeira leva
- [ ] Reordenação de exercícios (`ordem`) via drag-and-drop ou setas — hoje `ordem` só reflete sequência de criação


## v3 (futuro distante)

- [ ] Migrar Treino/Biblioteca (CSS Modules) para Tailwind — Estudos já migrou (DEC-038, 2026-07-25); decisão de estender pro resto do sistema ainda não tomada, sem data

# BACKLOG.md

Ideias futuras e funcionalidades não priorizadas. Nada aqui é compromisso — é uma lista de possibilidades para quando o núcleo do sistema estiver estável. Ver também `ROADMAP.md` → Fase 6 (Integrações Externas) e `VISION.md` para módulos ainda mais distantes.

---

## Treino

- [ ] Notificações push (Service Worker Push API) — lembrete de treino — **depende de M2, fora de escopo v1**
- [ ] Gráfico de evolução de carga por exercício
- [ ] Volume semanal por grupo muscular
- [ ] Página dedicada para `cardio` — **adiado para v2**, módulo de Treino será revisado por completo

## Geral

- [ ] Exportação de dados CSV/JSON via Supabase
- [ ] Google Calendar OAuth via Supabase Edge Function (ver DEC-009 — decisão de não fazer isso no MVP)
- [ ] Dashboard analytics avançado
- [ ] Modo múltiplos usuários (RLS já suporta — bastaria criar contas; não é objetivo do projeto por princípio, ver PROJECT_PRINCIPLES.md)

## Estudos

- [ ] Questões individuais estruturadas (hoje `sessoes_questoes` só registra desempenho agregado por sessão, não questão a questão)
- [ ] Importação de dados do sistema ENEM standalone antigo, se houver conteúdo relevante a resgatar

## Documentação / processo

- [ ] Revisar `NAMING_CONVENTIONS.md` de classes CSS  hoje há mistura de prefixo por página (`.rev-`, `.cal-`, `.ex-`) com nomes genéricos (`.btn-sm`, `.toast`); avaliar se vale padronizar
- [ ] Auditoria completa de `style.css` contra `DESIGN.md` para confirmar que todas as classes documentadas realmente existem

## Biblioteca

## Biblioteca v2 (B2–B6) — polimento- [ ] Integrar o seletor de gênero (B1, `SeletorGenero`/`lib/generos.ts`) nas 6 telas novas (filmes, séries, animes, mangás, livros, podcasts) — deixado de fora deliberadamente ao gerar cada tela
- [ ] Upload de capa/banner — campos `capa_path`/`banner_path` existem no schema desde DEC-023, mas nenhum bucket de Storage nem UI de upload foi criado para eles; hoje só é possível usar `capa_url`/`banner_url` (link externo)
- [ ] Integração de busca por API externa (TMDB, Google Books, Jikan, iTunes) nas telas novas da Biblioteca v2 — a v1 (`biblioteca.html`) tinha essa integração, as 6 telas v2 geradas até agora são só cadastro manual
- [ ] Edição de itens já criados em listas aninhadas (elenco, trilha sonora, temporadas, openings/endings, volumes) — hoje só dá pra criar ou apagar; os únicos campos editáveis depois de criado são os toggles (`lido`, `filler`, `assistido`)
- [ ] Reordenação manual (drag-and-drop) do campo `ordem` em elenco/trilha sonora/openings-endings/volumes — hoje `ordem` só reflete sequência de criação
- [ ] `animes_generos` (schema já existe desde `009_biblioteca_v2_b3.sql`) sem `lib/` nem UI — nenhuma tela permite associar gênero a um anime ainda
- [ ] `confirm()` nativo do navegador usado em todas as 6 categorias ao apagar item — pendência da geração inicial das telas, sobreviveu à consolidação em página única (DEC-032) e ao redesign visual (DEC-034): migrado sem correção em nenhuma das duas levas. Mesma pendência já registrada para Treino v2
- [ ] Menu de ações "⋯" (Editar/Apagar) nos cards não fecha sozinho ao clicar fora — só fecha ao escolher uma opção ou clicar de novo no próprio botão
- [ ] Velocidade de leitura (páginas/hora) em Livros (B5) — `paginas_total`/`pagina_atual` permitem progresso, mas não velocidade; exigiria registro de sessões de leitura com data, não desenhado ainda (ver DEC-029)
- [ ] Imagens estáticas de banner por categoria (`public/biblioteca/banners/{filmes,series,animes,mangas,livros,podcasts}.jpg`) — suporte já existe no `BibliotecaBanner` (DEC-034), mas depende do usuário fornecer as imagens; sem elas, cada categoria usa o mosaico automático das próprias capas cadastradas (funcional, mas não é o visual final pretendido)
- [ ] Perfil da sidebar (avatar + imagem de fundo) depende de `user_metadata.avatar_url`/`background_url` no Supabase Auth, hoje vazios — sem UI de "editar perfil" no sistema; população precisa ser manual via SQL/dashboard do Supabase até existir uma tela de Configurações (ver `VISION.md`)

## Treino v2

- [ ] Substituir `confirm()` nativo do navegador por modal de confirmação (padrão `.open`) ao apagar treino — inconsistência com `DESIGN.md` introduzida na geração inicial das páginas v2, adiada por decisão explícita (2026-07-16)
- [ ] Gráfico de evolução de peso em `app/treino/shape/page.tsx` — decisão de dependência (Chart.js via CDN solto vs. `react-chartjs-2`) ainda não tomada para v2
- [ ] Upload de imagem/GIF de exercício (`imagem_path`, bucket `exercicios`) — CRUD de exercício ficou só textual na primeira leva
- [ ] Reordenação de exercícios (`ordem`) via drag-and-drop ou setas — hoje `ordem` só reflete sequência de criação


## v3 (futuro distante)

- [ ] Migrar estilização de CSS Modules para Tailwind — decisão tomada durante planejamento da v2 (2026-07-14), fora de escopo da v2