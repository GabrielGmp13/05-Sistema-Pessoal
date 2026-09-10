# v0.2.0 — preparação do beta privado

> **Registro histórico fechado.** Este documento preserva o que era verdadeiro
> no marco v0.2.0; números e pendências abaixo não descrevem necessariamente o
> estado atual. Para continuar, use
> [RELEASE_V1.0.0_PLAN.md](RELEASE_V1.0.0_PLAN.md) e
> [NEXT_ENGINEER_HANDOFF.md](NEXT_ENGINEER_HANDOFF.md). Não atualize esta
> fotografia retroativamente.

Data: 2026-08-31; validada e publicada em 2026-09-05. **Release disponível no
deploy de produção protegido da Vercel.** Não é liberação automática de
convites nem garantia de homologação completa.

## Objetivo e público

Sistema de gestão pessoal para organizar estudo, rotina e acervo ao longo do
tempo. O beta amplia a validação para amigos convidados, com contas próprias
e isoladas. Não inclui cadastro aberto, cobrança, rede social, organizações,
SLA, suporte comercial, funcionamento offline ou certificação legal.

A numeração `0.2.0` vem do manifesto da aplicação (`0.1.0` anteriormente).
As fases históricas “v1/v2/v2.1” continuam preservadas e **não** significam
downgrade, outra aplicação ou renumeração de migrations (DEC-074).

## Mapa do produto

“Implementado” significa código existente; não equivale a aprovado por testes
reais de todos os cenários. Todos os módulos abaixo participam do beta somente
após os retestes correspondentes e o isolamento de contas.

| Área / entrada | Implementado | Limite ou validação ainda necessária |
|---|---|---|
| Início `/` | Insights, agenda e resumo de estudo/revisão | Relevância e dados de cada conta |
| Treino `/treino`, Shape | Planos, sessões, modo academia e evolução corporal | Sessões completas, PR, uploads; não usar fotos sensíveis no piloto |
| Biblioteca `/biblioteca` | Filmes, séries, animes, mangás, livros, podcasts, vídeos/playlists e artigos | Busca externa, detalhes e persistência de relações por mídia |
| Anime / séries | Temporadas; anime com obras vinculadas, equipe, músicas e ordem de consumo | Testar notas, vínculos e metadados incompletos |
| Estudos `/estudos` | Matérias/conteúdos, cursos, ENEM, redações e provas cronometradas | Gabaritos, resultados, recarga, arquivos e uso em celular |
| Revisão `/revisao` | Revisão espaçada, flashcards e importação CSV/TSV/Anki básica | Mídia/templates Anki avançados não suportados |
| Agenda `/agenda` | Mês + semana, dia/evento em modal, conclusão e Google Calendar bilateral | Calendário primário, site aberto; conflitos não sobrescritos automaticamente |
| Idiomas `/idiomas` | Vocabulário e práticas | Persistência e integração com rotina |
| Histórico `/historico` | Heatmap, filtros e exportação do recorte CSV | Não é exportação completa da conta |
| Projetos / Programação | Projetos, atividades e especialização de programação | Retestes com múltiplas contas |
| Diário `/diario` | Registros pessoais e acesso às áreas de vida | Evitar registros íntimos durante o piloto |
| Receitas / Saúde | Cadastros e acompanhamento pessoal | Não é serviço clínico; usar dados fictícios no piloto |
| Finanças `/financas` | Registros, posições e cotação BRAPI opcional | Sem aconselhamento financeiro; não importar dados bancários sensíveis |
| Lugares `/lugares` | Lugares, mídia e busca Places opcional | Custo/quota e privacidade de localização |
| Configurações | Perfil, mídia privada, temas, Google separado e relato de bugs | Convite, senha inicial/recuperação e exclusão própria ainda sem UI |

Há 32 arquivos de páginas e 14 API Routes na árvore atual; isso não é uma
contagem de fluxos homologados. O esquema documentado tem 68 tabelas, seis
buckets privados e cadeia local com 24 migrations; o remoto não foi consultado.

## Alterações desta release

- Reportar bug em Configurações: formulário → revisão editável → copiar →
  enviar pelo canal privado combinado. Não há envio de e-mail, banco de relatos
  nem upload de print. O texto só sai do formulário por ação explícita da pessoa.
- Correções pequenas de proteção de rotas, privacidade de logs e vinculação
  OAuth; detalhes/evidência em [BETA_PRIVADO.md](BETA_PRIVADO.md#auditoria-local-de-segurança--2026-08-31).
- Testes Node passam a bloquear a CI junto de typecheck/build. Sem dependência
  nova, tabela nova ou alteração de Supabase/Vercel remoto.
- Histórico de tarefas arquivado integralmente; [TASKS_NOW.md](TASKS_NOW.md)
  contém somente entrega atual, bloqueios e próxima ação.

## Integrações e configuração

Fonte única: [INTEGRACOES_EXTERNAS.md](INTEGRACOES_EXTERNAS.md), com inventário
de variáveis e limites. Exemplos vazios: `frontend/.env.example`.
Google Calendar/YouTube são opt-in por serviço. TMDB, Google Books + Open
Library, AniList/Kitsu/Jikan, YouTube/iTunes, Places e BRAPI têm fallback
manual ou mensagem de indisponibilidade; não prometemos catálogo completo.
SMTP de convites não é o formulário de bugs e ainda depende de configuração.

## Lançamento por etapas

1. Gabriel fecha retestes prioritários e infraestrutura de convite/senha.
2. Provas de isolamento e checklist de privacidade/quotas, sem pendências críticas.
3. Autorizar/publicar o lote e validar o domínio publicado.
4. Piloto com **até três amigos**, dados fictícios ou de baixo risco.
5. Após uma semana de uso e revisão sem bloqueios graves, considerar novo lote
   de convites; teto **dez participantes**, não crescimento automático.

Critérios exatos e responsabilidades: [BETA_PRIVADO.md](BETA_PRIVADO.md).
Operação semanal/mensal e triagem: [MANUTENCAO.md](MANUTENCAO.md).

## Validações deste lote

- GitHub Actions `Validate repository` #71 aprovado em 1m15s para o commit
  `19b0673`; Vercel registrou deploy de produção `success`. O endereço publicado
  exige login da Vercel, então o smoke do conteúdo após essa barreira fica para
  Gabriel; a proteção não foi contornada nem automatizada.

- `npm test`: **76 testes aprovados**, incluindo relatos, acesso, diagnóstico
  sem dados pessoais e proteção OAuth. O proxy real também é exercitado com
  Supabase simulado, verificando HTTP 401/redirect/cookies, sem rede remota.
- `npm run typecheck`: aprovado, inclusive após adicionar os testes do proxy.
- `npm run build`: aprovado (produção Next.js, 41 páginas geradas); sem rota
  de QA, endpoint de suporte ou dependência nova.
- `npm run lint`: execução integral concluída com **25 erros e 28 avisos**,
  mesma contagem registrada antes deste lote. Dívida principalmente de effects
  e imagens; não foi ocultada com desativação global de regras.
- Lint separado dos arquivos novos/alterados: **zero erros, dois avisos** já
  existentes nas imagens/ícone da página de Configurações; formulário novo sem achados.
- `git diff --check`: aprovado; sem `confirm(` / `window.prompt` no frontend.
- Revisão heurística dos 44 arquivos alterados/novos e stage: nenhum padrão
  de segredo encontrado; stage vazio. Sem nomes de segredos Google/service role
  no bundle público gerado. Isso não equivale a auditoria de todo o histórico Git.
- Links locais dos documentos de entrada/release/operação conferidos;
  comparação confirmou preservação integral do corpo antigo de TASKS_NOW.
  Lista ativa reduzida a cerca de 60 linhas; histórico preservado com 667 linhas.
- SQL: não executado neste lote, pois não houve migration. Existem 19 scripts
  locais; a evidência antiga não substitui teste de isolamento atual.
- Testes manuais reais/autenticados, convite/SMTP, Google e exclusão/exportação:
  pendentes. Um build aprovado não resolve esses bloqueios.
- Checagem visual local concluída em 2026-09-05 no computador e em viewport de
  celular: Configurações abriu autenticada, o formulário gerou uma prévia
  editável com a versão 0.2.0 e nada foi enviado. O console registrou uma falha
  sanitizada e transitória em `listarEventosAgenda` durante a primeira carga;
  a linha do tempo carregou depois. Integrações Google estavam sem as variáveis
  server-side no ambiente local, como esperado. Retestes reais de módulos,
  Google, duas contas e produção continuam pendentes.

## Inventário dos arquivos deste lote

- **Configurações:** novos `frontend/app/configuracoes/BugReportForm.tsx` e
  `frontend/lib/bug-report.ts`; integração em `configuracoes/page.tsx`.
- **Proteção/diagnóstico:** novos `frontend/lib/route-access.ts` e
  `safe-diagnostics.ts`; ajustes em `frontend/proxy.ts`, `lib/supabase.ts`,
  `lib/supabase-diagnostics.ts`, `lib/google-service.ts` e `lib/server/google.ts`.
- **APIs existentes:** `frontend/app/api/integracoes/google/` connect,
  callback, status, calendar/import, calendar/export, youtube/import,
  youtube/playlist-link, youtube/playlist-videos, youtube/playlists; também
  `frontend/app/api/lugares/google-places/route.ts`. Nenhuma rota nova.
- **Testes:** novos `frontend/tests/bug-report.test.ts`, `proxy.test.ts`,
  `route-access.test.ts` e `safe-diagnostics.test.ts`; ajustes em
  `google-service.test.ts` e `supabase-diagnostics.test.ts`.
- **Versão/CI:** `frontend/package.json`, `frontend/package-lock.json` e
  `.github/workflows/validate.yml`.
- **Documentação nova:** este arquivo, `docs/MANUTENCAO.md` e
  `docs/archive/TASKS_HISTORY_2026-08.md` (conteúdo preservado, não apagado).
- **Documentação atualizada:** `README.md`, `AGENTS.md`, `docs/AI_CONTEXT.md`,
  `BACKLOG.md`, `BETA_PRIVADO.md`, `CHANGELOG.md`, `DECISIONS.md`,
  `INTEGRACOES_EXTERNAS.md`, `NEXT_ENGINEER_HANDOFF.md`, `ROADMAP.md`,
  `TASKS_NOW.md` e `teste.md`.

## Depois do piloto

Priorizar bugs reproduzíveis e testes de regressão antes de funcionalidades
novas. Rate limiting, E2E autenticados e operação de conta vêm antes de qualquer
abertura maior. Editor de PDF/desenho, sincronização com navegador fechado,
analytics avançado e produto público continuam ideias/etapas separadas em
[BACKLOG.md](BACKLOG.md) e [ROADMAP.md](ROADMAP.md).
