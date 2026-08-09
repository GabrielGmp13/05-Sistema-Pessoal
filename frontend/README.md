# Frontend

Único frontend ativo do Sistema Pessoal. Usa Next.js 16 (App Router), React
19 e TypeScript. Treino e Biblioteca usam CSS Modules; Estudos usa Tailwind
v4 e componentes gerados pelo padrão shadcn/ui. O pacote de CLI `shadcn` não
é dependência do projeto; `components.json` permanece como configuração para
eventual geração consciente de componentes.

## Preparação

Use Node.js `24.15.0` e npm `12.0.1`, conforme `.nvmrc` e `package.json` da
raiz/projeto. Depois:

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Variáveis necessárias:

- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Não versione `.env.local` nem use credenciais privilegiadas no frontend.

## Verificações

```powershell
npm run typecheck
npm run build
npm run lint
```

O lint registra dívida técnica conhecida; consulte `docs/BACKLOG.md`. Não há
testes automatizados de frontend neste momento. Para contexto completo, volte
ao `README.md` da raiz e a `docs/AI_CONTEXT.md`.
