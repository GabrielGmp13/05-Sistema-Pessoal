# Supabase — operação do banco

Esta pasta separa três finalidades que não devem ser misturadas:

- `migrations/`: cadeia operacional ativa do Supabase CLI;
- `history/legacy-migrations/`: acervo histórico `001`–`019`, sem suporte a
  replay;
- `snapshots/`: evidência diagnóstica datada de produção, nunca migration.

## Histórico ativo

O ponto inicial oficial da cadeia CLI é:

1. `20260807000100_baseline_public.sql`;
2. `20260807000200_baseline_rls_guard.sql`;
3. `20260807000300_baseline_storage.sql`;
4. `20260811000100_agenda_v2.sql`;
5. `20260811000200_biblioteca_videos_artigos.sql`;
6. `20260811000300_conteudos_video.sql`;
7. `20260812000100_revisao_arquivados.sql`;
8. `20260812000200_projetos_receitas.sql` — validada no banco Docker local e
   aplicada em produção em 2026-08-12 após dry-run limpo; pós-check sem pendências;
9. `20260813000100_saude_financas_lugares.sql` — validada localmente e aplicada
   em produção em 2026-08-13; pós-check sem pendências;
10. `20260813000200_biblioteca_nota_cinco_estrelas.sql` — reset e teste SQL
    específico aprovados; aplicada em produção em 2026-08-14 após dry-run
    limpo e confirmada por pós-check sem pendências.
11. `20260814000100_idiomas.sql` — cria Idiomas, Vocabulário e Práticas com
    RLS/GRANT; reset e nove testes SQL aprovados, aplicada em produção em
    2026-08-15 após dry-run exclusivo e confirmada por pós-check.
12. `20260815000100_programacao_investimentos.sql` — especializa Projetos para
    Programação e cria posições de investimento; reset e dez testes SQL
    aprovados, aplicada em produção em 2026-08-15 após dry-run exclusivo e
    confirmada por pós-check.
13. `20260815000200_v21_hardening.sql` — normaliza o domínio de Matérias,
    adiciona cascade e endurece policies de exercícios/redações; reset e onze
    testes SQL aprovados, aplicada em produção em 2026-08-15 após dry-run
    exclusivo e confirmada por pós-check vazio.
14. `20260820000100_redacoes_nota_mil.sql` — amplia `redacoes.nota` para
    `NUMERIC(5,1)` e limita o valor a 0–1000; reset e 12 testes SQL aprovados,
    aplicada em produção em 2026-08-20 após dry-run exclusivo e confirmada por
    pós-check de schema, histórico e dry-run vazio.
15. `20260820000200_redacoes_tempo_execucao.sql` — adiciona duração opcional
    em minutos a `redacoes`, com rejeição de valores negativos; reset e 13
    testes SQL aprovados, aplicada em produção em 2026-08-20 após dry-run
    exclusivo e confirmada por pós-check de schema, histórico e dry-run vazio.
16. `20260820000300_agenda_prioridade.sql` — adiciona prioridade manual
    baixa/normal/alta à Agenda, com default normal; reset e 14 testes SQL
    aprovados, aplicada em produção em 2026-08-21 após dry-run exclusivo e
    confirmada por pós-check de schema, histórico e dry-run vazio.
17. `20260821000100_biblioteca_capas_storage.sql` — completa paths de capas
    para Vídeos/Artigos e restringe MIME do bucket `capas`; aplicada após
    validação local e dry-run remoto exclusivo.
18. `20260821000200_integracoes_google_midias.sql` — cria cofre Google
    server-only, idempotência Calendar, paths de uploads restantes e bucket
    privado `midias-pessoais`; reset e 16 testes SQL aprovados, aplicada em
    produção após dry-run exclusivo e pós-check final vazio.
19. `20260822000100_integracoes_google_service_role_grant.sql` — concede ao
    `service_role` o CRUD de tabela que faltava no cofre Google; aplicada após
    reset, 16 testes SQL, dry-run exclusivo e pós-check com RLS preservada.
20. `20260822000200_integracoes_google_servicos.sql` — separa o cofre por
    `youtube`/`calendar`, migra a conexão legada para Calendar e troca a PK por
    `(user_id, servico)`; aplicada após reset, 16 testes SQL, dry-run exclusivo,
    pós-check de schema/segurança e dry-run final vazio.
21. `20260822000300_biblioteca_playlists.sql` — cria agrupamentos persistentes
    de playlists e itens da Biblioteca; aplicada após reset, 17 scripts SQL,
    dry-run exclusivo e pós-check final vazio.
22. `20260827000100_homologacao_fluxos_pessoais.sql` — migration aplicada
    para histórico ENEM, vínculo acadêmico de flashcards, planejamento semanal
    de Treino e identificação Google Places; aplicada após reset/18 scripts e
    dry-run remoto exclusivo, com pós-check e dry-run final vazio.

As três baselines foram validadas por dois replays locais completos e por
comparação com produção. Em 2026-08-08, `migration repair --status applied`
registrou exatamente essas três versões em produção. O repair alterou somente
`supabase_migrations.schema_migrations`: nenhum SQL de baseline foi executado,
nenhum objeto da aplicação mudou e um `db push --dry-run` final retornou
`upToDate=true`, `dryRun=true` e `migrations=[]`. Não foi necessário executar
`db push` real.

Baselines aplicadas são imutáveis. Não corrigir retroativamente defaults,
grants, policies, constraints ou qualquer outro estado preservado nelas.

Em 2026-08-11, `20260811000100_agenda_v2.sql` foi a primeira migration
incremental da cadeia ativa aplicada por `db push --db-url`. Reset e testes
SQL locais passaram antes da operação; o pós-check remoto não encontrou
migrations pendentes. Nenhuma baseline foi alterada.

`20260811000200_biblioteca_videos_artigos.sql` foi validada localmente e
aplicada em produção em 2026-08-11. O push listou somente essa migration.

`20260811000300_conteudos_video.sql` adiciona a FK opcional entre conteúdos
de Curso e vídeos da Biblioteca. Reset e testes SQL locais passaram em
2026-08-11; a migration foi aplicada em produção em 2026-08-12 e o pós-check
remoto não encontrou pendências.

`20260812000100_revisao_arquivados.sql` acrescenta o estado reversível de
arquivamento em `revisao_espacada`, sem apagar cards ou alterar o progresso
SM-2. Reset local, teste consolidado e teste específico passaram em
2026-08-12. Após dry-run limpo, a migration foi aplicada em produção na mesma
data; o pós-check remoto não encontrou pendências.

`20260812000200_projetos_receitas.sql` cria `projetos`, `projetos_tarefas` e
`receitas`, com RLS, GRANT, checks e índices parciais. Após validação local e
dry-run limpo, foi aplicada em produção em 2026-08-12; o pós-check remoto não
encontrou migrations pendentes.

`20260813000100_saude_financas_lugares.sql` cria os contratos manuais dos três
módulos com RLS, GRANT, checks e índices. Foi validada localmente, aplicada em
produção em 2026-08-13 após dry-run limpo e confirmada por pós-check.

`20260813000200_biblioteca_nota_cinco_estrelas.sql` altera somente as colunas
`nota` já existentes em Filmes, Séries, Animes, Mangás, Livros, Podcasts e
Vídeos. Converte valores 0-10 proporcionalmente para 0-5, arredonda para o meio
ponto mais próximo e atualiza tipo/constraints. O reset completo e
`tests/validate_biblioteca_nota_cinco_estrelas.sql` passaram localmente; a
migration foi aplicada em produção em 2026-08-14 após dry-run limpo e o
pós-check remoto não mostrou migrations pendentes.

`20260814000100_idiomas.sql` cria `idiomas`, `idiomas_vocabulario` e
`idiomas_praticas`, com checks, FKs em cascata, RLS, policies, GRANTs e índices
parciais. O reset local e os nove testes SQL passaram; o dry-run remoto listou
somente essa migration, que foi aplicada em 2026-08-15. O pós-check confirmou
as três tabelas, três policies, RLS e os doze privilégios CRUD esperados.

`20260815000100_programacao_investimentos.sql` adiciona repositório, linguagem
principal e destaque a `projetos`, além de criar `financas_investimentos` com
checks, RLS, policy, GRANT e índice parcial. O reset e os dez testes SQL
passaram; o dry-run remoto listou somente essa migration, aplicada em
2026-08-15. O pós-check confirmou 63 tabelas, histórico remoto, três colunas de
Programação e proteção completa da nova tabela; o dry-run final ficou vazio.

`20260815000200_v21_hardening.sql` não cria tabela. Normaliza `escola`/`enem`
para `academica`, define default e CHECK de `materias.tipo`, alinha a FK de
usuário com `ON DELETE CASCADE` e recria as policies de `exercicios` e
`redacoes` para `authenticated`, com `USING` e `WITH CHECK` por primeira pasta.
O reset e os onze testes SQL passaram; o dry-run remoto listou somente essa
migration, aplicada em 2026-08-15. O pós-check alinhou as 13 versões e deixou o
dry-run vazio.

`20260820000100_redacoes_nota_mil.sql` corrige o limite histórico de
`redacoes.nota`, que em `NUMERIC(4,1)` não comportava 1000,0. O reset e os 12
testes SQL passaram; o dry-run remoto listou somente esta migration, aplicada
em produção em 2026-08-20. O pós-check confirmou `NUMERIC(5,1)`, constraint
0–1000, a 14ª versão no histórico e dry-run vazio.

`20260820000200_redacoes_tempo_execucao.sql` acrescenta somente
`redacoes.tempo_execucao_minutos INTEGER`, opcional e não negativo. O reset e
os 13 testes SQL passaram; o dry-run remoto listou exclusivamente esta
migration, aplicada em produção em 2026-08-20. O pós-check confirmou a coluna,
a constraint, a 15ª versão no histórico e dry-run final vazio.

`20260820000300_agenda_prioridade.sql` acrescenta somente
`agenda.prioridade TEXT NOT NULL DEFAULT 'normal'`, limitada a baixa, normal e
alta. O reset e os 14 testes SQL passaram; o dry-run remoto listou
exclusivamente esta migration, aplicada em produção em 2026-08-21. O pós-check
confirmou coluna, default, constraint, a 16ª versão e dry-run final vazio.

## Workflow para toda mudança futura

1. Criar uma nova migration timestamped em `migrations/`.
2. Nunca editar uma baseline ou migration já aplicada.
3. Testar localmente com `db reset --local --no-seed`.
4. Executar os testes estruturais e comportamentais relevantes em `tests/`.
5. Revisar o SQL e seus efeitos, incluindo RLS e GRANT quando aplicáveis.
6. Executar `db push --dry-run` contra o alvo autorizado.
7. Somente depois de novo precheck e autorização explícita executar qualquer
   operação remota mutável.
8. Atualizar `docs/DATABASE.md`, `docs/TASKS_NOW.md`, `docs/CHANGELOG.md` e,
   quando houver decisão nova, `docs/DECISIONS.md`.

## Produção e credenciais

A produção não possui link local persistido. A CLI `2.112.0` apresentou
incompatibilidade de parsing da Management API em `supabase link`; enquanto
isso permanecer, comandos remotos especificamente autorizados podem usar
`--db-url` com uma variável de ambiente da sessão. Nunca colocar connection
string, senha, token, project ref temporário ou conteúdo de variável em Git,
documentação, logs ou arquivos `.temp`.

Nunca executar `db push`, `migration repair`, `db reset`, `migration up` ou
comando equivalente contra produção sem escopo explícito e confirmação do
alvo. Preferir sempre operações locais e consultas somente leitura.

## Estado preservado, não hardening retroativo

A baseline reproduz o estado aprovado de produção, inclusive `GRANT ALL` nas
44 tabelas, policies atuais de `redacoes` e `exercicios`,
`materias.user_id` sem `ON DELETE CASCADE`, ausência de
`materias_tipo_check` e demais hardenings conhecidos. Qualquer mudança nesses
pontos deve ser uma migration futura separada, nunca edição da baseline.
