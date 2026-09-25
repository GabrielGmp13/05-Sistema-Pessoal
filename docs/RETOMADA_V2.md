# Retomada operacional — 2026-09-24

> **V2.2 publicada em 2026-09-25:** commit `79dce60` elimina o flash de tema
> com bootstrap nativo, reduz as operações fixas do Início de 16 para cinco,
> compartilha sessão/perfil no shell, isola o relógio e remove espera artificial
> antes da navegação. 155 testes, typecheck, lint, build de 49 páginas, CI,
> Vercel e smoke público/autenticado aprovados. Detalhes em
> `TASK_V2_2_DESEMPENHO.md`; DEC-093.

> **Correção complementar V2.2:** F5 repetido revelou que o `ThemeProvider`
> ainda desfazia `.dark` durante a hidratação. O provider agora espera a leitura
> local antes de escrever classes. O Início reutiliza resumo de cinco minutos
> por conta/aba e revalida no Supabase; logout limpa e Atualizar ignora o cache.
> 157 testes, typecheck, lint e build passaram. Commits `b075da2`/`442b94e`,
> CI e Vercel aprovados; 15/15 recargas escuras, sem erros. A sessão ainda
> antecede o cache em 1,4–2,1 s; medir agregação/SSR no próximo lote.

## Atualização em 2026-09-25 — I05 aplicada isoladamente

Na V2.1, Idiomas, Projetos, Programação e o conjunto Diário foram retirados da
superfície sem apagar dados: navegação/Início não os oferecem e URLs mostram
“cômodo em pausa”. A lista central está em `frontend/lib/modulos-pausados.ts`.
O inventário V3 de 404, erros, rede, permissões e estados transversais está em
`docs/V3_CATALOGO_DE_TELAS.md`; é planejamento, não código desta rodada. O
lote passou em 150 testes Node, typecheck, lint e build de produção.

No primeiro smoke autenticado após a publicação, o console mostrou que o
sincronizador legado do Calendar ainda rodava no Início. A montagem global foi
removida em correção posterior; validar que o Início não consulta/importa o
Calendar e que a Agenda mantém sincronização na abertura e no botão manual. O
reteste publicado do commit `547889b` confirmou ambos, sem logs no Início;
CI/Vercel passaram.

O reset local e o teste transacional da reordenação de Biblioteca passaram:
elenco, trilha e OP/ED são reordenados dentro de uma obra, com concorrência e
isolamento cobertos; cards do catálogo não são alvo. Com a credencial renovada,
o precheck e dry-run listaram exclusivamente I05; a aplicação e o pós-check
confirmaram histórico, invoker, `search_path` seguro, RLS/GRANTs e dry-run
final vazio. As migrations 00200/00300 não foram reaplicadas.

O candidato ganhou avisos opt-in de navegador para Treino/Revisão, reagendamento
da data original da revisão pela Agenda e sincronização Calendar somente ao
abrir a Agenda ou usar Atualizar. Testes 147/147, typecheck, lint e build de 49
rotas passaram. Próxima ação: iniciar a revisão V2.1 de navegação/visibilidade
preservando dados, depois retomar QA autenticada/publicação e o redesign Astra.
Não incluir o PDF avulso no Git.

## Validação mais recente — 2026-09-24

Publicação funcional parcial: commits `c862edb`, `dde129e` e `af05990`
enviados a `main`; CI concluiu com sucesso e Vercel marcou deploy de produção
como `success` para `af05990`. Smoke público: `/login` 200,
`/treino/cardio` 307 para login sem sessão e exportação privada 401 sem sessão.
Isso **não** significa V2 integral concluída: escolhas D/E, QA física/arquivos
reais permanecem em `TASK_V2_FECHAMENTO.md`.
`guia-amigos-sistema-pessoal.pdf` solto na raiz ficou fora do stage.

Rerun do Storage local após reiniciar Docker: foto atual da redação está vazia,
versão 3 preserva o path, conta dona gera URL assinada e abre JPEG (200),
segunda conta não consegue assinar (400), acesso bruto sem sessão falha (400).
O primeiro 404 do ensaio veio de compor manualmente o prefixo incorreto na URL
REST; com `/storage/v1` a URL assinada abriu. Este teste não substitui
homologação visual do link no site de produção.

Rodada final desta continuação: typecheck, **147 testes Node** e lint completo
aprovados; build de produção com 49 páginas aprovado. A inspeção do código confirmou que nenhuma
tela chama `reordenar_lista_biblioteca`: a migration `00100` pode permanecer
não aplicada em produção sem impedir os editores atuais. A QA local de foto
comprovou o upload e a exibição da imagem privada, e o histórico passou no
reteste acima. Não inferir aprovação de arquivo Nubank
real a partir dos arquivos sintéticos.

Rodadas anteriores de testes (146 Node) são histórico, não substituem a
validação acima. Os gates de escopo/QA ainda estão abertos.

QA autenticada local já comprovada: avaliações e simulados com anuladas após
recarga; ENEM com duas tentativas independentes, correção (1/1 e 0/1), catálogo
da segunda com redação e recarga; falta de ontem corrigida; Academia bloqueia
segunda aba, restaura série e descanso após recarga, salva sessão e conclui
compromisso único de hoje na Agenda. OFX sintético importou mercado e Pix,
excluindo pagamento da fatura. CSV parou por mês da fatura vazio no formulário;
conferir valor real após preenchimento antes de abrir arquivo. Não é falha
confirmada do parser. Arquivos fictícios em `tmp/qa-nubank.*`.

Restam QA de CSV/deduplicação, histórico de redações após edição, uploads,
leitura, duas contas e recortes visuais. Docker/dev foram desligados por
reinício externo; dados persistiram antes. Restaurar sem reset e sem repetir
produção. Datas/estados antigos abaixo são histórico, não novos bloqueios.

## Histórico da execução anterior

As seções abaixo preservam o caminho até o estado vigente acima. Não usar seus
trechos sobre credencial, migrations locais, ausência de publicação ou testes
pendentes como instrução atual.

### Cursor que levou à aplicação do SQL

`20260917000200` e `20260917000300` foram aplicadas em produção nesta
continuação, com precheck/dry-run exclusivo e dry-run final vazio. RLS/CRUD
authenticated/recusa anon confirmados nas quatro tabelas. Biblioteca continua
local. Não repetir aplicação; os parágrafos antigos abaixo são históricos.
CLI `db query` aceita uma instrução por chamada: precheck agora é um único DO;
regex do script foi corrigida para reconhecer versão antes de underscore.

Frontend adicionado: avaliações/média ponderada e anuladas sem SM-2 quando
não houver válidas; histórico/avaliações pessoais/nota oficial de redações;
tentativas ENEM independentes em `?modo=prova`, prazo no servidor, gravação por
resposta com versão, encerramento/catálogo/vínculo de redação e refazer sem
limpar questões legadas. Fotos anteriores preservadas. Typecheck/lint passaram;
143 testes passaram antes do lote final de ENEM. Necessário testar candidato
atual; não declarar UI homologada. Servidor dev iniciado na porta 3100;
Docker Desktop iniciado para recuperar Supabase local. Sem commit/push ainda.

## Atualização prioritária — autorização recebida

Gabriel autorizou explicitamente precheck/simulação/aplicação isolada de
`20260917000200` e `20260917000300`. **Não pedir autorização novamente.**
Este bloco é histórico: em 2026-09-25, a Biblioteca `20260917000100` foi
aplicada isoladamente após credencial renovada, com precheck, simulação e
pós-check aprovados. `00200`/`00300` não foram reaplicadas. A conexão
`SUPABASE_DB_URL` foi conferida contra o projeto esperado; o 28P01 descrito
abaixo ocorreu antes da renovação da credencial.
é necessário atualizar a credencial no ambiente, sem registrar no Git/chat.

Docker iniciado; reset local completo e 26 scripts SQL aprovados novamente.
`backend/scripts/v2-academico.ps1` prepara cadeia temporária isolada e oferece
modos Precheck/Simular/Aplicar; sintaxe validada, execução remota pendente da
credencial. `backend/supabase/prechecks/v2_academico.sql` é somente leitura.
Não executar UI dependente de schema remoto antes de pós-check bem-sucedido.

D02: proteção entre abas implementada em `TravaEdicaoTreino.tsx`, montando
Academia somente após obter trava por usuário/treino. Segunda aba fica
bloqueada antes de ler/gravar rascunho; troca de conta encerra edição. Falta
homologar duas abas, recarga, fechamento e navegadores físicos.

Validação após a trava: 141 testes Node, typecheck, lint direcionado e build
de 49 páginas aprovados. Nenhum commit/push nesta continuação; V2 ainda não
fechada. Próxima ação externa: atualizar conexão do ambiente e executar o
precheck já autorizado; próxima validação local: UI autenticada de duas abas.

Objetivo: terminar o escopo definido da V2, validar, revisar e então fazer
commit/push já autorizados por Gabriel. V2 ainda incompleta. Este arquivo é
o cursor de execução; `TASK_V2_FECHAMENTO.md` continua sendo o inventário
completo por ID. Não somar os checklists históricos novamente.

## Ponto de parada verificável

Atualização desta continuação: D11 implementado localmente em
`AtualizarLeitura.tsx`/`leitura-progresso.ts`/`lib/livros.ts`, ligado ao painel
do livro; soma ou posição absoluta com limites e controle de concorrência.
D16 parcial: `AnalisesGastos.tsx` mostra seis meses e categorias do mês.
Nubank agora invalida prévia ao mudar mês/cartão e confere proprietário na
persistência. 141 testes passaram; build final completou 49 páginas, incluindo
leitura, análise de gastos e vídeo/aula; lint completo e direcionado aprovados.
Não chamar os novos fluxos de homologados pela UI.
Ordem cronológica reconciliada no topo de `ROADMAP.md`.

- Há um lote grande de alterações locais de sessões anteriores; preservar.
- Nubank está integrado em `frontend/app/financas/page.tsx` por
  `frontend/components/financas/ImportarNubank.tsx`, com parser em
  `frontend/lib/nubank-import.ts` e persistência em `frontend/lib/financas.ts`.
  Conta OFX e cartão CSV (`date,title,amount`), prévia/categorias/seleção,
  identificação determinística por usuário e bloqueio de reimportação.
  Ainda **não homologado** com arquivo real ou UI autenticada.
- Testes novos: `frontend/tests/nubank-import.test.ts`. Não atribuir ao
  candidato atual a aprovação histórica de 134 testes/49 páginas.
- Verificação 2026-09-23: typecheck e cinco testes Nubank aprovados. Ainda
  faltam lint/build e UI autenticada deste lote.
- Nenhuma aplicação remota ou publicação foi feita nesta retomada.
- `guia-amigos-sistema-pessoal.pdf` é do usuário; não incluir automaticamente.

## Ordem de execução

1. **Fechar Nubank (D17).** Revisar parser, tratamento de créditos/pagamentos,
   codificação e datas; testar seleção, erro/reenvio, categorias e troca de
   conta. Corrigir mudanças de mês/cartão que deixem prévia antiga visível.
   Confirmar novamente o usuário na gravação, ligado ao dono da prévia.
   Não afirmar deduplicação contra lançamentos manuais: IDs só reconhecem
   reimportações; CSV depende do mesmo mês/apelido e conteúdo estável.
   Evitar dupla contagem entre compras da fatura e seu pagamento na conta;
   pagamento lançado como crédito na fatura também exige revisão.
   Homologação real requer OFX/CSV anonimizado, nunca senha bancária.
2. **Leitura (D11).** Implementação local concluída; faltam homologação
   autenticada de persistência, recarga, erro e concorrência entre abas.
3. **Vídeo/aula (D09).** Implementado localmente em `VideosSection.tsx` e
   `lib/conteudos.ts`, usando schema existente. DEC-087 registra propagação
   de teoria vista, falha parcial e reenvio; falta homologar UI/isolamento.
4. **Treino (I07/D01/D02).** Terminar proteção entre abas; modelar ocorrência
   agendada para falta automática ao fim do dia, conclusão da sessão marca
   feito e correção posterior é permitida. Não fabricar histórico usando o
   plano semanal atual. Schema novo exige migration incremental e o fluxo
   de autorização já estabelecido; retomada entre aparelhos foi dispensada.
5. **Finanças (D16).** Gastos por período/categoria podem usar dados existentes.
   Patrimônio/proventos/alertas foram aceitos como direção; explicitar fonte,
   periodicidade e regras ainda ausentes, mantendo custo zero.
6. **Restante do inventário.** Executar I03/I06/I08/I10 conforme arquivo único.
   I01/I02/I04 têm SQL local; UI dependente aguarda schema remoto confirmado.
   Resolver D/E abertos com perguntas concretas agrupadas, sem pedir outra vez
   escolhas já respondidas. Não declarar dependência externa concluída.
7. **Fechamento.** Testes direcionados durante implementação; suíte, tipos,
   lint/build e homologação do candidato final. Revisar stage/segredos e
   compatibilidade do banco antes de commit/push. Redesign é fase posterior,
   roteiro existente em `TASK_V2_DESIGN.md`.

## Decisões novas que substituem perguntas antigas

- D01: terminar sessão marca feito; pode corrigir falta no dia seguinte.
- D09: vídeo visto conclui aula vinculada; sem avanço automático.
- D11: progresso de páginas, sem velocidade/cronômetro.
- D14: lembretes e caderno em `IDEIAS_MELHORIAS.md`, sem versão obrigatória.
- D15: fotos corporais somente em Shape.
- D17: Gabriel confirmou **conta e fatura**. Não perguntar isso novamente.
- D19: pacote de arquivos exportados dispensado; manter exportação atual.
- D20: exclusão de conta continua administrativa.
- Hábitos/Metas/Arquivos e metas de Estudos: V3, definição posterior.
- D18/D21/D22 ainda precisam de explicação: atalhos são links de navegação;
  importação em lote é cadastro de vários itens de outra fonte (distinto do
  Nubank); gráficos gerais cruzam módulos, diferente de análises financeiras.

## Restrições e uso eficiente de contexto

- Respeitar leitura obrigatória do AGENTS.md. Depois consultar este cursor e
  apenas IDs/arquivos do lote escolhido. Não reler toda a conversa ou listas
  históricas, nem recriar documentos de escopo a cada “continue”.
- Atualizar aqui o último resultado, próximo passo e bloqueio concreto.
  Resumir saída de testes; ampliar apenas falhas. Não repetir suítes sem
  mudança relevante ou motivo novo. Não abrir agentes sem pedido aplicável.
- Biblioteca `20260917000100`, Estudos `20260917000200` e ENEM/Redações
  `20260917000300` já estão aplicadas em produção. Em qualquer nova operação,
  conferir o histórico e limitar o plano ao escopo expressamente autorizado.
- Não ler/divulgar segredos do ambiente ou copiar credenciais desta conversa.
- Sessão aberta em produção não comprova login no candidato local. Estado
  de servidores/contas de teste descrito em setembro é histórico; verificar.

Prompt de continuidade: “Siga AGENTS.md e docs/RETOMADA_V2.md. Comece no
primeiro item ainda incompleto, confira os arquivos reais, implemente e teste
o lote. Atualize o cursor com evidência e próximo passo. Não reabra decisões
respondidas nem declare homologação/publicação sem executá-las.”
