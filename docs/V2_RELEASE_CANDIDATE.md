# Handoff da release candidate da v2 expandida

## Estado

A implementação planejada da v2 expandida recebeu o lote v2.1 de melhorias
documentadas e permanece em homologação manual. A base congelada era `c2f8a25`;
o estado corrente inclui o hardening e os fluxos registrados na DEC-057.

Até a aprovação final, o escopo permitido é executar o checklist, corrigir
bugs bloqueantes ou falhas de segurança/dados e aplicar polimentos diretamente
decorrentes dos testes. Feature nova permanece em `BACKLOG.md`.

## Módulos implementados

- Login e Perfil
- Hub
- Treino e Shape
- Biblioteca: Filmes, Séries, Animes, Mangás, Livros, Podcasts, Vídeos e Artigos
- Estudos: ENEM, Escola, Curso, Redações, Olimpíadas, Vestibulares e Outros
- Revisão Espaçada
- Agenda
- Diário
- Projetos e Programação
- Receitas, Saúde, Finanças e Lugares
- Idiomas e Histórico
- Navegação responsiva, dropdown de perfil e temas claro/suave/nublado/estrelado/escuro

## Variáveis de ambiente

Obrigatórias no frontend:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Opcionais e exclusivas do servidor:

- `YOUTUBE_API_KEY` — metadados de vídeos
- `TMDB_API_KEY` — metadados de filmes e séries
- `BRAPI_TOKEN` — cotação sob demanda em Finanças
- `SUPABASE_SERVICE_ROLE_KEY` — somente API Routes Google
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` e
  `GOOGLE_TOKEN_ENCRYPTION_KEY` — conexão Google server-side

Sem as chaves opcionais, os respectivos fluxos mantêm fallback manual. Nunca
versionar `.env.local`, service role, senha, connection string ou
`SUPABASE_DB_URL`.

## Banco e migrations

- A cadeia operacional ativa contém 21 migrations em
  `backend/supabase/migrations/`.
- As três baselines e as incrementais até
  `20260822000300_biblioteca_playlists.sql` estão registradas como
  aplicadas em produção.
- O pós-check registrado em 2026-08-22 confirmou 66 tabelas e 21 versões
  aplicadas, cofre Google separado por serviço, playlists com FKs compostas,
  RLS/policies/GRANTs preservados e nenhuma migration pendente.

Qualquer correção futura de schema deve sair do lote de polimento, receber uma
nova migration timestamped e cumprir integralmente o fluxo de segurança de
`DATABASE.md`.

## Homologação e critério de saída

Executar integralmente `HOMOLOGATION_V2.md` em ambiente publicado. A v2 só pode
ser declarada concluída quando:

- o commit/deploy, ambiente, navegador, dispositivo e tema testados estiverem registrados;
- os módulos principais tiverem persistência confirmada após recarregar;
- desktop/mobile e os cinco temas estiverem aprovados;
- os controles básicos de Auth, dados privados, Storage e segredos passarem;
- todos os bloqueadores estiverem corrigidos e retestados.

## Escopo oficial pós-v2

- Google Calendar bidirecional/conflitos/exclusões remotas
- Google Photos Picker opcional (Storage privado já cobre imagens)
- mídias e templates complexos do Anki `.apkg`
- BRAPI/cotações avançadas
- uploads somente de futuros domínios ainda não definidos
- publicação da extensão em loja/captura avançada
- scraping e importações avançadas
- testes E2E autenticados amplos
- hardening restante do banco e do Storage
- polimentos visuais encontrados na homologação

## Se um problema for encontrado

1. Marcar o item correspondente em `HOMOLOGATION_V2.md` e registrar rota,
   dados usados, tema, tamanho de tela e passos exatos para reprodução.
2. Classificar como bloqueador de fluxo, segurança/dados ou polimento visual.
3. Corrigir a causa raiz sem ampliar o escopo do produto; ideias novas vão para
   `BACKLOG.md`.
4. Rodar typecheck, build, verificações de diff/segredos e o teste manual do
   fluxo afetado.
5. Atualizar `TASKS_NOW.md` e `CHANGELOG.md`; se houver decisão estrutural real,
   atualizar também `DECISIONS.md`.
