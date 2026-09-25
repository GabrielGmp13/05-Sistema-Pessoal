# Task — revisão integral de design da versão 2

## Estado e dependência

Preparação iniciada em 2026-09-15 a pedido de Gabriel para execução futura pelo
Astra 6. **Redesign não iniciado.** A fase funcional de
[TASK_V2_IMPLEMENTACAO.md](TASK_V2_IMPLEMENTACAO.md) ainda está incompleta.
Este inventário é uma base de trabalho, não uma certificação visual de cada tela.

Atualização funcional local de 2026-09-16: considerar os novos editores de
elenco/trilhas/temporadas de séries/volumes/OP-ED na Biblioteca, tendências de
Saúde, relógio ENEM em blocos e seleção dos atalhos em Configurações. Nenhuma
rota nova neste segundo lote. Preservar os estados de erro, cancelamento,
campos vazios e confirmação adicionados; homologação visual continua pendente.

Foram inventariados 39 arquivos `page.tsx`. Contagens de páginas do build
incluem geração e infraestrutura e não substituem este inventário de telas.
Hábitos, Metas e Arquivos foram adiados por Gabriel para a v3 em 2026-09-16;
não criar mockups dessas rotas como se fossem páginas da v2. Atualizar este
documento antes de começar o redesign. Preservar o orçamento zero.

## Briefing para Astra 6

Na execução futura, conferir as skills disponíveis e ler integralmente cada
`SKILL.md` aplicável antes de usá-la. Usar skill de navegação para inspeção e
validação visual; usar geração de imagens somente se assets raster novos
forem aprovados. Não presumir que uma skill de criação/hosting de sites serve
para este repositório Next.js, nem migrar stack/hosting por exigência de skill.
Registrar quais skills foram usadas, em quais páginas e a evidência visual.

Você vai refazer o design do Sistema Pessoal após o fechamento funcional da
versão 2. Leia AGENTS.md e os seis documentos obrigatórios na ordem definida;
em seguida, TASK_V2_IMPLEMENTACAO.md, este documento, a página selecionada e
seus componentes/dados reais. A comunicação com Gabriel é em português.

Objetivo: organizar a vida pessoal com leitura clara, agrupamento de conteúdo
e fluxos fáceis de executar. Preservar dados, persistência, isolamento e ações.
Os amigos já usam o site; não usar as contas deles como massa de testes.

A referência vigente é DESIGN.md: cinco iluminações e cinco decorações,
tokens semânticos, Syne para títulos, JetBrains Mono para números/fontes locais.
AppChrome usa coluna pessoal desde 1024 px e menu compacto abaixo. Biblioteca
tem sidebar própria; sessões de revisão e modo prova são telas de foco.
Não mudar essas decisões por conveniência de um mockup.

O pedido autoriza planejar o redesign, mas não escolhe uma nova paleta ou uma
referência visual. Antes da implementação visual, fechar com Gabriel uma
direção concreta em até três alternativas e registrar a escolha em DESIGN.md.
Pedidos ambíguos seguem AGENTS.md, regra 13. O novo design não exige trocar a
stack mista CSS Modules/Tailwind, nem uma dependência de animação.

## Sequência de revisão

1. **R0 — fechamento funcional:** todos os itens aceitos implementados e testados;
   dependências externas resolvidas. Registrar commit/base a redesenhar.
2. **R1 — captura de referência:** desktop 1440, tablet 1024 e mobile 390/360;
   registrar também 1023 px, zoom 200%, teclado e movimento reduzido. Usar dados
   fictícios, sem tokens, nomes reais, prints de suporte ou imagens privadas.
3. **R2 — sistema visual:** aprovar hierarquia, escala de espaçamento, densidade,
   títulos, ações, formulários, listas, gráficos, estados e sobreposições.
   Elementos relacionados têm intervalo menor que grupos independentes.
4. **R3 — estrutura compartilhada:** AppChrome, navegação, coluna pessoal,
   atmosfera, botões, campos, modais, feedback e componentes de estudo.
5. **R4 — páginas piloto:** Início, Treino/Academia, Biblioteca/detalhe e
   Matéria/ENEM. Aprovar padrões comuns antes de repetir em outras telas.
6. **R5 — todos os módulos:** seguir o inventário abaixo; testar componentes
   compartilhados em todos os consumidores afetados.
7. **R6 — revisão transversal:** responsividade, contraste, foco, ordem de
   tabulação, formulários, rolagem, dados longos, arquivos e integrações ausentes.
8. **R7 — release:** testes/typecheck/build/lint, homologação, documentação,
   commit/push, CI, deploy e smoke. Registrar autorização e resultado reais.

## Contrato por página

Cada task de página deve anexar: código/estilo/componentes lidos; fluxo atual;
capturas anonimizadas; problemas observados; proposta e comparação antes/depois;
estados vazio/carregando/erro/salvando/sucesso; mobile/desktop/teclado; testes e
links das evidências. Não marcar um item abaixo concluído apenas por gerar CSS.

### D01 — Início

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/` · `frontend/app/page.tsx`.
- **Conteúdo atual:** Resumo de tempo; Agenda; revisões; projetos; receitas; módulos; insights.
- **Ações a preservar:** Abrir o compromisso ou revisão priorizados; navegar para módulos.
- **Fontes para leitura:** `lib/agenda.ts, lib/provas.ts, lib/revisao.ts, lib/sessoes-estudo.ts, lib/insights.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Destacar a próxima ação e separar métricas de hoje/semana/mês. Evitar que insights disputem o foco com pendências.
- **Cenários obrigatórios:** Conta vazia, dados longos, carregamento parcial e períodos sem atividade.

### D02 — Painel de Treino

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/treino` · `frontend/app/treino/page.tsx`.
- **Conteúdo atual:** Modalidades; planejamento semanal; Shape; gráficos; pontuação; sessões recentes.
- **Ações a preservar:** Abrir plano/Shape/Cardio; criar/editar/remover planejamento.
- **Fontes para leitura:** `lib/treino.ts, lib/modulos-treinos.ts, components/treino/line-chart.tsx`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Agrupar “treinar hoje”, planejamento e evolução em hierarquia distinta; mostrar unidade, período e limite dos gráficos.
- **Cenários obrigatórios:** Falha de consulta não pode aparecer como zero; meses/anos diferentes; histórico longo e exercícios removidos.

### D03 — Planos da modalidade

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/treino/[moduloUuid]` · `frontend/app/treino/[moduloUuid]/page.tsx`.
- **Conteúdo atual:** Lista de planos; nome/descrição; formulário e ações.
- **Ações a preservar:** Criar plano; abrir exercícios; iniciar sessão; apagar; incluir edição quando implementada.
- **Fontes para leitura:** `lib/treino.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Tornar a ação Treinar dominante no plano selecionado e agrupar manutenção em ações secundárias.
- **Cenários obrigatórios:** Modalidade de outra conta, nenhum plano, plano vazio, título longo e exclusão com erro.

### D04 — Exercícios do plano

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/treino/[moduloUuid]/[treinoUuid]` · `frontend/app/treino/[moduloUuid]/[treinoUuid]/page.tsx`.
- **Conteúdo atual:** Força/cardio; séries/repetições/carga/descanso; imagem/GIF. Reordenação aguarda a migration; o protótipo inseguro foi retirado em 2026-09-16.
- **Ações a preservar:** Cadastrar e remover exercício/imagem; incorporar edição e reordenação quando concluídas na fase funcional.
- **Fontes para leitura:** `lib/treino.ts; bucket exercicios`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Explicar unidades junto aos valores; distinguir meta planejada de execução real; controles de ordem acessíveis no toque.
- **Cenários obrigatórios:** Ordem repetida, falha entre gravações, GIF, imagem ausente, zero/decimal, acesso cruzado e upload inválido.

### D05 — Execução do treino

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/treino/[moduloUuid]/[treinoUuid]/academia` · `frontend/app/treino/[moduloUuid]/[treinoUuid]/academia/page.tsx`.
- **Conteúdo atual:** Exercício/imagem; séries; carga/repetições reais; cardio; PR; descanso; finalização.
- **Ações a preservar:** Confirmar série; encerrar descanso; registrar cardio; finalizar/repetir envio.
- **Fontes para leitura:** `lib/execucoes.ts, lib/treino-finalizacao.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Priorizar próximo exercício/série e descanso em uso com uma mão; persistência deve ser visível. Retomada e som dependem da fase funcional.
- **Cenários obrigatórios:** Falha em cada gravação, reenvio, duplo clique, interrupção, retorno, série incompleta e sessão de outra conta.

### D06 — Histórico corporal

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/treino/shape` · `frontend/app/treino/shape/page.tsx`.
- **Conteúdo atual:** Registro de peso/observação/foto; galeria; edição e remoção.
- **Ações a preservar:** Registrar, editar data/peso, substituir/remover foto, excluir registro.
- **Fontes para leitura:** `Tabela shape; lib/image-optimization.ts; bucket shape`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Relacionar peso e data à foto sem sacrificar leitura; aproximar histórico e curva de peso; permitir datas/decimais claros.
- **Cenários obrigatórios:** Só peso, só foto, mesmo dia, falha de upload, rollback, zoom e foto privada expirada.

### D07 — Histórico de Cardio

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/treino/cardio` · `frontend/app/treino/cardio/page.tsx`.
- **Conteúdo atual:** Distância/duração/atividades do recorte; gráficos diários.
- **Ações a preservar:** Atualizar; consultar valores; voltar ao painel.
- **Fontes para leitura:** `lib/treino.ts, lib/treino-estatisticas.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Mostrar período e quantidade consultados antes dos totais; diferenciar ausência de medição de valor zero.
- **Cenários obrigatórios:** Dias de anos diferentes, valores nulos, amostra limitada, erro, vazio e tabela alternativa no celular.

### D08 — Catálogo multimídia

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/biblioteca` · `frontend/app/biblioteca/page.tsx`.
- **Conteúdo atual:** Sidebar, busca, categorias, banner/mosaico, ordenação, cards, formulários e painéis.
- **Ações a preservar:** Buscar/importar/criar/editar/excluir, favoritar, avaliar, abrir detalhes e relações.
- **Fontes para leitura:** `app/biblioteca/_components/*; components/Sidebar.tsx; lib/biblioteca-ordenacao.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Manter uma sidebar apenas; separar navegação, descoberta e gerenciamento. Reutilizar padrões entre todas as mídias.
- **Cenários obrigatórios:** Cada categoria; manual/fonte externa; resultados cancelados; capa ausente/privada; títulos longos e coleção vazia.

### D09 — Gêneros

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/biblioteca/generos` · `frontend/app/biblioteca/generos/page.tsx`.
- **Conteúdo atual:** Lista e gerenciamento dos gêneros compartilhados.
- **Ações a preservar:** Criar, alterar conforme UI e apagar gênero com confirmação.
- **Fontes para leitura:** `lib/generos.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Deixar explícito o impacto nas obras relacionadas; facilitar localizar nomes sem duplicação visual.
- **Cenários obrigatórios:** Gênero em uso, vazio, erro ao gravar, teclado e modal sobre a sidebar.

### D10 — Hub de Estudos

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/estudos` · `frontend/app/estudos/page.tsx`.
- **Conteúdo atual:** Áreas de estudo; revisões; provas; atividades; simulados.
- **Ações a preservar:** Entrar em área; acessar pendência e conteúdo.
- **Fontes para leitura:** `lib/materias.ts, lib/provas.ts, lib/atividades.ts, lib/simulados.ts, lib/revisao.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Diferenciar escolher área de resolver pendência; respeitar módulos opcionais quando implementados.
- **Cenários obrigatórios:** Seed sem duplicata, erros parciais, prazos locais, rótulo Escola/Faculdade e dados compartilhados.

### D11 — Escola / Faculdade

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/estudos/escola` · `frontend/app/estudos/escola/page.tsx`.
- **Conteúdo atual:** Matérias; próximas provas; atividades; gestão de contexto futura.
- **Ações a preservar:** Abrir matéria; incluir, editar e retirar do contexto depois da implementação.
- **Fontes para leitura:** `lib/materias.ts, lib/provas.ts, lib/atividades.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** O rótulo e a gestão livres dependem do fechamento funcional. Explicar quando uma matéria também aparece no ENEM.
- **Cenários obrigatórios:** Retirar da Escola sem apagar ENEM; voltar ao Hub sem seed recriar; prova sem data e renomeação compartilhada.

### D12 — Matéria e conteúdos

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/estudos/materia/[materiaUuid]` · `frontend/app/estudos/materia/[materiaUuid]/page.tsx`.
- **Conteúdo atual:** Conteúdos; domínio/revisão; provas; atividades; questões; simulados; materiais e registros.
- **Ações a preservar:** Adicionar/editar conteúdo; vincular matéria; registrar estudo; revisar; abrir documentos e avaliações.
- **Fontes para leitura:** `lib/conteudos.ts, lib/provas.ts, lib/atividades.ts, lib/questoes-individuais.ts, lib/simulados.ts; components/study/study-records.tsx`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Separar estudar agora, organização e resultados; reduzir a sequência de formulários longos sem perder acesso.
- **Cenários obrigatórios:** Vínculo compartilhado, contexto from, documento privado, rótulos de domínio e conta sem dados.

### D13 — Outras áreas de estudo

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/estudos/areas/[tipo]` · `frontend/app/estudos/areas/[tipo]/page.tsx`.
- **Conteúdo atual:** Área validada; lista e cadastro de matérias.
- **Ações a preservar:** Criar/editar/remover matéria e abrir conteúdos.
- **Fontes para leitura:** `lib/materias.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Reutilizar a organização de Escola/Curso sem impor campos de ENEM a outras áreas.
- **Cenários obrigatórios:** Tipos válidos definidos no arquivo real; tipo inexistente, exclusão e preservação de conteúdos.

### D14 — ENEM

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/estudos/enem` · `frontend/app/estudos/enem/page.tsx`.
- **Conteúdo atual:** Áreas oficiais; provas por dia; agendamento/cadastro; acesso ao gabarito.
- **Ações a preservar:** Criar prova, abrir área, iniciar/corrigir/refazer após fechamento funcional.
- **Fontes para leitura:** `lib/materias.ts, lib/provas.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Mostrar prova original e tentativas separadamente depois da migration; identidade de edição/caderno perto da ação iniciar.
- **Cenários obrigatórios:** Dia 1/2, redação opcional, prova com/sem PDF, tentativa preservada e gabarito correto oculto durante execução.

### D15 — Área do ENEM

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/estudos/enem/[area]` · `frontend/app/estudos/enem/[area]/page.tsx`.
- **Conteúdo atual:** Lista de matérias da área e navegação de retorno.
- **Ações a preservar:** Abrir matéria.
- **Fontes para leitura:** `lib/materias.ts; AREA_ENEM_LABELS`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Lista clara de matérias com retorno contextual; evitar métricas que o schema não sustenta.
- **Cenários obrigatórios:** Área inválida, carga lenta, nomes longos e matéria compartilhada com Escola.

### D16 — Prova e gabarito digital

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/estudos/enem/gabarito/[provaUuid]` · `frontend/app/estudos/enem/gabarito/[provaUuid]/page.tsx`.
- **Conteúdo atual:** Modo prova/correção; cronômetro; 90 questões; respostas; redação; gabarito; motivos.
- **Ações a preservar:** Responder, finalizar, catalogar, corrigir, classificar e refazer conforme contrato funcional atualizado.
- **Fontes para leitura:** `lib/provas.ts, lib/enem-gabarito.ts, lib/redacoes.ts, lib/questoes-individuais.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Distinguir visualmente responder de corrigir. Tela de foco, teclado/caneta, PDF e relógio dependem dos editores implementados.
- **Cenários obrigatórios:** Expiração, recarga, rascunho, duplo envio, resposta em branco, anulada, bloqueio após fim e ausência de vazamento do gabarito.

### D17 — Redações

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/estudos/redacoes` · `frontend/app/estudos/redacoes/page.tsx`.
- **Conteúdo atual:** Cadastro; nota e competências; foto; histórico; link MEC Enem.
- **Ações a preservar:** Registrar, editar conforme UI, anexar/remover foto; versões/avaliações depois de implementadas.
- **Fontes para leitura:** `lib/redacoes.ts, lib/redacoes-validacao.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Agrupar texto, versão, avaliador e resultado sem confundir média pessoal, nota oficial e avaliação de IA.
- **Cenários obrigatórios:** 0–1000, competências, passos válidos, sem foto, vínculo posterior e ausência de envio ao MEC.

### D18 — Catálogo de cursos

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/estudos/curso` · `frontend/app/estudos/curso/page.tsx`.
- **Conteúdo atual:** Formulário; busca/lista; plataforma; carga horária; progresso/status.
- **Ações a preservar:** Adicionar curso; buscar/filtrar; abrir conteúdo.
- **Fontes para leitura:** `lib/materias.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Destacar continuar curso, distinguir horas dedicadas de carga total e manter formulário secundário.
- **Cenários obrigatórios:** Curso sem carga, concluído, título longo, busca vazia e filtros.

### D19 — Curso: módulos e aulas

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/estudos/curso/[materiaUuid]` · `frontend/app/estudos/curso/[materiaUuid]/page.tsx`.
- **Conteúdo atual:** Módulos/aulas; vídeo; domínio; registros de estudo; certificado e progresso.
- **Ações a preservar:** Adicionar/editar/excluir estrutura; assistir/registrar; anexar certificado.
- **Fontes para leitura:** `lib/materias.ts, lib/modulos-curso.ts, lib/conteudos.ts; components/study/study-records.tsx`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Manter contexto do curso ao abrir aula; separar progresso, material e anotações.
- **Cenários obrigatórios:** Vídeo da Biblioteca, sincronia opcional futura, arquivo privado, módulo vazio e exclusão com dependentes.

### D20 — Fila e acervo de revisão

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/revisao` · `frontend/app/revisao/page.tsx`.
- **Conteúdo atual:** Pendentes/futuras; filtros; card manual; importação CSV/TSV/APKG; arquivados.
- **Ações a preservar:** Criar/importar, iniciar sessão, editar/arquivar/excluir conforme UI.
- **Fontes para leitura:** `lib/revisao.ts, lib/flashcard-import.ts, lib/materias.ts, lib/conteudos.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Separar revisar agora de administrar acervo; prévia da importação mostra formato, contagem e duplicatas.
- **Cenários obrigatórios:** Cloze, caracteres especiais, arquivo inválido, mídia futura, nenhum vencimento e timezone.

### D21 — Sessão de revisão

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/revisao/sessao` · `frontend/app/revisao/sessao/page.tsx`.
- **Conteúdo atual:** Pergunta; revelação; avaliação; progresso; encerramento.
- **Ações a preservar:** Revelar resposta, avaliar e avançar.
- **Fontes para leitura:** `lib/revisao.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Uma ação primária por etapa e escala inequívoca; não revelar resposta antes da ação; preservar SM-2.
- **Cenários obrigatórios:** Fila vazia, recarga, duplo clique, falha de gravação, resposta longa, teclado e mídia importada.

### D22 — Agenda

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/agenda` · `frontend/app/agenda/page.tsx`.
- **Conteúdo atual:** Mês, dia selecionado, semana horária; compromissos/provas; Calendar e conflitos.
- **Ações a preservar:** Criar/editar/concluir/reabrir/apagar; navegar datas; sincronizar e revisar conflitos.
- **Fontes para leitura:** `lib/agenda.ts, lib/calendar-import.ts, lib/provas.ts, lib/treino.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Preservar relação mês → semana; identificar origem e editabilidade; horários legíveis sem rolagens concorrentes.
- **Cenários obrigatórios:** Fuso, virada de mês, eventos sobrepostos, dia cheio, prova somente leitura, OAuth expirado e conflito externo.

### D23 — Idiomas

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/idiomas` · `frontend/app/idiomas/page.tsx`.
- **Conteúdo atual:** Idiomas/nível/objetivo; vocabulário/domínio; práticas; tempo.
- **Ações a preservar:** Gerenciar idioma, registrar prática, adicionar vocabulário e alterar domínio.
- **Fontes para leitura:** `lib/idiomas.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Contexto do idioma sempre visível; aproximar vocabulário e prática sem misturar métricas diferentes.
- **Cenários obrigatórios:** Trocar idioma durante carregamento; palavra longa; acentos; sem práticas; exclusão.

### D24 — Histórico transversal

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/historico` · `frontend/app/historico/page.tsx`.
- **Conteúdo atual:** Heatmap anual; filtros; meses; detalhe diário; CSV.
- **Ações a preservar:** Navegar ano, filtrar área, abrir dia e exportar.
- **Fontes para leitura:** `lib/atividade.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Escala/legenda legíveis; não tratar duração, dinheiro e notas como unidade comum.
- **Cenários obrigatórios:** Ano bissexto, timezone, filtro vazio, teclado por dia, exportação correspondente ao recorte.

### D25 — Projetos e tarefas

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/projetos` · `frontend/app/projetos/page.tsx`.
- **Conteúdo atual:** Lista; formulário; projeto selecionado; três etapas de tarefas.
- **Ações a preservar:** Criar/editar/remover projeto/tarefa e mover etapa.
- **Fontes para leitura:** `lib/projetos.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Seleção de projeto dominante; tarefas subordinadas sem mistura entre projetos; manutenção acessível.
- **Cenários obrigatórios:** Troca rápida de projeto, prazo ausente, tarefa longa, exclusão e erro de persistência.

### D26 — Programação

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/programacao` · `frontend/app/programacao/page.tsx`.
- **Conteúdo atual:** Projetos especializados; repositório; linguagem; status; destaque.
- **Ações a preservar:** Gerenciar projeto e navegar para tarefas.
- **Fontes para leitura:** `lib/projetos.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Preservar mesma fonte de Projetos; evidenciar link real de repositório e ausência de integração GitHub automática.
- **Cenários obrigatórios:** URLs, projeto sem linguagem, vazios e reflexo da edição na página Projetos.

### D27 — Portal cotidiano

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/diario` · `frontend/app/diario/page.tsx`.
- **Conteúdo atual:** Resumo diário e acessos de Saúde, Finanças, Lugares e Receitas.
- **Ações a preservar:** Abrir registro ou módulo de origem.
- **Fontes para leitura:** `lib/saude.ts, lib/financas.ts, lib/lugares.ts, lib/receitas.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Explicar visualmente que agrega registros do cotidiano; evitar criar editor cronológico inexistente.
- **Cenários obrigatórios:** Falha parcial, dia vazio, moeda/peso com unidades e links coerentes.

### D28 — Saúde

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/saude` · `frontend/app/saude/page.tsx`.
- **Conteúdo atual:** Sono, hidratação, humor; medicamentos; peso vindo do Shape; histórico.
- **Ações a preservar:** Registrar/editar/excluir medidas e medicamentos; abrir Shape.
- **Fontes para leitura:** `lib/saude.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Agrupar por dia e preservar privacidade visual; tendências com período/unidade sem diagnósticos automáticos.
- **Cenários obrigatórios:** Zero/nulo, data antiga, medicação ativa, exclusão e peso sem registro.

### D29 — Finanças

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/financas` · `frontend/app/financas/page.tsx`.
- **Conteúdo atual:** Mês; movimentações; categorias; orçamento; metas; investimentos/cotações.
- **Ações a preservar:** Registrar/editar/excluir, parcelar/repetir, gerenciar limites/metas/posições e consultar preço.
- **Fontes para leitura:** `lib/financas.ts, lib/financas-series.ts, lib/cotacoes.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Separar caixa de investimentos e lançamento de análise; identificar cotações ausentes/desatualizadas.
- **Cenários obrigatórios:** Centavos, parcela no fim do mês, série finita, orçamento excedido, preço ausente e filtro mensal.

### D30 — Lugares

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/lugares` · `frontend/app/lugares/page.tsx`.
- **Conteúdo atual:** Coleção e detalhes; endereço; capa; link Maps; busca opcional desativada.
- **Ações a preservar:** Cadastrar/editar/excluir lugar; anexar capa e abrir mapa externo.
- **Fontes para leitura:** `lib/lugares.ts, lib/midias-pessoais.ts, lib/integracoes-disponibilidade.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Dar valor ao cadastro manual; somente expor Places/Photos quando os contratos externos estiverem prontos.
- **Cenários obrigatórios:** Sem coordenada, endereço longo, imagem privada, link válido e integração indisponível.

### D31 — Receitas

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/receitas` · `frontend/app/receitas/page.tsx`.
- **Conteúdo atual:** Acervo; ingredientes/preparo; tempo/porções; categoria; nota/favorito/feita; foto.
- **Ações a preservar:** Criar/editar, selecionar, marcar favorita/feita, anexar foto e excluir.
- **Fontes para leitura:** `lib/receitas.ts, lib/midias-pessoais.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Leitura durante preparo: ingredientes e passos próximos, tamanhos confortáveis e edição secundária.
- **Cenários obrigatórios:** Texto longo, foto ausente, porções/tempo desconhecidos, filtros e falha no upload.

### D32 — Perfil, integrações e suporte

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/configuracoes` · `frontend/app/configuracoes/page.tsx`.
- **Conteúdo atual:** Perfil/avatar/fundo; senha; Google; suporte/protocolos; exportação/exclusão.
- **Ações a preservar:** Editar perfil, trocar senha, conectar/revogar por serviço, enviar/acompanhar chamado e pedir dados.
- **Fontes para leitura:** `lib/supabase.ts, lib/midias-pessoais.ts; ler chamadas API reais na página`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Separar perfil, conta, integrações e suporte; ações destrutivas claras; OAuth separado Calendar/YouTube.
- **Cenários obrigatórios:** Conta convidada, senha inválida, autorização expirada, print privado, erro em exportação e módulos ocultos futuros.

### D33 — Entrada e cadastro controlado

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/login` · `frontend/app/login/page.tsx`.
- **Conteúdo atual:** E-mail/senha; Google; CAPTCHA; recuperação; termos/privacidade.
- **Ações a preservar:** Entrar e acessar recuperação; cadastro somente quando liberado de fato.
- **Fontes para leitura:** `lib/supabase.ts, components/TurnstileWidget.tsx`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Tornar entrada e recuperação claras; não sugerir cadastro aberto no piloto.
- **Cenários obrigatórios:** Credencial inválida, erro OAuth, CAPTCHA indisponível, teclado e foco.

### D34 — Solicitar recuperação

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/recuperar-senha` · `frontend/app/recuperar-senha/page.tsx`.
- **Conteúdo atual:** E-mail; CAPTCHA; confirmação e retorno.
- **Ações a preservar:** Pedir recuperação.
- **Fontes para leitura:** `lib/supabase.ts, components/TurnstileWidget.tsx`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Explicar resultado sem revelar existência de conta nem prometer entrega que SMTP não suporta.
- **Cenários obrigatórios:** Limite, e-mail inválido, falha de envio e retorno ao login.

### D35 — Definir senha

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/nova-senha` · `frontend/app/nova-senha/page.tsx`.
- **Conteúdo atual:** Senha nova e validação; estado de sessão de recuperação.
- **Ações a preservar:** Salvar nova senha e continuar.
- **Fontes para leitura:** `lib/supabase.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Instrução curta, requisitos próximos do campo e sucesso inequívoco.
- **Cenários obrigatórios:** Link expirado/reutilizado, senhas diferentes, rede e preenchimento automático.

### D36 — Falha de autenticação

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/auth/erro` · `frontend/app/auth/erro/page.tsx`.
- **Conteúdo atual:** Mensagem sobre link inválido/expirado e navegação de recuperação.
- **Ações a preservar:** Voltar/recuperar acesso pelos links reais.
- **Fontes para leitura:** `app/auth/erro/page.tsx; conferir também app/auth/confirm/route.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Indicar próximo passo sem despejar código, token ou URL privada.
- **Cenários obrigatórios:** Link inválido, sessão ausente e navegação pelo teclado.

### D37 — Termos e aceite

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/termos` · `frontend/app/termos/page.tsx`.
- **Conteúdo atual:** Texto vigente, limites do piloto e ação de aceite.
- **Ações a preservar:** Ler, aceitar quando autenticado e acessar privacidade.
- **Fontes para leitura:** `lib/terms.ts, lib/supabase.ts`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Texto escaneável, versão visível e decisão explícita. Não alterar o contrato só como retoque visual.
- **Cenários obrigatórios:** Usuário sem aceite, visitante, persistência, erro ao aceitar e links públicos.

### D38 — Privacidade

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/privacidade` · `frontend/app/privacidade/page.tsx`.
- **Conteúdo atual:** Responsável; dados; finalidades; serviços; segurança; retenção; pedidos.
- **Ações a preservar:** Ler e acessar canais/links existentes.
- **Fontes para leitura:** `app/privacidade/page.tsx`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Largura confortável e hierarquia de seções; texto coerente com operação realmente publicada.
- **Cenários obrigatórios:** Leitura sem login, zoom, links e ausência de dados pessoais de participantes.

### D39 — Ajuda pública

- [ ] Inventário conferido após fase funcional; proposta aprovada; implementação e QA.
- **Rota/arquivo:** `/ajuda` · `frontend/app/ajuda/page.tsx`.
- **Conteúdo atual:** Perguntas frequentes; entrada e privacidade.
- **Ações a preservar:** Abrir respostas e navegar para suporte/entrada conforme disponibilizado.
- **Fontes para leitura:** `app/ajuda/page.tsx`. Ler também os imports e estilos do arquivo.
- **Direção de revisão:** Respostas curtas com exemplos e limitações reais; não expor detalhes administrativos privados.
- **Cenários obrigatórios:** Sem login, teclado em acordeões, conteúdo longo e links.

## Superfícies que não são uma rota própria

- **Biblioteca:** inventariar separadamente Filmes, Séries, Animes, Mangás,
  Livros, Podcasts, Vídeos, Artigos e qualquer categoria adicional real do
  arquivo atual; conferir contagem no código, pois documentos antigos divergem.
  Cada uma precisa de lista, vazio, criação, edição e detalhe. Rever
  `PainelObraLayout`, temporadas, complementos, episódios, ordem de consumo,
  OP/ED/OST, elenco, trilhas, volumes, citações/anotações e playlists.
- **Anki/importação:** prévia, seleção de deck, cloze, deduplicação, erros e
  futuras mídias seguras; não renderizar HTML executável no site autenticado.
- **Prova/PDF/editor:** carregamento, páginas grandes, zoom, seleção, caneta,
  desfazer/refazer, estado não salvo, erro, reabertura e exportação.
- **Modais:** ConfirmDialog, cadastro/edição, arquivos e seletores. Auditar foco
  preso/restaurado, Escape, backdrop, scroll lock e posição com AppChrome.
- **Navegação global:** entradas longas, rolagem horizontal, mudança de rota,
  foco, nome do usuário e menu compacto; recuperar o corte residual de Agenda.
- **Conta:** aceite de termos, confirmação OAuth, convite, expiração, suporte,
  protocolo/anexos, exportação/exclusão e avisos de permissão/rede.
- **Rotas técnicas:** `app/auth/confirm/route.ts`, APIs, proxy, loading/error/
  not-found existentes devem ser conferidos pelos fluxos afetados, sem inventar
  páginas para endpoints.
- **Extensão:** popup/opções/estados do pacote real em browser-extension;
  revisar com a publicação em loja se a integração já estiver concluída.

## Novas páginas dependentes da fase funcional

Hábitos, Metas, Arquivos, leitura, avaliações, editores e integrações podem
precisar novas rotas. Não atribuir endereços ou tabelas fictícias agora. Cada
nova rota deve ganhar ficha Dxx com os mesmos campos e cenários específicos,
antes de iniciar sua revisão visual.

## Entrega e critérios de aceite

- [ ] Toda rota real tem ficha, evidência de revisão e status honesto.
- [ ] Mesma unidade/estado visual significa a mesma coisa em todos os módulos.
- [ ] Gráficos têm unidade, período, recorte e alternativa textual; zero/nulo
  diferentes; nenhuma classificação pessoal ou nota de saúde inventada.
- [ ] Formulários não perdem dados ao falhar; confirmação destrutiva e feedback
  visíveis; botões refletem a gravação real.
- [ ] Sem estouro horizontal da página no celular, texto cortado ou teclado
  cobrindo ação essencial; rolagens intencionais claramente delimitadas.
- [ ] Contraste e foco verificados nos cinco temas e decorações; fotografias
  reais não substituem camada de contraste; movimento reduzido respeitado.
- [ ] Decisões novas em DECISIONS/DESIGN, tarefas em TASKS_NOW, marcos em CHANGELOG.
- [ ] Nenhuma captura privada, credencial, exportação de usuário ou log bruto no Git.

## Prompt para retomar

> Retome a revisão visual da versão 2 pelo TASK_V2_DESIGN.md. Antes, confirme
> que TASK_V2_IMPLEMENTACAO.md está fechado e que suas migrations foram
> aplicadas/testadas. Reconcilie as rotas reais com o inventário. Para cada
> página, leia código, dados e componentes; preserve fluxos e isolamento;
> proponha uma direção coerente com a referência aprovada; implemente em
> lotes revisáveis e faça QA com dados fictícios. Se a fase funcional ainda
> estiver incompleta, relate o item concreto antes de iniciar o redesign.
