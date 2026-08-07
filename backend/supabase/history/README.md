# Acervo histórico de migrations

Esta pasta preserva os SQLs `001`–`019` que registram parcialmente a evolução
histórica do banco do Sistema Pessoal.

## Status do acervo

Os arquivos em `legacy-migrations/`:

- não formam uma cadeia reproduzível;
- não devem ser executados em banco novo ou existente;
- não devem ser lidos automaticamente pelo Supabase CLI;
- incluem originais aparentemente preservados, arquivo modificado depois da
  execução histórica, reconstruções por engenharia reversa e correções feitas
  durante a reconciliação de 2026-08;
- são preservados inclusive com defaults, duplicações e operações destrutivas
  historicamente inconsistentes;
- não devem ser corrigidos para representar o estado atual.

A fonte canônica sobre a origem e limitações de cada arquivo é
`provenance.yaml`. O hash SHA-256 registrado no manifesto corresponde ao
conteúdo no momento do encerramento do acervo, em 2026-08-07.

## Limite da evidência

O projeto usava execução manual pelo SQL Editor e não possuía
`supabase_migrations.schema_migrations`. Confirmações históricas de que uma
mudança foi executada não provam que o arquivo atual seja o SQL literal colado
em produção. Por isso `literal_sql_executed_known` é `false` nos 19 registros.

O snapshot de `public` confirma o estado estrutural final, não a ordem, a
atomicidade, versões intermediárias ou transformações de dados. Campos como
`final_schema_effect_confirmed` significam apenas que o efeito estrutural final
é compatível com o snapshot, nunca que a operação histórica foi recuperada.

## Regras de preservação

1. Não editar os SQLs em `legacy-migrations/`.
2. Se um arquivo precisar ser estudado, comparar primeiro seu SHA-256.
3. Novas descobertas históricas são registradas no manifesto ou neste README,
   não por alteração retroativa do SQL.
4. A futura cadeia operacional ficará exclusivamente em
   `backend/supabase/migrations/`.
5. Nenhum arquivo desta pasta deve ser copiado para a cadeia operacional como
   solução de replay.

## Classificações usadas

- `original_aparentemente_preservada`: o Git não mostra alteração material
  posterior conhecida; isso não prova o texto executado no SQL Editor.
- `posteriormente_modificada`: o Git comprova mudança material após a primeira
  versão conhecida.
- `reconstruida`: arquivo criado em 2026-08 por engenharia reversa do estado
  final; o SQL original não é conhecido.
- `corrigida_reconstruida`: havia versões anteriores no Git, mas o arquivo
  atual foi refeito durante a reconciliação e não é historicamente literal.
- `incerta`: evidência insuficiente até para uma das classificações anteriores.

Todos os 19 arquivos têm `replay_supported: false`, independentemente de sua
classificação individual, porque o conjunto possui colisões e divergências
documentadas.
