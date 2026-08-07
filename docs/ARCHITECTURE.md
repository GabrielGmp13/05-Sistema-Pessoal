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
- Storage ⚠️ o dump atual cobre `public`, não o inventário de `storage.buckets`. O repositório provisiona `shape`, `documentos` e `capas` em `001_schema_inicial.sql`; `017` instrui criar `redacoes` manualmente e o frontend contém sua integração; não há criação/policy versionada para `exercicios`. Ver a seção abaixo e `DATABASE.md`.
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
| `shape` | Fotos de shape | 10MB | JPEG, PNG, WebP | Provisionamento e policies em `001`; uso no frontend confirmado |
| `documentos` | PDFs de provas, apostilas, documentos pessoais | 50MB | PDF | Provisionamento e policies em `001`; sem UI de upload atual |
| `capas` | Capas de obras da Biblioteca sem cobertura de API | 2MB | JPEG, PNG, WebP | Provisionamento e policies em `001`; sem UI de upload atual |
| `exercicios` | Imagens/GIFs demonstrativos de exercícios (força e cardio) | Não definido em migration | Não definido em migration | Nome planejado, mas sem criação/policy versionada e sem UI |
| `redacoes` | Foto da folha manuscrita de redação (ENEM/Escola) | 10MB sugeridos em `017` | JPEG, PNG, WebP | Criação manual instruída em `017`; integração presente em `lib/redacoes.ts` |

Convenção de path obrigatória: `{user_id}/nome-do-arquivo.ext`. As policies versionadas em `001` e a policy instruída em `017` usam `(storage.foldername(name))[1] = auth.uid()::text` para isolar o acesso. O inventário e as policies efetivamente presentes em produção exigem consulta direta ao Supabase.

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

Pasta única do frontend: `frontend/` (renomeada de `frontend-v2/` em 2026-07-19, DEC-031). **Não existe pasta `backend/` com código de aplicação** — existe, sim, uma pasta `backend/supabase/migrations/` na raiz do repositório, contendo só os arquivos `.sql` das migrations (não é um servidor, é apenas onde as migrations ficam versionadas). Qualquer menção anterior a `supabase/migrations/` (sem o prefixo `backend/`) está desatualizada — o caminho real é `backend/supabase/migrations/`.

### Layout por módulo com sidebar interna (DEC-032)
Módulos com navegação por categoria (Biblioteca; possivelmente Treino/Estudos
no futuro) usam um `layout.tsx` próprio dentro da pasta de rota do módulo
(ex: `app/biblioteca/layout.tsx`), que envolve a página com uma sidebar
lateral fixa (`components/Sidebar.tsx`, genérico e reutilizável) — proporção
de layout **2/9 sidebar, 7/9 conteúdo**. Diferente de uma sidebar de
navegação global de nível 1 (site inteiro) — cada módulo tem a sua própria,
escopada à sua pasta de rota. Troca de categoria dentro do módulo é estado
de cliente (`useState`), não navegação de rota — sem reload, sem URL nova.
**Nota:** não existe hoje navegação global entre módulos nem botão de logout
visível em nenhuma tela — cada módulo (`/treino`, `/biblioteca`, `/estudos`)
é acessado diretamente pela URL. Isso é uma lacuna real de UX, não uma
omissão documental — ver `TASKS_NOW.md`.

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
│ chamaria via fetch()
▼
app/api/**/route.ts  ← API Routes (server-side, roda no Vercel) — NENHUMA EXISTE AINDA
│ usaria segredo (env var server-only) + falaria com API externa e/ou Supabase
▼
API externa (TMDB, etc.) e/ou Supabase Cloud
```

**Regra de decisão:** se a operação não precisa de segredo nem lógica exclusiva
de servidor, o componente fala direto com o Supabase client. Se precisa de uma
chave de API ou processamento que não pode ser exposto no navegador, passa por
uma API Route — mas **isso ainda é só o padrão planejado**: nenhuma rota
`app/api/**` foi criada até agora (confirmado via inspeção do repositório,
2026-08). A necessidade real mais próxima é a integração de TMDB para
Filmes/Séries (única API externa da Biblioteca que exige segredo — ver
`TASKS_NOW.md`).

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
Usa `createServerClient` de `@supabase/ssr` para ler a sessão via cookies e
redireciona para `/login` quando ausente.

**Nota de nomenclatura (Next.js 16):** o arquivo se chama `proxy.ts` e exporta
a função `proxy()`, não `middleware()` — convenção renomeada pelo próprio
Next.js 16 (`middleware.ts` é depreciado, mas ainda funciona, só como Edge
Runtime). A migração para `proxy.ts` corrigiu um bug real: `proxy.ts` roda em
runtime Node.js por padrão, o que resolveu um erro `__dirname is not defined`
causado por incompatibilidade do `@supabase/ssr` com o Edge Runtime. Ver DEC-031.

### API Routes — componente planejado, ainda não construído
Rodariam como funções serverless no Vercel (mesmo runtime do build do Next.js
— não Edge Functions do Supabase, ver DEC-018). Guardariam segredo como
variável de ambiente **sem prefixo `NEXT_PUBLIC_`**.

Uso planejado mais próximo: `app/api/tmdb/search/route.ts`, para a integração
de metadados de Filmes/Séries da Biblioteca (`TASKS_NOW.md` → "Próxima tarefa
de escopo"). Google Books, Jikan e iTunes Search não precisam de API Route —
não exigem chave secreta, podem ser chamadas direto do client.

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
#12). Não altera o fluxo de aplicação de mudanças — geração de código
continua sendo entregue como arquivo/diff pro usuário aplicar manualmente;
**nenhuma alteração é commitada diretamente por um agente de IA.**

---

## Confirm() nativo e outras dívidas de UX conhecidas (2026-08)

Confirmado por inspeção do código real: `confirm()` nativo do navegador
ainda está em uso em 9 arquivos, com 10 ocorrências
(`app/biblioteca/generos/page.tsx`, as 6 `*Section.tsx` de Biblioteca,
`app/treino/[moduloUuid]/page.tsx` e
`app/treino/[moduloUuid]/[treinoUuid]/page.tsx`) — contraria `DESIGN.md` e
`CLAUDE.md`/`AGENTS.md` regra 6, é dívida técnica já registrada, ver
`BACKLOG.md`. Também confirmado: `window.prompt()` em
`app/estudos/materia/[materiaUuid]/page.tsx` para vínculo manual de conteúdo
compartilhado (pendência já registrada em `TASKS_NOW.md`).

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
