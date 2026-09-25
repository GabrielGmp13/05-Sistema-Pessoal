# V2 — pendências consolidadas para finalização

**Atualizado em 2026-09-24. Documento único de encaminhamento.** Este é o
quadro vigente de pendências da V2 expandida. Substitui, para **triagem e
priorização**, as listas dispersas em `TASK_V2_IMPLEMENTACAO.md`,
`V2_DECISOES_PENDENTES.md`, `V2_ESCOLHAS_POR_TOPICO.md`, `TASKS_NOW.md` e
checklists históricos. Esses documentos continuam como evidência e detalhe;
não somar seus itens outra vez. `HOMOLOGATION_V2.md` contém casos de teste, não
uma lista de funcionalidades ausentes. `V2_RELEASE_CANDIDATE.md` retrata uma
release candidate anterior à ampliação do escopo e **não** descreve o estado
atual do banco ou o critério final desta V2.

## Decisões já fechadas e fotografia atual

- Hábitos, Metas e Arquivos ficam para **V3**, com nova especificação após o
  lançamento da V2. Isto não decide automaticamente a meta diária de Estudos
  (D04).
- O custo autorizado é **zero**. Serviço indisponível/gratuito insuficiente
  não é uma entrega concluída; escolher alternativa viável ou adiar por ID.
- Treino `20260915000100` está aplicado em produção. As três migrations de
  2026-09-17 não têm o mesmo estado: `00200` e `00300` foram aplicadas em produção em 2026-09-24 após precheck e dry-run isolado; `00100` permanece local. Gabriel pediu que a de Biblioteca
  `20260917000100` permaneça local; não incluí-la em aplicação remota.
- A implementação local existente passou reset/26 scripts SQL, 134 testes de
  frontend, typecheck, lint e build de 49 páginas. Isso **não** equivale a
  homologação autenticada do candidato atual nem publicação. A última rodada
  não fez commit/push nem alterou banco de produção ou dados dos amigos.
- O roteiro do redesign Astra 6 está criado em `TASK_V2_DESIGN.md`. O redesign
  é a **fase seguinte**, após fechar a funcionalidade; não confundir com estes
  bloqueadores.

### Escolhas confirmadas pelo Gabriel nesta rodada

As respostas posteriores abaixo prevalecem sobre perguntas desta primeira
rodada. Cursor atualizado e ordem de execução: `RETOMADA_V2.md`.

- **PDF (D08):** V2 apenas envia/abre o PDF privado em nova aba, usando o
  visualizador do navegador quando disponível. Não desenvolver editor próprio,
  OCR, desenho ou anotações persistidas no site. Isso já existe no candidato;
  falta homologar a abertura. Um **caderno digital** é ideia futura separada,
  ainda sem especificação ou versão atribuída.
- **Treino (D01):** falta automática se um treino agendado para determinada
  data não for marcado como feito até o fim desse dia (24h no exemplo dado).
  Para implementação, interpretar como 00:00 do dia seguinte no fuso local;
  ainda confirmar se conclusão da sessão marca feito automaticamente e se uma
  falta pode ser corrigida/reagendada depois. Não inferir faltas anteriores à
  implantação a partir do plano semanal atual.
- **Treino (D02):** não é necessário começar num aparelho e continuar noutro.
  Manter retomada no mesmo navegador; impedir que duas abas editem a mesma
  sessão sem aviso/perda de dados é proteção técnica, não sincronização ampla.
- **Estudos (D04):** metas de estudo/sequência ficam para a **V3**, junto com o
  módulo Metas; especificação posterior.
- **Revisão/Agenda (D06):** revisões também podem ser editadas na Agenda, que
  reúne a rotina. A Agenda deve editar o registro original da revisão, sem
  criar dois compromissos independentes nem duas fontes de verdade. Falta
  definir quais campos podem ser alterados ali e como cancelar/adiar.
- **Vídeo/Curso (D09):** Gabriel não quer avanço automático para o próximo
  vídeo/aula. Ainda falta esclarecer se marcar um vídeo como visto altera o
  estado da **aula vinculada**; hoje os estados são independentes.
- **Formatação (D07), velocidade de leitura (D11), Saúde (D14–D15), Finanças
  (D16–D17) e Conta/organização (D18–D22):** continuam para explicação e
  escolha. Não classificar como V3 por silêncio.

### Respostas posteriores do Gabriel

- **Saúde:** lembretes saem dos bloqueadores da V2 e entram no banco de ideias
  `IDEIAS_MELHORIAS.md`, sem versão/prazo; fotos corporais ficam apenas em Shape,
  sem segundo acervo de Saúde.
- **Finanças:** Gabriel quer acompanhar gastos por período/categoria, evolução
  patrimonial, proventos e alertas. Implementar primeiro o que é derivável dos
  dados próprios; cotação histórica/proventos/alertas exigem contrato de fonte,
  frequência e comportamento, mantendo custo zero e sinalizando ausência.
  Importação de extrato Nubank por arquivo foi solicitada para implementação;
  a documentação oficial confirma OFX da conta, mas a fatura do cartão é fluxo
  distinto. Não conectar à conta nem pedir senha. Homologação com arquivo real
  anonimizado ainda será necessária.
- **Conta:** não é necessário pacote de exportação com todos os binários;
  manter JSON/inventário atual. Exclusão continua por solicitação administrativa.
- **Leitura:** o objetivo descrito é **progresso**, não páginas por hora:
  registrar “li mais 20 páginas” ou “parei na página 122”. Não criar cronômetro
  ou velocidade sem novo pedido.
- **Vídeo/Curso:** marcar vídeo como visto conclui a aula vinculada, sem abrir
  ou concluir automaticamente a próxima aula/vídeo.
- **Treino:** concluir sessão marca o treino planejado como feito. Permitir
  corrigir uma falta no dia seguinte; registrar a alteração, sem fabricar
  retrospecto anterior à implantação.
- **D18 atalhos, D21 importação em lote e D22 analytics geral:** ainda precisam
  ser explicados em linguagem de uso antes da escolha final.

**Legenda:** `I` = implementação/validação com comportamento já definido;
`D` = decisão de produto do Gabriel; `E` = dependência externa/operacional.
`Local` significa código/SQL no repositório, não disponível para os amigos.
Nenhum item muda de V2 para V3 por silêncio.

## 1. Trabalho já definido — executar sem pedir nova especificação

**Atualização operacional 2026-09-24:** `00200` e `00300` aplicadas em produção,
com histórico, RLS/GRANTs das quatro tabelas e dry-run final vazio conferidos.
Frontend de tentativas ENEM, versões/avaliações de redações, avaliações por
matéria e anuladas implementado. Os textos abaixo que descrevem implementação
ausente são a linha de base; esta atualização e `RETOMADA_V2.md` prevalecem.
QA local confirmou avaliações/simulado após recarga; duas tentativas ENEM
independentes, correção e vínculo de redação persistidos; correção posterior
de falta de treino. 145 testes Node e typecheck passaram antes dos dois
ajustes finais de UI/cálculo. Homologação completa e publicação ainda pendentes.

| ID | Estado verificável | Para fechar |
|---|---|---|
| I01 ENEM | SQL aplicado; frontend local usa tentativas independentes, respostas versionadas, prazo de servidor, finalização, correção, catálogo e vínculo posterior. QA confirmou duas tentativas, recarga, correção e vínculo. SQL testa prazo/imutabilidade/conflito; API confirmou isolamento. | Completar matriz de UI Dia 1/2, 0/90/parcial e concorrência; arquivos privados e publicação. Preservado o legado. Percentual ≠ TRI. |
| I02 Redações | SQL aplicado; versões/avaliações/média pessoal/nota oficial integradas. QA confirmou texto original preservado, texto revisado, avaliação 800 e oficial 920 separados após recarga; vínculo ao ENEM persistiu. API confirmou isolamento/exportação. | Completar upload/substituição/abertura privada e matriz de falhas. Fotos referenciadas por versões não são apagadas. MEC automático é E03, não parte desta entrega. |
| I03 Escola/Faculdade | Rótulo por conta e criar/renomear/retirar/reincluir matérias implementados localmente. CRUD, seed, duplicatas e falha/recuperação foram conferidos; Matemática não sumiu do ENEM e duas contas tiveram escopo separado via API. | Homologar troca de contas **pela UI** no candidato final, recarga e páginas relacionadas; corrigir falhas encontradas. Não refazer a implementação já feita. |
| I04 Avaliações/simulados | SQL aplicado e UI integrada. QA: 8/10 produz 80%; 4 acertos de 10 com 2 anuladas mostra 4/8 após recarga. Testes cobrem pendentes/zero válidas e exclusão de anuladas; sem SM-2 quando não há válidas. | Completar homologação geral I08 e publicação; não repetir aplicação de banco. |
| I05 Ordem interna da Biblioteca | SQL local `20260917000100` reordena **elenco, trilha e OP/ED dentro de uma obra**, não os cards do catálogo. Testado localmente, mas Gabriel mandou mantê-lo local. | Preservar essa restrição. A UI dependente não pode ser ligada em produção. Para entregar na V2, Gabriel precisa mudar explicitamente essa instrução e autorizar a aplicação específica; caso contrário, decidir V3 para este item. |
| I06 Metadados de temporadas | Editores de Anime e Série foram ampliados localmente; IDs externos, episódios e progresso são preservados. | Homologar criar/editar/cancelar/recarregar com registros existentes e duas contas; corrigir regressões. Sem sincronização externa automática implícita. |
| I07 Treino | Rascunho/IDs estáveis, proteção de plano divergente, reenvio idempotente, trava entre abas e presenças implementados. QA: segunda aba bloqueada; recarga restaura série/descanso; finalização salva e conclui Agenda; falta anterior corrigível. | Completar quedas de rede reais, restauração de plano divergente, áudio em aparelho físico e matriz de histórico/PR. Sem sincronização entre aparelhos. |
| I08 Homologação do candidato | Testes automatizados passaram; só parte da UI acadêmica local foi conferida com conta fictícia. A página publicada/logada não demonstra o código local. | Executar fluxos autenticados do **candidato atual** com duas contas descartáveis: Treino, ENEM, Redações, avaliações, temporadas/listas, Saúde, módulos ocultos, uploads/Storage, revisão, Agenda e demais módulos. Recarregar, forçar erros, testar mobile/desktop/temas e registrar evidência, correção e reteste. Não usar dados reais dos amigos para ensaio destrutivo. |
| I09 Segurança/dados/publicação | RLS, GRANTs e exportação têm cobertura parcial; migrations novas são locais. Repositório está sujo e não há stage/commit/push deste lote. | Testar isolamento de duas contas, FKs/Storage/signed URLs, exportação das novas tabelas, ausência de segredos, cookies/Auth e erros sem credencial. Revisar diff/stage excluindo o PDF solto e `.env`; executar suíte, precheck SQL e homologação. Só depois do fechamento autorizado fazer commit/push, acompanhar CI/deploy e smoke publicado. |
| I10 Polimentos e reconciliação | O corte residual da letra “g” em “Agenda” em certo zoom/largura está documentado. `NAMING_CONVENTIONS.md`, CSS real versus `DESIGN.md` e documentos de release antigos divergem do escopo atual. | Reproduzir/corrigir o corte sem iniciar o redesign, auditar padrões visuais e nomenclatura relevantes, registrar versão/estado real e não usar marcações históricas de “concluído” para encerrar a V2 ampliada. |

### Banco: ordem e autorização não são decisões de funcionamento

1. **`20260917000100_biblioteca_reordenacao.sql`: não aplicar** enquanto valer
   a instrução de manter local. Não executar `db push` indiscriminado, pois a
   cadeia incluiria essa migration.
2. **`20260917000200_estudos_avaliacoes_anuladas.sql`:** aplicada e conferida
   em produção; não reaplicar nem editar a migration.
3. **`20260917000300_enem_redacoes_modelo.sql`:** aplicada e conferida
   em produção; não reaplicar nem editar a migration. Legado foi preservado.
4. Produção é a fonte da verdade. Não editar baselines/migrations já aplicadas,
   não fazer reset remoto, não registrar senha/URL/segredo no Git, nem presumir
   que o SQL local já está disponível aos usuários.

## 2. Escolhas de produto — responder `Dxx: V2 opção A/B ...` ou `Dxx: V3`

| ID | Estado atual | Decisão e efeito |
|---|---|---|
| D01 Disciplina de Treino — **implementado localmente** | Presença deriva das ocorrências datadas da Agenda, sem duplicar tabela. | Falta na virada local; finalizar conclui ocorrência única; correção posterior. Múltiplos compromissos no mesmo dia exigem escolha na Agenda. Plano semanal é modelo, não cria retrospecto. QA básico aprovado. |
| D02 Treino entre abas/aparelhos — **definido** | Rascunho no mesmo navegador; não há sincronização entre dispositivos. | Retomada no mesmo navegador basta. Não criar sincronização entre aparelhos; segunda aba deve ser protegida contra edição concorrente sem perda de dados. |
| D03 Avisos/fone | Som e aviso visual funcionam com página aberta e gesto prévio. | **A:** limitar a isso. **B:** segundo plano/tela bloqueada/ação por fone, sujeito a infraestrutura gratuita, permissões e teste Android/iOS. |
| D04 Meta/sequência de Estudos — **V3** | Módulo Metas e suas regras não estão especificados. | Adiado explicitamente junto com Metas; não bloqueia V2. |
| D05 Estatísticas de Estudos | Há acertos/erros/motivos e percentuais básicos do ENEM. | **A:** só indicadores descritivos por período. **B:** força/fraqueza/eficiência; definir fórmula, período, amostra mínima e denominador. Não inventar TRI. |
| D06 Revisão na Agenda — **definido parcialmente** | Datas vivem em módulos distintos. | A Agenda reúne e permite editar a revisão original, sem duplicar dados. Confirmar campos editáveis e o efeito de cancelar/adiar antes da UI. |
| D07 Texto formatado | Campos atuais são texto simples/formatos específicos. | **A:** negrito/itálico/listas/links nos campos nomeados. **B:** imagens/desenho/editor rico; indicar módulos e preservar/sanitizar texto legado. |
| D08 PDF no navegador — **definido** | Upload privado e ação “Abrir arquivo” em nova aba já existem. | Manter visualização nativa quando suportada ou download conforme navegador; não criar editor de PDF na V2. Caderno digital é ideia futura distinta. Homologar abertura e privacidade. |
| D09 Vídeo→Curso — **implementado localmente** | Salvar assistido propaga teoria vista às aulas vinculadas; novo vínculo herda assistido. Falha parcial é informada e permite reenvio. DEC-087. | Homologar persistência, erro/reenvio e isolamento. Não avança aula, não atribui domínio e desmarcar vídeo não apaga teoria. |
| D10 Temporadas | Edição pedida já implementada localmente. | **Não há escolha pendente** para esta entrega; falta I06. Sincronização automática externa seria escopo novo. |
| D11 Leitura — **implementado localmente** | Painel oferece acréscimo/posição absoluta, limites e controle de concorrência; testes passaram. QA: 40 + 20 = 60, depois posição 122 persistida após recarga. | Completar falha/duas abas na matriz. Sem cálculo de velocidade ou cronômetro. |
| D12 Anki avançado | Básico/cloze existe; pacotes complexos não. | **A:** suportar tipos de um `.apkg` real anonimizado. **B:** compatibilidade mais ampla de mídia/templates, sem executar scripts do pacote na origem autenticada. |
| D13 Banners | Assets/fallbacks existentes. | **A:** conservar. **B:** fornecer/autorizar imagens por categoria com licença, estilo e fallback definidos. |
| D14 Lembretes de Saúde — **banco de ideias** | Gráficos locais, sem lembretes gerais. | Não bloqueia V2; especificar quando houver necessidade em `IDEIAS_MELHORIAS.md`. |
| D15 Fotos de Saúde — **definido** | Shape já tem fotos corporais privadas. | Reutilizar só Shape; não criar acervo paralelo. |
| D16 Finanças avançadas — **direção aprovada** | Lançamentos e cotações sob demanda; sem histórico/proventos/alertas. | Gabriel quer gastos por período/categoria, patrimônio, proventos e alertas. Fazer análises dos dados existentes; para as demais, definir fonte, periodicidade, alertas e ausências antes de considerar concluídas. Custo zero. |
| D17 Importação Nubank — **local, QA sintética aprovada** | OFX/CSV, prévia e persistência integrados; pagamentos de fatura começam desmarcados. QA importou extrato e compra/estorno, conferiu totais após recarga e bloqueou duplicatas da fatura. | Arquivo real anonimizado ainda necessário para comprovar variações do banco. CSV sem identificador exige mesmo apelido/mês/descrição para deduplicar. Não é conexão automática com o Nubank. |
| D18 Ocultação de módulos | Atalhos da navegação/Início ocultáveis por conta; dados continuam acessíveis. | **A:** isso basta. **B:** ocultar também resumos/busca/referências em páginas especificadas, sem excluir dados nem mudar RLS. |
| D19 Exportação integral — **definido** | JSON/inventário e CSV do recorte do Histórico existem. | Não criar pacote de todos os binários; manter processo atual. |
| D20 Exclusão self-service — **definido** | Solicitação/execução administrativa. | Manter solicitação administrativa; não criar botão de exclusão direta nesta fase. |
| D21 Importação/scraping em lote | Nenhuma fonte/contrato definido. | **A:** arquivo com prévia e deduplicação. **B:** coleta de fontes autorizadas, com URLs, limites, frequência e termos; não contornar login/proteções. |
| D22 Analytics geral | Hub e Histórico têm resumos/heatmap; “dashboard analytics avançado” aparece no BACKLOG sem métricas ou telas definidas. | **A:** considerar os resumos atuais suficientes para V2. **B:** definir indicadores, módulos, filtros, períodos, comparações e significado de cada métrica antes de criar um painel novo. |

## 3. Dependências externas ou operacionais — resolver, trocar por alternativa ou V3

| ID | Estado | Condição para chamar de entregue na V2 |
|---|---|---|
| E01 Places/Maps | Desligado por custo zero. | Serviço gratuito permitido com quota testada, ou alternativa manual claramente diferente; não ativar faturamento. |
| E02 BRAPI avançada | Quota/endpoints gratuitos não verificados para D16. | Definir D16, verificar cobertura real e testar limite/fallback. |
| E03 MEC Enem automático | Link externo existe; API de correção não confirmada. | API/exportação oficial permitida e consentimento; não automatizar Gov.br. Senão manter só link ou V3. |
| E04 YPT | Sem API/arquivo verificável. | API pública estável ou exportação anonimizada real; sem isso V3. |
| E05 Catálogo oficial ENEM | Upload manual existe; catálogo completo não. | Escolher links oficiais versus cópia privada; validar edição, aplicação, dia, caderno, gabarito, origem e direitos. |
| E06 Legado ENEM | Exportação antiga não fornecida. | Arquivo anonimizado e mapeamento, ou declaração de que não há dados a migrar. |
| E07 Google Photos Picker | Sem OAuth/consentimento homologado. | Configuração, política de cópia privada durável e quota/custo verificados. |
| E08 Calendar com navegador fechado | Integração existente não comprova webhook/retry contínuo. | Definir calendários/conflitos e validar infraestrutura gratuita de renovação, revogação e retry; ou restringir explicitamente ao uso manual. |
| E09 Extensão em loja | Extensão local, não publicada em loja. | Conta de publicador, eventual taxa aprovada, pacote e revisão externa. |
| E10 Cadastro público | Piloto segue fechado para amigos. | Escolher V3 ou preparar e-mail/domínio, OAuth, CAPTCHA/abuso, privacidade e suporte antes de abrir. |
| E11 Recuperação administrativa | Procedimento documentado, último ensaio não feito. | Conta descartável autorizada, confirmação de identidade e entrega por canal conhecido; sem senha/token no chat ou Git. |
| E12 Retenção/backup/quotas | Política e restauração não concluídas. | Limites por conta/anexo/API, retenção e ensaio em ambiente separado, sem sobrescrever produção. |
| E13 Uso real e celular | Testes de código não substituem uso físico. | Participantes/aparelhos/período 24h/7d combinados, observação após publicação e correção dos defeitos encontrados. |
| E14 Configuração das integrações já existentes | YouTube/TMDB/Calendar têm caminhos implementados ou fallback manual; nem todas as contas/chaves do candidato foram homologadas nesta rodada. | Se habilitadas na V2, configurar credenciais no ambiente correto e testar conexão, importação, quota, reconexão e fallback sem expor chaves. Sem chave opcional, o fluxo manual deve continuar utilizável; não marcar integração ativa por existir botão. |

## 4. Gates finais — não são funcionalidades novas

1. **Classificação de escopo:** respeitar D01/D02/D04/D08/D09/D11/D14/D15/
   D19/D20 já fechados; completar D06 e os detalhes de D16/D17. Gabriel
   responde D03/D05/D07/D12/D13/D18/D21/D22 e
   E01–E14 com V2/opção ou V3/não aplicável; D10 segue I06. O que continuar na
   V2 vira tarefa de implementação; nenhuma ideia é considerada pronta por ser
   bloqueada externamente.
2. **Banco:** autorizações específicas para `00200`/`00300`, sem tocar `00100`;
   precheck, dry-run, aplicação isolada, pós-check, comparação com schema de
   produção e atualização de `DATABASE.md`. Se não houver autorização, UI
   dependente permanece local/não entregue.
3. **Candidato autenticado:** usar contas descartáveis, registrar commit/URL,
   ambiente, navegador, dispositivo, tema e dados de teste. Cobrir CRUD,
   recarga, upload privado, queda de conexão, duas contas, rotas diretas,
   temas e telas de 360/768/1280 px. O checklist detalhado
   `HOMOLOGATION_V2.md` pode ser usado como roteiro, mas suas notas históricas
   de “única etapa aberta” não são o estado atual.
4. **Qualidade e segurança:** reset/testes SQL locais após cada migration;
   testes Node, typecheck, lint e build; diff sem segredos; RLS/GRANT/Storage,
   exportação e sessão/Auth. Revisar dívida Node 20/runtime 24 e script
   `unrs-resolver` sem liberar dependências por aparência. Não fazer teste
   destrutivo em conta real nem reset remoto.
5. **Operação:** reconciliar documentação/versão, registrar retenção/backup e
   limites gratuitos, homologar recuperação e integrações escolhidas, obter
   observação física. Corrigir bloqueadores e retestar.
6. **Entrega:** somente após fechar/adiar explicitamente cada ID e passar os
   gates, revisar stage (não incluir `guia-amigos-sistema-pessoal.pdf` por
   acidente), fazer commit/push conforme autorização anterior para o marco
   completo, acompanhar CI/Vercel e fazer smoke publicado. Não chamar push de
   deploy validado. Então iniciar a revisão visual guiada por
   `TASK_V2_DESIGN.md`.

## Resposta mínima do Gabriel para destravar as próximas etapas

1. Conexão de produção resolvida e rito acadêmico concluído. Não é necessária
   outra credencial para esse passo. Biblioteca `00100` permanece local.
2. Completar D06 e responder os IDs `D`/`E` ainda abertos; D01/D09 já definidos; marcar V3
   ou não aplicável explicitamente quando for o caso. Não reabrir PDF,
   retomada entre aparelhos ou metas de estudo sem nova intenção do Gabriel.
3. Informar quando houver contas/aparelhos descartáveis para os testes físicos
   e, se aplicável, amostras anonimizadas de Anki, banco, YPT e ENEM legado.

Não encaminhar senha do Supabase, service role, token ou dados pessoais junto
com este documento.
