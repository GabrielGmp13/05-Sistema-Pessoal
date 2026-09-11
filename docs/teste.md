# Homologação funcional — rodada encerrada em 2026-09-09

## Reteste do candidato — concluído em 2026-09-11

Sem repetir a rodada histórica abaixo. Commit/push autorizados por Gabriel.

- **APROVADO LOCALMENTE** — 106 testes Node, typecheck e build de 48 páginas;
  auditoria de produção com zero vulnerabilidades; lint com 0 erros/0 avisos.
- **APROVADO PUBLICADO** — termos: checkbox inicialmente desmarcado, bloqueio
  da navegação sem aceite, privacidade acessível, registro autorizado e
  persistência confirmada. CAPTCHA interativo ainda não foi retestado.
- **APROVADO PUBLICADO** — Anime/Mangá com fallback Kitsu: `attac` retornou
  Attack on Titan nas duas categorias; busca cancelada não exibe resposta antiga.
  Importação de artigo/vídeo abriu o formulário correto.
- **APROVADO PUBLICADO** — link MEC Enem, Places manual, CSP/headers, APIs sem
  sessão e abertura dos formulários de artigo/vídeo.
- **ADIADO POR GABRIEL** — ENEM completo será testado pelo próprio usuário
  durante o uso; não repetir a homologação sem regressão concreta.
- **APROVADO PUBLICADO / CICLO REAL PENDENTE** — criação manual com senha
  temporária confirmada no painel e formulário de troca de senha conferido no
  site. Nenhuma conta foi criada; recuperação perdida ainda não foi homologada.
- **PENDENTE ESPECÍFICO** — Agenda: conflito, cancelamento externo, dia inteiro
  e atualização automática. Não alterar eventos pessoais para testar.
- **DEPENDE DE DISPOSITIVO** — toque/trackpad, celular físico e redução de
  movimento no sistema. Não declarar concluído apenas por inspeção desktop.

### Evidências publicadas do commit cc2ccde

- **APROVADO** — GitHub Actions e status Vercel concluíram com sucesso.
- **APROVADO** — `/login`, `/termos`, `/privacidade`, `/nova-senha` com HTTP 200;
  três APIs privadas sem sessão com 401; CSP/nosniff presentes.
- **APROVADO** — caixa de termos inicialmente desmarcada/botão desabilitado,
  Biblioteca redirecionando aos termos e privacidade acessível antes do aceite.
  Com autorização específica, aceite registrado e retorno autenticado ao início.
- **APROVADO** — link e aviso do MEC Enem visíveis no cadastro de redação;
  Places desativado e formulário manual preservado na interface publicada.
- **ACHADO** — busca Anime por Naruto terminou em indisponibilidade no reteste.
  Código aguardava fontes lentas e repetia consultas; corrigido localmente para
  primeira resposta não vazia entre AniList/Kitsu/Jikan, com dois testes novos.
  Kitsu respondeu 200 em 1,38 s no diagnóstico local, o que não certifica a Vercel.
  Correção publicada em `bbfb166`; resultado do reteste abaixo.

### Reteste incremental de bbfb166

- **APROVADO** — CI e Vercel concluíram com sucesso; 105 testes locais e build
  passaram, assim como lint direcionado. CI: execução `34545064622`.
- **APROVADO** — revisitar `/termos` mostrou “Você já aceitou esta versão”.
- **APROVADO** — importações de artigo e vídeo abriram o formulário e os campos
  esperados; preview do artigo carregou. Formulários cancelados sem salvar.
- **ACHADO PERSISTENTE** — Naruto em Anime e Mangá retornou “Nenhum resultado
  compatível encontrado”. A redução da espera não certificou disponibilidade
  das fontes em produção; precisa de diagnóstico adicional.
- **ACHADO A INVESTIGAR** — console continha uma falha genérica sanitizada de
  `calendar/sincronizacao-automatica`. Não prova perda de dados nem identifica
  causa. Não foram alterados eventos pessoais para reproduzir.
- **INSPEÇÃO SOMENTE** — ENEM carregou áreas e formulário Dia 1/Dia 2, sem
  provas existentes. Finalizar/corrigir/refazer e redação continuam pendentes.
- Nenhuma massa persistente foi criada nesta rodada de navegação.

### Correções finais e reteste de produção

- **APROVADO** — a causa final do 406 era o media type: Kitsu requer
  `Accept: application/vnd.api+json`. A correção `c81c727` passou em 106 testes,
  typecheck, build, lint 0/0, GitHub Actions e Vercel. No domínio publicado,
  `attac` retornou Attack on Titan em Anime e Mangá.
- **APROVADO LOCALMENTE** — os 10 avisos de dependências de efeitos foram
  resolvidos; as 15 imagens privadas/externas foram centralizadas num componente
  nativo documentado, pois o otimizador não encaminha autenticação. Lint 0/0.
- **APROVADO PUBLICADO** — troca de senha temporária exige senha atual, nova
  senha de 12+ caracteres e confirmação; os três campos foram conferidos em
  Configurações. Criação manual foi apenas inspecionada; nenhum usuário criado.
- **TRIADO, NÃO REPRODUZIDO** — a requisição Calendar associada ao achado
  isolado retornou 200 no Vercel; a sessão final autenticada não registrou novo
  erro de console. Sem evidência de perda, não se alteraram eventos reais para
  forçar os casos já homologados.

Este arquivo registra o resultado real da rodada final. Ele não mistura teste
aprovado com tarefa futura.

Legenda: **APROVADO** foi executado ou tem cobertura automatizada direta;
**ACHADO** exige correção/configuração; **ADIADO** depende de infraestrutura,
dispositivo ou massa de teste que não faz parte do beta gratuito atual.

## Resultado geral

- **APROVADO** — `npm test`: 95/95 testes Node.
- **APROVADO** — `npm run typecheck` e `npm run build`.
- **APROVADO** — reset local completo do Supabase e 22/22 testes SQL.
- **INFORMATIVO** — lint completo mantém dívida preexistente: 25 erros e 28
  avisos. O arquivo alterado nesta rodada passou isoladamente.
- **APROVADO** — nenhuma credencial nova foi gravada no repositório.

## Conta, privacidade e isolamento

- **APROVADO** — login por e-mail, logout, recuperação entregue por e-mail e
  login Google retornando à conta já existente.
- **APROVADO** — troca de conta não mostrou dados da anterior.
- **APROVADO** — matriz real de duas contas cobriu leitura, CRUD,
  relacionamentos e Storage. A segunda camada é coberta por RLS SQL, FKs
  compostas e testes das rotas privilegiadas.
- **APROVADO** — APIs privadas sem sessão responderam `401`; testes do logger
  confirmam remoção de tokens, cookies, URLs de banco, paths e UUIDs.
- **ADIADO** — convite, primeira senha, link reutilizado/expirado e SMTP
  próprio. Cadastro público e SMTP continuam fechados enquanto domínio e
  remetente verificado forem deliberadamente adiados para manter custo zero.

## Suporte, bugs e sugestões

- **APROVADO** — validações de campos obrigatórios e limites de texto.
- **APROVADO** — bug com print privado, protocolo
  `SP-20260909-D8DAE9F7` e histórico inicial visível.
- **APROVADO** — sugestão com protocolo `SP-20260909-BE0EF31B` e histórico.
- **APROVADO** — print acessível apenas por URL assinada e removido do bucket.
- **OBSERVAÇÃO** — ocorreu “Não autenticado” logo após o primeiro upload;
  navegar novamente restaurou a sessão e o reteste passou. Investigar apenas
  se voltar a ocorrer.

## Hub e Biblioteca

- **APROVADO** — Insight mostrou apenas contexto pessoal pertinente.
- **APROVADO** — duas séries em andamento alternaram no mesmo card em cerca de
  cinco segundos, sem perder os demais cards.
- **APROVADO** — distribuidora, orçamento e bilheteria não aparecem.
- **APROVADO** — TMDB encontrou Filme e Série; Filme persistiu ano, duração,
  gêneros e créditos. O cadastro manual permaneceu utilizável nas falhas.
- **ACHADO** — Anime/Mangá retornaram fallback para buscas conhecidas; revisar
  disponibilidade de AniList/Jikan/Kitsu.
- **ACHADO CORRIGIDO LOCALMENTE** — Livros podia ficar indefinidamente em
  “Buscando sugestões”. Agora a chamada encerra em 12 segundos e oferece o
  cadastro manual.

## Estudos, ENEM, Redações e Revisão

- **APROVADO** — Redação aceitou os passos válidos C1–C5, calculou 600 e
  persistiu data e duração de 1h30.
- **APROVADO** — CSV real importou dois cards, inclusive texto com vírgula,
  mantendo matéria/conteúdo.
- **APROVADO** — `.apkg` real abriu deck, prévia e importou um card.
- **APROVADO** — sessão focada bloqueou avaliação antes da resposta, registrou
  “Bom”, avançou e recalculou a próxima data.
- **APROVADO** — arquivar, restaurar e excluir flashcard.
- **ADIADO** — gesto de arrastar com mouse e toque em dispositivo real.
- **ADIADO** — finalizar/refazer prova ENEM completa e anexar redação pelo Dia
  1. As regras críticas, inclusive prova em branco, passaram nos testes Node;
  falta uma fixture manual curta no produto.

## Agenda e Google

- **APROVADO** — Calendar e YouTube conectados independentemente.
- **APROVADO** — outra Conta Google pôde ser escolhida; a conta
  `sistemapessoa007@gmail.com` foi recusada por não estar na lista de testes do
  OAuth. Adicionar somente se ela também precisar usar a integração.
- **APROVADO** — compromisso criado no site apareceu no Google; a alteração do
  título atualizou o mesmo evento sem duplicar.
- **APROVADO** — mês e semana juntos, seleção de dia e fuso `America/Recife`.
  Eventos reais e recorrentes existentes foram preservados.
- **ADIADO** — conflito simultâneo, cancelamento vindo do Google, evento de dia
  inteiro criado só para teste e atualização automática por dois minutos. A
  classificação de novos/alterados/cancelados/conflitos e fuso passou nos
  testes Node.

## Lugares e imagens

- **ACHADO** — Google Places informou não estar configurado; falta
  `GOOGLE_MAPS_API_KEY` na Vercel para ativar a busca visual.
- **APROVADO** — fallback manual salvou, recarregou e editou lugar com custo,
  nota, favorito, endereço e capa privada.
- **APROVADO** — novos JPG/PNG/WebP são redimensionados e convertidos para WebP
  somente quando o resultado é menor; GIF/PDF e original menor são preservados.
  A inspeção não encontrou perda visual perceptível.

## Responsividade, acessibilidade e temas

- **APROVADO** — 13 rotas autenticadas em largura compacta (mínimo efetivo do
  navegador controlado: 400 px) sem rolagem horizontal.
- **APROVADO** — coluna fixa desde 1024 px; abaixo disso, três linhas ao lado da
  navegação abrem a coluna completa.
- **APROVADO** — painel fecha por fundo/`Esc`, some da árvore de acessibilidade
  e devolve o foco. Biblioteca não faz a transição longa em tela compacta.
- **APROVADO** — login, prova ENEM e sessão focada não exibem a coluna.
- **APROVADO** — 25 pares iluminação/estação passaram no contraste automático;
  Lua e Sol também foram inspecionados no deploy.
- **ADIADO** — celular físico, trackpad, “reduzir movimento” no sistema e
  inspeção visual manual das outras combinações.

## Limpeza da homologação

Após confirmação de Gabriel, foram removidos três obras, quatro flashcards,
uma redação, um lugar e sua capa, um compromisso do site/Google Calendar, dois
chamados com históricos/metadados e um print privado, além do CSV e `.apkg`
locais. Contas, conexões Google, agenda real, matérias e demais dados pessoais
foram preservados. O prefixo da rodada foi `TESTE FINAL`.

## Reteste após publicação

- **APROVADO** — commit `ea77467` publicado na `main`; CI concluída com sucesso.
- **APROVADO** — produção respondeu normalmente e manteve a sessão autenticada.
- **APROVADO** — Livros pesquisou `Dom Casmurro` e retornou resultados do Open
  Library e Google Books, sem carregamento infinito e sem salvar novo registro.
