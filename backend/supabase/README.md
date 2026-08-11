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
4. `20260811000100_agenda_v2.sql`.

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
