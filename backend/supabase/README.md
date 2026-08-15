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
