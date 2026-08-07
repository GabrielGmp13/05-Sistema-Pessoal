# Captura de produção — 2026-08-07

## Origem

- Ambiente: Supabase de produção do Sistema Pessoal.
- Data de referência: 2026-08-07, fuso America/Sao_Paulo.
- Método disponível: dump somente do schema `public`, previamente obtido com
  `supabase db dump`, e consultas manuais somente leitura no SQL Editor.
- Acesso automático ao remoto: não utilizado nesta etapa.

## Arquivos presentes

- `public_schema.sql`: preservação byte a byte do `schema_real.sql` que estava
  na raiz do repositório.
- `capture_queries.sql`: consultas somente leitura para completar a captura.
- `critical_capture_queries.sql`: captura mínima obrigatória, consolidada em
  apenas dois resultados JSON; executada manualmente em 2026-08-07.
- `critical_storage_metadata.json`: resultado literal validado da captura de
  buckets e policies de Storage.
- `critical_public_security_metadata.json`: resultado literal validado da
  captura da função, event trigger e objetos residuais de `public`.
- `capture-notes.md`: método, validações, divergências e limitações da captura.
- `remote-observations.md`: transcrição dos resultados remotos já informados;
  preservada como registro anterior à captura literal.

## Captura mínima concluída

Os dois blocos de `critical_capture_queries.sql` foram executados e preservados
como:

- `critical_storage_metadata.json`;
- `critical_public_security_metadata.json`.

Os resultados foram validados estruturalmente e confrontados com o dump e o
acervo histórico. A captura ampla abaixo permanece opcional e não é necessária
para gerar a baseline.

## Captura ampla opcional

Ao executar cada bloco de `capture_queries.sql`, exportar o resultado para:

- `capture_context.csv`;
- `public_objects.csv`;
- `public_columns.csv`;
- `public_constraints.csv`;
- `public_indexes.csv`;
- `public_triggers.csv`;
- `public_policies.csv`;
- `public_schema_acl.csv`;
- `public_table_grants.csv`;
- `public_relation_acls.csv`;
- `public_default_acls.csv`;
- `public_routine_grants.csv`;
- `public_functions.csv`;
- `rls_auto_enable_definition.sql`;
- `event_triggers.csv`;
- `extensions.csv`;
- `public_sequences.csv`;
- `public_types.csv`;
- `public_comments.csv`;
- `storage_buckets.csv`;
- `storage_policies.csv`;
- `storage_relation_acl.csv`;
- `object_counts.csv`.

Os arquivos só devem ser adicionados ao repositório depois de revisão para
remover identificadores ou metadados sensíveis. Não exportar resultados de
consultas diferentes para o mesmo arquivo.

## Limitações

O dump `public_schema.sql` não contém o schema `storage`, os registros de
`storage.buckets` nem event triggers. Essas lacunas são complementadas pelos
dois JSONs críticos; consultar `capture-notes.md` para o escopo exato.

SHA-256 de `public_schema.sql` no momento da preservação:
`a5b71dfde138b0da61d69afe0ff754b27d2145d13d4337503708a69bcf1e7d2d`.
