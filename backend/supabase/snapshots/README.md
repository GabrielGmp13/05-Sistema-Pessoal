# Snapshots do Supabase

Esta pasta guarda evidências diagnósticas datadas do banco. Um snapshot:

- não é migration e nunca deve ser executado como SQL de implantação;
- representa somente o estado observado na data da captura;
- pode ficar obsoleto imediatamente após uma mudança no banco;
- deve registrar data, origem, método de captura e limitações;
- não deve conter linhas de negócio, arquivos de Storage, credenciais, tokens,
  senhas, dados pessoais ou segredos do projeto.

Cada captura vive em uma pasta no formato `AAAA-MM-DD-ambiente/`. Os arquivos
de resultado devem conservar a saída bruta sempre que isso não expuser dados
sensíveis. Qualquer normalização posterior deve gerar outro arquivo e explicar
o procedimento em `capture-notes.md`.

## O que deve ser capturado

- schema `public` completo;
- tabelas, colunas, constraints, índices, RLS e policies;
- grants e ACLs dos objetos de `public`;
- funções customizadas de `public`;
- event triggers e extensões instaladas;
- configuração dos buckets da aplicação, sem listar objetos armazenados;
- policies aplicadas a `storage.objects`.

## O que não deve ser capturado

- conteúdo das tabelas da aplicação;
- usuários ou identidades de `auth`;
- nomes e paths de arquivos enviados pelos usuários;
- conteúdo dos buckets;
- variáveis de ambiente ou connection strings;
- objetos internos da plataforma sem relevância para o diagnóstico.

Os arquivos desta pasta não são fonte operacional. A cadeia executável futura
ficará exclusivamente em `backend/supabase/migrations/`.
