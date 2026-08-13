# BACKLOG.md

Ideias futuras e funcionalidades não priorizadas. Nada aqui é compromisso — é uma lista de possibilidades para quando o núcleo do sistema estiver estável. Ver também `ROADMAP.md` → Fase 6 (Integrações Externas) e `VISION.md` para módulos ainda mais distantes.

> **Nota (2026-08):** este arquivo estava com todo o conteúdo duplicado — a
> segunda metade era uma cópia mais antiga e menos completa da primeira.
> Removida a duplicação nesta reconciliação; os dois itens que existiam só
> na cópia antiga (banners estáticos, perfil da sidebar) foram trazidos para
> a seção de Biblioteca abaixo.

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
- [x] Navegação global entre módulos e botão de logout visível — implementado em 2026-08-09 com hub `/`, navegação para Treino/Biblioteca/Estudos e logout via Supabase Auth.
- [ ] Corrigir o corte residual da letra “g” em “Agenda” na navegação em uma combinação específica de largura/zoom; o usuário decidiu não bloquear o teste atual por isso (2026-08-12).
- [ ] Evoluir a área global de perfil para um painel pessoal/social. Nesta etapa ela exibe somente avatar, nome e background vindos de `user_metadata`, sem rota própria.

## Estudos

- [x] ~~Questões individuais estruturadas~~ — resolvido no schema da Fase 1 do Estudos v2 (`questoes_individuais`, DEC-035)
- [ ] Importação de dados do sistema ENEM standalone antigo, se houver conteúdo relevante a resgatar
- [x] Upload de materiais de estudo no bucket privado `documentos`, usando `arquivo_path` e signed URLs, implementado em 2026-08-12 sem mudança de Storage.
- [x] Cursos (estrutura própria — módulos/aulas/certificado) — implementado na Fase 1B de Estudos v2 (DEC-036)
- [ ] Importação Anki como etapa própria. Auditoria de 2026-08 confirmou que `.apkg` combina arquivo ZIP, banco SQLite do Anki e mídia; suportá-lo corretamente exige parser/dependência, escolha de baralho/modelo, tratamento de HTML/cloze/mídia e regra de duplicação. Uma alternativa futura mais leve é importar exportação tabulada de notas, mas ainda precisa de decisão explícita sobre mapeamento de campos e deduplicação. Não misturar com o CRUD atual de Revisão.
- [ ] Redação versionada (múltiplas versões, competências detalhadas), Fase 1 entrega só versão leve (DEC-035)
- [x] Calendário acadêmico/cronograma absorvido pela Agenda v2; provas continuam em Estudos e são apenas exibidas na Agenda, sem duplicação
- [ ] Metas diárias/semanais/mensais e sequência de dias estudando (streak) — avaliar sobreposição com o módulo Hábitos (ainda não iniciado) antes de construir algo específico de Estudos
- [ ] Notas por avaliação com peso (ex: "Prova bimestral" peso 2, "Lista" peso 1) e nota máxima customizável por avaliação, com média ponderada calculada — ideia trazida por um componente gerado pelo v0.dev (`GradeManager`) na tela de Matéria, descartada da restilização de 2026-07-31 por não ter schema equivalente. `provas.nota` hoje é só uma nota simples por prova. Se for adotada, exige tabela nova (algo como `lancamentos_nota`) e entra como decisão de schema em `DECISIONS.md`, não como ajuste de UI.
- [ ] Estatísticas avançadas de Estudos (ranking de conteúdos fracos/fortes, eficiência de estudo) — depende de volume real de dado acumulado, sem sentido construir com o schema vazio
- [ ] Upload de arquivo de prova/gabarito em `simulados` — Fase 1 entrega só campos numéricos/observação, sem anexo
- [ ] Modo "fazer prova na hora" — upload do PDF da prova, cronômetro de
      fundo (dia 1 ~5h30 / dia 2 ~5h, confirmar minutos exatos), PDF aberto
      no navegador enquanto o cronômetro roda, gabarito digital preenchido
      em paralelo (redação fica de fora — escrita à mão, só foto depois).
      Dois modos de exibição do cronômetro: contagem regressiva simples e
      estilo "relógio de sala de aplicador" (blocos de 30 em 30 min,
      riscando o que já passou). Trava novas respostas quando o tempo
      esgota. Feature grande, própria — ver DEC-041 (registrado, não
      esquecido) — precisa de `MODULE_TEMPLATE.md` antes de qualquer schema.
- [ ] Vínculo direto entre um card de Revisão Espaçada e um compromisso da
      Agenda. A Agenda v2 já oferece horário/duração para estudo por matéria e
      conteúdo, mas não cria compromissos automaticamente a partir de cards.
- [ ] Áreas de estudo além de ENEM/Escola/Curso — o rascunho original do
      módulo (ver histórico de chat) previa Olimpíadas Científicas, Idiomas
      e Vestibulares específicos como áreas completas e independentes.
      `materias.tipo` aceita esses valores tecnicamente (sem `CHECK`
      constraint no banco), mas nenhuma tela, dashboard ou decisão de escopo
      existe pra elas ainda — nem em `VISION.md`. Não construir sem antes
      confirmar com o usuário qual entra primeiro e se o modelo
      Matéria→Conteúdo de ENEM/Escola serve como está ou precisa de ajuste.
- [x] Cronograma/planejamento temporal de estudo pertence à Agenda; Estudos
      permanece fonte de verdade de matérias, conteúdos e provas. Metas e
      prioridades avançadas continuam fora do escopo atual.
- [x] Widgets de tempo estudado no Hub (hoje / semana / mês) — implementados
      em 2026-08-12 com agregação real de `sessoes_estudo` no fuso local.
- [ ] Campo "questões anuladas" em `simulados` — presente no rascunho
      original do módulo, sem equivalente no schema atual.

## Documentação / processo

- [ ] Revisar `NAMING_CONVENTIONS.md` de classes CSS — hoje há mistura de prefixo por página (`.rev-`, `.cal-`, `.ex-`) com nomes genéricos (`.btn-sm`, `.toast`); avaliar se vale padronizar
- [ ] Auditoria completa do CSS contra `DESIGN.md` para confirmar que todas as classes documentadas realmente existem
- [x] `frontend/README.md` reconciliado com o setup real, toolchain, variáveis e validações do projeto.
- [x] `estrutura.txt` substituído em 2026-08-08 por um mapa conciso da estrutura atual; não incluir novamente dumps de `.next`/`node_modules`.
- [x] SVGs padrão do Create Next App confirmados ausentes de `frontend/public/`.
- [x] `frontend/app/page.module.css` confirmado ausente; o Hub atual usa Tailwind.
- [ ] Recapturar snapshots de produção periodicamente e comparar com a cadeia ativa em `backend/supabase/migrations/` — nunca usar o acervo `history/legacy-migrations/` como referência operacional.

## Biblioteca

### Biblioteca v2 (B2–B6) — polimento

- [x] YouTube API preparada para importar título, canal, duração e thumbnail
      por uma API Route server-side; requer `YOUTUBE_API_KEY` no ambiente.
- [ ] Extensão de navegador, importação em lote e scraping para Vídeos/Artigos
      continuam fora do produto atual. O cadastro manual permanece disponível.
- [x] Fluxo manual Vídeo → Curso em Estudos — implementado localmente com
      `conteudos.video_uuid`, escolha explícita de curso/módulo e bloqueio de
      duplicação no mesmo curso (DEC-048). Migration aplicada em produção em
      2026-08-12; fluxo liberado para publicação.
- [ ] Sincronizar opcionalmente progresso entre vídeo da Biblioteca e aula do
      Curso. O fluxo inicial mantém `assistido`, `teoria_vista` e domínio
      independentes por decisão; só reavaliar após uso real.

- [x] Seletor de gênero integrado de ponta a ponta nas 6 categorias originais:
      leitura em lote, seleção no formulário, persistência ao criar/editar,
      seed seguro e acesso ao gerenciamento pela sidebar (2026-08-12).
- [ ] Upload de capa/banner — o bucket privado `capas` e suas policies estão versionados em `001_schema_inicial.sql`, mas não existe UI de upload; `banner_path` não tem bucket definido. Hoje a interface usa apenas `capa_url`/`banner_url` (link externo)
- [x] Busca externa integrada aos formulários de Filmes, Séries, Animes,
      Mangás, Livros e Podcasts via TMDB, Jikan, Google Books e iTunes Search.
      TMDB usa `TMDB_API_KEY` server-only; as fontes públicas mantêm fallback
      manual quando há limite ou indisponibilidade temporária (2026-08-12).
- [ ] Edição de itens já criados em listas aninhadas (elenco, trilha sonora, temporadas, openings/endings, volumes) — hoje só dá pra criar ou apagar; os únicos campos editáveis depois de criado são os toggles (`lido`, `filler`, `assistido`)
- [ ] Reordenação manual (drag-and-drop) do campo `ordem` em elenco/trilha sonora/openings-endings/volumes — hoje `ordem` só reflete sequência de criação
- [x] `animes_generos` consumida por `lib/generos.ts` e pela UI de Animes.
- [x] `confirm()` nativo do navegador ao apagar item — as 10 ocorrências em Biblioteca e Treino foram substituídas pelo `ConfirmDialog` reutilizável em 2026-08-11; busca no frontend ficou zerada.
- [x] Menu de ações dos cards fecha por clique externo, Escape ou escolha de ação, com foco devolvido ao botão quando fechado pelo teclado e botão visível em dispositivos sem hover (2026-08-12).
- [ ] Velocidade de leitura (páginas/hora) em Livros (B5) — `paginas_total`/`pagina_atual` permitem progresso, mas não velocidade; exigiria registro de sessões de leitura com data, não desenhado ainda (ver DEC-029)
- [ ] Imagens estáticas de banner por categoria (`public/biblioteca/banners/{filmes,series,animes,mangas,livros,podcasts,videos,artigos}.jpg`) — suporte já existe no `BibliotecaBanner` (DEC-034), mas depende do usuário fornecer as imagens; sem elas, cada categoria usa mosaico de capas ou fallback visual. Confirmado que ao menos `animes.jpg` já está versionado.
- [x] Perfil removido da sidebar e promovido à navegação global de todo o site, com avatar, nome, background opcional e fallback (2026-08-12, DEC-049).
- [x] Tela `/configuracoes` para editar nome, descrição curta, `user_metadata.avatar_url` e `background_url`, implementada em 2026-08-12.

## Saúde, Finanças e Lugares

- [x] Primeira versão manual de Saúde, Finanças e Lugares implementada em
      2026-08-13, sem integração externa ou dependência nova.
- [ ] Saúde: gráficos de tendência, lembretes e fotos próprias ficam para uma
      evolução posterior; peso continua em `shape` e não deve ser duplicado.
- [ ] Finanças: recorrência, importação bancária e cotações ficam fora da versão
      inicial; qualquer integração financeira exigirá pesquisa de segurança.
- [ ] Lugares: upload de fotos, Maps/Places API e Google Photos permanecem
      futuros; a versão inicial usa capa por URL e link externo para Maps.

## Treino v2

- [x] Substituir `confirm()` nativo do navegador por modal de confirmação ao apagar treino — concluído com o `ConfirmDialog` reutilizável em 2026-08-11.
- [ ] Gráfico de evolução de peso em `app/treino/shape/page.tsx` — decisão de dependência ainda não tomada para v2 (Chart.js não está no `package.json` atual — se retomado, escolher biblioteca do zero, não assumir Chart.js como já decidido)
- [ ] Upload de imagem/GIF de exercício (`imagem_path`) — CRUD ficou só textual; o bucket privado `exercicios` e sua policy existem e estão na baseline, mas a policy atual tem `WITH CHECK = NULL`. Qualquer hardening deve vir em migration separada antes/ junto da UI, nunca por edição da baseline.
- [ ] Reordenação de exercícios (`ordem`) via drag-and-drop ou setas — hoje `ordem` só reflete sequência de criação

## Dívida técnica de código (achados da auditoria de 2026-08)

- [ ] Lint: 40 achados na execução reproduzível de 2026-08-12: 23 erros
      `react-hooks/set-state-in-effect`, 13 warnings `exhaustive-deps` e 4
      `no-img-element`. Os 2 `no-explicit-any` e os 2
      `react/no-unescaped-entities` foram corrigidos na auditoria final local.
      Investigar o restante caso a caso; lint continua informativo na CI.
- [ ] npm 12 bloqueia por padrão os scripts de instalação transitivos de `sharp@0.34.5` e `unrs-resolver@1.12.2`. Instalação, typecheck e build passaram nesse estado; não aprovar scripts cegamente. Reavaliar somente se uma plataforma limpa demonstrar falha funcional (especialmente otimização de imagens ou resolução nativa).
- [ ] `@types/node` permanece na linha 20, herdada do setup do Next, enquanto o runtime é Node 24. Typecheck e build passam e o código não depende de APIs exclusivas da major 24; alinhar os tipos apenas numa atualização deliberada, sem misturar com feature.
- [ ] Hardening do banco, sempre em migrations incrementais separadas: revisar o `GRANT ALL` atual de `authenticated`; policies/`WITH CHECK` de `redacoes` e `exercicios`; `materias.user_id` sem cascade; ausência de `materias_tipo_check`; e a configuração `SECURITY DEFINER`/`search_path` de `public.rls_auto_enable()`. A baseline apenas preserva esses estados e nunca deve ser editada para corrigi-los.
- [ ] `materias.user_id` é a única FK do projeto sem `ON DELETE CASCADE` (confirmado no dump real, 2026-08) — corrigir numa migration dedicada, não em conjunto com uma feature nova. Ver `DATABASE.md` → Gotchas.
- [ ] `materias.tipo` nunca teve `CHECK constraint` — considerar adicionar depois de confirmar com o código quais valores `lib/materias.ts` usa hoje de fato. Ver `DATABASE.md` → Gotchas.
- [ ] Frontend sem testes unitários, de integração ou E2E automatizados. A CI mínima já valida instalação, tipos e build; a única suíte automatizada funcional existente é a validação SQL local da baseline. Adicionar testes quando houver um primeiro caso de alto valor, sem introduzir framework apenas por cobertura nominal.

## v3 (futuro distante)

- [ ] Migrar Treino/Biblioteca (CSS Modules) para Tailwind — Estudos já migrou (DEC-038, 2026-07-25); decisão de estender pro resto do sistema ainda não tomada, sem data
