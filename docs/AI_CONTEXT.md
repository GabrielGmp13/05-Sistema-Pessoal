# AI_CONTEXT.md

> **Leia este arquivo primeiro.** Ele é o ponto de entrada do projeto — um bootstrap para qualquer agente de IA (ou o próprio Gabriel) retomar o trabalho sem precisar reler tudo. Detalhes técnicos vivem nos documentos linkados abaixo, não aqui.
>
> **Retomada rápida:** depois deste arquivo, leia `docs/NEXT_ENGINEER_HANDOFF.md`
> para obter o estado operacional curto, o bug ativo conhecido e o prompt de
> continuidade sem carregar toda a documentação longa.

---

## Projeto

**Sistema Pessoal** — gestão pessoal online, multi-dispositivo, para uso individual de longo prazo.
**Desenvolvedor:** Gabriel, estudante (Pernambuco, BR).
**Editor:** VS Code · Windows
**Comunicação:** Português · tom direto · sem rodeios

Qualquer agente de IA que trabalhar neste projeto (Claude via chat, Codex via
`AGENTS.md`, ou outro) segue a mesma disciplina: lê a documentação nesta
ordem antes de propor mudança estrutural, só commita/pusha com autorização
explícita do usuário e nunca assume nome de coluna/rota de memória. Ver `PROJECT_PRINCIPLES.md` → "Fluxo
de trabalho com IAs" para o histórico completo de ferramentas já usadas.

---

## Estrutura real do repositório

```
05-Sistema-Pessoal/
├── AGENTS.md              ← instruções para agentes de IA (Codex e outros)
├── README.md              ← entrada operacional: instalação e validação
├── .nvmrc                 ← Node.js 24.15.0
├── .github/workflows/     ← CI mínima do frontend
├── docs/                  ← toda a documentação do projeto (este arquivo incluído)
├── browser-extension/     ← extensão local Chrome/Edge; abre itens para revisão
├── backend/
│   ├── package.json       ← ferramentas locais do banco; não é aplicação
│   └── supabase/
│       ├── config.toml    ← configuração local, sem link de produção
│       ├── history/       ← acervo histórico 001–019
│       ├── migrations/    ← cadeia operacional ativa (baselines + incrementais futuras)
│       └── snapshots/     ← evidência forense do remoto
└── frontend/               ← único frontend ativo, Next.js App Router
```

**Não existe** pasta `backend/` com código de aplicação/servidor — o nome é
enganoso, mas ela guarda infraestrutura SQL, snapshots e a Supabase CLI local
fixada. O manifesto de `backend/` é apenas de ferramentas; não existe monorepo
com múltiplas aplicações. Documentação aprofundada fica em `docs/`;
`README.md`, `AGENTS.md` e o stub `CLAUDE.md` ficam na raiz por função
operacional.

---

## Estado atual (2026-09)

> **Consolidação de 2026-09-09:** a v0.2.0 continua sendo a versão declarada no
> pacote, mas acesso, suporte, isolamento, otimização de imagens, responsividade
> e homologação posteriores já estão publicados. A próxima versão planejada é a
> v1.0.0; ela ainda não foi lançada. Use
> [RELEASE_V1.0.0_PLAN.md](RELEASE_V1.0.0_PLAN.md) para seus gates e
> [NEXT_ENGINEER_HANDOFF.md](NEXT_ENGINEER_HANDOFF.md) para retomar em outro
> chat. O relato cronológico abaixo preserva evidências intermediárias e não
> deve ser usado isoladamente como lista de pendências.

**Resumo vigente (2026-09-10):** 106 testes Node, typecheck e build de 48
páginas aprovados sobre a instalação limpa de 2026-09-09; o lint atual tem
0 erros e 0 avisos após a rodada autorizada para publicação
e permanece como gate de qualidade. Reset local e 22 testes SQL são a evidência da última
recertificação de banco. A auditoria local está sem vulnerabilidades após
atualizar Next.js/`eslint-config-next` para 16.3.3, `sharp` para 0.35.4 e
`baseline-browser-mapping` para 2.11.21. A homologação autenticada e de duas contas terminou;
a massa `TESTE FINAL` foi apagada, preservando contas, integrações e agenda real.
Cadastro público segue desligado. Em 2026-09-09, Gabriel confirmou a v1.0.0
como lançamento controlado para uso pessoal e amigos nos primeiros meses,
compatível com a operação gratuita atual. Cadastro irrestrito fica para uma
etapa futura e exigirá os gates adicionais de e-mail/OAuth, abuso, privacidade
e retenção. Places foi desativado para a v1.0.0 por decisão de custo zero;
Lugares segue manual. Pendências aceitas/externas: reteste publicado da
correção de Anime/Mangá e gestos físicos de toque. Gabriel adiou a homologação
ENEM completa para fazê-la pessoalmente durante o uso.

### Registro cronológico anterior (preservado como evidência)

**Fase registrada no início do lote:** release v0.2.0 publicada em 2026-09-05; lote de acesso, suporte público
e login Google publicado em 2026-09-07 pelo commit `118e487`. Cadastro continua
desligado até SMTP, CAPTCHA, isolamento, privacidade e homologação. A migration
de suporte já está em produção. As fases históricas v2/v2.1 continuam
preservadas; a aplicação Next.js é o único frontend ativo.
**Smoke público:** login Google concluiu e vinculou a conta existente sem
duplicata; a central criou protocolo/histórico e abriu print privado. Exportação
passou nas contas principal e descartável; a recuperação entregou o e-mail
esperado sem troca de senha. Uma segunda conta aprovou isolamento cruzado de
Projetos, tarefa relacionada e Shape/Storage privado; a matriz completa por
módulo ainda está pendente.
**Decisão-chave:** DEC-018 (reabre DEC-006) — frontend migrou de HTML puro para Next.js/React
**Deploy:** ✅ em produção no Vercel desde 2026-07-13 (não "pendente" — ver `ARCHITECTURE.md`)
**Schema:** produção possui 71 tabelas e 27 migrations aplicadas até `20260908000100_treino_integridade_por_usuario.sql`; a migration mais recente passou reset completo, 22 testes SQL, dry-run exclusivo, aplicação autorizada e dry-run final vazio.
**Histórico CLI:** evidências dos pós-checks anteriores estão em `DATABASE.md`/`CHANGELOG.md`; a revisão local atual não recertifica o remoto.
**Reprodutibilidade:** Node.js `24.15.0`, npm `12.0.1`, lockfile e CI ativos. Na preparação v0.2.0: typecheck/build e 76 testes Node aprovados; lint informativo com 25 erros/28 avisos (dívida anterior), zero erros no recorte alterado. Evidências em `RELEASE_V0.2.0.md`.
**Situação registrada durante a homologação:** cadastro continua fechado e domínio/Resend/SMTP
foram adiados para manter a operação gratuita. A conta principal foi reiniciada
em 2026-09-07, preservando login, perfil e duas conexões Google; o pós-check
confirmou módulos/pedidos vazios e nenhum arquivo restante fora da mídia do
perfil. A exportação JSON foi publicada pelo commit `af8486b`, com deploy
`Ready`, recusa 401 sem sessão e download autenticado válido confirmados. A
exportação não incluiu campos secretos. O ensaio de exportação/exclusão com
conta descartável e a entrega do e-mail de recuperação passaram em 2026-09-08;
nenhuma senha foi alterada. A otimização de imagens foi publicada no commit
`a8aa37f`, com CI e deploy de produção aprovados. A conta de teste foi recriada:
perfil, integrações, suporte e onze módulos não vazaram dados da principal, e um
projeto da secundária e sua tarefa relacionada ficaram invisíveis na principal.
O mesmo ocorreu com um registro Shape e sua imagem otimizada para WebP; acesso
direto sem assinatura respondeu `400`, e o bucket ficou vazio após a limpeza.
CRUD, relacionamento, qualidade visual e remoção da massa temporária passaram.
Naquele ponto, ainda restavam casos por módulo de `teste.md`; eles foram
encerrados na consolidação de 2026-09-09 acima. Há um único
e-mail operacional privado; marca e telefone público
foram adiados. Estrutura em `MAPA_DO_PROJETO.md`, abertura/testes em
`ABERTURA_PUBLICA.md` e operação em `MANUTENCAO.md`.

**Hardening publicado (registro intermediário):** DEC-080 adiciona uma segunda camada de isolamento no
código, sem substituir RLS. APIs com `service_role`, relações
de suporte, exclusão lógica compartilhada e paths genéricos de Storage repetem
o escopo do usuário; testes de regressão foram adicionados à CI. A validação
local passou com 91 testes, typecheck, build e lint do recorte; CI, deploy e
recusa `401` de oito APIs sem sessão também passaram. O smoke autenticado desta
camada estava pendente naquele momento e foi concluído na homologação posterior.

**Hardening de relacionamentos publicado:** a matriz real confirmou que as
leituras de Agenda, Idiomas, Saúde, Finanças, Lugares e Treino não vazam entre
duas contas. URLs diretas do Treino, porém, exibiam formulários vazios porque as
FKs históricas não carregavam `user_id`. A DEC-081 e a migration
`20260908000100_treino_integridade_por_usuario.sql` corrigiram a interface e dez
relações do banco. Reset, 22 testes SQL, 93 testes Node, typecheck e build
passaram; a migration foi aplicada em produção e o dry-run final voltou vazio.
Produção possui 27 migrations. As três URLs cruzadas agora bloqueiam módulo,
exercícios e academia antes de exibir formulários.

---

## Stack (resumo — detalhes em ARCHITECTURE.md)

| Camada | Tecnologia |
|---|---|
| Banco de dados | PostgreSQL via Supabase (71 tabelas em produção) |
| Auth | Supabase Auth (e-mail/senha, recuperação e login Google) |
| Storage | Supabase Storage — 7 buckets privados e 18 policies; suporte não aceita acesso direto do cliente |
| Frontend | Next.js 16.3.3 (React 19) + TypeScript — pasta `frontend/`, único frontend do projeto |
| Estilização | CSS Modules (Treino/Biblioteca/Dashboard) + Tailwind v4/shadcn (Estudos) — stack mista intencional, DEC-038 |
| Backend leve | 19 API Routes (Next.js/Vercel): metadados, BRAPI, Anki, Google OAuth/YouTube/Calendar, Places, suporte e exportação de dados, com credenciais server-only |
| Offline | Service Worker — fora de escopo por ora (Fase M2, ver `ROADMAP.md`) |
| Hosting | Vercel — **em produção desde 2026-07-13** |
| Toolchain | Node.js 24.15.0 + npm 12.0.1; versões fixadas no repositório |
| CI/testes | GitHub Actions: `npm ci`, typecheck, testes Node e build bloqueantes; lint informativo. Estado local mais recente: 106 testes Node, typecheck e build aprovados; lint tem 0 erros/0 avisos; 22 testes SQL na última recertificação |

---

## Regras gerais

1. Schema-first: nunca gerar frontend para tabela/coluna sem confirmar em `DATABASE.md` que a migration já foi executada.
2. Diffs para alteração de arquivo existente; arquivo completo só para criação nova ou reescrita extensa e justificada.
3. Não alterar stack sem justificativa forte (ver `PROJECT_PRINCIPLES.md`).
4. Toda nova página segue o padrão descrito em `ARCHITECTURE.md` → Frontend.
5. Todo nome de coluna/tabela deve ser conferido em `DATABASE.md` antes de escrever queries — a causa mais comum de bugs neste projeto até agora foi nome de coluna inventado sem checar o schema real. Em segundo lugar: arquivo de migration local divergindo do banco real (ver `DATABASE.md`, nota de 2026-08) — quando em dúvida, o banco de produção é a fonte da verdade, não o `.sql` local.
6. Agentes não commitam nem fazem push por padrão; podem fazê-lo somente quando o usuário autorizar explicitamente no prompt, após revisar validações, stage e segredos.
7. Banco: `history/legacy-migrations/` é somente acervo; `snapshots/` é somente evidência; a cadeia ativa fica em `backend/supabase/migrations/`. Baseline aplicada nunca é editada — toda mudança futura nasce em migration timestamped incremental.

---

## Mapa da documentação

| Documento | Conteúdo |
|---|---|
| `ARCHITECTURE.md` | Diagrama do sistema, componentes Supabase, camadas do frontend, Service Worker, Realtime |
| `DATABASE.md` | Todas as tabelas, colunas, relacionamentos, RLS, convenções de migração, gotchas de nomes |
| `DESIGN.md` | Paleta, tipografia, componentes de UI, responsividade |
| `PROJECT_PRINCIPLES.md` | Princípios permanentes do projeto |
| `MODULE_TEMPLATE.md` | Modelo para documentar novos módulos |
| `DECISIONS.md` | Decisões arquiteturais com alternativas consideradas |
| `ROADMAP.md` | Fases do projeto e o que falta em cada uma |
| `VISION.md` | Visão macro de módulos futuros |
| `TASKS_NOW.md` | Tarefas ativas e próximas ações |
| `RELEASE_V0.2.0.md` | Fotografia histórica do marco v0.2.0 e suas evidências |
| `RELEASE_V1.0.0_PLAN.md` | Escopo, decisões, gates e definição de pronto para a próxima versão |
| `NEXT_ENGINEER_HANDOFF.md` | Retomada curta e prompt recomendado para o próximo chat |
| `BETA_PRIVADO.md` | Convites, privacidade, gates e auditoria local de segurança |
| `MANUTENCAO.md` | Rotinas, relatos de bugs e publicação de notas de atualização |
| `INTEGRACOES_EXTERNAS.md` | Inventário de APIs, variáveis e limitações |
| `archive/TASKS_HISTORY_2026-08.md` | Fotografia integral das tarefas anteriores; não é estado vigente |
| `BACKLOG.md` | Ideias futuras, não priorizadas |
| `CHANGELOG.md` | Histórico de mudanças por marco |
| `HOMOLOGATION_V2.md` | Checklist manual completo da release candidate |
| `V2_RELEASE_CANDIDATE.md` | Handoff, requisitos de ambiente, estado de migrations e critério de saída da v2 |
| `NAMING_CONVENTIONS.md` | Padrões de nomenclatura (arquivos, SQL, JS, CSS) |
| `COMMIT_CONVENTIONS.md` | Padrão de mensagens de commit |
