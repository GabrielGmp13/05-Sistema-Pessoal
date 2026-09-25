# Tarefas atuais — preparação funcional da versão 2

**V2.2 local em 2026-09-25:** o plano de `TASK_V2_2_DESEMPENHO.md` foi aplicado
ao gargalo medido. Bootstrap de tema é nativo; Início caiu de 16 operações
fixas para cinco essenciais e não consulta cômodos pausados; perfil/sessão e
módulos ocultos são compartilhados; relógio foi isolado; navegação não espera
360 ms/2,45 s; mídia externa usa decodificação assíncrona. Validação: 155 testes,
typecheck, lint e build de 49 páginas aprovados; QA local recarregou Lua sem
flash lógico, divergência de classe ou aviso de hidratação. Falta concluir
commit/push, CI, deploy e smoke publicado desta rodada.

**Atualização em 2026-09-25 (V2.1):** Idiomas, Projetos, Programação e Diário
(incluindo Saúde, Finanças, Lugares e Receitas) foram pausados centralmente:
sumiram de navegação/Início e as URLs autenticadas exibem tela de pausa, sem
apagar código, dados ou schema. A reativação futura é centralizada em
`lib/modulos-pausados.ts`. O catálogo V3 de telas transversais, incluindo 404,
erros, rede e integrações, está em `V3_CATALOGO_DE_TELAS.md`; não implementar
essas telas antes da V3. Validação local deste lote: 150 testes Node,
typecheck, lint e build de produção aprovados.

**Correção do smoke publicado:** a tentativa de sincronização Calendar vista no
Início vinha do componente legado ainda montado no layout global. A montagem
foi removida e ganhou teste de escopo; a Agenda continua sincronizando uma vez
ao abrir ou quando a pessoa usa o botão manual. Commit `547889b` passou em CI,
Vercel e smoke autenticado; o Início ficou sem tentativa global no console.

**Atualização em 2026-09-25:** D03/D06/E08 foram implementados no candidato:
avisos opt-in do navegador para descanso e revisões, reagendamento da revisão
original pela Agenda (Arquivar fica em Revisão) e Calendar somente na abertura
da Agenda ou em Atualizar. Testes Node (147), typecheck, lint e build de 49
rotas passaram. I05 foi aplicada em produção após a credencial ser renovada:
precheck, dry-run exclusivo, histórico, função invoker, RLS/GRANTs e dry-run
final passaram. Cards do catálogo seguem fora da função. Próxima fase é a
revisão V2.1 de navegação/visibilidade, preservando dados e rotas.

**Publicado em 2026-09-24:** lote funcional parcial nos commits `c862edb`,
`dde129e` e `af05990` em `main`; CI e deploy Vercel de `af05990` aprovados.
Smoke público de login, proteção da rota Treino/Cardio e recusa de exportação
sem sessão aprovado. O PDF avulso do usuário não entrou no Git. A V2 ampliada
continua aberta pelos itens D/E de `TASK_V2_FECHAMENTO.md` e pelos retestes
indicados abaixo; não iniciar redesign como se todos estivessem encerrados.

**Atualização prioritária 2026-09-24:** conexão resolvida; migrations
`20260917000100`/`00200`/`00300` aplicadas em produção por ritos isolados,
com histórico, RLS/GRANT e dry-run final conferidos. A `00100` não altera
cards do catálogo.
UI nova de avaliações/anuladas, versões/avaliações de redações e tentativas
ENEM integrada localmente; validação autenticada em andamento. As falhas de
credencial abaixo são histórico, não bloqueio atual. Cursor: `RETOMADA_V2.md`.

**Conferência final mais recente:** 147 testes Node, typecheck, lint e build
de produção com 49 páginas passaram. Foto histórica de redação abriu por URL
assinada na conta dona (200), não foi assinada por outra conta (400) nem aberta
bruta sem sessão (400).
A migration de reordenação da Biblioteca foi aplicada; a UI atual ainda não
chama sua função. Upload, exibição e abertura histórica da foto privada
de redação passaram localmente; falta ensaio visual completo em produção.
O inventário de decisões e dependências ainda aberto segue em
`TASK_V2_FECHAMENTO.md`; não declarar a V2 100% concluída por essa rodada.

QA autenticada em Docker local: avaliações/média e anuladas persistiram;
ENEM preservou duas tentativas, correção e catálogo com redação após recarga;
Treino bloqueou segunda aba, restaurou série/descanso após recarga, finalizou
e marcou compromisso de hoje feito; falta de ontem pôde ser corrigida.
Nubank OFX e CSV sintéticos passaram pela UI, com pagamento de fatura excluído,
compra/estorno persistidos e bloqueio de reimportação. Nenhum arquivo bancário
real foi fornecido. Versões de redação, uploads privados e isolamento também
foram cobertos localmente; a matriz completa em produção continua pendente.

Reinícios do ambiente encerraram serviços locais, não os dados persistidos.
Rodar lint/build sem Docker/dev simultâneos em máquina de 8 GB. Checkpoint
temporário: `tmp/RETOMAR_FECHAMENTO_V2.md`, ignorado pelo Git. Próximo passo:
concluir gates do candidato, reconciliar o inventário e revisar entrega autorizada.

Continuação 2026-09-23: leitura por acréscimo/posição absoluta implementada
localmente; Nubank invalida prévia antiga e valida proprietário ao gravar;
Finanças ganhou análise mensal/categorias dos próprios lançamentos. 141 testes
aprovados. Homologação autenticada ainda pendente. `ROADMAP.md` foi reconciliado
com a ordem funcional → validação/publicação → redesign → V3.
Vídeo assistido agora conclui teoria das aulas vinculadas, com mensagem de
falha parcial e reenvio (DEC-087); homologação autenticada pendente.

**Próxima ação:** seguir `RETOMADA_V2.md` e `TASK_V2_FECHAMENTO.md`: fechar
somente escolhas funcionais que Gabriel definir e executar os ensaios reais
restantes. Nubank conta/fatura já passou com massa sintética, lint/build e
publicação; ainda requer arquivo anonimizado real para cobrir variações do
banco. Não reaplicar migrations já aplicadas.

**Encaminhamento único vigente:** `TASK_V2_FECHAMENTO.md` reúne todas as
pendências I01–I10, escolhas D01–D22, dependências E01–E14, migrations e gates
de homologação/publicação. As notas cronológicas abaixo são evidência, não uma
segunda lista para somar ou uma declaração de V2 concluída.
Decisões desta conversa: PDF no navegador sem editor interno na V2; caderno
digital futuro sem versão definida; Treino com falta automática após o dia
agendado e sem troca de aparelho na mesma sessão; metas de estudo na V3;
revisões editáveis pela Agenda sem duplicar fonte. Detalhes ainda abertos de
falta/Agenda/vídeo estão discriminados no documento único.

## Histórico de retomadas anteriores

As seções abaixo são evidência cronológica. O estado vigente está no topo e em
`RETOMADA_V2.md`; não usar trechos sobre migrations somente locais, UI antiga
ou ausência de commit/push como tarefas atuais.

### Prioridade registrada em 2026-09-16

### Continuação de 2026-09-17

- I01/I02: migration incremental `20260917000300` criada **somente local**.
  Prepara identidade estruturada ENEM, tentativas independentes com prazo,
  rascunho, controle de versão e histórico protegido; versões e avaliações de
  redação com nota oficial separada. Não altera tentativas legadas nem dados
  remotos. O frontend ainda usa o fluxo antigo até aplicação autorizada e
  conferência do schema de produção. Falta concluir UI, transição de legado,
  testes de ponta a ponta e homologação; não declarar I01/I02 concluídos.
  Reset completo e 26 scripts SQL locais aprovados, inclusive tentativas,
  concorrência, RLS de duas contas, versões imutáveis e exclusão em cascata da
  conta. Nenhuma migration aplicada remotamente.
- I07: retomada de Treino agora detecta exercício ausente no plano tanto no
  rascunho local como em execuções já salvas; preserva dados e bloqueia
  finalização até restauração. Reenvio da finalização confirma se a sessão já
  fechou sem mudar o horário final. Resta D02 (regra para duas abas/aparelhos),
  recuperação de gravação parcialmente incerta e homologação autenticada.
- Guia de escolhas `V2_ESCOLHAS_POR_TOPICO.md` detalha estado/opções de D01–D21
  e E01–E13, sem transformar implementação definida em pergunta.
- Validação desta rodada: 134 testes de frontend, typecheck, lint e build de
  49 páginas passaram. Não houve homologação autenticada da UI nova, commit
  nem push; o PDF de amigos não foi incluído em stage.

- I04 em execução: migration local `20260917000200` prepara lançamentos de
  nota, média ponderada normalizada e anuladas de simulados, sem converter
  `provas.nota` nem duplicar uploads. Reset e 25 scripts SQL aprovados. UI ainda não
  integrada por schema-first; aplicação remota não autorizada.
  Reset apagou apenas as duas contas e matérias fictícias locais; nenhuma
  credencial foi salva no repositório. Não usar a antiga sessão local sem
  recriar a massa de testes. Próximo passo de I04: autorização específica para
  precheck/dry-run/aplicação exclusiva desta migration, preservando Biblioteca local.

- Retomada autenticada LOCAL (histórico): renomear/retirar/reincluir matéria aprovados;
  nome personalizado e rótulo Faculdade persistiram ao reabrir. Matemática
  retirada da Faculdade continuou acessível no ENEM; seed não recriou AO.
- Gravação acadêmica incerta agora bloqueia reenvio até atualizar os dados,
  sem alegar que uma requisição falha necessariamente não foi salva.
- Falha simulada desligando somente REST local: formulário preservado, reenvio
  bloqueado, atualização sem conexão mantém trava; após restaurar serviço,
  atualização libera edição. Nome duplicado foi recusado na interface.
- Aviso de semântica no link de revisão do hub corrigido (`nativeButton=false`).
- 133 testes Node, typecheck, lint completo e build final de 49 páginas aprovados.
  Último ajuste do link também passou lint direcionado. Testes de arquivos não executados:
  Storage local falhou ao iniciar; Auth/REST/banco ficaram disponíveis sem ele.
  Nenhum dado de produção alterado. Duas contas fictícias: API autenticada
  recusou leitura/alteração cruzada de matéria e manteve rótulos independentes.
  Troca de contas pela interface não concluída: após reiniciar o servidor,
  navegador bloqueou controle da aba presa na página de conexão recusada.
  Próximo passo: I01/I02/I04 (modelo incremental local de Estudos) e restante
  de I08; não interpretar esses itens como falta de definição do usuário.

- Escola/Faculdade: CRUD de contexto e rótulo por conta implementados localmente
  (DEC-083); ENEM/histórico preservados e seed não repõe matérias personalizadas.
- Temporadas: edição ampliada dos metadados de anime, mantendo identidade,
  episódios e nota pessoal; séries incluem nota IMDb/data de conclusão.
- ENEM: gráficos de resultados/motivos e percentuais com denominador explícito,
  ocultos durante modo de prova; respostas bloqueadas ao vencer prazo.
- Reordenação Biblioteca (histórico): antes da autorização de 2026-09-25, a
  migration estava somente local. Hoje ela está aplicada, e nenhuma UI ainda
  depende dessa função.
- 131 testes Node, typecheck, lint e build aprovados; 24 scripts SQL locais
  aprovados. Homologação autenticada continua pendente; preparando ambiente
  local com dados fictícios, sem alterar contas dos amigos.
- Continuar funcionalidades já definidas; não devolvê-las como decisões de produto.

### Triagem individual solicitada

Consultar `V2_DECISOES_PENDENTES.md`: I01–I09 são implementação/validação
restante, D01–D21 precisam de escolha funcional e E01–E13 dependem de serviço,
ambiente ou operação. Não adiar itens por silêncio nem declarar a v2 pronta.
Nesta rodada: som opcional no descanso (página aberta), nota de temporada em
estrelas e confirmação de remoção de planejamento. 122 testes, typecheck,
lint e build de 49 páginas aprovados. Homologação autenticada pendente:
navegador acessível sem aba do site. Sem commit/push.

Escopo atualizado por Gabriel: Hábitos, Metas e Arquivos adiados para v3,
com especificação futura após o lançamento da v2. Manter custo zero;
integrações indisponíveis ficam bloqueadas, não concluídas. Demais pendências
da v2 permanecem em `TASK_V2_IMPLEMENTACAO.md`.

### Ampliação local após Treino

- Retomada adicional: temporadas de anime com edição de número/episódios,
  nomes e sinopse; preserva vínculos/progresso. Remoção agora exige modal,
  erros de leitura/gravação são exibidos e edição filtra conta e registro ativo.
  Homologação autenticada e edição dos demais metadados ainda pendentes.
- Validação desta retomada: 122 testes Node, typecheck e build aprovados;
  lint terminou sem achados. Nenhum commit/push nesta rodada.

- Biblioteca: edição de elenco, trilhas, temporadas de séries, volumes e
  OP/ED/OST de anime; remoção com confirmação e preservação dos vínculos.
- Saúde: tendências de 7/30/90 dias para sono, copos de água e humor, sem
  preencher dias ausentes ou produzir avaliação médica.
- ENEM: relógio opcional em blocos de 30 minutos, derivado do prazo existente.
- Configurações: seleção dos atalhos da navegação e lista de módulos do Início,
  persistida por conta; não bloqueia rotas nem elimina dados/resumos. Exportação
  inclui a preferência e usa os nomes atuais dos campos de perfil.
- 120 testes Node, build de 49 páginas e lint sem achados aprovados na retomada.
  Este lote continua local e em validação; não representa todas as ideias da
  v2 concluídas. Publicação autenticada disponível para consulta, mas não
  comprova o funcionamento do candidato local. Nenhum commit/push executado.

### Estado do primeiro lote

Gabriel incluiu todas as ideias futuras no escopo da versão 2. Execução em
`TASK_V2_IMPLEMENTACAO.md`; inventário de redesign em `TASK_V2_DESIGN.md`
(39 páginas atuais, revisão visual ainda não iniciada). Commit e push foram
autorizados após o fechamento das pendências; não houve publicação nesta rodada.
O objetivo integral ainda está incompleto e não deve ser anunciado como pronto.

Primeiro lote: migration `20260915000100` aplicada em produção após dry-run
exclusivo e autorização. Pós-check confirmou histórico, três colunas, função
invoker e execução somente para authenticated; dry-run final vazio. Evidência
local: reset e 23 scripts SQL aprovados (105 checks/quatro funções).
Frontend local integrado: edição de planos/exercícios, grupos, instruções,
reordenação transacional e volume semanal. Academia inicia explicitamente,
retoma sessão aberta e guarda rascunho por conta/sessão neste navegador; IDs
persistidos antes do envio. Não é sincronização de rascunho entre dispositivos.
114 testes Node, typecheck, lint e build (49 páginas) aprovados. Próxima ação: homologar UI local
autenticada, recuperação/reenvio e isolamento; depois continuar os demais
itens de `TASK_V2_IMPLEMENTACAO.md`. O navegador acessível não conserva a
sessão autenticada informada pelo usuário; não extrair cookies de outra sessão.

As seções abaixo preservam a evidência anterior da preparação da v1.

Atualizado em 2026-09-11. A versão publicada continua **0.2.0**. A 1.0.0 é o
próximo marco planejado, ainda sem autorização de abertura pública.

## Base já concluída

- [x] Aplicação publicada e protegida por autenticação.
- [x] Cadastro, confirmação, recuperação e login Google implementados.
- [x] Signup público fechado em duas camadas; CAPTCHA ativo.
- [x] Suporte com bugs, sugestões, protocolos, histórico e prints privados.
- [x] Isolamento entre duas contas validado em frontend, APIs, banco e Storage.
- [x] Exportação e ensaio de exclusão de conta.
- [x] Agenda/Calendar e YouTube separados por serviço e usuário.
- [x] Imagens novas otimizadas de forma conservadora.
- [x] Responsividade: coluna fixa desde 1024 px e menu abaixo disso.
- [x] Homologação de 2026-09-09 encerrada e massa de teste removida.
- [x] Instalação limpa, 106 testes Node, typecheck e build aprovados.
- [x] Reset local e 22 testes SQL aprovados na última recertificação de banco.

## Rodada local — Treino (2026-09-15)

- [x] Painel ganhou evolução de peso e de carga por exercício, ambos em SVG
      nativo, além do resumo semanal de cardio.
- [x] Página dedicada de Cardio consolidou distância, duração e atividades
      concluídas, com tendências diárias sem nova tabela.
- [ ] Reordenação transacional integrada após migration aplicada; homologar
      as setas de força/cardio, limites e falhas de conexão na conta de testes.
- [x] Academia trata sessão expirada/falha de carregamento, confirma saída pelo
      botão local e identifica carga/repetições/cardio para leitores de tela.
      A finalização verifica se a sessão foi efetivamente atualizada.
- [x] Build aprovado com 49 páginas geradas; typecheck, 112 testes Node e lint passaram
      na retomada. Evidência SQL local: 23 scripts aprovados.
- [ ] Revisar visualmente os gráficos e o fluxo Academia na sessão autenticada
      local. Commit/push já autorizados por Gabriel após conclusão do escopo.
- [ ] Volume por grupo muscular implementado localmente, com paginação da
      semana e separação de séries/carga × reps; homologar junto a Cardio.

## Gates da 1.0.0

1. [x] Gabriel definiu lançamento controlado para uso pessoal e amigos; signup
       público permanece fechado nos primeiros meses.
2. [x] Escopo do piloto congelado; expansões estão no `BACKLOG.md` e em
       `EVOLUCAO_ESTUDOS_EDITORES.md`.
3. [x] Resolver ou aceitar formalmente:
   - [x] Google Places fica desativado na v1.0.0 por decisão de custo zero;
     Lugares continua com cadastro manual, capa e link externo.
   - [x] validação publicada de Anime/Mangá após enviar o media type exigido
     pela Kitsu; `attac` retornou Attack on Titan nas duas categorias;
   - gestos touch sem teste manual físico (adiados por Gabriel); ENEM completo
     será testado pessoalmente por Gabriel e não bloqueia mais o piloto;
   - [x] smoke publicado da CSP/headers e controles automatizados de segurança;
     CAPTCHA interativo fica fora do gate enquanto signup público estiver fechado.
   - [x] atualização de segurança autorizada: Next.js e `eslint-config-next`
     16.3.3, `sharp` 0.35.4 e `baseline-browser-mapping` 2.11.21 no
     lockfile. `npm audit --omit=dev` encerrou com 0 vulnerabilidades após
     `npm ci`; nenhuma publicação foi feita.
   - [x] Logs brutos de Treino, Shape, gêneros e componentes globais substituídos
     pelo registrador sanitizado, com teste de regressão.
   - [x] Lint completo reduzido de 25 erros/29 avisos para **0 erros/0 avisos**,
     sem supressão global de regras.
   - [x] Regressões locais: CSP permite scripts/frames do CAPTCHA; termos não
     bloqueiam privacidade, ajuda e recuperação. Testes adicionados, smoke
     autenticado da publicação ainda depende da etapa autorizada.
   - [x] Manifesto do frontend declara ESM, eliminando os avisos de
     reinterpretar testes TypeScript como módulos.
4. [ ] Manter documentados os gates de cadastro público (SMTP/domínio, OAuth
       publicado/verificado, limites, templates, retenção e incidente) para
       uma decisão futura; eles não bloqueiam este piloto controlado.
5. [x] Aviso de privacidade revisado; termos com aceite obrigatório publicados,
       aceitos com autorização e persistência confirmada.
6. [x] Rodar bateria final limpa e smoke do candidato, preservadas as exceções
       explicitamente adiadas (ENEM completo e dispositivo físico).
7. [ ] Somente então mudar a versão para `1.0.0` e gerar notas.
8. [x] Com autorização separada: commit, push, deploy e smoke.
9. [ ] Observar por 24 horas e 7 dias; fechar signup diante de P0/P1.

## Rodada local para convidados — 2026-09-10

- [x] Link externo do MEC Enem em Registrar redação, com nova aba protegida,
  aviso de avaliação estimada por IA e ausência de envio automático de dados.
- [x] Places bloqueado no servidor antes de ler chave/chamar Google e busca
  oculta na interface; cadastro manual preservado. A decisão anterior estava
  somente documentada, não era um bloqueio explícito no código.
- [x] Busca de metadados descarta respostas canceladas e limpa resultados ao
  mudar termo/fonte/filtros; imagem de redação acompanha o caminho atual.
- [x] Carregamentos iniciais de Estudos e Projetos ignoram respostas após sair;
  tarefas são filtradas pelo projeto selecionado, sem exibir as de outro projeto.
- [x] Aceite de termos mantém botão ocupado até atualizar a sessão e trata falha
     inesperada; ícone de Configurações identificado como decorativo.
- [x] 103 testes Node, typecheck e build de 48 páginas aprovados. Lint atual:
  **8 erros e 27 avisos** (antes desta rodada: 16/29). Nenhuma regra desativada.
- [x] Restante de efeitos e imagens resolvido; lint final 0/0.
- [~] Recuperação administrativa para amigo fora da equipe está documentada;
  executar somente quando houver um pedido real e identidade confirmada.
- [x] Revisão final de diff/segredos, validação visual, publicação e smoke.

“Acesso full” foi recebido como autonomia de trabalho; não foram executadas
operações remotas, mudança de versão, commit ou push nesta rodada. A meta de
abrir hoje não significa que o gate operacional já foi aprovado.

## Candidato autorizado para publicação — 2026-09-10

Gabriel autorizou commit e push e pediu retestes após publicação. Validação:
106 testes Node, typecheck/build aprovados, audit de produção zero, lint
**0 erros/0 avisos**. Corrigidos os efeitos remanescentes de carregamento e
sincronização de formulários; conteúdo dos módulos de Curso carrega em paralelo.
Os 10 avisos de dependências foram corrigidos e as 15 imagens variáveis foram
centralizadas com justificativa local, sem desativação global de regras.
O roteiro específico está no topo de `teste.md`; convite/recuperação e recursos
físicos continuam dependentes de autorização/ambiente. Não anunciar v1 pronta.

## Próxima ação exata

### Estado que substitui a triagem histórica abaixo

- [x] Código publicado em `cc2ccde` e ajuste de latência em `bbfb166`.
- [x] 106 testes Node, typecheck e build aprovados. Lint completo:
  **0 erros/0 avisos**, sem supressão global de regras.
- [x] Termos: bloqueio antes do aceite, privacidade acessível, aceite autorizado
  registrado e persistência confirmada. CSP/headers/APIs sem sessão aprovados.
- [x] Link MEC Enem e Places manual conferidos na publicação; importação de
  artigo/vídeo abriu campos corretos, sem salvar registros.
- [x] Anime/Mangá: espera redundante corrigida e causa do vazio confirmada. A
  Kitsu exige `Accept: application/vnd.api+json`; commit `c81c727` publicado
  com CI/Vercel aprovadas e `attac` retornou Attack on Titan nas duas categorias.
- [x] Registro isolado `calendar/sincronizacao-automatica` triado: a requisição
  correspondente retornou 200 no Vercel e o erro não reapareceu na sessão final.
  Sem regressão reproduzível ou perda; reabrir somente se houver recorrência.
- [x] ENEM completo adiado por decisão de Gabriel, que fará o teste durante o
  uso. Não repetir sem regressão concreta. Recuperação perdida segue manual.
- [~] Acesso de amigos: painel permite criar usuário com senha temporária e
  auto-confirmação; formulário de troca de senha está publicado e visível.
  Falta somente executar o ciclo com a primeira conta real, sem criar usuário
  durante a homologação técnica.
- [~] Primeiro ciclo de amigo, recuperação perdida e observação operacional
  permanecem para o uso real. Testes físicos continuam adiados. A mudança do
  número para 1.0.0 ainda exige autorização específica.
- [x] Guia para amigos ampliado com exemplos, login Google, três capturas
  públicas sem dados da conta e versão PDF visual em `output/pdf/`.
- [x] Guia para amigos e PDF destacam o estado beta e identificam Programação,
  Projetos, Finanças e Saúde como áreas ainda em planejamento.

### Triagem histórica (não representa o estado atual)

Triagem anterior de 2026-09-10: os 16 erros/29 avisos eram de análise estática, não de
console em produção. Os 16 erros pertencem à regra `set-state-in-effect`;
os avisos são 12 de dependências de efeitos, 15 de imagens nativas, um de
variável não usada e um falso positivo de `alt-text` sobre ícone Lucide `Image`.
Priorizar efeitos com risco de estado desatualizado, sobrescrita de formulário
ou resposta assíncrona atrasada; não confundir severidade configurada com
gravidade funcional. Recomendações de imagem podem ser aceitas caso a caso,
preservando imagens privadas/GIFs/custo zero. Não houve aceite global da dívida
nem alteração das regras de lint. Não exigir console vazio como critério de
release: falhas reais, perdas de dados e segurança continuam bloqueantes;
ruído externo conhecido e otimizações precisam de classificação, não de
correção cega. Esta rodada não alterou código nem repetiu homologação.

Revisar os efeitos prioritários, depois preparar a recuperação manual
privada sem SMTP pago e validar os termos no candidato. Não há autorização de
operação remota. Requisitos novos do ENEM, Escola/Faculdade e editores em
[EVOLUCAO_ESTUDOS_EDITORES.md](EVOLUCAO_ESTUDOS_EDITORES.md); notificações,
módulos opcionais e teste físico de acessibilidade continuam para depois.
MEC Enem gratuito confirmado; integração automática sem API pública confirmada
fica fora do compromisso da v1. Link externo implementado localmente; múltiplas
avaliações e importação de notas ainda não implementadas.
Congelar a inclusão de expansões na v1 antes de implementá-las. Plano:
[RELEASE_V1.0.0_PLAN.md](RELEASE_V1.0.0_PLAN.md). Evidência já concluída:
[teste.md](teste.md).

## Limites preservados

- Operação gratuita; nenhum custo recorrente sem aprovação.
- Nome provisório “Projeto Pessoal”; sem telefone público.
- Um e-mail operacional privado: `sistemapessoa007@gmail.com`.
- Sem painel admin público e sem compartilhar acesso Supabase/Vercel.
- Saúde, Finanças e demais módulos continuam disponíveis; cada pessoa escolhe
  o que usar e inserir. O site não é serviço médico ou financeiro.
