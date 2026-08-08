# Notas da captura forense

## Data e método

- Ambiente: Supabase de produção do Sistema Pessoal.
- Captura de Storage: `2026-08-07T22:28:28.899688+00:00`.
- Captura de segurança de `public`: `2026-08-07T22:29:12.549561+00:00`.
- Método: os dois blocos `SELECT` de `critical_capture_queries.sql` foram
  executados manualmente pelo usuário no SQL Editor do Supabase.
- Transporte: resultados copiados como tabelas Markdown; a célula JSON de cada
  resultado foi extraída, validada com parser JSON e salva de forma formatada.
- Acesso automático ao remoto: não utilizado.
- Mutação do remoto: nenhuma.

## Escopo

`critical_storage_metadata.json` contém:

- configuração literal dos cinco buckets da aplicação, exceto campos de
  ownership deliberadamente removidos pela consulta;
- 14 policies de `storage.objects`, com roles, comando, `USING` e `WITH CHECK`;
- contagens de controle.

`critical_public_security_metadata.json` contém:

- `pg_get_functiondef(public.rls_auto_enable())`;
- owner, ACL, linguagem, `SECURITY DEFINER`, volatilidade, parallel safety e
  `proconfig` da função;
- metadados do event trigger `ensure_rls`;
- confirmação de ordinary triggers, sequences, domains/enums,
  views/foreign tables e outras funções em `public`.

O schema relacional de `public` permanece documentado por `public_schema.sql`,
preservado byte a byte do dump anterior.

## Validação estrutural

- Ambos os arquivos são JSON válido.
- Buckets: campo de controle `5`, array com `5`, IDs únicos `5`.
- Policies: campo de controle `14`, array com `14`, nomes únicos `14`.
- Todos os cinco buckets são `STANDARD` e privados.
- A lista de policies corresponde exatamente aos nomes previamente observados.
- `rls_auto_enable()` é a única função em `public`.
- O corpo da função retornado pelo remoto é idêntico ao corpo do dump, após
  normalizar apenas quoting e delimitador dollar-quote.
- `ordinary_triggers`, `sequences`, `domains_and_enums`,
  `views_and_foreign_tables` e `other_public_functions` são arrays vazios.

SHA-256 dos arquivos canônicos:

- `critical_storage_metadata.json`:
  `df6afc19ec0ae181a5239a4a2794dec8b7b2e85fccea3e957fd31f2ff70d3370`;
- `critical_public_security_metadata.json`:
  `4c7a8209653ee8364de284540b1b33989d121bad879a7e0a305b7f5ff4201451`.

## Confrontação com o dump e o histórico

### Compatibilidades

- `shape` mantém 10 MiB e MIME types JPEG, PNG e WebP, como em `001`.
- As 12 policies de `shape`, `documentos` e `capas` são semanticamente iguais
  às policies versionadas em `001`.
- `redacoes_isolamento_usuario` corresponde à instrução manual comentada em
  `017`, inclusive `TO public`, `FOR ALL`, `USING` e `WITH CHECK`.
- A função confirma owner `postgres`, `plpgsql`, `SECURITY DEFINER`,
  `search_path=pg_catalog`, volatilidade `volatile`, parallel safety `unsafe` e
  ACL explícita `NULL`.
- `ensure_rls` confirma owner `postgres`, evento `ddl_command_end`, estado `O`
  (`origin`) e tags `CREATE TABLE`, `CREATE TABLE AS`, `SELECT INTO`.
- Não foi encontrado drift em objetos residuais de `public` em relação ao dump.

### Divergências históricas confirmadas

- `capas`: `001` registrava 2 MiB e JPEG/PNG/WebP; o remoto atual possui
  3 MiB e `allowed_mime_types = null`.
- `documentos`: `001` registrava somente PDF; o remoto atual mantém 50 MiB,
  mas aceita dez MIME types, incluindo EPUB, formatos Office, texto e JSON.
- `redacoes`: `017` sugeria JPEG/PNG/WebP; o bucket real possui 10 MiB e
  `allowed_mime_types = null`.
- `exercicios`: bucket de 5 MiB, quatro MIME types de imagem e policy própria
  existem no remoto, mas sua criação não está versionada nas migrations legadas.

Essas diferenças são evidência de configuração manual posterior. Elas não
devem ser corrigidas no acervo histórico; a baseline deve reproduzir o remoto.

## Dados pessoais

Os dois JSONs não contêm:

- linhas das tabelas da aplicação;
- usuários de `auth`;
- IDs de owner dos buckets;
- nomes ou paths de objetos armazenados;
- conteúdo de arquivos;
- credenciais, tokens, connection strings ou segredos.

O valor `postgres` presente nos metadados é um role técnico do banco, não uma
identidade pessoal.

## Limitações

- A captura não contém dados nem objetos armazenados nos buckets.
- Tabelas e colunas de `public` não foram recapturadas nesta consulta crítica;
  sua evidência continua sendo `public_schema.sql`.
- Os seis event triggers de infraestrutura foram registrados na observação
  remota anterior, mas o JSON crítico recaptura somente `ensure_rls`, único
  objeto que entrará na baseline do projeto.
- Extensões continuam responsabilidade da plataforma e não foram recapturadas
  com versão/owner porque esses dados não são necessários à baseline.
- Na data desta captura, a equivalência operacional ainda não havia sido
  comprovada e nenhum CLI havia sido inicializado. Depois, dois replays locais
  completos confirmaram equivalência com produção.

## Suficiência para baseline

- `baseline_public.sql`: evidência suficiente.
- `baseline_rls_guard.sql`: evidência suficiente.
- `baseline_storage.sql`: evidência suficiente.

Naquele momento, esta conclusão autorizava somente a geração futura dos
arquivos. Posteriormente, as baselines foram geradas, validadas localmente e
adotadas no histórico de produção em 2026-08-08 sem reexecução de SQL. A
captura continua sem autorizar mudança de segurança por si só.
