# TASKS_NOW.md

Tarefas ativas e próximas ações. Ideias não priorizadas vivem em `BACKLOG.md`, histórico de tarefas concluídas vive em `CHANGELOG.md` — não aqui.

---

## Status geral
**Fase atual:** v2.1 — prioridade manual da Agenda implementada, validada e publicada; reteste manual em produção pendente. A v1 está aposentada (DEC-031) e `frontend/` é o único frontend ativo.
**Bloqueio:** nenhum bloqueio técnico conhecido neste lote; resta homologação manual autenticada.
**Banco:** produção e cadeia local estão alinhadas até `20260820000300_agenda_prioridade.sql`; o pós-check de 2026-08-21 confirmou coluna, default, constraint, histórico e dry-run remoto vazio.
**Reprodutibilidade:** consolidada em 2026-08-08 — toolchain fixado, `npm ci`, typecheck e build aprovados, CI mínima criada; lint mantém dívida conhecida.
**Próxima ação:** retestar em produção a prioridade da Agenda, especialmente persistência, ordenação em empate e coexistência sem duplicação com provas de Estudos.

## Prioridade manual da Agenda — lote local de 2026-08-20

- [x] Escala fechada em baixa/normal/alta, com default normal e check no banco.
- [x] Formulário cria/edita prioridade; cards semanais exibem rótulo e a visão mensal usa marcador compacto acessível.
- [x] Ordem previsível: data, horário, prioridade alta/normal/baixa, título e UUID; eventos sem horário ficam depois dos horários definidos.
- [x] Provas continuam lidas diretamente de Estudos, sem coluna, edição ou duplicação na Agenda.
- [x] Reset local e os 14 testes SQL passaram, incluindo `validate_agenda_prioridade.sql`; baseline consolidada agora espera 79 checks.
- [x] Dry-run remoto listou exclusivamente `20260820000300_agenda_prioridade.sql`.
- [x] Autorização recebida; migration aplicada com pós-check de schema/histórico e dry-run final vazio.
- [x] Frontend, migration, teste e documentação liberados para commit/push.

## Atmosfera visual do topo — refinamento de 2026-08-20

- [x] Os cinco temas passam a representar iluminação: Sol, Suave, Nublado, Estrelado e Lua, com tokens próprios para fundo, superfícies, bordas, textos, ações, campos, header e sombras.
- [x] A decoração é independente da iluminação e oferece apenas as quatro estações — Primavera, Verão, Outono e Inverno — mais Nenhum; o valor local antigo `noite` migra para `nenhum`.
- [x] Iluminação, decoração e cor ambiente têm persistência local e aplicação pré-hidratação; nenhum dado visual novo depende de schema ou Supabase.
- [x] A imagem real continua restrita ao perfil; partículas CSS usam a decoração e a cor ambiente, concentram-se à esquerda e desaparecem à direita sob uma navegação translúcida.
- [x] O resumo do perfil ganhou controle de cor ambiente e restauração do fallback temático.
- [x] Paletas deixaram de ser cores literais: cada iluminação ganhou profundidade de página, superfícies, vidro, header e sombras coerentes; as quatro estações ganharam formas, cores e movimentos próprios.
- [ ] Retestar as combinações por amostragem representativa, incluindo “Nenhum”, cor personalizada, recarga, 360 px e desktop.

## Topo global e documentação de reteste — 2026-08-20 (base anterior)

- [x] Os três controles separados viraram um botão único com dropdown meteorológico e linha contínua para claro, suave, nublado, estrelado e escuro.
- [x] A preferência continua na chave existente e os cinco temas são aplicados antes da hidratação para evitar flash visual.
- [x] O perfil no topo abre um resumo com avatar, capa, nome, descrição, e-mail e ação “Editar perfil”; clique externo, Escape e troca de rota fecham o painel.
- [x] Auditoria manteve prioridade da Agenda, capa/banner da Biblioteca, dashboards analíticos e hardening adicional no backlog por dependerem de migration, contrato de Storage ou decisão de produto.
- [ ] Retestar este lote e o commit `d5a8b7e` na versão publicada; implementação local não marca homologação manual como concluída.

## Correções da segunda rodada de homologação — 2026-08-20

- [x] Competências C1–C5 de Redações usam somente 0, 40, 80, 120, 160 e 200; valores manuais fora da sequência são rejeitados.
- [x] Redações registram e editam tempo em horas/minutos, persistido como total opcional em minutos.
- [x] Resumo do modo “Fazer prova ENEM” separa respondidas, em branco, acertos, erros e total sem chamar 90 respostas nulas de lançadas.
- [x] Dia 1 permite vincular tema e imagem da redação durante a prova; o registro reaparece em `/estudos/redacoes` para completar e corrigir.
- [x] Card de Shape mantém foto rotativa, deixa o topo livre e move balança, peso, data e ação para o rodapé; o fundo cobre a faixa superior.
- [x] Migration `20260820000200_redacoes_tempo_execucao.sql` passou reset, 13 testes SQL, dry-run remoto exclusivo, aplicação, pós-check de schema/histórico e dry-run final vazio.
- [ ] Retestar os cinco fluxos acima após o deploy, nos temas claro/suave/nublado/estrelado/escuro e em desktop/mobile.

## Correções da homologação v2.1 — publicadas em 2026-08-20

- [x] Logout reseta “Saindo...” em erro, troca de rota e novo login.
- [x] Botões principais de Treino usam tokens de ação com contraste consistente.
- [x] Imagem inválida de exercício pode ser removida ou substituída e bloqueia o envio.
- [x] Shape permite editar/excluir por clique no registro, com `ConfirmDialog`; Saúde e Treino desempataram registros do mesmo dia por `updated_at`.
- [x] Card de Shape no dashboard usa dados/fotos reais com rotação discreta; pontuação por modalidade deriva de sessões concluídas.
- [x] Agenda tornou concluir/reabrir visível no card e no modal de edição.
- [x] Tema suave foi adicionado sem remover claro/escuro e usa a mesma preferência persistida.
- [x] TMDB e Jikan preenchem campos adicionais já existentes no schema; demais fontes preservam seus contratos atuais.
- [x] Base do modo “Fazer prova ENEM” usa o gabarito existente, cronômetro de 5h30/5h e persistência local do prazo; o segundo lote integrou o anexo da redação do Dia 1.
- [x] Causa da falha de Redações identificada: `NUMERIC(4,1)` não comporta 1000,0; migration incremental e teste específico foram criados.
- [x] Reset local completo e 12 testes SQL aprovados, incluindo `validate_redacoes_nota_mil.sql`.
- [x] Dry-run remoto listou exclusivamente `20260820000100_redacoes_nota_mil.sql`.
- [x] Migration aplicada com autorização explícita; pós-check confirmou schema/histórico e dry-run vazio.
- [ ] Retestar em produção os itens marcados em `docs/teste.md`.

## Únicas tarefas ativas antes de concluir a v2

- [ ] Executar integralmente `HOMOLOGATION_V2.md` em ambiente publicado e registrar commit/deploy, navegador, dispositivo e tema.
- [ ] Corrigir e retestar somente bugs bloqueantes, falhas de segurança/dados e polimentos claramente decorrentes da homologação.
- [ ] Confirmar desktop/mobile e temas claro/suave/nublado/estrelado/escuro antes de declarar a v2 concluída.

**Escopo após o lote:** não iniciar módulo, integração pesada ou redesign antes da homologação. As caixas não marcadas nas seções históricas abaixo representam testes consolidados pelo checklist ou evoluções movidas para `BACKLOG.md`; não são autorização para ampliar a release candidate.

## Melhorias documentadas v2.1 — 2026-08-15

- [x] Agenda ganhou alternância semanal/mensal sem duplicar provas ou compromissos.
- [x] Revisão ganhou prévia de CSV/TSV, módulo padrão e filtro de módulo para cards ativos/arquivados.
- [x] Histórico ganhou resumo mensal, legenda explícita e exportação CSV do período filtrado.
- [x] Finanças ganhou valor atual, resultado e cobertura de cotações das posições, mantendo BRAPI opcional e sob demanda.
- [x] Busca de metadados da Biblioteca ganhou origem, prévia mais informativa e orientação para limite/indisponibilidade das APIs.
- [x] Treino ganhou upload privado de imagem/GIF de exercício, signed URL e rollback do arquivo quando o registro falha.
- [x] Migration `20260815000200_v21_hardening.sql` alinhou `materias.tipo`, cascade de usuário e policies de `exercicios`/`redacoes`; reset, onze testes, dry-run exclusivo, aplicação e pós-check aprovados.
- [ ] Homologar manualmente os fluxos v2.1 com dados reais em desktop/mobile e nos cinco temas.

---

## ✅ Cutover v1 → v2 (DEC-031) — concluído

- [x] Pasta renomeada `frontend-v2/` → `frontend/`
- [x] Projeto Vercel antigo deletado, projeto novo criado com Root Directory `frontend`
- [x] Environment variables configuradas
- [x] Deploy realizado (confirmado: 2026-07-13)
- [x] Supabase → Auth → URL Configuration atualizado para a nova URL
- [x] Hub inicial v2 com navegação para `/treino`, `/biblioteca`, `/estudos` e logout visível implementado localmente (2026-08-09)
- [x] **Teste de login end-to-end na URL de produção confirmado pelo usuário** (2026-08-09)
- [x] Hub `/` validado em produção pelo usuário (passou; polimento do hub fica para etapa futura)
- [x] Navegação funcionando em produção para `/treino`, `/biblioteca` e `/estudos` (2026-08-09)
- [x] Logout validado em produção pelo usuário (2026-08-09)
- [x] Problemas observados no smoke test online: nenhum relatado pelo usuário

## Hub operacional v2

- [x] Resumo de tempo estudado hoje, na semana atual e no mês atual usando `sessoes_estudo`
- [x] Compromissos e provas pendentes do dia exibidos sem duplicar dados da Agenda/Estudos
- [x] Revisões vencidas e para hoje exibidas com acesso direto a `/revisao`
- [x] Loading, falha parcial, estado vazio e atualização manual implementados
- [x] Falhas excepcionais de uma fonte não interrompem mais o restante do resumo (`Promise.allSettled`)
- [x] Bloco compacto de insights pessoais implementado com rotação automática a cada 5 segundos e navegação manual, usando Biblioteca, Estudos, Revisão, Projetos e Receitas
- [x] Insights ampliados com tempo estudado hoje/semana/mês, receita recente e próximo compromisso, sem tabela nova
- [x] Insights de Saúde, Finanças e Lugares adicionados a partir dos registros já existentes, completando a cobertura das áreas pedidas sem tabela nova
- [x] Idioma ativo, prática semanal e dia mais ativo do ano integrados ao carrossel; atalhos de Idiomas e Histórico adicionados
- [x] Projeto técnico destacado e resumo de posições de investimento integrados sem consultar nem persistir cotação no Hub
- [ ] Validar visualmente o Hub com dados reais em desktop e mobile na etapa final

## Homologação final da v2 expandida — 2026-08-15

- [x] Inventário local confirmou 31 páginas, 2 API Routes e 12 migrations na cadeia ativa, sem migration nova neste lote
- [x] Variáveis documentadas reconciliadas com o código: duas públicas do Supabase e três opcionais server-only
- [x] Proteção global passou a validar o usuário no servidor antes de liberar páginas e APIs
- [x] Validação do formulário de investimentos deixou de converter preço médio vazio em zero
- [x] Upload de Shape foi alinhado ao contrato real do bucket: JPG/PNG/WebP, até 10 MB, com falha visível e rollback do arquivo se o registro não salvar
- [x] Dois componentes sem importadores ou rota (`InlineAddForm` e `Switch`) foram removidos após varredura estática
- [x] Checklist operacional consolidado em `docs/HOMOLOGATION_V2.md`
- [ ] Executar o checklist autenticado em produção e registrar navegador, dispositivo, tema e evidências dos problemas encontrados

## Programação, investimentos e flashcards tabulados — 2026-08-15

- [x] `/programacao` implementado como visão especializada de `projetos`, com repositório, linguagem principal, status e destaque, sem GitHub API ou domínio duplicado
- [x] Finanças ganhou CRUD de posições; cotação BRAPI é opcional, server-side, sob demanda e não persistida
- [x] `/revisao` importa CSV/TSV de até 1 MB/500 cards, aceita módulo opcional e ignora pares pergunta/resposta duplicados do usuário
- [x] Hub, Diário e navegação global atualizados; Histórico permanece baseado em eventos com data e não conta posição financeira sem data de negócio
- [x] Uploads adicionais auditados e mantidos no backlog quando bucket/policy/destino não oferecem contrato seguro
- [x] `20260815000100_programacao_investimentos.sql` passou reset local, dez testes SQL, dry-run remoto exclusivo, aplicação e pós-check
- [ ] Homologar CRUDs, fallback sem `BRAPI_TOKEN`, consulta com token configurado e arquivos CSV/TSV reais

## Idiomas, áreas adicionais e Histórico — 2026-08-15

- [x] `/idiomas` implementado com CRUD, objetivo/nível, vocabulário, domínio, práticas e resumos semanal/mensal
- [x] Soft delete de idiomas, palavras e práticas protegido por `ConfirmDialog`
- [x] Olimpíadas, Vestibulares e Outros estudos reutilizam `materias`, `conteudos` e a tela de Matéria sem cronograma paralelo
- [x] `/historico` agrega nove fontes em sete áreas, com heatmap anual, filtro e resumo diário, sem tabela agregada
- [x] Navegação global adaptada para Idiomas e Histórico, preservando rolagem mobile e ícones no desktop intermediário
- [x] `20260814000100_idiomas.sql` passou reset local, nove testes SQL, dry-run exclusivo, aplicação e pós-check remoto
- [ ] Testar manualmente CRUDs, filtros do heatmap e responsividade com dados reais

## Dashboards de domínio e Diário — 2026-08-13

- [x] `/treino` deixou de ser apenas uma grade de modalidades e passou a resumir sessões da semana, planos, exercícios, Shape e histórico recente
- [x] Duração acumulada da semana e duração individual das sessões concluídas passaram a aparecer no dashboard de Treino
- [x] `/diario` criado como portal sem tabela própria, agregando dados reais de Saúde, Finanças, Lugares e Receitas
- [x] Saúde, Finanças, Lugares e Receitas saíram da navegação global direta e passaram a ficar sob Diário
- [x] O Hub principal substituiu os quatro atalhos separados por um único acesso ao Diário
- [x] A imagem real ficou restrita ao perfil; o restante do topo usa somente manchas e fragmentos abstratos do tema, mais presentes até “Início” e progressivamente discretos depois
- [ ] Validar Treino, Diário e o topo em tema claro/escuro, desktop e mobile

## Lote Saúde, Finanças e Lugares — 2026-08-13

- [x] `/saude` implementado com sono, hidratação, humor, medicamentos e registros diários
- [x] Peso preservado em `shape` como fonte única; Saúde apenas consulta o último registro e aponta para `/treino/shape`
- [x] `/financas` implementado com categorias, lançamentos, resumo mensal, orçamentos e metas
- [x] `/lugares` implementado com CRUD, favorito, detalhe e link externo para Google Maps sem API
- [x] Hub integrado; Saúde, Finanças e Lugares ficam agrupados no portal Diário junto de Receitas
- [x] Curso mostra thumbnail e link nas aulas vinculadas a vídeos da Biblioteca
- [x] Reset local completo e sete testes SQL aprovados
- [x] Dry-run, aplicação e pós-check de `20260813000100_saude_financas_lugares.sql` em produção (2026-08-13)
- [ ] Testar manualmente os três módulos em desktop/mobile

## Lote Perfil, uploads, Projetos e Receitas — 2026-08-12

- [x] `/configuracoes` edita nome, descrição curta, avatar e background em `user_metadata`, sem tabela nova
- [x] Perfil global abre Configurações e reflete alterações após salvar
- [x] Materiais de Estudos aceitam arquivo privado no bucket `documentos` e abrem por signed URL
- [x] Fluxo de imagem de Redações valida tipo/tamanho e limpa substituições/rollback de upload
- [x] `/projetos` implementado com CRUD, quadro de tarefas por status e soft delete
- [x] `/receitas` implementado com CRUD, favorito, feita/não feita, nota e foto por URL
- [x] Hub e navegação global integrados aos dois módulos
- [x] Migration/teste específico validados no banco Docker local; teste consolidado aprovado
- [x] Dry-run remoto de `20260812000200_projetos_receitas.sql` concluído sem migrations adicionais
- [x] Migration aplicada em produção e pós-check remoto concluído sem pendências (2026-08-12)
- [ ] Testar manualmente os novos fluxos em desktop/mobile

## Auditoria final local da v2 — 2026-08-12

- [x] Datas de negócio passaram a usar o dia local em Hub, Estudos, Revisão e Shape, evitando avanço de um dia após 21h no fuso de Pernambuco
- [x] Hub de Estudos deixou de exibir trecho de UUID e agora resolve o nome real da matéria
- [x] Curso pode ser concluído e reaberto sem divergência entre detalhe e listagem
- [x] Provas escolares podem ser concluídas/reabertas; gabarito ENEM completo marca a prova como concluída
- [x] Gabarito exige a classificação já definida na DEC-041 antes de salvar uma linha iniciada
- [x] Simulados e competências de redação bloqueiam valores inválidos antes de persistir
- [x] Biblioteca não reaproveita o gatilho de adicionar ao trocar de categoria; menus fecham após escolher uma ação e ficam acessíveis em telas sem hover
- [x] Typecheck aprovado; lint informativo reduzido para 40 achados conhecidos
- [ ] Teste manual autenticado definitivo com dados reais, incluindo responsividade e operações CRUD

## Ajustes do teste manual final — lote local de 2026-08-12

- [x] Contraste e estados do botão de login corrigidos nos temas claro e escuro
- [x] Navegação global reorganizada responsivamente para não cortar “Agenda”
- [x] Hub ganhou bloco compacto e navegável de provas futuras, lendo `provas`
- [x] Biblioteca passou a seguir o tema global; perfil foi movido da sidebar para o topo e as rolagens internas concorrentes foram removidas
- [x] Revisão ganhou filtro de Arquivados, restauração e separação entre arquivar e apagar
- [x] `20260812000100_revisao_arquivados.sql` passou em reset local e na suíte SQL completa
- [x] Importação Anki `.apkg` auditada e mantida fora desta leva por exigir parser de pacote SQLite/ZIP; o fallback CSV/TSV foi implementado depois no lote de 2026-08-15
- [x] Dry-run remoto limpo, migration aplicada em produção com autorização explícita e pós-check sem pendências (2026-08-12)
- [x] Primeiro lote publicado; login validado pelo usuário em produção (2026-08-12)
- [x] Perfil promovido ao topo global em todas as rotas, sem duplicar o link “Início”
- [x] Background do perfil recomposto em camadas de fallback e imagem com transição suave, sem faixa retangular
- [x] Topo consolidado em uma grade única de perfil, navegação e logout, com altura e borda compartilhadas
- [x] Sidebar da Biblioteca compactada e contraste do item ativo corrigido
- [x] Topo deixa de quebrar prematuramente em grade: desktop compacto começa em 960px e larguras menores usam navegação horizontal controlada
- [x] Perfil permanece como único acesso às Configurações e o topo recebe fragmentos sutis do background, com fallback temático
- [x] O lote `0fef310` está incorporado ao histórico atual; os testes manuais restantes foram consolidados em `docs/HOMOLOGATION_V2.md`

## Integrações externas da Biblioteca — primeiro lote

- [x] Primeira API Route criada em `app/api/biblioteca/metadados/route.ts`, protegida pela sessão global e sem expor segredos no client
- [x] YouTube preparado para título, canal, duração e thumbnail; requer `YOUTUBE_API_KEY` server-only e preserva o preenchimento manual sem ela
- [x] TMDB preparado para busca básica de filmes/séries; requer `TMDB_API_KEY` server-only e preserva o preenchimento manual sem ela
- [x] Google Books, Jikan (animes e mangás) e iTunes Search integrados sem chave
- [x] Busca passou a usar o próprio título com debounce e sugestões abaixo do campo; Vídeos também aceitam URL, sem campo/botão de busca separado
- [ ] Validar manualmente resultados, seleção e fallback das sete fontes em produção; APIs públicas podem aplicar limites ou indisponibilidade temporária

## Redesign visual da Biblioteca — 2026-08-13

- [x] Direção visual do protótipo v0 adaptada aos componentes reais, sem dados mockados ou troca de lógica
- [x] Sidebar compacta em painel, busca refinada, contadores reais das oito categorias carregados desde a entrada e ações inferiores preservadas
- [x] Hero de categoria em card com label, título, total, ação de cadastro e colagem das capas reais
- [x] Cards verticais refinados com capa dominante, nota em estrela, favorito, status, metadados, gêneros e menu existente
- [x] Ordenação local real por recência, título, nota, favoritos e status, aplicada depois da busca nas oito categorias
- [x] Seletor acessível de cinco estrelas e meias estrelas substituiu os inputs numéricos nas sete categorias que possuem `nota`; Artigos permanece sem nota
- [x] Toggle de tema movido para a área de ações ao lado de “Sair” em todas as rotas autenticadas
- [x] Fragmentos do topo refinados como pétalas/lascas abstratas; `background_url` continua restrita ao perfil
- [x] Acabamento final aproximou cards do protótipo v0, ampliou pétalas orgânicas e colocou os links globais em cápsula translúcida (2026-08-14)
- [x] Reset local completo e teste específico de `20260813000200_biblioteca_nota_cinco_estrelas.sql` aprovados
- [x] Dry-run limpo, migration aplicada em produção e pós-check sem pendências (2026-08-14)
- [x] CRUD, importações de metadados, gêneros, Vídeo → Curso, painéis, modais e soft delete preservados
- [x] Duração/tempo auditada nas oito categorias: cards, detalhes e formulários usam os campos reais já existentes; TMDB/Jikan/YouTube preenchem quando a fonte oferece dado confiável, enquanto podcast/iTunes preserva entrada manual por não expor média confiável da obra
- [x] Favorito auditado nas oito categorias, com checkbox no formulário, ação uniforme no menu e coração sempre visível/clicável diretamente na capa do card (2026-08-14)
- [x] Nenhuma migration foi necessária: `duracao_minutos`, `duracao_segundos`, `tempo_leitura_minutos` e `favorito` já existem no schema de todas as categorias
- [ ] Validar o novo visual autenticado em produção nos temas claro/escuro e em desktop/mobile

## Ordem dos próximos módulos (v2)

- [x] Revisão Espaçada dedicada vem antes de Agenda; página `/revisao` implementada sobre o SM-2 existente, sem migration (2026-08-11)
- [x] Agenda definida como dona do cronograma e planejamento temporal; Estudos continua dono das entidades acadêmicas (2026-08-11)
- [x] Agenda v2 implementada localmente em `/agenda`, integrada ao hub e à navegação global (2026-08-11)
- [x] Validar localmente `20260811000100_agenda_v2.sql` com reset, teste consolidado e teste específico (2026-08-11)
- [x] Migration da Agenda aplicada em produção via cadeia ativa e pós-check remoto concluído (2026-08-11)

## 🟢 Agenda v2 — implementada e publicada

- [x] Visão semanal de compromissos por data
- [x] CRUD de eventos manuais com soft delete e `ConfirmDialog`
- [x] Eventos gerais, de estudo (matéria + conteúdo opcional) e de treino
- [x] Provas de Estudos exibidas por leitura direta de `provas`, sem duplicação
- [x] Acesso por `/`, `GlobalNav` e rota `/agenda`
- [x] Reset local, `validate_baseline.sql` e `validate_agenda_v2.sql` aprovados
- [ ] Teste manual responsivo e dos fluxos CRUD na etapa final

---

## 🟢 Estudos v2 — Correção de modelagem pós-design (2026-08) — concluída, smoke principal aprovado

- [x] Migration 017 (área ENEM, letra do gabarito, redação com imagem) executada
- [x] Migration 018 (matéria única, mostra_escola/mostra_enem, limpeza de dado duplicado) executada
- [x] Migration 019 (gabarito 2 fases, domínio de conteúdo, dificuldade) executada — **reconfirmado no dump real do schema em 2026-08**
- [x] `lib/materias.ts`, `lib/conteudos.ts`, `lib/questoes-individuais.ts`, `lib/provas.ts`, `lib/revisao.ts`, `lib/redacoes.ts` atualizados
- [x] Páginas de Estudos atualizadas (Hub, ENEM, área ENEM nova, Escola, Curso×2, Matéria, Gabarito e Redações: 9 rotas de página) — `npx tsc --noEmit` limpo
- [x] **Teste manual completo no navegador** — smoke test online das rotas principais concluído pelo usuário em produção (2026-08-09)
- [x] **Teste em produção (Vercel)** — acesso a `/estudos` confirmado no smoke test online (2026-08-09); teste profundo das 9 rotas internas ainda pode ser feito em etapa própria
- [x] `SubjectManager` órfão removido; nenhuma tela ativa exibe contagem ou taxa de acerto artificial (2026-08-11)
- [x] `materiais_estudo`, `anotacoes_estudo`, `sessoes_estudo` ganharam camada `lib/` e UI funcional nos detalhes de Matéria e Curso, sem mudança de schema (2026-08-11)
- [x] Vínculo de conteúdo compartilhado deixou de usar `window.prompt` e passou a usar seleção visível de matéria (2026-08-09)
- [x] Ações destrutivas de Estudos agora passam por modal de confirmação (conteúdo, prova, atividade, módulo de curso e foto de redação)
- [x] Datas de registros acadêmicos e reagendamento SM-2 respeitam o fuso local do dispositivo
- [x] Provas escolares têm controle de conclusão e o gabarito ENEM completo atualiza `provas.feita`
- [x] Gabarito valida letra, matéria, conteúdo, dificuldade e motivo por questão iniciada
- [x] As 10 ocorrências restantes de `confirm()` nativo em Treino/Biblioteca foram substituídas pelo `ConfirmDialog` reutilizável (2026-08-11)
- [ ] Validar manualmente os novos modais de Treino/Biblioteca: confirmar, cancelar, fechar por Escape e clicar no backdrop
- [ ] Validar manualmente em Estudos: criar/listar/apagar material por URL/arquivo, anotação e sessão em Matéria e Curso

## 🟢 Revisão Espaçada v2 — página dedicada implementada

- [x] Rota `/revisao` com revisões vencidas/para hoje e futuras
- [x] Avaliação usa o `calcularSM2`/`avaliarCard` existente
- [x] Cards manuais simples usam o schema atual (`modulo = 'manual'`)
- [x] Cards de Estudos permanecem lembretes de conteúdo (`modulo = 'estudos'`)
- [x] Exclusão usa `ConfirmDialog`, soft delete e desvincula `conteudos.revisao_uuid`
- [x] Acesso pelo hub `/`, navegação global e Hub de Estudos
- [ ] Validar manualmente criação, revelação de resposta, avaliação, reagendamento e exclusão

## Pendências de polimento

Ver `BACKLOG.md` — upload de capa/banner, edição de itens em listas aninhadas e integrações externas continuam futuras. O menu de ações da Biblioteca fecha por clique externo, Escape ou escolha de uma ação e permanece visível em dispositivos sem hover.

## 🟡 Biblioteca v2 — Vídeos, Artigos e vínculo com Cursos

- [x] Migration incremental com `videos` e `artigos`, RLS, GRANT, checks e índices parciais
- [x] Reset local, teste consolidado, teste da Agenda e teste específico aprovados
- [x] Categorias integradas à página única e à sidebar da Biblioteca
- [x] CRUD manual, detalhe, busca e soft delete com `ConfirmDialog`
- [x] Extração local de `youtube_id` e thumbnail para URLs reconhecidas
- [x] Migration de Vídeos/Artigos aplicada em produção via cadeia ativa (2026-08-11)
- [x] Fluxo manual “Usar em Curso” com escolha de curso e módulo existente ou novo
- [x] Aula mantém FK para o vídeo, sem sincronizar progresso entre módulos
- [x] Tela de Curso identifica aulas da Biblioteca, abre o vídeo e controla teoria/domínio separadamente
- [x] Duplicação do mesmo vídeo no mesmo curso bloqueada pela camada de dados/UI
- [x] `20260811000300_conteudos_video.sql` aplicada em produção e pós-check remoto concluído (2026-08-12)
- [x] Gêneros carregados em lote e persistidos ao criar/editar filmes, séries, animes, mangás, livros e podcasts
- [x] Gêneros padrão inicializados quando necessário e gerenciamento acessível pela sidebar
- [x] Menu de ações dos cards fecha por clique externo e Escape
- [x] Trocar de categoria não reaproveita um gatilho antigo de “Adicionar”; menu fecha ao editar/apagar e é acessível por toque
- [ ] Validar manualmente os dois fluxos na etapa final
