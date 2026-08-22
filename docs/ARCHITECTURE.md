# ARCHITECTURE.md

> **Nota (2026-08):** este documento descrevia, em partes, o estado da v1
> (HTML puro) como se fosse a arquitetura atual — incluindo "deploy do Vercel
> ainda não feito" e exemplos de código em `window.sb`/`sm2.js`. Isso estava
> desatualizado: a v1 foi aposentada em 2026-07-19 (DEC-031), o deploy no
> Vercel está feito desde 2026-07-13, e o SM-2 hoje vive em
> `frontend/lib/revisao.ts` (TypeScript), não em `sm2.js`. Este documento foi
> reescrito para refletir o estado real do sistema v2.

## Diagrama do sistema

```
                   [Qualquer dispositivo — PC, celular, tablet]
                                  Browser (HTTPS)
                                      │
    ┌─────────────────────────────────┼────────────────────────┐
    │                                 │                        │
    ▼                                 ▼                        ▼
Vercel — frontend/                  Supabase                Supabase
(Next.js + proxy.ts)          (PostgreSQL + Auth)        (Storage privado)
Único projeto Vercel, único frontend ativo — v1 aposentada em 2026-07-19 (DEC-031)
```

**Sem servidor customizado.** O frontend (Next.js) é servido pelo Vercel. Todos os dados, auth e arquivos passam pelo Supabase.

**Status de implementação real (2026-08):**
- Schema PostgreSQL ✅ executado — 44 tabelas em `public` confirmadas via dump real do banco (ver `DATABASE.md`).
- Auth ✅ funcionando (email + senha).
- Storage ✅ cinco buckets/14 policies históricos reproduzidos pela baseline;
  produção atual possui seis buckets privados e 18 policies após a migration
  incremental de mídias. Ver `DATABASE.md` e os snapshots.
- Deploy no Vercel ✅ feito (`frontend/` como Root Directory) desde 2026-07-13.
- Realtime 🔄 não implementado.
- Service Worker 🔄 não implementado.
- API Routes (`app/api/**/route.ts`) 🔄 **nenhuma existe ainda** — a integração de APIs externas (TMDB) que precisaria de uma ainda não foi construída (ver `TASKS_NOW.md`).

Offline: Service Worker cacheia assets e dados recentes (ainda não implementado — Fase M2, formalmente fora de escopo por ora, ver `ROADMAP.md`).

---

## Supabase: componentes utilizados

### PostgreSQL
Banco de dados relacional. Schema completo executado e confirmado via dump real extraído do Supabase em 2026-08 (não apenas pela existência dos arquivos `.sql` locais — ver `DATABASE.md` para a discrepância que isso revelou entre alguns arquivos locais e o banco real). Toda tabela segue a convenção:
- `user_id UUID` (para RLS)
- Tipos nativos: `BOOLEAN`, `TIMESTAMPTZ`, `UUID`, `NUMERIC`
- Row Level Security ativa em todas as tabelas

### Supabase Auth
- Email + senha — testado com usuário real, login funcionando
- JWT gerado automaticamente
- `auth.uid()` disponível em políticas RLS
- Sessão lida no frontend via `lib/supabase.ts` → `getSession()`/`getUserId()`, e no servidor via `proxy.ts` → `createServerClient` (`@supabase/ssr`)

### Supabase Storage

**Decisão (DEC-010): todos os buckets são privados.** Nenhum arquivo é publicamente acessível. Acesso exclusivo via signed URL com expiração de 1 hora.

| Bucket | Conteúdo | Limite | Tipos aceitos | Evidência atual no repositório |
|---|---|---|---|---|
| `shape` | Fotos de shape | 10 MiB | JPEG, PNG, WebP | Confirmado no snapshot e reproduzido pela baseline |
| `documentos` | Provas, apostilas e documentos | 50 MiB | 10 MIME types documentados no snapshot | Confirmado no snapshot e reproduzido pela baseline |
| `capas` | Capas de obras da Biblioteca | 3 MiB | sem restrição MIME no estado capturado | Confirmado no snapshot e reproduzido pela baseline |
| `exercicios` | Imagens/GIFs de exercícios | 5 MiB | 4 MIME types de imagem | Confirmado no snapshot; origem histórica era configuração manual |
| `redacoes` | Foto da folha manuscrita | 10 MiB | sem restrição MIME no estado capturado | Confirmado no snapshot; origem histórica era configuração manual |

Convenção de path obrigatória: `{user_id}/nome-do-arquivo.ext`. A baseline
preserva as 14 policies históricas; produção possui mais quatro policies CRUD
de `midias-pessoais`, totalizando 18. As definições históricas estão no
snapshot; hardenings permanecem migrations incrementais, nunca edição da baseline.

### Supabase Realtime
- Subscrições a `postgres_changes` por tabela
- **Status:** 🔄 não implementado em nenhuma página ainda (Fase M3, formalmente fora de escopo por ora — ver `ROADMAP.md`)

---

## Schema PostgreSQL

Schema completo (tabelas, colunas, relacionamentos, RLS, convenções de migração) vive em `DATABASE.md`. Este documento cobre a arquitetura de componentes; `DATABASE.md` cobre a estrutura de dados em si — incluindo o histórico de reconciliação contra o dump real do banco (2026-08).

---

## Política de mídia — Biblioteca

Ver DEC-011 em `DECISIONS.md` para o raciocínio completo. Resumo prático: catálogo de metadados, nunca hospedagem de mídia. Capas via `capa_url` (quando a API fornece) ou upload manual em `capas`/`capa_path` (só quando não fornece — upload em si ainda sem UI, ver tabela de Storage acima).

---

## Frontend (Next.js / React — DEC-018)

Pasta única do frontend: `frontend/` (renomeada de `frontend-v2/` em 2026-07-19, DEC-031). **Não existe pasta `backend/` com código de aplicação** — a pasta atual contém somente ferramentas e infraestrutura SQL. Em `backend/supabase/`, `migrations/` é a cadeia ativa, `history/legacy-migrations/` é acervo não reproduzível e `snapshots/` é evidência diagnóstica. Nenhum arquivo de history/snapshot deve ser executado como migration.

### Reprodutibilidade e validação

O repositório fixa Node.js `24.15.0` em `.nvmrc` para uso local/CI, seleciona a
major `24.x` em `engines` para a Vercel e fixa npm `12.0.1` nos dois
manifestos. `frontend/package-lock.json` é a fonte da instalação determinística
por `npm ci`; o nome do pacote é `frontend`. O padrão shadcn/ui continua no
código gerado e em `components.json`, mas a CLI `shadcn` não é dependência de
runtime nem de desenvolvimento instalada permanentemente.

A CI em `.github/workflows/validate.yml` usa placeholders públicos e inertes
para as duas variáveis Supabase do cliente; não acessa produção nem faz deploy.
`npm ci`, typecheck e build são bloqueantes. O lint é informativo enquanto os
51 achados catalogados em `BACKLOG.md` permanecerem. A suíte leve do frontend
usa `node:test` para parsers/cálculos de alto valor; o banco mantém os scripts
SQL locais em `backend/supabase/tests/`.

### Rotas confirmadas pelo build

O build de 2026-08-21 confirmou 37 entradas no inventário do App Router,
incluindo 11 API Routes e o `_not-found` gerado pelo Next.js. A lista de
páginas abaixo permanece o inventário funcional; as novas API Routes cobrem Anki e Google
OAuth/YouTube/Calendar:

- base e portais (7): `/`, `/login`, `/configuracoes`, `/agenda`, `/revisao`,
  `/diario` e `/historico`;
- Biblioteca (2): `/biblioteca` e `/biblioteca/generos`;
- Estudos (10): `/estudos`, `/estudos/areas/[tipo]`, `/estudos/curso`,
  `/estudos/curso/[materiaUuid]`, `/estudos/enem`,
  `/estudos/enem/[area]`, `/estudos/enem/gabarito/[provaUuid]`,
  `/estudos/escola`, `/estudos/materia/[materiaUuid]` e `/estudos/redacoes`;
- Treino (5): `/treino`, `/treino/shape`, `/treino/[moduloUuid]`,
  `/treino/[moduloUuid]/[treinoUuid]` e
  `/treino/[moduloUuid]/[treinoUuid]/academia`;
- demais domínios (7): `/financas`, `/idiomas`, `/lugares`, `/programacao`,
  `/projetos`, `/receitas` e `/saude`;
- APIs (2): `/api/biblioteca/metadados` e `/api/financas/cotacao`.

### Histórico operacional do banco

As três baselines timestamped de `backend/supabase/migrations/` são o ponto
inicial oficial do histórico CLI. Foram reproduzidas localmente duas vezes e
registradas como `applied` em produção em 2026-08-08 sem reexecutar seus SQLs.
O `db push --dry-run` posterior confirmou nenhuma migration pendente. Mudanças
futuras são exclusivamente migrations incrementais novas; baseline aplicada é
imutável. A produção não possui link persistido e operações remotas autorizadas
podem usar `--db-url` enquanto a CLI 2.112.0 permanecer incompatível com a API
de link, sempre sem registrar credenciais.

### Layout por módulo com sidebar interna (DEC-032)
Módulos com navegação por categoria (Biblioteca; possivelmente Treino/Estudos
no futuro) usam um `layout.tsx` próprio dentro da pasta de rota do módulo
(ex: `app/biblioteca/layout.tsx`), que envolve a página com uma sidebar
lateral fixa (`components/Sidebar.tsx`, genérico e reutilizável) — proporção
de layout **2/9 sidebar, 7/9 conteúdo**. Diferente da navegação global de
nível 1 (`components/GlobalNav.tsx`), cada sidebar é escopada à pasta de rota
do próprio módulo. A navegação global dá acesso aos módulos de primeiro nível,
agrupa Saúde, Finanças, Lugares e Receitas sob Diário, abre Configurações pelo
perfil e mantém o logout visível; a troca de categoria dentro da Biblioteca
continua sendo estado de cliente (`useState`), sem reload nem URL nova.

### Hierarquia de camadas

```
Página/Componente (React, .tsx)
│ importa
▼
lib/supabase.ts     ← client do Supabase (createBrowserClient)
│ usa (client-side, para CRUD direto sob RLS)
▼
Supabase Cloud       ← PostgreSQL + Auth + Storage + Realtime
```

```
Componente (React, .tsx)
│ chama via fetch()
▼
app/api/**/route.ts  ← API Routes (server-side, roda no Vercel)
│ usa segredo opcional (env var server-only) e fala com API externa
▼
YouTube, TMDB, Google Books, Jikan, iTunes e BRAPI
```

**Regra de decisão:** se a operação não precisa de segredo nem lógica exclusiva
de servidor, o componente fala direto com o Supabase client. Se precisa de uma
chave de API ou processamento que não pode ser exposto no navegador, passa por
uma API Route. Hoje `app/api/biblioteca/metadados/route.ts` unifica as fontes
de metadados e mantém `YOUTUBE_API_KEY`/`TMDB_API_KEY` no servidor;
`app/api/financas/cotacao/route.ts` mantém `BRAPI_TOKEN` no servidor e não
persiste a cotação. As duas rotas estão cobertas pelo `proxy.ts` global.

### `lib/supabase.ts` — client Supabase + helpers
Funções: `getSession()`, `getUserId()`, `getSignedUrl()`, `uploadFile()`, `deleteFile()`, `softDelete()`, `sbErr()`, `now()`.

**Gotcha real encontrado na implementação:** o client precisa ser criado com
`createBrowserClient` do pacote `@supabase/ssr` — **não** `createClient` de
`@supabase/supabase-js`. `createClient` guarda a sessão só em `localStorage`,
invisível para `proxy.ts` (que roda no servidor e só lê sessão via cookies).
Usar o client errado faz o login "funcionar" silenciosamente sem nunca
autenticar de fato do ponto de vista do proxy — sem erro no Console,
redireciona de volta pro login sem explicação. Encontrado e corrigido em
2026-07-15.

**Gotcha adicional (modelagem de matéria duplicada, 2026-08):** durante o
planejamento do gabarito ENEM, uma sessão modelou "matéria" como DUAS linhas
(`tipo='escola'` + `tipo='enem'`) pra resolver o problema de "a mesma
Física aparece nos dois módulos" — decisão tomada sem confirmar
explicitamente com o usuário, que corrigiu ao perceber (matéria deveria ser
UMA linha, só a TELA decide o que exibir). Gerou dado de teste duplicado no
Supabase, limpo via `018_materias_unicas_escola_enem.sql`. **Lição:** decisões
de modelagem que afetam "a mesma entidade existe em módulos diferentes" devem
ser confirmadas explicitamente antes de implementar, nunca assumidas por
conveniência de query. Ver DEC-040.

### `proxy.ts` — proteção de rota (DEC-021, renomeado de `middleware.ts` em 2026-07-19, DEC-031)
Fica na **raiz de `frontend/`** (não dentro de `app/`). Protege toda rota por
padrão (fail-safe), exceto as listadas em `ROTAS_PUBLICAS` (hoje só `/login`).
Usa `createServerClient` de `@supabase/ssr` e valida o usuário com
`auth.getUser()` antes de liberar a rota; `auth.getSession()` não é usado para
autorização server-side porque apenas leria o cookie sem validar sua
autenticidade. Redireciona para `/login` quando o usuário não é confirmado.

**Nota de nomenclatura (Next.js 16):** o arquivo se chama `proxy.ts` e exporta
a função `proxy()`, não `middleware()` — convenção renomeada pelo próprio
Next.js 16 (`middleware.ts` é depreciado, mas ainda funciona, só como Edge
Runtime). A migração para `proxy.ts` corrigiu um bug real: `proxy.ts` roda em
runtime Node.js por padrão, o que resolveu um erro `__dirname is not defined`
causado por incompatibilidade do `@supabase/ssr` com o Edge Runtime. Ver DEC-031.

### API Routes — backend leve server-side
Rodam como funções serverless no Vercel (mesmo runtime do build do Next.js —
não Edge Functions do Supabase, ver DEC-018). Segredos ficam em variáveis de
ambiente **sem prefixo `NEXT_PUBLIC_`**. O projeto possui duas rotas: a rota
unificada de metadados da Biblioteca e a consulta opcional de cotação de
Finanças. Nenhuma delas usa `service_role` ou persiste resposta externa.

### v1 (HTML puro) — histórico, sem código no repositório atual
Usava `assets/supabase.js` (client global `window.sb`), `assets/auth.js` e
`sm2.js` (SM-2 em JavaScript puro). Removida do projeto em 2026-07-19 —
**sem arquivo real correspondente no repositório hoje**, mantida só como
backup local fora do Git. Os equivalentes ativos são `lib/supabase.ts`,
`proxy.ts` e `lib/revisao.ts` (SM-2 em TypeScript, ver seção abaixo). Se
precisar do código exato de referência da v1, está descrito em
`CHANGELOG.md`, não neste documento.

### Acesso ao repositório via GitHub (2026-08)
Repositório conectado como **público**
(`github.com/GabrielGmp13/05-Sistema-Pessoal`) — qualquer agente de IA com
acesso à rede pode clonar e ler arquivos reais do projeto diretamente, em
vez de depender só de cópia manual colada pelo usuário. Reduz risco de
assinatura de função assumida incorretamente (ver `PROJECT_PRINCIPLES.md`
#12). Não altera o fluxo de aplicação de mudanças: agentes deixam alterações
locais por padrão e só fazem commit/push com autorização explícita de Gabriel
no prompt, após revisar validações, stage e segredos.

---

## Confirmações destrutivas e seleção de vínculo (2026-08)

`components/ui/confirm-dialog.tsx` é o padrão reutilizável para confirmações
destrutivas. As 10 ocorrências nativas antes presentes em Treino e Biblioteca
foram migradas em 2026-08-11; a busca por `confirm()` no frontend ficou
zerada. `window.prompt` também está ausente: em Estudos, o vínculo de conteúdo
compartilhado usa uma seleção visível de matéria.

---

## Service Worker

🔄 **Não implementado ainda** (Fase M2, fora de escopo por ora — ver `ROADMAP.md`). Estratégia planejada, caso a premissa de "sempre há wifi disponível" mude no futuro:

| Recurso | Estratégia | Motivo |
|---|---|---|
| CSS, fontes, ícones | Cache First | Assets estáticos que não mudam |
| Dados do Supabase | Network First com fallback | Sempre preferir dado atualizado |
| Assets de Storage (fotos) | Stale While Revalidate | Fotos raramente mudam |

---

## Realtime (sync multi-dispositivo)

🔄 **Não implementado ainda** (Fase M3, fora de escopo por ora — sync já ocorre via banco central, ver `ROADMAP.md`). Exemplo de uso, se algum dia for retomado:

```typescript
sb.channel('treinos-changes')
  .on('postgres_changes', {
    event: '*', schema: 'public', table: 'treinos',
    filter: `user_id=eq.${userId}`,
  }, () => { /* recarregar dados */ })
  .subscribe();
```

---

## Armazenamento de arquivos

```typescript
import { uploadFile, getSignedUrl } from '@/lib/supabase';

// Upload de foto de shape — bucket privado, path por usuário
const filePath = `${userId}/${data}-shape.jpg`;
const path = await uploadFile('shape', filePath, file);

// Exibir: NUNCA usar getPublicUrl (buckets são privados)
const url = await getSignedUrl('shape', filePath);
// usar `url` em <img src="">  — válida por 1 hora
```

---

## SM-2 (spaced repetition)

✅ Implementado em `frontend/lib/revisao.ts` (TypeScript — **não** `sm2.js`, que era a implementação da v1 e não existe mais no repositório):

```typescript
// Função pura — calcula os novos valores SM-2
calcularSM2(ef, repeticoes, intervaloDias, qualidade)
// retorna { ef, repeticoes, intervaloDias, proximaRevisao }

// Wrapper integrado ao Supabase — busca, calcula e persiste em um passo
avaliarCard(cardUuid, qualidade)
// busca o card em revisao_espacada, chama calcularSM2, salva o resultado

// Variante usada por Estudos v2 — cria o card na primeira vez, senão só avalia
avaliarCardPorConteudo(conteudoUuid, qualidade)

// Usado pelo card "Revisões pendentes" do Hub de Estudos (DEC-043)
listarRevisoesPendentes(diasNoFuturo)
```

---

## Dependências externas

| Dependência | Tipo | Onde |
|---|---|---|
| Next.js 16, React 19 | npm | Todo o frontend |
| `@supabase/ssr`, `@supabase/supabase-js` | npm | `lib/supabase.ts`, `proxy.ts` |
| Tailwind v4 + shadcn/ui + Base UI | npm | Módulo Estudos (DEC-038) |
| Lucide React | npm | Ícones (Estudos, principalmente) |
| JetBrains Mono, Syne | self-hosted `.woff2` | Todas as páginas |

Chart.js (mencionado em versões antigas deste documento) não está nas
dependências reais do `package.json` atual — se algum gráfico de evolução
for retomado (ver `BACKLOG.md`), a biblioteca a usar ainda não foi decidida.

---

## Custos (Supabase Free Tier)

| Recurso | Limite free | Estimativa de uso |
|---|---|---|
| Banco de dados | 500MB | Anos de dados pessoais |
| Storage | 1GB | Centenas de fotos de shape + PDFs (sem mídia da Biblioteca) |
| Bandwidth | 5GB/mês | Muito abaixo para uso pessoal |
| Auth | 50.000 MAU | 1 usuário |
| Realtime | 200 conexões simultâneas | 1-3 dispositivos (não usado hoje) |
| **Total** | **$0/mês** | — |
