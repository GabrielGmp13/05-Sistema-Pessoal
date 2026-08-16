# Homologação final da v2 expandida

Checklist operacional para validar a versão publicada com uma conta de teste
autenticada. Use dados descartáveis nos testes de exclusão e **não apague o
usuário em Supabase Auth**, pois as FKs podem remover dados em cascata.

> Esta é a única etapa funcional aberta da release candidate. Consulte
> `V2_RELEASE_CANDIDATE.md` para ambiente, migrations, itens pós-v2 e tratamento
> de problemas encontrados.

## Registro da execução

- [ ] Anotar data, commit/deploy testado e URL do ambiente
- [ ] Anotar navegador, sistema, dispositivo e largura aproximada da tela
- [ ] Executar uma passagem em tema claro e outra em tema escuro
- [ ] Registrar evidência e passos de reprodução para cada falha
- [ ] Recarregar a página depois dos CRUDs principais para confirmar persistência

## Login e Perfil

- [ ] Login inválido exibe erro sem revelar detalhes sensíveis; login válido abre o Hub
- [ ] Acesso direto a uma rota protegida sem sessão redireciona para `/login`
- [ ] Nome, descrição, avatar e background salvam, aparecem no topo e persistem após recarregar
- [ ] URLs vazias mantêm o fallback do tema; URLs inválidas não quebram o layout
- [ ] Logout encerra a sessão; voltar no navegador não reabre conteúdo protegido

## Hub

- [ ] Resumos de estudo, Agenda e Revisão correspondem aos registros reais
- [ ] Carrossel de insights alterna manual/automaticamente e cobre os módulos com dados
- [ ] Atalhos abrem as rotas corretas e estados vazios/falhas parciais não quebram o restante
- [ ] Atualização manual reflete alterações feitas em outros módulos

## Treino

- [ ] Dashboard mostra planos, exercícios, duração semanal e sessões recentes corretamente
- [ ] Criar/editar/excluir módulo, treino e exercícios de força/cardio funciona com cancelamento seguro
- [ ] Imagem/GIF de exercício aceita JPG/PNG/WebP/GIF até 5 MB, reaparece por URL assinada e não deixa arquivo órfão se o cadastro falhar
- [ ] Modo Academia registra séries/cardio, conclui sessão e atualiza duração/histórico
- [ ] Shape salva peso/observação e aceita foto JPG/PNG/WebP de até 10 MB por URL assinada
- [ ] Arquivo inválido ou falha de upload em Shape exibe erro e não cria registro incompleto

## Biblioteca

- [ ] As oito categorias carregam, filtram e ordenam por recência, título, nota, favorito e status
- [ ] Cards com/sem capa mantêm layout; detalhe, edição, exclusão e metadados correspondem ao item
- [ ] Coração alterna favorito com um clique sem abrir o detalhe e sincroniza card/lista/painel
- [ ] Duração/tempo aparece e edita corretamente nas oito categorias conforme o campo real
- [ ] Notas de 0–5, gêneros, status e listas aninhadas preservam os valores após recarregar
- [ ] YouTube/TMDB funcionam com chave; ausência de chave mantém cadastro manual; fontes públicas tratam indisponibilidade
- [ ] Prévia de metadados identifica a fonte, mostra os campos úteis e orienta o cadastro manual quando a API limita ou falha
- [ ] Vídeo pode ser vinculado a Curso sem duplicação no mesmo curso

## Estudos

- [ ] Hub e áreas ENEM, Escola, Curso, Olimpíadas, Vestibulares e Outros abrem rotas válidas
- [ ] Matéria/conteúdo compartilhado não duplica a entidade e respeita os filtros de área
- [ ] CRUD de conteúdo, prova, atividade, anotação, sessão e material por URL funciona
- [ ] Upload de material aceita apenas formatos previstos, até 50 MB, e abre por URL assinada
- [ ] Curso cria módulos/aulas, conclui/reabre e exibe vídeo vinculado da Biblioteca
- [ ] Gabarito ENEM valida letra/classificação, calcula resultados e conclui a prova quando completo
- [ ] Redação salva texto/notas/competências e foto privada; substituir/remover imagem mantém consistência

## Revisão

- [ ] Card manual cria, revela resposta, recebe avaliação e é reagendado pelo SM-2
- [ ] Cards de Estudos continuam vinculados ao conteúdo correto
- [ ] Arquivar, restaurar e excluir exigem o fluxo esperado e atualizam os filtros
- [ ] CSV e TSV reais mostram prévia antes de gravar, importam módulo opcional/default e preservam acentos
- [ ] Filtro de módulo atualiza cards ativos e arquivados sem alterar os registros
- [ ] Limites de 1 MB/500 cards e deduplicação exibem mensagens claras sem importação parcial indevida

## Agenda

- [ ] Semana/mês anterior e seguinte, alternância de visão e retorno ao período atual funcionam no fuso local
- [ ] Visão mensal posiciona dias corretamente e não duplica provas ou compromissos
- [ ] CRUD de evento geral, estudo e treino preserva data, horário e duração
- [ ] Provas aparecem por leitura de Estudos sem duplicação e apontam para a matéria correta
- [ ] Concluir/reabrir e excluir atualizam Hub e Agenda após recarregar

## Diário

- [ ] Resumos de Saúde, Finanças, Lugares e Receitas usam dados atuais
- [ ] Cards e links abrem os quatro módulos e exibem estados vazios sem valores artificiais

## Projetos

- [ ] Criar, selecionar, editar status/prazo/descrição e excluir projeto funciona
- [ ] Tarefas criam e transitam entre a fazer, fazendo e feito, persistindo após recarregar
- [ ] Cancelar edição não grava alterações e nenhum projeto técnico é duplicado por Programação

## Programação

- [ ] Exibe apenas projetos identificados por repositório ou linguagem
- [ ] Criar/editar repositório, linguagem, status e destaque reflete também em Projetos
- [ ] URL de repositório válida abre em nova aba; entrada inválida recebe erro sem quebrar a tela
- [ ] Exclusão usa confirmação e não cria domínio ou dado paralelo

## Receitas

- [ ] CRUD preserva ingredientes, preparo, tempo, porções, categoria, nota e URL da foto
- [ ] Favorito e feita/não feita atualizam lista, detalhe, Hub/Diário e persistem
- [ ] Foto ausente ou URL quebrada mantém o card utilizável

## Saúde

- [ ] Sono, hidratação, humor e medicamentos salvam valores-limite válidos e rejeitam inválidos
- [ ] Registro diário de medicamento e estoque/estado ativo persistem corretamente
- [ ] Último peso vem de Shape, sem duplicação, e o atalho abre `/treino/shape`
- [ ] Exclusões usam confirmação e atualizam os resumos do Diário/Hub

## Finanças

- [ ] Categorias de entrada/saída e lançamentos atualizam totais do mês
- [ ] Orçamentos e metas calculam progresso sem divisão ou valores inválidos
- [ ] Posição exige ticker, quantidade positiva e preço médio explicitamente preenchido
- [ ] Editar/excluir posição atualiza custo acumulado; cotação nunca persiste no banco
- [ ] Valor atual, resultado e cobertura usam somente posições com cotação disponível e sinalizam cobertura parcial
- [ ] Sem `BRAPI_TOKEN`, CRUD continua funcional e a indisponibilidade é clara
- [ ] Com `BRAPI_TOKEN`, ticker válido consulta sob demanda; erro/timeout externo não quebra a página

## Lugares

- [ ] CRUD preserva localização, período, custo, nota, favorito, texto e capa por URL
- [ ] Link do Maps usa coordenadas quando presentes e fallback de nome/local quando ausentes
- [ ] Favorito, filtro, detalhe e exclusão permanecem sincronizados após recarregar

## Idiomas

- [ ] CRUD de idioma preserva nível, objetivo, cor e estado ativo
- [ ] Vocabulário cria, marca domínio e exclui com confirmação
- [ ] Práticas registram tipo/data/duração e atualizam totais semanal/mensal
- [ ] Exclusões e estados vazios não deixam seleção ou resumo obsoleto

## Histórico

- [ ] Heatmap anual, troca de ano, filtro por área e detalhe do dia usam as nove fontes esperadas
- [ ] Resumo mensal e exportação CSV respeitam ano/filtro atuais e preservam datas no fuso local
- [ ] Sessão de treino só conta quando concluída; Agenda só conta eventos concluídos
- [ ] Totais são contagens de atividade, sem somar duração, valor financeiro ou nota
- [ ] Falha parcial de uma fonte é sinalizada sem apagar os resultados das demais

## Mobile e Desktop

- [ ] Testar ao menos 360 px, 768 px e 1280 px sem corte ou rolagem horizontal da página
- [ ] Navegação global rola no mobile, mantém perfil/tema/logout acessíveis e destaca a rota correta
- [ ] Modais, painéis, menus e formulários cabem na viewport e mantêm foco/teclado utilizáveis
- [ ] Tabelas, grids, cards com textos longos e estados vazios não sobrepõem controles

## Tema claro e escuro

- [ ] Alternância funciona no login e em todas as rotas autenticadas e persiste após recarregar
- [ ] Texto, bordas, inputs, foco, alertas, favoritos, estrelas e ações destrutivas têm contraste suficiente
- [ ] Imagens, placeholders, signed URLs e background do perfil não ocultam conteúdo
- [ ] Animações respeitam `prefers-reduced-motion`

## Segurança básica

- [ ] Páginas e as duas API Routes recusam acesso sem usuário validado
- [ ] Dados continuam isolados por `user_id`/RLS e nenhuma operação usa `service_role`
- [ ] Buckets permanecem privados; arquivos abrem por signed URL e paths começam pelo usuário
- [ ] Arquivos fora de tipo/tamanho são rejeitados antes ou pelo contrato do bucket com mensagem visível
- [ ] Chaves YouTube, TMDB e BRAPI não aparecem em HTML, console, resposta ou bundle do cliente
- [ ] Nenhum fluxo usa `confirm()` ou `window.prompt`; exclusões usam `ConfirmDialog`
- [ ] Erros externos e do Supabase não exibem tokens, URLs de banco ou credenciais
- [ ] Logout, expiração e cookie inválido não liberam páginas nem APIs protegidas
