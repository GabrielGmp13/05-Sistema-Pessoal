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

Variáveis opcionais, usadas somente no servidor:

- `YOUTUBE_API_KEY` — vídeos;
- `TMDB_API_KEY` — filmes e séries;
- `GOOGLE_BOOKS_API_KEY` — livros;
- `BRAPI_TOKEN` — cotações sob demanda em Finanças.

As conexões OAuth de YouTube e Google Calendar também exigem
`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`GOOGLE_REDIRECT_URI` e `GOOGLE_TOKEN_ENCRYPTION_KEY`. A busca de lugares usa
`GOOGLE_MAPS_API_KEY`. Consulte `docs/INTEGRACOES_EXTERNAS.md` para o preparo
das APIs e dos redirects.

Não versione `.env.local`, não use prefixo `NEXT_PUBLIC_` nessas chaves
privadas e não use credenciais privilegiadas no frontend.

No desenvolvimento local, adicione as chaves opcionais que quiser habilitar a
`frontend/.env.local`.
Na produção, use **Vercel → Project → Settings → Environment Variables**,
marque **Production** e faça um redeploy. Sem `BRAPI_TOKEN`, as posições de
investimento continuam funcionando e apenas a consulta de cotação fica inativa.
Jikan e iTunes Search funcionam sem chave. A Google Books API exige que a
aplicação se identifique com `GOOGLE_BOOKS_API_KEY`, inclusive para dados
públicos.

## Verificações

```powershell
npm run typecheck
npm run build
npm run lint
```

O lint registra dívida técnica conhecida; consulte `docs/BACKLOG.md`. Não há
testes automatizados de frontend neste momento. Para contexto completo, volte
ao `README.md` da raiz e a `docs/AI_CONTEXT.md`.
