# Sistema Pessoal

Aplicação web de gestão pessoal de longo prazo, para uso individual. O
frontend está em produção na Vercel; o repositório usa Next.js 16, React 19,
TypeScript e Supabase (PostgreSQL, Auth, Storage e RLS).

**Marco publicado: v0.2.0. Próximo marco planejado: v1.0.0.** O lote de acesso,
suporte, isolamento e homologação já está publicado e validado; cadastro público
continua desligado por decisão operacional. O fechamento da próxima versão está
em [Plano da v1.0.0](docs/RELEASE_V1.0.0_PLAN.md).

## Entender o produto e operar o beta

- [Mapa do projeto](docs/MAPA_DO_PROJETO.md): cada pasta, o que revisar e o que
  nunca deve entrar no GitHub público.
- [Plano de abertura](docs/ABERTURA_PUBLICA.md): ordem, gates e testes depois de publicar.
- [Configurar acesso público](docs/CONFIGURAR_ACESSO_PUBLICO.md): SMTP/Resend,
  URLs, CAPTCHA, Auth e criação de contas teste.
- [Aviso de privacidade — rascunho](docs/AVISO_DE_PRIVACIDADE_RASCUNHO.md):
  decisões de dados e retenção que ainda precisam de aprovação.

- [Release v0.2.0](docs/RELEASE_V0.2.0.md): módulos implementados, limitações,
  integrações e evidências históricas daquele marco.
- [Handoff para o próximo chat](docs/NEXT_ENGINEER_HANDOFF.md): estado factual,
  itens que não devem ser refeitos e primeiro ponto de decisão da v1.0.0.
- [Beta privado](docs/BETA_PRIVADO.md): abertura gradual (três amigos no piloto,
  teto dez), auditoria local de segurança e cuidados com contas/dados.
- [Manutenção](docs/MANUTENCAO.md): rotina semanal/mensal e triagem. Bugs e
  sugestões já geram protocolo, histórico e prints privados em produção.
- [Integrações/variáveis](docs/INTEGRACOES_EXTERNAS.md),
  [retestes manuais](docs/teste.md), [roadmap](docs/ROADMAP.md) e
  [ideias futuras](docs/BACKLOG.md).

Este arquivo é o ponto de entrada operacional. O contexto completo para
pessoas e agentes está em [`AGENTS.md`](AGENTS.md) e
[`docs/AI_CONTEXT.md`](docs/AI_CONTEXT.md); o trabalho atual está em
[`docs/TASKS_NOW.md`](docs/TASKS_NOW.md).

## Estrutura

- `frontend/`: único frontend ativo, em Next.js App Router;
- `browser-extension/`: extensão local de Chrome/Edge que abre Artigos e Vídeos
  pré-preenchidos para revisão dentro da Biblioteca; não contém credenciais;
- `backend/`: ferramentas locais e infraestrutura do Supabase; não é um
  servidor de aplicação;
- `backend/supabase/migrations/`: única cadeia operacional de migrations;
- `backend/supabase/history/legacy-migrations/`: acervo histórico, sem replay;
- `backend/supabase/snapshots/`: evidência forense, nunca migration;
- `docs/`: arquitetura, banco, decisões, tarefas e backlog.

## Requisitos

- Node.js `24.15.0` (fixado em `.nvmrc`);
- npm `12.0.1`;
- Docker Desktop somente para reconstruir/testar o Supabase local.

## Frontend

```powershell
cd frontend
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Preencha em `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Essas duas variáveis são configuração pública do cliente. Nunca use ou
versione uma chave `service_role`, senha, token ou connection string. A
aplicação local fica em `http://localhost:3000`.

Para ativar o preenchimento automático opcional da Biblioteca, configure
`YOUTUBE_API_KEY` e `TMDB_API_KEY` somente no ambiente do servidor, sem o
prefixo `NEXT_PUBLIC_`. `BRAPI_TOKEN`, também server-only, habilita cotações sob
demanda em Finanças sem ser necessário para o CRUD de posições.
Google Books usa `GOOGLE_BOOKS_API_KEY`; Open Library complementa livros sem
chave. AniList, Kitsu, Jikan e iTunes Search também dispensam chave.
OAuth e Places têm configuração própria no inventário de integrações acima.
Localmente, as chaves ficam em `frontend/.env.local`. Em produção, cadastre-as
em **Vercel → Project → Settings → Environment Variables**, marque o ambiente
**Production** e faça um novo deploy para que sejam carregadas.

Validações do frontend:

```powershell
npm run typecheck
npm test
npm run build
npm run lint
```

O lint possui dívida técnica conhecida e é informativo na CI; typecheck, build
e testes Node são bloqueantes. A homologação autenticada da rodada de 2026-09-09
está concluída; novos testes manuais devem acompanhar regressões ou os gates
específicos escolhidos para a v1.0.0.

## Supabase local

```powershell
cd backend
npm ci
npm run supabase -- start
npm run supabase -- db reset --local --no-seed
```

Com o stack local ativo, execute a validação SQL a partir da raiz:

```powershell
Get-Content -Raw backend/supabase/tests/validate_baseline.sql |
  docker exec -i supabase_db_backend psql -U postgres -d postgres -X
```

Detalhes, pré-requisitos e cautelas estão em
[`backend/supabase/README.md`](backend/supabase/README.md) e
[`backend/supabase/tests/README.md`](backend/supabase/tests/README.md).

## Migrations

As três baselines timestamped em `backend/supabase/migrations/` são o início
imutável da cadeia ativa e já constam como aplicadas em produção. Toda mudança
futura deve ser uma nova migration incremental: reset e testes locais, revisão
do SQL, `db push --dry-run` e autorização explícita antes de qualquer operação
remota. Nunca execute os arquivos de `history/` ou `snapshots/`.

Leia também:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md);
- [`docs/DATABASE.md`](docs/DATABASE.md);
- [`docs/DECISIONS.md`](docs/DECISIONS.md);
- [`docs/BACKLOG.md`](docs/BACKLOG.md);
- [`docs/ROADMAP.md`](docs/ROADMAP.md).
