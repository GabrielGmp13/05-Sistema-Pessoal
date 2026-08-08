# Observações remotas já confirmadas

Este arquivo transcreve resultados informados antes da captura crítica literal.
Os resultados canônicos posteriores estão em `critical_storage_metadata.json`
e `critical_public_security_metadata.json`.

> **Estado posterior:** o histórico ausente abaixo descreve a captura. Em
> 2026-08-08, produção passou a registrar exatamente as três baselines ativas
> como `applied`, sem executar novamente seus SQLs.

## Histórico de migrations

A consulta a `supabase_migrations.schema_migrations` retornou `42P01`: a
relação não existe. Portanto não havia histórico remoto gerenciado pela
Supabase CLI na data da consulta.

## Buckets

Foram encontrados exatamente cinco buckets, todos privados:

| id | limite informado | criação informada |
|---|---:|---|
| `documentos` | 50 MB | 2026-06-27 |
| `capas` | 3 MB | 2026-06-28 |
| `shape` | 10 MB | 2026-06-28 |
| `exercicios` | 5 MB | 2026-07-15 |
| `redacoes` | 10 MB | 2026-08-02 |

Os valores literais em bytes, MIME types e demais colunas foram posteriormente
capturados em `critical_storage_metadata.json`.

## Policies de `storage.objects`

- `documentos`: `docs_select`, `docs_insert`, `docs_update`, `docs_delete`,
  `TO authenticated`, isolamento pela primeira pasta igual a `auth.uid()`.
- `capas`: `capas_select`, `capas_insert`, `capas_update`, `capas_delete`,
  `TO authenticated`, mesmo isolamento.
- `shape`: `shape_select`, `shape_insert`, `shape_update`, `shape_delete`,
  `TO authenticated`, mesmo isolamento.
- `redacoes`: `redacoes_isolamento_usuario`, `TO public`, `FOR ALL`, com
  `USING` e `WITH CHECK` restringindo bucket e primeira pasta.
- `exercicios`: `user_own_files_exercicios`, `TO public`, `FOR ALL`, com
  `USING` restringindo bucket e primeira pasta; `WITH CHECK` apareceu como
  `NULL` em `pg_policies`.

As expressões literais foram posteriormente capturadas em
`critical_storage_metadata.json`. Nenhuma conclusão de hardening é aplicada
neste snapshot.

## Função e event trigger customizados

- Única função observada em `public`: `public.rls_auto_enable()`.
- Retorna `event_trigger`.
- É `SECURITY DEFINER`.
- Event trigger ativo: `ensure_rls`.
- Evento: `ddl_command_end`.
- Tags: `CREATE TABLE`, `CREATE TABLE AS`, `SELECT INTO`.
- Função chamada: `public.rls_auto_enable()`.

Definição literal, owner, ACL e `proconfig`/`search_path` foram posteriormente
capturados em `critical_public_security_metadata.json`.

## Event triggers de plataforma observados

- `issue_graphql_placeholder`;
- `issue_pg_cron_access`;
- `issue_pg_graphql_access`;
- `issue_pg_net_access`;
- `pgrst_ddl_watch`;
- `pgrst_drop_watch`.

Esses objetos aparecem no schema `extensions` e são tratados provisoriamente
como infraestrutura gerenciada, não como objetos do projeto.

## Extensões observadas

- `pg_stat_statements`;
- `pgcrypto`;
- `plpgsql`;
- `supabase_vault`;
- `uuid-ossp`.

Versões, schemas de instalação e owners ainda precisam ser exportados.

## Grants observados

`authenticated` possui nas tabelas de `public`: `SELECT`, `INSERT`, `UPDATE`,
`DELETE`, `TRUNCATE`, `REFERENCES` e `TRIGGER`. Isso corresponde ao estado
efetivo de `GRANT ALL` observado, sem autorizar redução nesta etapa.

## `materias`

- `tipo`: `text`, `NOT NULL`, `DEFAULT 'escola'`;
- `materias_pkey`;
- `materias_user_id_fkey`, sem `ON DELETE CASCADE`;
- `materias_area_enem_check`;
- nenhuma constraint `CHECK` sobre `materias.tipo`.

Esses fatos também são compatíveis com `public_schema.sql`.
