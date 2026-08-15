# Handoff da release candidate da v2 expandida

## Estado

A implementação planejada da v2 expandida está concluída e congelada para
homologação manual. A base técnica anterior ao congelamento é o commit
`c2f8a25`; este documento acompanha o commit documental
`docs: freeze v2 expanded release candidate`.

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
- Navegação responsiva e temas claro/escuro

## Variáveis de ambiente

Obrigatórias no frontend:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Opcionais e exclusivas do servidor:

- `YOUTUBE_API_KEY` — metadados de vídeos
- `TMDB_API_KEY` — metadados de filmes e séries
- `BRAPI_TOKEN` — cotação sob demanda em Finanças

Sem as chaves opcionais, os respectivos fluxos mantêm fallback manual. Nunca
versionar `.env.local`, service role, senha, connection string ou
`SUPABASE_DB_URL`.

## Banco e migrations

- A cadeia operacional ativa contém 12 migrations em
  `backend/supabase/migrations/`.
- As três baselines e as incrementais até
  `20260815000100_programacao_investimentos.sql` estão registradas como
  aplicadas em produção.
- O pós-check registrado em 2026-08-15 confirmou 63 tabelas e nenhuma migration
  pendente.
- O congelamento da release candidate não cria migration e não altera o
  Supabase remoto.

Qualquer correção futura de schema deve sair do lote de polimento, receber uma
nova migration timestamped e cumprir integralmente o fluxo de segurança de
`DATABASE.md`.

## Homologação e critério de saída

Executar integralmente `HOMOLOGATION_V2.md` em ambiente publicado. A v2 só pode
ser declarada concluída quando:

- o commit/deploy, ambiente, navegador, dispositivo e tema testados estiverem registrados;
- os módulos principais tiverem persistência confirmada após recarregar;
- desktop/mobile e temas claro/escuro estiverem aprovados;
- os controles básicos de Auth, dados privados, Storage e segredos passarem;
- todos os bloqueadores estiverem corrigidos e retestados.

## Escopo oficial pós-v2

- Google Calendar/OAuth
- Google Photos
- Anki `.apkg`
- BRAPI/cotações avançadas
- uploads adicionais
- extensão de navegador
- scraping e importações avançadas
- testes automatizados
- hardening do banco e do Storage
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
