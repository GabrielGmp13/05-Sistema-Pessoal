# CHANGELOG.md

Histórico de marcos do projeto. Bugs corrigidos e seus detalhes técnicos vivem em `DATABASE.md` → Gotchas (se forem de schema/coluna) ou ficam registrados apenas aqui em 1 linha (se forem pontuais e sem risco de repetição). Decisões arquiteturais vivem em `DECISIONS.md`, não aqui.

> Entradas até 2026-07-09 foram reconstruídas retroativamente nessa data. A partir dali, cada entrada leva a data real do evento.

---

## Próxima versão — fechamento da v1.0.0 (iniciado em 2026-09-05)

- `cc2ccde` enviado à main com autorização: CI/Vercel aprovados; primeiro
  aceite e smoke público aprovados. Reteste encontrou busca de Anime indisponível.
  Correção incremental troca espera/repetição de fontes pela primeira resposta
  útil em paralelo; 105 testes Node aprovados. Reteste pendente após publicação.

- Candidato de 2026-09-10: oito erros restantes de lint corrigidos em
  Biblioteca/Artigos/Vídeos/Receitas/Curso, incluindo carregamento paralelo de
  aulas e cancelamento lógico ao sair. Lint 0 erros/25 avisos; 103 testes,
  typecheck, build e auditoria de dependências aprovados. Commit/push
  autorizados, sem alteração do número de versão; retestes em `teste.md`.

- Segunda rodada local de 2026-09-10: link MEC Enem no cadastro de redação,
  bloqueio explícito de Places no servidor/interface, proteção contra respostas
  antigas em buscas, imagens e carregamentos, isolamento visual das tarefas
  pelo projeto selecionado e tratamento de falha no aceite. 103 testes Node,
  typecheck e build aprovados; lint reduzido a 8 erros/27 avisos, sem alterar
  regras. Ainda sem publicação ou alteração remota.

- Em 2026-09-10, corrigidas localmente duas regressões da preparação: CSP
  bloqueava Turnstile, e o gate de termos bloqueava privacidade/recuperação.
  Nove erros de lint resolvidos (oito editores e capa privada), restando
  16 erros/29 avisos; 101 testes Node, typecheck e build de 48 páginas aprovados. Requisitos novos
  consolidados em `EVOLUCAO_ESTUDOS_EDITORES.md`, sem implementar expansões,
  alterar banco remoto/Auth/OAuth/Vercel, versão, commit ou push.

- Em 2026-09-09, localmente e ainda sem publicação, a busca de Anime/Mangá
  passou a usar Kitsu como fallback paralelo para as duas categorias após o
  ensaio registrar indisponibilidade de AniList e Jikan. Logs brutos de
  Treino, Shape, gêneros e componentes globais foram substituídos pelo
  registrador sanitizado. Uma CSP global e os headers associados foram
  adicionados com teste de regressão. A validação local passou com 98 testes,
  typecheck e build; a indicação anterior de lint sem achados estava incorreta
  (ver rechecagem abaixo). O manifesto do frontend também passou a
  declarar ESM, eliminando os avisos de reinterpretar os testes. Falta o smoke
  publicado autorizado.

- Ainda localmente em 2026-09-09, uma instalação limpa confirmou 98 testes,
  typecheck e build depois de atualizar Next.js/`eslint-config-next` para
  16.3.3, `sharp` para 0.35.4 e `baseline-browser-mapping` para 2.11.21.
  `npm audit --omit=dev` passou a retornar 0 vulnerabilidades. Versão do
  aplicativo, serviços remotos, commit e push permaneceram inalterados. O
  servidor local também entregou a CSP e `X-Frame-Options: DENY` no smoke da
  tela de login; o smoke publicado continua pendente de autorização. Uma
  rechecagem posterior revelou 25 erros e 29 avisos preexistentes no lint
  completo, portanto esse gate não está encerrado.

- Ainda sem publicação, a v1.0.0 passou a ter `/termos`: contas autenticadas
  sem aceite da versão vigente são levadas à confirmação e recebem 403 nas APIs
  até aceitar. O registro fica nos metadados da própria conta, sem migration.
  Google Places foi explicitamente deixado fora da versão para manter custo
  zero; Lugares continua com cadastro manual, capa privada e link externo.

- Em 2026-09-09, Gabriel definiu a v1.0.0 como piloto de uso pessoal e amigos,
  com acesso controlado e signup público fechado nos primeiros meses. A escolha
  não alterou Auth, OAuth, Vercel, banco, versão, commit ou push; os gates de
  cadastro aberto foram preservados para uma etapa futura.

- Em 2026-09-09, a documentação foi reconciliada para transferir o fechamento
  da v1.0.0 a um novo chat sem repetir trabalho concluído. `TASKS_NOW`,
  `AI_CONTEXT`, `ROADMAP`, `README` e o handoff agora distinguem o marco v0.2.0
  publicado da v1.0.0 planejada; `RELEASE_V1.0.0_PLAN.md` centraliza as duas
  opções de lançamento, gates, pendências externas e definição de pronto.

- Em 2026-09-09, a homologação funcional consolidou 95 testes Node, typecheck,
  build, reset local e 22 testes SQL. No deploy passaram Hub, TMDB, Redações,
  CSV/APKG, sessão de Revisão, suporte com print/protocolo, Calendar básico
  bidirecional, Lugares manual, responsividade e isolamento. Livros ganhou
  timeout de 12 segundos para nunca carregar indefinidamente. Google Places sem
  chave e fontes de Anime/Mangá ficaram como pendências externas. Após
  confirmação, toda a massa `TESTE FINAL`, inclusive print privado e evento no
  Google, foi removida sem tocar nas contas, conexões ou agenda real. O commit
  `ea77467` foi publicado, a CI passou e o reteste em produção retornou
  resultados de Livros sem criar registro novo.

- Revisão do limite responsivo: a coluna fixa volta em janelas de 1024 px ou
  mais; o menu sobreposto fica restrito a larguras menores. CSS, estado do
  painel e transição da Biblioteca usam o mesmo limite. A navegação permite
  rolagem própria quando os links não cabem no espaço restante.

- Em 2026-09-09, após conferir o perfil compacto publicado, Gabriel optou por
  um menu de três linhas ao lado da navegação que abre a coluna pessoal completa
  como painel sobreposto até 1480 px. A revisão local reutiliza perfil, relógio,
  calendário, Agenda, atmosfera e saída; fecha por fundo, `Esc` ou navegação e
  remove a transformação longa da Biblioteca somente nessas larguras. Os 95
  testes Node, typecheck, build de 47 páginas e lint do recorte passaram. Os
  commits `89b5477` e `1d7c618` foram publicados; Home e Biblioteca passaram no
  teste autenticado a 1100 px, inclusive fechamento por `Esc`, retorno de foco
  e ocultação correta do painel fechado para leitores de tela.
- Em 2026-09-09, Gabriel definiu o perfil compacto no canto superior direito
  como alternativa responsiva à coluna pessoal. A implementação local exibe
  editar perfil, atmosfera e sair até 1480 px; no mobile, o avatar fica em uma
  linha curta acima da navegação. Rotas de tela inteira e a variante própria da
  Biblioteca foram preservadas. Os 93 testes Node, typecheck, build de 47
  páginas e lint do arquivo alterado passaram. O commit `85bbdf1` foi publicado;
  a UI autenticada passou em 360, 1440 e 1840 px, incluindo abertura de perfil,
  atmosfera e fechamento por `Esc`, sem duplicação na tela larga.
- Em 2026-09-08, treze páginas autenticadas foram inspecionadas a 360 px sem
  erro ou rolagem horizontal; Home passou nos temas Lua e Sol, e a coluna
  pessoal apareceu completa a 1840 px. Login, ENEM e sessão focada de Revisão
  permaneceram sem a coluna, como projetado. A rodada revelou uma pendência:
  abaixo de 1481 px a coluna recolhia sem oferecer acesso alternativo visível a
  Configurações, atmosfera ou Sair; o ajuste foi definido na entrada acima.
- Em 2026-09-08, a rodada autenticada de duas contas foi encerrada para
  Agenda, Idiomas, Saúde, Finanças, Lugares e Treino. Nenhum marcador da conta
  secundária apareceu na principal, inclusive depois de mover o planejamento
  semanal do treino. Após confirmação destrutiva, toda a massa temporária
  desses módulos foi removida pela interface na ordem segura dos vínculos; as
  sete modalidades padrão e a conta secundária foram preservadas. A varredura
  final encontrou zero marcadores e nenhuma página com erro. A validação local
  posterior manteve 93 testes Node, typecheck e build de 47 páginas aprovados.
- Em 2026-09-08, o teste cruzado de Agenda, Idiomas, Saúde, Finanças, Lugares e
  Treino aprovou o isolamento de leitura. Uma URL direta de treino alheio
  revelou que formulários vazios ainda eram exibidos e que FKs simples não
  garantiam o mesmo proprietário nos dois lados da relação. Foi preparada a
  migration `20260908000100`, com dez FKs compostas por `user_id`, precheck que
  aborta diante de inconsistência e GRANTs explícitos. O frontend passou a
  validar módulo/treino antes de mostrar formulários e a repetir o usuário nas
  mutações. Reset completo, 22 testes SQL, 93 testes Node, typecheck, build de
  47 páginas e lint do recorte sem erros passaram. O primeiro dry-run remoto
  foi somente leitura e falhou por usar a credencial anterior à troca de senha.
  Com a credencial atual, o dry-run listou somente a migration esperada. O
  precheck detectou uma sessão vazia criada pelo teste cruzado antigo e abortou
  sem alterações; após exclusão confirmada desse único registro, a migration
  foi aplicada e o dry-run final voltou vazio. Módulo, exercícios e academia
  alheios agora exibem bloqueio em produção, sem formulários.
- Defesa em profundidade de isolamento foi publicada no commit `b5bdf2f`. Rotas que
  usam `service_role` agora têm contrato de CI para autenticar antes do cliente
  privilegiado e derivar o escopo da sessão. Histórico, anexos e limite de
  anexos do suporte repetem `user.id`; exclusão lógica compartilhada também
  filtra usuário/estado; e helpers genéricos de Storage recusam paths fora da
  pasta da sessão. A rodada passou com 91 testes, typecheck, build de 47 páginas
  e lint do recorte sem erros. GitHub Actions e Vercel passaram; oito APIs sem
  sessão recusaram acesso com `401`. O smoke autenticado segue pendente porque
  o Edge controlado desconectou e o CAPTCHA não concluiu no navegador interno.
- Em 2026-09-08, a matriz real de duas contas foi ampliada em produção. Na
  secundária, um projeto passou por criação, leitura e edição; uma tarefa filha
  foi criada e movida de etapa; e o Shape recebeu imagem JPG, otimizada pelo
  navegador para WebP sem perda visual perceptível. Na principal, projeto,
  tarefa, registro e imagem não apareceram. A URL direta sem assinatura foi
  recusada com `400`. Após confirmação, projeto/tarefa e Shape/imagem foram
  removidos; o Dashboard confirmou o bucket `shape` vazio e a conta secundária
  foi preservada para continuar a homologação.
- Em 2026-09-08, a conta descartável passou pelo fluxo completo de exportação:
  JSON coerente com a conta vazia, sem campos secretos e inventário com zero
  arquivos. Depois da confirmação destrutiva, ela foi excluída no Supabase; o
  pós-check deixou somente a conta principal e o login antigo passou a falhar.
  A recuperação de senha da conta principal também entregou o e-mail esperado
  na caixa correta; o link não foi aberto e a senha não foi alterada.
- A conta secundária foi recriada para homologação contínua. Onze módulos,
  perfil, integrações e suporte abriram sem dados da principal. Um projeto de
  teste criado na secundária não apareceu ao trocar para a principal, provando
  isolamento real de leitura em `projetos`. Uma resposta transitória de
  credenciais inválidas não se repetiu no reteste; a conta voltou a entrar e o
  marcador foi removido, preservando o usuário secundário para a matriz futura.
- Novos uploads de JPG/PNG/WebP passaram a ser redimensionados por finalidade e
  convertidos para WebP em qualidade alta apenas quando o resultado é menor.
  A regra cobre mídias pessoais, Biblioteca, Shape, redações, exercícios e
  prints de suporte, preserva GIF/PDF e não altera o acervo antigo. Typecheck,
  86 testes, build e lint do recorte passaram sem erros. O commit `a8aa37f`
  foi enviado à `main`; CI e deploy de produção concluíram com sucesso.
- O smoke autenticado da exportação passou na conta principal com autorização:
  protocolo/histórico criados, download JSON válido e nenhum campo de token,
  segredo, senha ou cookie presente. Nenhum dado da conta foi modificado.
- Exportação autenticada foi implementada localmente: após gerar protocolo, a
  pessoa baixa um JSON dos próprios registros, perfil, integrações sem tokens e
  inventário de arquivos. Uma ferramenta administrativa de exclusão opera em
  simulação por padrão e exige três confirmações para apagar Storage e Auth na
  ordem segura. Typecheck, 84 testes, build, lint do recorte, reset completo e
  21 testes SQL passaram. O teste-base foi reconciliado com as 71 tabelas, sete
  buckets, trigger de suporte e funções atuais. O dry-run remoto listou somente
  `20260907000100`; após autorização, a migration foi aplicada e o dry-run final
  retornou vazio. O frontend foi publicado pelo commit `af8486b`; o deploy de
  produção ficou `Ready`, o site respondeu 200 e a API recusou corretamente uma
  tentativa sem sessão com 401.
- Em 2026-09-07, a conta principal de produção foi reiniciada a pedido do
  proprietário: registros pessoais e chamados de teste foram removidos e os
  nove arquivos associados foram apagados pelos controles do Storage. O
  pós-check encontrou zero arquivo da conta fora do bucket de mídia pessoal.
  Login, perfil, avatar/fundo e duas conexões Google permaneceram funcionais;
  Home e “Meus pedidos” foram validados vazios após a operação. Eventos do
  Calendar podem ser importados novamente pela sincronização já autorizada.
- Configurações ganhou solicitações autenticadas de cópia dos dados e exclusão
  da conta, reaproveitando protocolo e histórico privados da central de suporte.
  Exclusão exige a frase exata `EXCLUIR MINHA CONTA`, e o pedido apenas inicia
  a análise e confirmação de identidade: nenhum dado é apagado automaticamente.
  O pedido real de cópia passou no smoke de produção, aparecendo imediatamente
  em “Meus pedidos” com status Recebido e evento inicial no histórico.
- O aviso de privacidade versão 1.0 foi aprovado e disponibilizado publicamente
  no login, FAQ e Configurações. Ele registra o responsável e canal público,
  dados, finalidades, fornecedores, retenção e direitos. Saúde, Diário, Finanças
  e os demais módulos permanecem disponíveis: cada pessoa escolhe os recursos e
  dados que deseja usar, com recomendação de baixo risco durante o piloto.
- Em 2026-09-07, login Google foi configurado no Supabase com projeto/cliente
  OAuth separado das integrações Calendar/YouTube. A URL de retorno de produção
  foi autorizada e o botão foi publicado pelo commit `118e487`; o cadastro
  público continua desligado. O fluxo completo retornou autenticado e vinculou
  o Google ao usuário já existente, sem duplicar a conta. Metadados próprios do
  perfil passaram a usar chaves `app_*`, para novos logins não substituírem o
  nome, subtítulo, avatar e fundo escolhidos no site.
- A central de suporte passou no primeiro smoke autenticado de produção: uma
  sugestão criou protocolo, status Recebido e evento inicial, todos exibidos em
  “Meus pedidos”. Um segundo teste criou protocolo com print privado e o link
  assinado abriu a imagem corretamente. Isolamento com uma segunda conta
  continua pendente.
- A recuperação de senha aceitou a solicitação real para a conta de Gabriel;
  a entrega na caixa postal foi confirmada em 2026-09-08. Abertura do link e
  definição de uma nova senha não foram executadas porque não eram necessárias
  para validar o transporte e exigem ação humana na etapa final.
- O frontend do Cloudflare Turnstile foi preparado sem dependência nova no
  login, cadastro e recuperação. Ele só aparece com a site key pública e deve
  ser publicado antes de o CAPTCHA ser ativado no Supabase.
- O widget gratuito `Projeto Pessoal - Produção` foi criado no Cloudflare em
  modo Managed para o endereço `*.vercel.app`. A site key foi cadastrada como
  configuração pública de produção na Vercel, o redeploy ficou Ready e o
  desafio respondeu com sucesso no login. Só então a secret key foi cadastrada
  no Supabase e a proteção CAPTCHA foi ativada. Nenhum valor de chave entrou no
  repositório ou na documentação.
- A conta secundária `gamazon1313` foi autenticada numa sessão InPrivate real:
  Home, perfil, integrações e suporte não exibiram dados da conta principal, e
  “Meus pedidos” permaneceu vazio apesar dos três protocolos de Gabriel. A
  tentativa de navegar diretamente à rota técnica do print foi bloqueada pelo
  próprio Edge antes da requisição; o isolamento cruzado do Storage continua
  sustentado pelo teste SQL já aprovado, não por essa tentativa do navegador.
- Troca de senha passou a exigir sessão recente e senha atual no Supabase Auth;
  o fluxo de recuperação por e-mail será retestado após a publicação.

- Em 2026-09-06, Gabriel aprovou a migration de suporte. Precheck e dry-run
  listaram exclusivamente `20260905000100_suporte_publico.sql`; aplicação
  concluída, 25 versões alinhadas e dry-run final vazio. O frontend permanece
  local e cadastro público desligado. O wrapper npm imprimiu a connection URL
  no log privado da tarefa; nenhuma credencial entrou no Git, mas a senha do
  banco deve ser rotacionada antes da publicação.

- Cadastro por e-mail implementado atrás de chave desligada por padrão;
  recuperação, confirmação de e-mail/convite e definição de senha adicionadas.
- Central autenticada de bugs e sugestões com protocolo, histórico, resposta e
  prints privados; e-mail opcional serve apenas como aviso, sem painel admin.
- FAQ público separado da sugestão: FAQ responde dúvidas comuns; sugestão gera
  pedido autenticado e acompanhável.
- Cabeçalhos globais bloqueiam MIME sniffing, framing/clickjacking e permissões
  de câmera, microfone e geolocalização não usadas pelo site.
- Migration incremental e testes locais adicionados, ainda não aplicados em
  produção. Abertura pública, SMTP/Resend, CAPTCHA, Auth remoto e publicação
  permanecem gates separados com aprovação de Gabriel.
- Princípios e decisões atualizados para “pessoal primeiro, público preparado”,
  custo aprovado e organização legível para manutenção solo/equipe futura.
- Reset completo do Supabase e teste SQL do suporte aprovados: bucket privado,
  três RLS de leitura própria, isolamento entre contas, escrita cliente negada
  e histórico administrativo automático. Produção permaneceu intocada.

---

## v0.2.0 — preparação local de beta privado (2026-08-31)

- Em 2026-09-05, typecheck, 76 testes, build e `git diff --check` foram
  repetidos com sucesso. O lint manteve a dívida conhecida de 25 erros e 28
  avisos, sem erro nos arquivos TypeScript alterados. Configurações e o relato
  de bug passaram em smoke local no computador e em viewport de celular; os
  retestes reais de produção, integrações e duas contas continuam pendentes.

- Reportar bug em Configurações: formulário guiado, revisão editável e cópia;
  sem envio de e-mail, persistência, upload de print, dependência ou migration.
- Proxy passa a retornar JSON 401 para APIs sem sessão, delimita login público
  e remove queries privadas do redirect, preservando cookies de Auth.
- Logs comuns Supabase/Google/Places sem payloads/paths; mensagens externas
  controladas. OAuth vinculado ao usuário inicial e sem reutilizar refresh
  token de outra conta Google.
- Testes Node incluídos como etapa bloqueante da CI. Manifesto/lock em 0.2.0;
  fases históricas v2/v2.1 não foram renumeradas nem removidas.
- Documentação de produto, beta e manutenção consolidada; tarefas antigas
  preservadas em `archive/TASKS_HISTORY_2026-08.md`.
- Convites ainda bloqueados por fluxo de senha/SMTP, homologação entre contas
  e operação/privacidade. Em 2026-09-05, quatro commits foram enviados a
  `main`; CI #71 e o deploy de produção passaram. O domínio protegido pela
  Vercel ainda exige o smoke autenticado de Gabriel. Resultados finais e
  limites: [RELEASE_V0.2.0.md](RELEASE_V0.2.0.md).

---

## v1 (HTML puro) — histórico resumido

- **2026-07-09** — Migração LAN → Supabase decidida e executada (DEC-001 a DEC-011). Schema inicial (`001_schema_inicial.sql`, 8 tabelas) executado. Auth + Core JS (`login.html`, `supabase.js`, `auth.js`, `sm2.js`) implementados. Módulo de Treino completo (`treino.html`, `treino-shape.html`, `treino-plano.html`, `treino-academia.html`). `revisao.html` implementado com bug de schema conhecido (corrigido depois, ver abaixo).
- **2026-07-09/10** — Schema de Estudos (`002_estudos.sql`) criado; `estudos.html` gerado antes da confirmação de execução (a pedido do usuário, risco assumido).
- **2026-07-11** — `002_estudos.sql` executado e verificado. `estudos.html` validado contra o schema real, sem incompatibilidades. `revisao.html` corrigido (colunas e assinatura de `calcularSM2()` — ver DATABASE.md → Gotchas). Módulo Biblioteca planejado (DEC-014) e `003_biblioteca.sql` (11 tabelas) executado.
- **2026-07-11 a 07-13** — GRANT retroativo aplicado a todas as tabelas (DEC-015, badge "API DISABLED" era falta de GRANT, não erro de RLS). `biblioteca.html` gerado, testado end-to-end, path de CSS corrigido. Auditoria de modais (`abrirModal`/`.open`) corrigiu 4 páginas (`treino-academia.html`, `treino-shape.html`, `revisao.html`, `estudos.html`). RLS de Estudos confirmada. Podcasts ganham iTunes Search API (DEC-016).
- **2026-07-13** — Deploy no Vercel (`sistemapessoal`). Incidente: usuário deletado manualmente em Auth causou `ON DELETE CASCADE` e apagou todos os dados de teste (ver DATABASE.md → Gotchas, nunca repetir). Fase M (migração + deploy) encerrada: e2e e multi-dispositivo confirmados. Links quebrados do dashboard (Enem/Olimpíada/Escola) corrigidos via `?tipo=` (DEC-017). Classes `.btn-icon`/`.btn-salvar` faltantes adicionadas.

**v1 congelada em 2026-07-14** (DEC-018) — todas as fases (1–6, M) concluídas. Removida do projeto em 2026-07-19 (DEC-031), mantida só como backup local.

---

## v2 expandida (Next.js) — v2.1 pronta tecnicamente; homologação manual pendente

- **2026-08-31 (seleção de temporadas)** — Corrigida a exibição simultânea de busca e sugestões relacionadas; seleção, nota e confirmação ficam no mesmo bloco, antes das temporadas cadastradas. Troca de seleção invalida respostas pendentes, sem alterações no banco.

- **2026-08-30 (novo design dos painéis da Biblioteca)** — Referência v0
  adaptada para CSS Modules e temas existentes: banner/capa/identidade, topo e
  ações fixos, conteúdo central rolável e corpos específicos por mídia. Anime
  mostra temporadas, equipe, OP/ED/OST, complementos e ordem de consumo;
  Mangá exibe volumes por arco e Livro, progresso/anotações/citações. Playlist
  ganhou lista numerada ligada aos vídeos reais. Campos vazios são omitidos;
  edição e vínculo com Curso preservados. Nenhuma alteração de banco ou API.

- **2026-08-30 (revisão das cinco iluminações)** — Paleta do v0 adaptada aos
  tokens existentes, com correção das razões de contraste da proposta e dos
  usos de sucesso/aviso/destrutivo. Treino, Histórico e estrelas deixam de
  usar cores fixas de interface; foco utiliza `--ring`. Auditoria documenta
  valores finais, exceções e regressão automatizada dos 25 pares de
  iluminação/decoração. Layout, animações, persistência e banco preservados;
  revisão visual autenticada permanece pendente.

- **2026-08-30 (painel de obra e schema relacionado)** — O painel somente
  leitura das obras ganhou margens superior e inferior no desktop, altura pelo
  conteúdo e rolagem interna limitada à janela; mobile permanece em tela
  inteira. O painel passou a usar portal no `body`, evitando que o `transform`
  das transições do `AppChrome` desloque seus limites para fora da tela. A
  migration `20260830000100_anime_related_works.sql` foi aplicada
  em produção após precheck e dry-run exclusivos; histórico e dry-run final
  confirmaram o banco sem pendências.

- **2026-08-30 (criação contínua de Anime)** — O cadastro de Anime ganhou duas
  etapas explícitas dentro do mesmo modal: após salvar a obra-base, a interface
  avança e rola para temporadas, músicas, complementos e ordem de consumo, sem
  exigir fechar e reabrir como edição. A gravação dessas relações permanece
  condicionada à migration incremental ainda pendente em produção.

- **2026-08-30 (hierarquia dos banners da Biblioteca)** — Removidos
  “Categoria ativa”, “Biblioteca pessoal” e “Sua coleção” de todas as
  categorias. A linha de ordenação ficou alinhada à direita, sem divisor, com
  15 px entre o banner superior e a grade de obras.

- **2026-08-30 (busca complementar da Biblioteca)** — Anime e Mangá passaram
  a consultar AniList primeiro e manter Jikan como fallback, corrigindo buscas
  vazias durante respostas `504` da Jikan sem exigir chave nova. Livros passaram
  a combinar Google Books em português, Google geral e Open Library, com
  deduplicação e prioridade para edição portuguesa. A identificação da fonte e
  do idioma ficou visível em cada sugestão. O corte dos dias passados na Agenda
  passou a atravessar a célula em diagonal, do canto inferior esquerdo ao canto
  superior direito.

- **2026-08-29 (Agenda diária e grade semanal)** — O mês passou a abrir um
  painel central com todos os compromissos e provas do dia, incluindo descrição,
  edição, conclusão e exclusão segura; dias passados recebem um corte horizontal
  integral. A semana foi compactada em sete colunas sobre uma grade de 24 horas
  com rolagem própria e eventos posicionados por horário/duração. A linha do
  tempo lateral destaca com “Agora” o compromisso correspondente ao horário
  atual. A conclusão permanece local em `agenda.concluido`, pronta para futura
  atualização pelos módulos vinculados, começando por Treino.

- **2026-08-29 (auditoria Calendar/APIs)** — A sincronização bilateral foi
  reconciliada com a documentação e ganhou diagnóstico visível das variáveis
  ausentes, tolerância a exclusão remota já concluída e timestamp estável na
  importação. Google Books passou a exigir sua chave oficial; consultas de
  metadados ganharam timeout. O histórico confirmou que o editor interno de PDF
  com desenho não tinha contrato detalhado preservado. Os efeitos sazonais do
  topo passaram à metade da velocidade, sem alterar a coluna lateral.
  O diagnóstico posterior passou a diferenciar falhas seguras de Calendar e a
  identificar o commit quando uma chave da Biblioteca não chega ao deployment.
  O reteste revelou o `GRANT` ausente de `agenda` para `service_role`; foi
  preparada uma migration incremental mínima, sem mudança de RLS ou dados. O
  reset completo e os 18 scripts SQL locais foram aprovados; após dry-run
  exclusivo, a migration foi aplicada em produção e confirmada por privilégio,
  histórico único e dry-run final vazio.

- **2026-08-29 (atmosfera sazonal expandida)** — As decorações deixaram de
  ficar limitadas à cápsula de navegação e ganharam uma camada reutilizável que
  cobre toda a faixa superior e o fundo da coluna pessoal. Primavera usa
  pétalas suaves, verão brilhos solares, outono folhas secas e inverno flocos de
  neve. As camadas não capturam cliques, respeitam redução de movimento e não
  alteram a transição compartilhada com a Biblioteca. Somente a neve cai;
  pétalas, folhas e brilhos seguem trajetórias horizontais de vento. A camada
  lateral é ocultada ao concluir a entrada na Biblioteca.

- **2026-08-29 (Agenda automática e duas escalas visíveis)** — A Agenda passou
  a manter o mês completo acima da semana selecionada. A conexão Calendar
  consulta mudanças ao navegar, retomar a aba e em intervalo de dois minutos;
  criação, edição e exclusão locais são enviadas imediatamente ao Google. A
  coluna pessoal agora lista toda a agenda de hoje em ordem cronológica. Perfil
  e controles ficam imóveis no topo e rodapé; o miolo com relógio, calendário e
  Agenda rola como uma área única. Sem migration ou dependência nova; OAuth
  bilateral depende de reteste no deploy.

- **2026-08-29 (transições entre páginas e perfil compartilhado)** — A
  navegação superior ganhou troca direcional de conteúdo e indicador ativo que
  se desloca entre módulos. Ao entrar ou sair da Biblioteca em tela larga, o
  card de perfil da coluna pessoal percorre uma transição encadeada até o perfil
  compacto do topo, junto do recolhimento da coluna. O estado final usa as
  mesmas medidas da interface real para evitar duplicação e “teleporte”; a
  implementação respeita redução de movimento e não adiciona dependência.

- **2026-08-28 (hierarquia visual e conceito de revisão)** — Corrigida a
  composição da Biblioteca para não exibir a coluna pessoal junto da sidebar
  própria. O perfil, a atmosfera e a saída retornaram compactos ao topo desse
  módulo, com animação curta; no catálogo, a sidebar fica imóvel e apenas a
  coleção rola. Cabeçalhos comuns agora começam diretamente pelo título
  principal. Início e Estudos deixaram de classificar flashcards como pendências
  de conteúdo; somente lembretes vinculados por `referencia_uuid` entram nesses
  resumos. Sem migration ou alteração dos cards existentes.

- **2026-08-28 (scroll e robustez da coluna pessoal)** — A coluna lateral fixa
  passou a rolar verticalmente como uma área única em janelas baixas, sem scroll
  concorrente na linha temporal e sem cortar o seletor de atmosfera. O
  carregamento agora preserva resultados parciais, sempre encerra o estado de
  espera, informa falhas e expõe foco visível nos controles. Typecheck e build
  aprovados; validação visual no deploy permanece em `docs/teste.md`.

- **2026-08-28 (handoff curto para continuidade)** — Criado
  `docs/NEXT_ENGINEER_HANDOFF.md` como resumo operacional para novos chats de
  engenharia, com estado atual, bug ativo da coluna esquerda, regras de
  validação e prompt de continuidade. `AI_CONTEXT.md`, `TASKS_NOW.md` e
  `teste.md` passaram a apontar para esse caminho curto sem remover histórico
  útil dos documentos longos.

- **2026-08-27 (enquadramento visual global)** — Rotas autenticadas comuns
  ganharam um `AppChrome` com coluna pessoal atmosférica fixa à esquerda, do
  topo ao rodapé, e conteúdo principal adaptado à direita em telas largas. A
  coluna reúne perfil, relógio digital, calendário do mês, linha temporal de
  Agenda/provas, tema e logout; a barra superior ficou dedicada à navegação.
  A área principal recebeu gradientes e profundidade por tema/estação,
  recolhendo abaixo de `1480px`; login, prova ENEM e sessão focada de Revisão
  preservam largura total. Sem migration, dependência ou alteração de dados.

- **2026-08-27 (lote consolidado de homologação)** — Hub passou a exibir
  somente revisões, provas e Biblioteca em andamento; Biblioteca ampliou gêneros
  e importação de metadados/créditos; ENEM ganhou histórico seguro de tentativas;
  Revisão ganhou vínculo acadêmico e sessão focada; Agenda ganhou importação
  Calendar com prévia/conflitos; Treino ganhou planejamento semanal; Lugares
  ganhou busca Google Places server-side. Reset/18 scripts, 28 testes Node,
  typecheck e build passaram. A migration foi aplicada após dry-run exclusivo;
  pós-check confirmou schema/segurança e o dry-run final ficou vazio.

- **2026-08-22 (painel múltiplo de insights do Hub)** — O bloco rotativo de um
  item foi substituído por cards reais simultâneos: três colunas no desktop,
  quatro em telas largas, duas no tablet e faixa horizontal com snap no mobile.
  Ícone, categoria, título compacto e ação contextual permanecem ligados aos
  dados já carregados; com menos de três insights, nenhum placeholder é criado.

- **2026-08-22 (lote local de playlists e beta privado)** — Biblioteca > Vídeos
  ganhou importação por link com prévia/seleção pela API oficial e agrupamentos
  persistentes que reutilizam vídeos normais, preservando Vídeo → Curso. O Hub
  passou a rotacionar mais itens reais e considerar compromissos/provas de hoje;
  metadados e BRAPI ganharam autenticação direta como defesa adicional. YPT foi
  mantido manual por ausência de API/export oficial verificável, sem credenciais
  ou scraping. O checklist operacional de beta privado foi documentado. A
  migration `20260822000300_biblioteca_playlists.sql` passou reset, 17 scripts
  SQL, dry-run remoto exclusivo, aplicação e pós-check de histórico, 66 tabelas,
  RLS, policies, GRANTs, índices e FKs compostas; o dry-run final ficou vazio.
  A publicação do frontend segue condicionada às validações e ao commit deste lote.

- **2026-08-22 (contas Google separadas)** — YouTube e Calendar passaram a ter
  autorizações, credenciais cifradas, status e desconexão independentes por
  `(user_id, servico)`, permitindo contas Google diferentes. OAuth força escolha
  da conta e solicita somente o escopo do serviço; eventual conexão legada é
  mapeada para Calendar sem duplicar refresh token, embora o pós-check tenha
  encontrado o cofre vazio em produção. A migration incremental passou
  reset/16 scripts SQL, dry-run remoto exclusivo, aplicação e pós-check; os 23
  testes Node, typecheck e build também passaram, com dry-run final vazio.

- **2026-08-22 (causa do `42501` Google confirmada)** — O diagnóstico seguro
  revelou ausência de privilégio SQL do `service_role` em
  `integracoes_google`: a migration original havia concedido CRUD somente a
  `authenticated`. A migration incremental contendo apenas o `GRANT` faltante
  passou reset/16 testes SQL, dry-run exclusivo, aplicação e pós-check remoto;
  RLS e ausência de policies de cliente foram preservadas e o dry-run final ficou vazio.

- **2026-08-22 (diagnóstico da conexão Google)** — A rota de status passou a
  preservar e classificar erros do Supabase por códigos estáveis, registrar
  somente campos seguros e diferenciar ambiente ausente, chave inválida,
  tabela/coluna ausente, permissão e erro inesperado. O cliente server-side
  valida chaves públicas por engano e mantém compatibilidade com `sb_secret_`
  e JWT legado `service_role`. A suíte Node passou a 21 testes; sem migration.

- **2026-08-21 (fechamento técnico de integrações e uploads)** — OAuth Google
  ganhou state/PKCE, cofre AES-256-GCM server-only, UI de conexão/revogação,
  importação paginada de playlists do YouTube e exportação idempotente da
  Agenda para o Calendar. Perfil, Receitas, Lugares, provas/simulados e banners
  da Biblioteca passaram a usar Storage privado. Revisão ganhou `.apkg` com
  ZIP/SQLite, deck, prévia, limites e deduplicação. Foram adicionados testes de
  Agenda, ENEM, Redação, Anki, Open Graph e BRAPI (18 testes Node no total),
  além do 16º script SQL. Next/eslint-config-next subiram para 16.3.2 e
  `npm audit` ficou zerado. A migration
  `20260821000200_integracoes_google_midias.sql` foi aplicada após reset, dry-run
  exclusivo e pós-check remoto, com dry-run final vazio.

- **2026-08-21 (fechamento visual e operacional)** — Corrigido o fundo
  retangular externo do botão de atmosfera, preservando foco arredondado e
  acessível também em “Sair”. Lua virou o dark mode neutro em
  carvão/grafite/ardósia, enquanto Estrelado manteve o azul noturno. As
  estações agora influenciam discretamente acentos, superfícies secundárias,
  bordas e glows por tokens compartilhados. A extensão local passou a exibir
  configuração e retorno do envio sem credencial própria; documentação e
  auditoria final foram reconciliadas. Sem migration ou operação remota.

- **2026-08-21 (atmosfera visual de Treino e card de Shape)** — `/treino`
  passou a preservar a profundidade dos cinco ambientes com fundos em camadas,
  superfícies, bordas e sombras integradas. O card de Shape ganhou foto
  full-bleed sem faixa superior, centro livre e rodapé dedicado para balança,
  peso, data e acesso ao histórico, sem alteração de dados ou consultas.

- **2026-08-20 (refinamento da atmosfera)** — As cinco iluminações ganharam
  paletas atmosféricas com profundidade de página, superfícies, vidro, header e
  sombras coerentes. Primavera, Verão, Outono e Inverno passaram a ter formas,
  cores e movimentos claramente distintos; “Noite” foi removida por não ser
  estação, com migração local automática para “Nenhum”. O topo integra perfil,
  partículas dissipadas e cápsula sem repetir a imagem real. Sem migration,
  dependência, Supabase remoto ou mudança de lógica funcional.

- **2026-08-20 (arquitetura de atmosfera)** — Os cinco temas foram consolidados
  como iluminações Sol, Suave, Nublado, Estrelado e Lua. O painel “Atmosfera”
  ganhou decoração independente, posteriormente refinada para as quatro
  estações e Nenhum; o resumo do perfil ganhou cor ambiente local. O topo agora combina
  base temática, imagem real confinada ao perfil, partículas CSS dissipadas e
  cápsula translúcida de navegação. Preferências têm aplicação anti-flash,
  animações respeitam movimento reduzido e não houve migration, dependência,
  operação remota ou alteração funcional de módulos.

- **2026-08-21 (prioridade da Agenda publicada)** — Eventos manuais ganharam
  prioridade baixa/normal/alta, default normal, edição, identificação compacta
  nos cards e ordenação cronológica com prioridade como desempate; provas de
  Estudos permanecem somente leitura e sem duplicação. A migration
  `20260820000300_agenda_prioridade.sql` passou reset, 14 testes e dry-run
  remoto exclusivo, foi aplicada em produção e teve coluna, constraint,
  histórico e dry-run final vazio confirmados antes da publicação do frontend.

- **2026-08-20 (topo global e reteste explícito)** — O seletor de aparência
  virou um controlador meteorológico de botão único, preservando claro/suave/
  escuro e acrescentando nublado/estrelado na preferência existente. O perfil
  passou a abrir um resumo acessível com seus metadados e ação de edição. O
  reteste manual do commit `d5a8b7e` continua explicitamente pendente; nenhuma
  migration ou integração foi criada neste lote.

- **2026-08-20 (segunda rodada da homologação)** — Redações passaram a aceitar
  apenas os passos reais 0/40/80/120/160/200 por competência e ganharam tempo
  opcional informado em horas/minutos. O modo “Fazer prova ENEM” agora separa
  respondidas, em branco, acertos, erros e total, além de permitir tema e upload
  privado da redação do Dia 1, vinculada à prova para correção posterior. O card
  de Shape moveu peso/data/ação para o rodapé e eliminou a faixa sem imagem no
  topo. `20260820000200_redacoes_tempo_execucao.sql` passou reset, 13 testes,
  dry-run exclusivo, aplicação e pós-check remoto com dry-run final vazio.

- **2026-08-20 (correções da primeira homologação publicadas)** —
  Corrigidos estado de logout, contraste das ações de Treino, seleção inválida
  de imagem, edição/exclusão de Shape, desempate do peso diário e visibilidade
  de concluir/reabrir na Agenda. O dashboard de Treino ganhou fotos reais do
  Shape e pontuação derivada de sessões; o sistema ganhou tema suave; TMDB e
  Jikan passaram a preencher mais campos existentes; e o gabarito ENEM ganhou
  modo cronometrado de 5h30/5h. A falha de Redações foi rastreada ao limite de
  `NUMERIC(4,1)` para uma nota máxima de 1000,0. A migration incremental
  `20260820000100_redacoes_nota_mil.sql` passou reset e 12 testes SQL; o dry-run
  remoto listou somente esse arquivo, a aplicação foi autorizada e o pós-check
  confirmou `NUMERIC(5,1)`, faixa 0–1000, histórico alinhado e dry-run vazio.

- **2026-08-15 (melhorias documentadas v2.1)** — Agenda ganhou visão mensal;
  Revisão passou a pré-visualizar CSV/TSV e filtrar por módulo; Histórico ganhou
  resumo mensal, legenda e exportação CSV; Finanças mostra valor atual, resultado
  e cobertura de cotações; Biblioteca detalha melhor origem/limites da busca de
  metadados. Treino passou a aceitar imagem/GIF privado de exercício com signed
  URL e rollback. A migration `20260815000200_v21_hardening.sql` normalizou o
  domínio de `materias.tipo`, alinhou cascade e endureceu as policies de
  `exercicios`/`redacoes`; reset, onze testes SQL, dry-run exclusivo, aplicação
  remota e pós-check vazio foram aprovados. Sem dependência nova.

- **2026-08-15 (congelamento da release candidate)** — A implementação geral
  da v2 expandida foi encerrada e congelada para homologação. `TASKS_NOW.md`
  passou a limitar o trabalho ativo ao checklist manual e às correções
  decorrentes; `BACKLOG.md`, `ROADMAP.md`, `VISION.md` e `AI_CONTEXT.md` foram
  reconciliados com o estado real. O handoff operacional foi consolidado em
  `docs/V2_RELEASE_CANDIDATE.md`. Nenhuma feature, migration, dependência,
  alteração de produto ou operação remota foi realizada.

- **2026-08-15 (preparação da homologação final)** — Auditoria local confirmou
  31 páginas, 2 API Routes, variáveis documentadas e as 12 migrations da cadeia
  ativa, sem alteração de banco. A proteção global passou a validar o token no
  Supabase Auth antes de liberar rotas; investimentos deixaram de aceitar preço
  médio vazio como zero; e o upload de Shape foi alinhado aos formatos e ao
  limite real do bucket, com erro visível. Dois componentes sem consumidores
  foram removidos. A documentação arquitetural foi reconciliada e o checklist
  manual completo foi criado em `docs/HOMOLOGATION_V2.md`.

- **2026-08-15 (Programação, investimentos e importação tabulada)** — Criado
  `/programacao` como visão especializada de Projetos, com repositório,
  linguagem, status e destaque. Finanças ganhou CRUD de posições e consulta
  opcional de cotação por API Route server-side com `BRAPI_TOKEN`, sem persistir
  preço de mercado. Revisão passou a importar CSV/TSV com parser local,
  limites e deduplicação por pergunta/resposta. Hub, Diário e navegação foram
  atualizados; uploads sem contrato seguro permaneceram documentados. A
  migration `20260815000100_programacao_investimentos.sql` passou reset e dez
  testes SQL, foi aplicada em produção após dry-run exclusivo e teve pós-check
  completo, deixando produção e cadeia local sem pendências.

- **2026-08-15 (Idiomas, novas áreas e histórico anual)** — Criado `/idiomas`
  com CRUD, nível/objetivo, vocabulário, práticas e métricas semanais/mensais.
  Olimpíadas, Vestibulares e Outros estudos passaram a reutilizar
  `materias`/`conteudos`; `/historico` agrega nove fontes em heatmap anual sem
  tabela própria. Hub e navegação receberam os novos acessos e insights. A
  migration `20260814000100_idiomas.sql` passou reset e nove testes SQL, foi
  aplicada em produção após dry-run exclusivo e confirmada por pós-check.

- **2026-08-14 (favorito rápido na Biblioteca)** — O coração passou a ficar
  sempre visível sobre a capa dos cards das oito categorias, vazado ou
  preenchido conforme o estado. Um clique alterna o favorito sem abrir o painel
  de detalhes; lista, card e painel selecionado continuam sincronizados pelos
  callbacks existentes. A opção equivalente foi preservada no menu como acesso
  alternativo. Sem migration, dependência ou operação remota.

- **2026-08-14 (duração, favoritos e fechamento do brainstorm)** — As oito
  categorias da Biblioteca foram reconciliadas com os campos reais de tempo e
  favorito já presentes no schema. Cards, painéis e formulários agora exibem e
  editam duração de forma consistente; o menu compartilhado permite favoritar
  ou remover favorito sem esconder o fallback manual. YouTube preserva duração
  em segundos; TMDB enriquece filmes e séries pelos endpoints de detalhe; Jikan
  preenche a duração média de anime quando disponível. A busca de podcast da
  iTunes não fornece duração média confiável da obra, então esse campo continua
  manual em vez de gravar um valor ambíguo. O Hub ganhou insights
  simples de Saúde, Finanças e Lugares, o dashboard de Treino passou a mostrar
  duração semanal e por sessão, e itens grandes do brainstorm foram
  explicitados no backlog. Nenhuma migration ou dependência nova foi necessária.

- **2026-08-14 (acabamento visual de cards e navegação)** — Os cards da
  Biblioteca receberam capa dominante com moldura interna, sobreposições mais
  próximas do protótipo v0 e corpo inferior específico para os temas claro e
  escuro. A navegação global passou a usar cápsula translúcida; o campo visual
  foi ampliado para pétalas orgânicas rosadas quando há background de perfil e
  fallback temático quando não há, sem repetir a imagem real pela barra.

- **2026-08-14 (Biblioteca: estrelas, ordenação e acabamento v0)** — As oito
  contagens da sidebar passaram a carregar na entrada do módulo; a busca ganhou
  ordenação local por recência, título, nota, favoritos e status. As sete
  categorias que possuem `nota` agora usam cinco estrelas com meio ponto nos
  formulários, cards e detalhes; Artigos continua corretamente sem nota. A
  migration incremental `20260813000200_biblioteca_nota_cinco_estrelas.sql`
  converte 0-10 para 0-5, foi aprovada em reset e teste SQL local, aplicada em
  produção após dry-run limpo e confirmada por pós-check sem pendências. Cards
  foram refinados na direção do protótipo v0, o toggle de tema foi movido para
  junto de “Sair” e o topo passou a usar pétalas/lascas temáticas sem repetir a
  imagem real do perfil.

- **2026-08-13 (redesign visual da Biblioteca)** — A página única da Biblioteca
  foi reformulada a partir da direção visual aprovada no protótipo v0, sem
  importar dados mockados nem alterar os fluxos reais. Sidebar, hero e cards
  compartilhados agora apresentam as oito categorias em uma composição mais
  compacta, capas reais em colagem, status, notas, favoritos, metadados e
  gêneros. CRUD, importações, Vídeo → Curso, modais, painéis e soft delete foram
  preservados; sem migration, dependência ou API nova.

- **2026-08-13 (correção dos fragmentos do topo)** — Removido o repasse de
  `background_url` para o rastro e as partículas da navbar, que esticava a
  imagem real pela barra. A foto agora permanece exclusivamente no bloco do
  perfil; o restante do efeito usa gradientes e lascas abstratas dos tokens do
  tema, com maior presença até “Início” e dissipação progressiva.

- **2026-08-13 (reconciliação pós-lote)** — Documentação consolidada para
  registrar a implementação técnica da v2 expandida, mantendo os testes manuais
  finais como etapa de homologação. A política de Git agora explicita que agentes
  não commitam/pusham por padrão, mas podem fazê-lo com autorização expressa do
  usuário. O rastro do background do perfil foi reforçado por toda a barra, com
  maior presença até “Início” e dissipação progressiva nos links seguintes.

- **2026-08-13 (dashboards de Treino e Diário)** — `/treino` deixou de ser
  apenas uma grade de modalidades e passou a resumir sessões da semana,
  treinos planejados, exercícios, Shape e histórico recente. `/diario` foi
  criado como portal sem tabela própria, agregando Saúde, Finanças, Lugares e
  Receitas; essas quatro áreas saíram do topo e passaram a ser representadas
  por Diário. A navegação também ganhou uma transição visível do background do
  perfil com fragmentos irregulares distribuídos pela barra, incluindo
  fallback nos temas claro e escuro. Sem migration ou dependência nova.

- **2026-08-13 (Saúde, Finanças e Lugares)** — Criados os módulos manuais
  `/saude`, `/financas` e `/lugares`, com migration incremental única, RLS,
  GRANT, checks, índices parciais e soft delete. Saúde preserva `shape` como
  fonte única do peso; Finanças resume entradas, saídas e saldo mensal; Lugares
  abre coordenadas ou endereço no Google Maps sem API. O Hub ganhou insights
  de tempo hoje/semana/mês, receita recente e próximo compromisso, e aulas de
  Curso vinculadas a vídeo passaram a mostrar thumbnail. Reset local completo
  e os sete testes SQL foram aprovados. Após dry-run remoto limpo, a migration
  foi aplicada em produção e o pós-check não encontrou pendências.

- **2026-08-12 (UX das importações e do topo)** — O campo e o botão paralelos
  de busca foram removidos dos formulários da Biblioteca. O próprio título
  agora consulta metadados após debounce e mostra sugestões logo abaixo;
  Vídeos também usam a URL quando disponível. Falhas e chaves ausentes não
  bloqueiam o preenchimento manual. O topo global passou a compactar a linha
  desktop a partir de 960px e, abaixo disso, usa uma faixa horizontal em vez
  da grade de quatro colunas. O perfil continua sendo o único acesso às
  Configurações, sem engrenagem, e fragmentos discretos do background se
  espalham pela navegação com fallback compatível com os dois temas.

- **2026-08-12 (insights e metadados da Biblioteca)** — O Hub ganhou um
  carrossel compacto de insights pessoais com rotação automática e controles
  manuais, composto apenas a partir de Biblioteca, Estudos, Revisão, Projetos
  e Receitas existentes. A Biblioteca ganhou a primeira API Route do projeto,
  com busca e preenchimento revisável por YouTube, TMDB, Google Books, Jikan e
  iTunes Search. YouTube/TMDB usam chaves opcionais somente no servidor; as
  demais fontes não exigem segredo e todos os formulários mantêm o fluxo
  manual diante de chave ausente, limite ou indisponibilidade externa.

- **2026-08-12 (perfil, uploads e novos módulos)** — `/configuracoes` passou a
  editar os metadados visuais do perfil no Supabase Auth e atualizar o topo
  global. Materiais de Estudos ganharam upload privado no bucket `documentos`
  com signed URLs; o fluxo de imagem de Redações ganhou validação e limpeza de
  arquivos em substituições/falhas. Projetos e Receitas foram implementados
  com CRUD, soft delete, navegação e resumos no Hub. A migration incremental
  `20260812000200_projetos_receitas.sql` e seu teste específico passaram no
  banco Docker local. Após novo dry-run limpo, a migration foi aplicada em
  produção em 2026-08-12; o pós-check remoto não encontrou pendências.

- **2026-08-12 (alinhamento estrutural da navegação global)** — O topo deixou
  de combinar `flex-wrap`, reordenação e larguras independentes: `GlobalNav`
  passou a usar uma única grade responsiva com áreas de perfil, navegação e
  logout. No desktop, as três áreas compartilham a mesma linha de `3.5rem`; em
  larguras menores, apenas a navegação quebra de forma controlada. O efeito de
  perfil ficou contido na célula esquerda, com fallback neutro baseado em
  `surface-2`, e a borda inferior passou a pertencer exclusivamente ao
  `header`. Os offsets e o acabamento da Biblioteca foram preservados.

- **2026-08-12 (acabamento do perfil global)** — O background do perfil no
  `GlobalNav` deixou de depender de uma cor sólida mascarada. O fallback agora
  é um gradiente transparente próprio, e `background_url` ocupa uma segunda
  camada com máscaras CSS padrão e WebKit. As duas camadas se dissolvem no
  fundo da navegação sem formar uma faixa retangular; avatar, nome, link
  “Início” e comportamento mobile foram preservados. Nenhuma mudança de banco,
  dependência ou integração foi necessária.

- **2026-08-12 (correções após o primeiro deploy do polimento final)** — O
  perfil deixou de ser uma exceção da Biblioteca e substituiu “Sistema
  Pessoal” no topo de todas as rotas autenticadas, mantendo “Início” como
  acesso único à Home. O background do perfil passou a degradar logo depois
  do nome. A sidebar da Biblioteca foi compactada para exibir categorias e
  ações sem a pequena rolagem observada no teste, e o item ativo passou a usar
  `--accent-foreground`, corrigindo o rótulo invisível sobre o fundo de
  destaque. Nenhuma mudança de banco ou dependência foi necessária.

- **2026-08-12 (ajustes do teste manual final)** — Corrigidos o contraste do
  login e o corte de “Agenda” na navegação responsiva. O Hub ganhou um bloco
  compacto de provas futuras baseado em `provas`. A Biblioteca deixou o tema
  dourado fixo, passou a acompanhar o tema global, moveu o perfil para o topo
  e eliminou a disputa de rolagem entre página, conteúdo e sidebar. Revisão
  Espaçada ganhou arquivamento reversível separado do soft delete; a migration
  `20260812000100_revisao_arquivados.sql` e seu teste passaram em reset local
  e na suíte SQL completa. Após dry-run limpo, a migration foi aplicada em
  produção com autorização explícita e o pós-check remoto não encontrou
  pendências. A importação Anki foi auditada e mantida como etapa própria por
  depender de ZIP/SQLite e de
  decisões de mapeamento, sem nova dependência nesta leva.

- **2026-08-12 (auditoria final local)** — Revisão completa dos fluxos centrais
  antes do teste manual definitivo. Corrigido o uso de data UTC em operações
  de Hub, Estudos, Revisão e Shape; o Hub passou a preservar dados disponíveis
  quando uma fonte falha. O Hub de Estudos deixou de mostrar UUID de matéria.
  Cursos e provas ganharam controles coerentes de conclusão, e o gabarito ENEM
  completo marca a prova como feita. Simulados, competências de redação e
  correção do gabarito passaram a validar os limites/requisitos já definidos.
  Na Biblioteca, o gatilho de adicionar não vaza entre categorias e os menus
  fecham ao escolher uma ação, com acesso visível por toque. Nenhuma migration,
  dependência ou operação remota foi necessária; typecheck aprovado e lint
  informativo reduzido de 44 para 40 achados conhecidos.

- **2026-08-12 (cont.)** — Hub inicial transformado em painel operacional
  com tempo estudado hoje/semana/mês, compromissos e provas do dia e revisões
  pendentes, todos derivados das tabelas existentes e com estados de loading,
  vazio e falha parcial. Na Biblioteca, o fluxo de gêneros das seis categorias
  originais foi completado: seed quando necessário, leitura em lote,
  persistência na criação/edição e acesso ao gerenciamento pela sidebar. O
  menu compartilhado dos cards agora fecha por clique externo e Escape. Seis
  erros de lint em efeitos das telas tocadas foram removidos; nenhuma migration,
  dependência ou operação remota foi necessária.

- **2026-08-11 (cont.)** — Migration de Vídeos/Artigos aplicada em produção.
  Implementado localmente o fluxo manual Vídeo → Curso: escolha explícita de
  curso e módulo existente ou novo, criação de conteúdo com FK opcional para
  `videos`, prevenção de duplicação no mesmo curso e manutenção de progresso
  independente. A tela de Curso identifica aulas vindas da Biblioteca, abre o
  vídeo e permite controlar teoria vista e domínio separadamente. A migration
  `20260811000300_conteudos_video.sql` passou por reset e testes locais, foi
  aplicada em produção em 2026-08-12 e teve pós-check remoto sem pendências,
  liberando o lote para publicação.

- **2026-08-11 (cont.)** — Biblioteca v2 expandida localmente com as
  categorias Vídeos e Artigos na página única da DEC-032. Foram adicionados
  CRUD manual, busca, painel de detalhe, links externos e soft delete com
  `ConfirmDialog`; URLs reconhecidas do YouTube fornecem ID e thumbnail sem
  API. A migration `20260811000200_biblioteca_videos_artigos.sql` cria as duas
  tabelas com RLS, GRANT, checks e índices parciais. Reset e três testes SQL
  passaram localmente; a migration foi aplicada em produção em 2026-08-11.

- **2026-08-11 (cont.)** — Agenda v2 implementada localmente em `/agenda`,
  com visão semanal, CRUD de compromissos, soft delete, eventos gerais, de
  estudo e de treino, além da exibição de provas diretamente da fonte de
  verdade de Estudos. Hub e navegação global passaram a incluir Agenda. A
  migration incremental `20260811000100_agenda_v2.sql` evolui a tabela
  existente sem recriá-la; reset, teste consolidado e teste específico da
  Agenda passaram localmente. A migration foi aplicada em produção pela
  cadeia ativa em 2026-08-11 e o pós-check remoto não encontrou pendências,
  liberando a publicação do frontend.

- **2026-08-11** — Fechamento seguro de UX da v2: as 10 ocorrências restantes
  de `confirm()` nativo em Treino e Biblioteca foram substituídas pelo
  `ConfirmDialog` reutilizável, preservando as mesmas operações de exclusão.
  `window.prompt` continua ausente. Documentação reconciliada com o hub `/`,
  navegação global, logout, smoke principal de produção e modais atuais. Sem
  mudança de banco, migration, dependência ou infraestrutura.

- **2026-08-11 (cont.)** — Estudos v2 passou a consumir as três tabelas que
  ainda não tinham fluxo: materiais por conteúdo, anotações por matéria com
  conteúdo opcional e sessões manuais com início/duração. Foram adicionadas
  três libs e um componente reutilizado nos detalhes de Matéria e Curso, com
  soft delete e `ConfirmDialog`. O `SubjectManager` órfão, única fonte das
  métricas artificiais antigas, foi removido. A auditoria concluiu que o
  schema consolidado já era suficiente; nenhuma migration, dependência ou
  configuração de Storage foi alterada.

- **2026-08-11 (cont.)** — Revisão Espaçada ganhou página dedicada em
  `/revisao`, acessível pelo hub, navegação global e Hub de Estudos. A tela
  separa cards vencidos/para hoje dos futuros, permite revelar resposta,
  registrar resultado pelos mesmos níveis do SM-2 existente, criar card
  manual e apagar com `ConfirmDialog` + soft delete. Cards de Estudos são
  identificados como conteúdo e têm `conteudos.revisao_uuid` desvinculado ao
  apagar. O schema existente foi suficiente; sem migration ou dependência.

- **2026-08-09** — Primeira etapa segura para tornar a v2 usável como site:
  rota `/` deixou de ser placeholder técnico e virou hub inicial com acesso
  direto a Treino, Biblioteca e Estudos. Navegação global simples adicionada
  ao layout raiz, com ação visível de logout via Supabase Auth e
  redirecionamento para `/login`. Nenhuma mudança de banco, migration,
  dependência, Storage, Vercel ou API externa.

- **2026-08-09 (cont.)** — Smoke test online em produção consolidado:
  login, hub, navegação para Treino/Biblioteca/Estudos e logout passaram,
  sem problema relatado pelo usuário. Em Estudos, ações destrutivas
  receberam modal de confirmação e o vínculo de conteúdo compartilhado
  deixou de usar `window.prompt`, passando para seleção visível de matéria.
  Sem mudança de schema, migration, dependência ou infraestrutura.

- **2026-07-14** — Decisão de migrar para Next.js/React + TypeScript (DEC-018). Estrutura da v2 definida: `frontend-v2/`, App Router, CSS Modules (DEC-019).
- **2026-07-15** — Fase 7.0 (setup técnico) concluída: projeto Next.js criado, `lib/supabase.ts` (bug real: precisa de `createBrowserClient`, não `createClient` — ver ARCHITECTURE.md), `middleware.ts` (DEC-021), login testado, CSS global com tokens de `DESIGN.md`. Treino v2 planejado (Fase 7.1, DEC-020): hierarquia `modulos_treino` → `treinos` → `exercicios_forca`/`exercicios_cardio`. `005_treino_v2.sql` executado.
- **2026-07-16** — DEC-022: módulos de treino viram fixos (reabre parte da DEC-020). Páginas do Treino v2 geradas (hub, CRUD de treino/exercícios, modo academia, shape). Teste e2e: 3 bugs corrigidos (inputs numéricos com `useState<number>`, `.linhaSerie`/`.linhaCardio` vazando borda; `confirm()` nativo adiado deliberadamente, ver BACKLOG.md). Biblioteca v2: escopo completo definido, fatiado em B1–B6 (DEC-023 a DEC-025 abrem o desenho). B1 executado e gerado (`generos`, remoção de `tags`).
- **2026-07-17** — Biblioteca v2 B2 (`elenco`/`trilha_sonora` polimórficos, `series_temporadas` — DEC-024) e B3 (`animes`, `animes_episodios`, `openings_endings`, complementos como filmes reais — DEC-025) executados. Campo `tecnologias` de `filmes` removido antes de qualquer uso (DEC-026). Padrão de UI da Biblioteca definido: `PainelDetalheObra`/`PainelSimples` somente leitura + menu "⋯" (DEC-027).
- **2026-07-18** — Biblioteca v2 B4 (Mangás — DEC-028), B5 (Livros — DEC-029), B6 (Podcasts — DEC-030) desenhados, executados e com frontend gerado. Fecha o frontend das 6 sub-fases da Biblioteca. 2 bugs corrigidos: tipos `Update` vs `Input` para toggles simples (ver DATABASE.md → Gotchas); `AnotacoesLivroEditor.tsx` sobrescrito por engano com lógica de `VolumesEditor.tsx`, restaurado.
- **2026-07-19** — v1 aposentada, `frontend-v2/` renomeada para `frontend/`, único frontend ativo (DEC-031). Cutover de infra Vercel: projeto recriado, env vars configuradas, `middleware.ts` renomeado para `proxy.ts` (bug real: `@supabase/ssr` incompatível com Edge Runtime — ver ARCHITECTURE.md). Deploy concluído, teste de login pendente de confirmação final. Biblioteca v2: decisão de consolidar as 6 rotas numa página única com sidebar por categoria (DEC-032) — código pendente, ver TASKS_NOW.md.
- **2026-07-19 (cont.)** — DEC-032 executada via Cline+DeepSeek: `Sidebar.tsx` genérico, `app/biblioteca/layout.tsx` (2/9+7/9) e `app/biblioteca/page.tsx` consolidados; conteúdo das 6 rotas antigas migrado para `app/biblioteca/_components/*Section.tsx`; 6 rotas antigas removidas. `lib/*.ts`, painéis de detalhe e editores de listas aninhadas 100% reaproveitados sem alteração. Bug real encontrado ao apagar as pastas antigas: `.module.css` das 6 categorias tinha ficado nas pastas de rota antigas (`filmes/`, `series/`) em vez de `_components/` — resolvido criando `BibliotecaSection.module.css` compartilhado e trocando o import nas 6 Sections.
- **2026-07-20** — Redesign visual completo da Biblioteca + nova identidade visual do sistema inteiro (DEC-034). Usuário trouxe referência real (export do Figma Make: `theme.css` + `App.tsx`), usada como fonte da verdade de cor e estrutura em vez de aproximação. Paleta trocada de verde-limão para dourado/âmbar via `globals.css` — cascateia pra todo o sistema por já usar CSS Modules com variáveis. `Sidebar` ganhou faixa de perfil com imagem de fundo, avatar com anel dourado, badge de contagem só no item ativo. `BibliotecaBanner` reescrito com hero de 168px, prioridade de fundo (imagem estática do módulo → mosaico das capas reais do usuário → gradiente), sub-header fora do hero em fluxo normal (não fixo). `BibliotecaCard` reescrito: título 1 linha, ano+nota★ na mesma linha, 1 gênero, menu "⋯" só no hover. Nota migrada de escala 1-5 para 0-10 nos 6 formulários e nos painéis de detalhe (DEC-033, migration `014_nota_escala_dez.sql` confirmada executada pelo usuário). Contagem por categoria conectada via callback `onTotalCarregado` (Section → page.tsx → Sidebar). Dois bugs de estrutura JSX corrigidos pelo usuário durante a aplicação manual (key prop espalhada incorretamente; `<div>` do container sem fechamento ao trocar por Fragment). Integração de APIs externas (TMDB/Google Books/Jikan/iTunes) explicitamente adiada como próxima tarefa de escopo, não incluída neste redesign.

### Pendências ativas
Ver `TASKS_NOW.md` para o que está em aberto agora. Ver `BACKLOG.md` para polimento não bloqueante (gráficos, upload de imagem, reordenação etc.).

- **2026-07-20** — Planejamento de Estudos v2 (Fase 1/núcleo, DEC-035): rascunho amplo do usuário analisado, 3 sobreposições identificadas com módulos existentes/planejados (checklist de revisão duplicando SM-2; calendário próprio duplicando Agenda; Cursos/Flashcards como escopo de produto à parte). Escopo fasado com o usuário: núcleo cobre matérias (mantidas), conteúdos, anotações, materiais, sessões de estudo com tempo, questões individuais, simulados e redação leve — todas como tabelas novas, substituindo as equivalentes da v1 a pedido do usuário. Revisão de conteúdo reaproveita `revisao_espacada` existente como lembrete (não flashcard). Migration `015_estudos_v2.sql` gerada, execução pendente. Fase 2 (Cursos, Flashcards/Anki, Redação versionada, Calendário próprio, metas/streak, estatísticas avançadas) registrada em `BACKLOG.md`, não descartada.

- **2026-07-23** — Estudos v2 Fase 1B (DEC-036): sessão de perguntas e respostas detalhou o funcionamento real de ENEM (dia de prova com gabarito questão-a-questão, separado de simulado informal por conteúdo que alimenta SM-2), Escola (atividades, provas, conteúdo compartilhado com ENEM) e Curso (hierarquia Curso → Módulo → Aula). Migration `015_estudos_v2.sql` confirmada executada pelo usuário (2026-07-22). Migration `016_estudos_v2_fase1b.sql` gerada: `conteudos` passa a N:N com `materias` via `conteudos_materias`; novas tabelas `modulos_curso`, `atividades`, `provas`; `questoes_individuais` ganha gabarito (`prova_uuid`/`numero`/`motivo_erro`); `simulados` ganha `conteudo_uuid` (dispara SM-2) e `redacao_uuid`; `redacoes` ganha 5 notas de competência; `materias` ganha campos de Curso. Pesquisa confirmou ausência de API pública do YPT (Yeolpumta) — integração automática de tempo estudado descartada por ora, mesmo raciocínio de DEC-009.

- **2026-07-23 (cont.)** — Migration `016_estudos_v2_fase1b.sql` executada e confirmada pelo usuário no Supabase. Cline+DeepSeek desativado do projeto (ver PROJECT_PRINCIPLES.md) — Claude passa a gerar código diretamente. Camada de dados da Fase 1B gerada em bloco único (exceção consciente à disciplina schema-first, pois o usuário não pôde testar no momento — ver nota em DECISIONS.md): `lib/materias.ts` (estendido com campos de curso), `lib/conteudos.ts` (com N:N via `conteudos_materias`), `lib/modulos-curso.ts`, `lib/atividades.ts`, `lib/provas.ts`, `lib/questoes-individuais.ts` (gabarito digital em lote), `lib/simulados.ts` (dispara SM-2 quando vinculado a conteúdo), `lib/redacoes.ts` (com notas por competência). Aplicados pelo usuário. Pendência identificada e não resolvida nesta sessão: `lib/simulados.ts` depende de `avaliarCard`/`lib/revisao.ts`, inexistente na v2 (Revisão Espaçada v2 ainda não planejada, sub-fase 7.4) — bloqueia build até resolução.

- **2026-07-25** — Estudos v2: dependência bloqueante resolvida. `lib/revisao.ts`
  criado (não existia na v2) com `calcularSM2`, `avaliarCard` e
  `avaliarCardPorConteudo`, desbloqueando `lib/simulados.ts` (que já importava
  `avaliarCard` de um arquivo inexistente). Assinatura conferida contra o
  código real de `lib/simulados.ts` fornecido pelo usuário (não assumida) —
  ajuste necessário: `sbErr(error, contexto)` recebe 2 parâmetros, não 1;
  `qualidade` é `number` puro, não union type literal.
  Primeira leva de frontend de Estudos v2 (Fase 1 + 1B) gerada em bloco,
  versão deliberadamente crua (sem estilização, decisão do usuário — design
  vem depois): `app/estudos/page.tsx` (hub), `app/estudos/enem/page.tsx`,
  `app/estudos/escola/page.tsx`, `app/estudos/curso/page.tsx`,
  `app/estudos/curso/[materiaUuid]/page.tsx` (Curso → Módulo → Aula),
  `app/estudos/materia/[materiaUuid]/page.tsx` (tela mais densa, compartilhada
  entre ENEM/Escola: conteúdos, provas, atividades, questões avulsas,
  simulados), `app/estudos/redacoes/page.tsx`. Leva seguinte adicionou
  `app/estudos/enem/gabarito/[provaUuid]/page.tsx` (lançamento em lote do
  gabarito ENEM por área) e ações de apagar (conteúdo/atividade/prova) +
  vínculo cru de conteúdo compartilhado (`vincularConteudoAMateria` via
  prompt, sem seletor — pendência de UI). Navegação decidida como **rota
  real** (não `useState`/DEC-032) — usuário confirmou explicitamente que
  entra num mundo (ENEM/Escola/Curso), usa, e volta pro hub pra escolher
  outro. Todos os 11 arquivos aplicados pelo usuário sem erros.
  `materiais_estudo`, `anotacoes_estudo` e `sessoes_estudo` ficaram sem
  página nesta leva — schema existe, UI não foi gerada.
- **2026-07-25 (cont.)** — Exploração de design de Estudos v2.
  3 rodadas de prompt geradas: (1) prompt único cobrindo as 8 telas
  (excedeu 5.000 caracteres do limite do Figma, refeito compacto); (2) prompt
  compacto único (~3.900 caracteres); (3) reescrito como 8 prompts
  independentes, um por tela, sem instrução de cor/estilo (só lógica/estrutura),
  a pedido do usuário pra deixar o Figma mais livre. Usuário testou o prompt 1
  (Hub) no Figma Make e gostou da direção, mas achou os 3 mockups HTML/CSS
  cru gerados por Claude (lista, cards, sidebar) ainda distantes da visão
  desejada — 3 refinamentos adicionais gerados em cima do mockup "lista"
  (escolhido pelo usuário), agora usando os tokens reais de `DESIGN.md`
  (paleta dourado/âmbar, tipografia). Figma atingiu limite de uso do usuário;
  fluxo de design migrado para v0.dev. Os 8 prompts foram reescritos num
  formato adaptado pra geração de UI React/Next.js (cabeçalho padrão pedindo
  mock data e nenhuma lógica real, reforço de escopo por página, states
  explícitos, nota de Design System consistente entre páginas) e entregues
  como `.zip`. Usuário está rodando os prompts no v0.dev aos poucos (limite
  de geração da ferramenta) — 2 de 8 páginas prontas até agora. Combinado:
  conforme o v0 for entregando páginas, Claude adapta a estrutura/visual
  delas para o Next.js real do projeto (reaproveitando os `lib/*.ts`
  existentes) em vez de aplicar o código do v0 direto — os componentes
  gerados lá usam mock data solto, sem noção do schema real.

  ### Stack mista de estilização (DEC-038, 2026-07-25)
Desde a adoção do design gerado no v0.dev para Estudos v2, o projeto passou
a ter **duas stacks de estilização coexistindo conscientemente**:
- **Treino, Biblioteca, Dashboard:** CSS Modules puro (convenção original da v2, DEC-019)
- **Estudos:** Tailwind v4 + shadcn/ui (`components/ui/*`), DEC-038

`app/globals.css` é a fonte única de cor pros dois sistemas — variáveis
CSS Modules antigas (`--bg`, `--surface`, `--accent`...) e variáveis shadcn
(`--background`, `--card`, `--primary`...) coexistem no mesmo `:root`/`.dark`,
a maioria das antigas como alias direto das novas (ver DESIGN.md → Paleta).

**Toggle claro/escuro (DEC-039):** `components/ThemeProvider.tsx` +
`components/ThemeToggle.tsx`, controlado por classe `.dark` na tag `<html>`
(sem lib externa — contexto React + `localStorage`, script anti-flash
inline no `<head>` de `app/layout.tsx`). Vale pro sistema todo, **exceto
Biblioteca**, que fica com tema dourado fixo via classe `.bibliotecaTheme`
aplicada em `app/biblioteca/layout.tsx` (sobrescreve as variáveis
localmente, ganha de qualquer `.dark` herdada).

- **2026-07-26** — Estudos v2: infraestrutura de design adotada. Duas
  primeiras telas geradas no v0.dev (Hub, ENEM/Gabarito, Escola) aprovadas
  visualmente pelo usuário — decisão de manter a stack Tailwind v4 +
  shadcn/ui gerada por padrão, em vez de portar pra CSS Modules (DEC-038),
  puxando parcialmente pra frente o item de Tailwind que estava registrado
  em `BACKLOG.md` como "v3, futuro distante". Paleta do v0.dev (verde-oliva/
  off-white) adotada como padrão do sistema — Dashboard, Treino e Estudos —
  substituindo o dourado da DEC-034, que fica como exceção só da Biblioteca
  (DEC-037). Toggle claro/escuro real implementado no sistema inteiro exceto
  Biblioteca (DEC-039, `ThemeProvider`/`ThemeToggle` próprios, sem lib
  externa). `app/globals.css` mesclado: dois vocabulários de variável (CSS
  Modules antigo + shadcn novo) coexistindo, maioria das variáveis antigas
  como alias das novas — única fonte de verdade de cor. Conteúdo de
  `shadcn/dist/tailwind.css` colado direto no `globals.css` (variantes
  `data-*` e keyframes de accordion) em vez de manter `shadcn` como
  dependência do projeto — é só uma CLI, não usada em runtime. Setup
  testado (`npm install` + `npm run dev`, sem erros). Próximo passo: gerar
  as 4 páginas do zip do v0 com mock data pra validação visual, antes de
  conectar aos `lib/*.ts` reais de Estudos.

  - **2026-07-27** — Estudos v2: Hub, ENEM e Gabarito Digital restilizados com
  os componentes `study/*`/`ui/*` gerados pelo v0.dev (Tailwind v4 +
  shadcn/ui + Base UI), aplicados via Cline+DeepSeek em cima das páginas
  reais já existentes — lógica de dados 100% preservada, nenhuma chamada a
  `lib/*.ts` alterada. v0.dev entregou só 2 de 8 telas antes de atingir
  limite de geração (Hub confirmado; ENEM e Gabarito construídos mas não
  testados pelo próprio v0; Escola foi iniciada e descartada desta leva —
  incompleta). `SubjectManager` integrado na página ENEM, exigindo correção
  própria: o componente vindo do v0 mantinha estado interno via `useState`
  duplicando a prop de matérias — corrigido para componente controlado
  (fonte da verdade é a página pai). Durante os testes, 3 bugs reais foram
  encontrados e corrigidos, nenhum deles causado por esta restilização:
  (1) `lib/supabase.ts` — `sbErr()` e `softDelete()` com assinatura
  incompatível com o resto do projeto, gerando 37 erros de TypeScript em 9
  arquivos de Estudos + 15 callers de Biblioteca corrigidos em cascata;
  (2) pasta de rota `app/estudos/materia/[materialUuid]/` com erro de
  digitação desde a geração original (Fase 1B), travando a página em
  "Carregando..." permanentemente sem erro visível — corrigida a causa raiz
  (rename de pasta), não só o sintoma; (3) cache `.next/` desatualizado após
  o rename de pasta, exigindo limpeza manual (`rm -rf .next`) e restart
  limpo do `npm run dev` — Fast Refresh sozinho não bastou.
  Pendência aberta: `SubjectManager` exibe contagem de conteúdos e taxa de
  acerto como `0` fixo (placeholder), já que a página ENEM não carrega esses
  dados reais ainda — resolver em leva futura.

  - **2026-07-31** — Estudos v2: as 4 telas restantes restilizadas (Escola,
  Curso — lista e detalhe —, Redações, Matéria/detalhe), fechando as 8 telas
  do módulo com o design Tailwind v4/shadcn (`components/study/*`, `ui/*`)
  iniciado em 2026-07-27. Mesmo tratamento das telas anteriores: só
  visual/estrutura aproveitado, lógica de dados 100% dos `lib/*.ts` reais.

  **Contexto da leva de origem:** após ~1 semana sem atividade no projeto, o
  usuário pediu ao v0.dev pra continuar de onde parou; o limite de geração
  havia resetado, e o agente gerou sozinho, sem revisão prévia, as 5 telas
  que faltavam de uma vez — incluindo um data layer mockado próprio
  (`lib/study-data.ts`) e rotas fora da convenção do projeto (`/materia/[id]`,
  `/curso`, `/escola`, `/redacoes`, sem prefixo `/estudos/` nem os UUIDs
  nomeados corretamente). Nenhum desses artefatos foi usado — mesmo
  princípio já aplicado a toda geração do v0.dev (DEC-034/038): só
  visual/estrutura, nunca dado mockado nem decisão estrutural.

  **Decisões tomadas durante a adaptação:**
  - `GradeManager` do v0 (notas por avaliação com peso, nota máxima
    customizável, média ponderada calculada no client) **descartado por
    completo** na tela de Matéria — não existe schema equivalente (`provas`
    só tem uma `nota` por prova, sem peso). Ideia registrada em
    `BACKLOG.md` como possibilidade futura, não perdida.
  - Seção de "materiais de apoio" do mock de Matéria também descartada —
    não existe `lib/materiais-estudo.ts`; `materiais_estudo` segue sem
    página (pendência já registrada, ver `TASKS_NOW.md`).
  - Curso (detalhe): toggle de aula agora marca/desmarca concluída (o crú
    original só marcava) — melhoria de UX trivial, sem mudança de schema,
    dentro do escopo da restilização.
  - Curso (lista): barra de progresso mostra só 0%/100% (`concluido`), não
    o cálculo granular do mock do v0 — buscar contagem de aulas de todos os
    cursos na tela de lista teria custo desproporcional; o progresso
    detalhado continua disponível na tela de detalhe.

  Todos os 5 arquivos testados localmente: `tsc --noEmit` limpo, navegação e
  CRUD confirmados manualmente pelo usuário em ambiente de desenvolvimento.
  **Teste em produção (Vercel) ainda pendente** — nenhuma das 8 telas de
  Estudos foi validada fora do `localhost` até agora.

  - **2026-08** — Estudos v2: sessão extensa de correção pós-restilização,
  motivada pelo usuário revisando o resultado contra o que havia sido
  originalmente planejado (dois documentos de referência trazidos: rascunho
  original "Módulo Estudos" e uma auditoria prévia "Especificação — módulo
  Estudos" gerada em outra conversa). Diagnóstico: várias decisões da leva
  anterior seguiram estrutura importada do v0.dev/Figma em vez de
  questionar se batia com o domínio real do ENEM — indo contra a regra já
  estabelecida (do v0 só se aproveita visual, nunca lógica/estrutura).

  **Correções de modelagem, em ordem:**
  1. Hierarquia real confirmada por pesquisa (Inep): ENEM tem 4 áreas fixas
     (Linguagens, Humanas, Natureza, Matemática — não a lista solta
     cadastrada antes), cada dia com 90 questões numeradas 1-90 (não
     corrido 1-180), Linguagens/Humanas no dia 1 (1-45/46-90),
     Natureza/Matemática no dia 2, mesma numeração. Redação não é área nem
     matéria — vira tile de navegação separado.
  2. `materia.tipo` perde `'enem'`/`'escola'`, ganha `'academica'`; matéria
     é linha única com `mostra_escola`/`mostra_enem` (booleans) — reverte
     um erro de modelagem cometido e corrigido na mesma sessão (matéria
     havia sido duplicada em duas linhas por engano). Migration `018`
     limpa o dado de teste duplicado em cascata. Ver DEC-040.
  3. Gabarito ENEM reformulado pra 2 fases reais: lançar (grade visual tipo
     cartão-resposta, só a letra, sem matéria) e corrigir (linha a linha,
     matéria+conteúdo+dificuldade+motivo em toda questão, não só erradas).
     `acertou` sempre derivado (nunca campo manual); letra em branco
     detectada automaticamente, nunca escolhida manualmente. Prova ENEM
     também deixou de poder ser criada dentro da tela de Matéria (bug
     encontrado pelo usuário) — só existe em `/estudos/enem`. Ver DEC-041.
  4. `conteudos.progresso` (número solto, "+25%" sem critério) removido,
     substituído por `teoria_vista` (primeiro contato) + `dominado_manual`
     (override); "dominado" de fato é calculado
     (`dominado_manual OR revisao_espacada.repeticoes >= 5`), sem
     duplicar contagem que o SM-2 já faz. Ver DEC-042.
  5. Card "Revisões pendentes" adicionado ao Hub de Estudos — pedido de
     visibilidade rápida do usuário. Pedido de agendamento com
     horário/duração próprio dentro de Estudos foi recusado, por já ser
     escopo do módulo Agenda (reafirma DEC-035). Ver DEC-043.
  6. Redação ganhou upload de imagem (`imagem_path`, bucket novo `redacoes`)
     e `texto` virou opcional — permite registrar a redação com foto da
     folha manuscrita, sem digitar. Campo de observação/correção do
     professor (`comentario`) exposto só na edição, por decisão do
     usuário (normalmente não existe ainda na criação).

  **Migrations executadas:** `017_estudos_gabarito_enem_redacao.sql`,
  `018_materias_unicas_escola_enem.sql`,
  `019_gabarito_dominio_dificuldade.sql` — todas confirmadas pelo usuário no
  Supabase.

  **Arquivos alterados:** `lib/materias.ts`, `lib/conteudos.ts`,
  `lib/questoes-individuais.ts`, `lib/provas.ts`, `lib/revisao.ts`,
  `lib/redacoes.ts` (trocado de chamada direta `sb.storage` pros helpers
  `uploadFile`/`getSignedUrl`/`deleteFile` já existentes em
  `lib/supabase.ts`, por consistência — só percebido depois de ler o
  arquivo real via acesso ao repositório), `app/estudos/page.tsx`,
  `app/estudos/enem/page.tsx`, `app/estudos/enem/[area]/page.tsx` (nova
  rota), `app/estudos/enem/gabarito/[provaUuid]/page.tsx`,
  `app/estudos/escola/page.tsx`, `app/estudos/curso/page.tsx`,
  `app/estudos/curso/[materiaUuid]/page.tsx`,
  `app/estudos/materia/[materiaUuid]/page.tsx`. `npx tsc --noEmit` limpo
  ao final. Teste manual no navegador ainda em andamento pelo usuário no
  momento desta entrada.

  **Mudança de processo relevante:** usuário conectou o repositório
  (`github.com/GabrielGmp13/05-Sistema-Pessoal`) como público — a partir
  desta sessão, Claude pode ler arquivos reais do projeto diretamente via
  clone, em vez de depender exclusivamente de cópia manual colada pelo
  usuário. Reduz risco de assinatura assumida incorretamente.

- **2026-08 (cont.)** — **Auditoria de migração para o Codex e reconciliação
  completa da documentação.** Preparação para adotar Codex CLI como agente
  de execução de código (Claude segue como arquiteto/documentador via chat).
  Codex rodou uma auditoria completa do repositório (estrutura, stack,
  divergências entre documentação e código, estado do Git) sem alterar
  nenhum arquivo. Principais achados e resolução:
  1. **Migrations `004`, `005`, `007`, `010`, `014`, `019` nunca foram
     copiadas para o VS Code** (falha de cópia manual, confirmado pelo
     usuário — não foi perda de dado, todas estavam executadas no Supabase).
     Usuário extraiu um dump real do schema de produção via Supabase CLI
     (`supabase db dump`, exigiu instalar Docker) e forneceu o arquivo
     (`schema_real.sql`). As 6 migrations foram reconstruídas a partir do
     dump e adicionadas de volta a `backend/supabase/migrations/`.
  2. **`015_estudos_v2.sql` e `016_estudos_v2_fase1b.sql` locais estavam com
     conteúdo corrompido** (referências circulares entre tabelas — provável
     colagem incorreta em sessão de chat anterior). Confirmado, comparando
     contra o dump real, que **o banco de produção nunca teve esse
     problema** — só a cópia no repositório estava malformada. Ambos os
     arquivos foram reescritos para bater exatamente com o schema real,
     reordenando a criação de `modulos_curso` para antes do vínculo em
     `conteudos` (a versão corrompida referenciava a tabela antes dela
     existir).
  3. **`DATABASE.md` reconciliado linha a linha contra o dump real:**
     `conteudos` e `questoes_individuais` estavam documentadas de forma
     desatualizada (mostravam `progresso`/`materia_uuid NOT NULL`/`acertou
     NOT NULL` quando o schema real já refletia DEC-041/042 há semanas —
     `materia_uuid` nullable, `acertou` nullable, `letra_marcada`/
     `letra_correta`/`dificuldade` presentes). Dois gotchas novos
     descobertos no dump: `materias.user_id` é a única FK do projeto sem
     `ON DELETE CASCADE`; `materias.tipo` nunca teve `CHECK constraint`.
  4. **`DECISIONS.md` corrigido:** `014` e `015` estavam marcadas "execução
     pendente" havia semanas depois de já confirmadas; DEC-032 estava
     marcada "código pendente" apesar de implementada desde 2026-07-19.
  5. **`ARCHITECTURE.md` reescrito por completo** — descrevia partes da v1
     (HTML puro, `window.sb`, `sm2.js`) como arquitetura atual e afirmava
     "deploy do Vercel ainda não feito" (deploy real é de 2026-07-13).
     Também documentado, por inspeção real do código: nenhuma
     `app/api/**/route.ts` existe ainda; `confirm()` nativo confirmado em 9
     arquivos e 10 ocorrências (não só "algumas telas"); `window.prompt()` confirmado em
     Estudos; SM-2 vive em `lib/revisao.ts` (TypeScript), não `sm2.js`.
  6. **`BACKLOG.md` estava com todo o conteúdo duplicado** a partir da
     metade do arquivo (cópia mais antiga colada junto da versão atual) —
     deduplicado, preservando os 2 itens que só existiam na cópia antiga.
  7. **`ROADMAP.md` corrigido:** cabeçalho da Fase M se contradizia ("EM
     ANDAMENTO" no título, "CONCLUÍDA" no corpo); marcadores de diff (`+`)
     deixados por engano no meio do texto da Fase 7; status de Biblioteca/
     Estudos desatualizado (Fase 4 ainda marcada "EM ANDAMENTO" apesar de
     completa há muito tempo).
  8. **`VISION.md` corrigido:** Dashboard estava marcado "✅ Implementado
     (`index.html`)" — a rota `/` real da v2 é uma tela técnica de
     diagnóstico, não um dashboard funcional (confirmado por inspeção do
     código). Referências a `documentos_estudo` (tabela removida)
     trocadas por `materiais_estudo` (equivalente real em v2).
  9. **`TASKS_NOW.md`, `MODULE_TEMPLATE.md`, `PROJECT_PRINCIPLES.md`,
     `NAMING_CONVENTIONS.md`, `COMMIT_CONVENTIONS.md`, `AI_CONTEXT.md`**
     ajustados pontualmente: caminhos de arquivo corrigidos
     (`backend/supabase/migrations/`, não `supabase/migrations/`;
     documentação em `docs/`, não na raiz), papel de "codificador
     principal" deixou de ser amarrado a uma ferramenta específica
     (Claude + Codex convivendo), status "versão crua" de Estudos
     atualizado para refletir a restilização já concluída, exemplos de
     nome de coluna/tabela trocados para os nomes reais atuais (v1 tinha
     `assunto_uuid`/`documento_uuid`, não existem mais).
  10. **`package.json`** (achado, correção ainda pendente de aplicação):
      dependência `shadcn` não deveria estar listada (é CLI, não lib de
      runtime) e `name` ainda é `"frontend-v2"`. Registrado em
      `TASKS_NOW.md`/`BACKLOG.md` para correção na próxima sessão de código.

  Nenhuma alteração foi commitada diretamente — todos os arquivos corrigidos
  (documentação + 6 migrations reconstruídas + 2 migrations reescritas)
  foram entregues como arquivos completos para o usuário revisar e aplicar
  manualmente, seguindo a disciplina de sempre.

- **2026-08 (reconciliação final)** — Nova conferência independente do
  `schema_real.sql` confirmou 44 tabelas em `public`, todas com RLS, policy
  `user_own_data` e GRANT para `authenticated`; o número 46 era erro manual
  propagado entre documentos, não tabela ausente. Corrigida também a dívida
  de `confirm()` para 9 arquivos/10 ocorrências, os status atuais em
  `DECISIONS.md` e `TASKS_NOW.md`, e a contagem atual de 9 rotas de página em
  Estudos. O dump não inclui o inventário de Storage: a documentação agora
  distingue buckets provisionados em migration, criação manual instruída e
  nomes apenas planejados. Registrado também que as migrations reconstruídas
  refletem o estado final; naquele momento, a cadeia `001`–`019` ainda
  aguardava investigação. A conclusão posterior foi arquivá-la como acervo não
  reproduzível e criar as três baselines timestamped validadas.

- **2026-08-07 (preparação e conclusão local do STOP 3)** —
  Supabase CLI `2.112.0` fixada em um manifesto próprio de ferramentas em
  `backend/`; `backend/supabase/config.toml` criado por `supabase init`, sem
  link ou credenciais de produção. A primeira tentativa de `supabase start`
  foi interrompida por falta de espaço; após liberação de 9 GB e reinício
  limpo do Docker, o stack iniciou. Dois `db reset --local --no-seed`
  consecutivos aplicaram as três migrations sem erro. Testes transacionais
  confirmaram contagens, grants, RLS, guard, cinco buckets, 14 policies e
  isolamento entre usuários/primeira pasta. O dump `public` local ficou
  equivalente ao remoto, exceto por defaults/extensões da plataforma. Nenhuma
  migration foi alterada e nenhuma operação remota foi executada.

- **2026-08-07 (ensaio remoto descartável de adoção do histórico)** — A CLI
  estável `2.112.0` falhou em `supabase link` por incompatibilidade ao validar
  metadados de API keys. Sem fabricar estado de link, o ensaio foi retomado
  por conexão PostgreSQL direta e protegida. `migration list` mostrou três
  migrations locais e nenhuma remota; `migration repair --status applied`
  criou o histórico com exatamente as três versões sem executar baseline. O
  schema de aplicação e os buckets permaneceram ausentes, e `db push
  --dry-run` retornou banco atualizado, sem migrations pendentes. Nenhum dado
  de conexão ou identificador do ambiente descartável foi versionado.

- **2026-08-08 (adoção do histórico de migrations em produção)** — Produção
  foi recapturada por consultas somente leitura imediatamente antes da
  operação: PostgreSQL 17.6, 44 tabelas, 44 PKs, 92 FKs, 15 checks, 42 índices
  explícitos, 44 RLS/policies, cinco buckets, 14 policies Storage e guard de
  RLS equivalentes às baselines. Com histórico remoto inicialmente ausente,
  `migration repair --status applied --db-url` registrou somente
  `20260807000100`, `20260807000200` e `20260807000300`. Nenhum SQL de baseline
  foi executado e os objetos da aplicação permaneceram inalterados. A
  `migration list` final ficou alinhada e `db push --dry-run` retornou
  `upToDate=true`, `dryRun=true`, `migrations=[]`; nenhum push real ocorreu.
  Credenciais e metadata de vínculo não foram versionados. A partir deste
  marco, as três baselines são o início oficial e imutável da cadeia ativa;
  toda mudança futura será migration timestamped incremental (DEC-044).

- **2026-08-08 (handoff Claude → Codex e reprodutibilidade do repositório)** —
  O manifesto do frontend deixou o nome residual `frontend-v2`, a dependência
  de CLI `shadcn` sem lock foi removida e os lockfiles permaneceram sem upgrade
  oportunista. Node.js `24.15.0` e npm `12.0.1` foram fixados; `.env.example`,
  README raiz, README do frontend e CI mínima sem segredos foram adicionados.
  Uma instalação limpa adicionou 380 pacotes; typecheck e build passaram, com
  18 páginas de aplicação reconhecidas. Cinco warnings triviais de imports
  não usados foram corrigidos; o lint final mantém 43 achados em 33 arquivos
  (28 erros e 15 warnings) e permanece informativo na CI. Não há
  testes automatizados de frontend; a validação SQL local da baseline continua
  sendo a suíte existente. Foram removidos cinco SVGs padrão do Next e o CSS
  inicial órfão, todos sem referências. Nenhuma migration, snapshot, código de
  produto ou ambiente remoto foi alterado.

## 2026-08-21 — fechamento funcional seguro da v2.1

Finanças ganhou parcelamento e recorrência mensal finitos; Biblioteca recebeu capa privada nas oito categorias e metadados Open Graph seguros para Artigos; a extensão Manifest V3 abre Artigo/Vídeo pré-preenchido sem acessar sessão; BRAPI ganhou cache curto; seis testes Node iniciam a cobertura automatizada. Integrações Google foram auditadas nas fontes oficiais e permanecem sem UI de conexão falsa até haver armazenamento cifrado de refresh token.

A migration `20260821000100_biblioteca_capas_storage.sql` passou reset e 15 testes SQL, foi a única listada no dry-run remoto, foi aplicada em produção e teve colunas, bucket privado, limite de 3 MB, MIME types, policies, histórico e dry-run final vazio confirmados.
## 2026-08-30 — Cadastro completo de Anime no mesmo fluxo

- Corrigido o contrato AniList: IDs e links de AniList e MyAnimeList deixam de
  ser misturados no preenchimento automático.
- Criação mantém o modal aberto depois do primeiro salvamento para configurar
  temporadas, openings/endings, complementos e ordem de consumo.
- Temporadas e complementos passam a pesquisar relações da própria obra na
  AniList; músicas combinam YouTube com Apple Music/iTunes.
- Cards exibem nomes original/traduzido e siglas calculadas, e dubladores deixam
  de aparecer somente no cadastro de Anime.
- Temporadas e complementos passam a preservar a obra externa selecionada, a
  equipe técnica é preenchida pela AniList, músicas aceitam trilha sonora e a
  ordem de consumo ganha edição visual em linha do tempo.
- Busca parcial ganha Kitsu como autocomplete e percorre a cadeia de relações
  AniList; dublagem some do painel, campos gerais viram derivados e os seletores
  de obras vinculadas passam a confirmar seleção e exibir falhas de salvamento.
