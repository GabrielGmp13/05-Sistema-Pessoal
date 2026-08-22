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
- [ ] Executar uma passagem nos temas claro, suave, nublado, estrelado e escuro
- [ ] No painel “Atmosfera”, alternar Sol/Suave/Nublado/Estrelado/Lua e confirmar persistência após recarregar
- [ ] Alternar Primavera/Verão/Outono/Inverno/Nenhum; confirmar formas claramente distintas, dissipação à direita e leitura dos links
- [ ] Confirmar que o botão de atmosfera não tem fundo/borda retangular externa em desktop/mobile; navegar por Tab e verificar foco arredondado no botão e em “Sair”
- [ ] Confirmar Lua em carvão/grafite/ardósia neutros, sem preto puro/laranja dominante; Estrelado continua azul noturno
- [ ] Por amostragem, comparar Sol+Verão, Sol+Inverno, Lua+Primavera e Estrelado+Outono; acentos, bordas, superfícies secundárias e glow devem mudar sutilmente sem tingir textos
- [ ] Selecionar Nenhum e confirmar retorno à paleta-base limpa, mantendo a iluminação escolhida
- [ ] Se o navegador guardava a decoração antiga “Noite”, confirmar que ela migra para “Nenhum” sem quebrar o painel
- [ ] Definir e restaurar a cor ambiente no resumo do perfil; confirmar que ela afeta detalhes, mas nunca pinta a barra inteira
- [ ] Com redução de movimento ativa no sistema, confirmar que partículas ficam estáticas
- [ ] Registrar evidência e passos de reprodução para cada falha
- [ ] Recarregar a página depois dos CRUDs principais para confirmar persistência

## Login e Perfil

- [ ] Login inválido exibe erro sem revelar detalhes sensíveis; login válido abre o Hub
- [ ] Acesso direto a uma rota protegida sem sessão redireciona para `/login`
- [ ] Nome, descrição, avatar e background salvam, aparecem no topo e persistem após recarregar
- [ ] Avatar/nome abre o resumo sem navegar; capa, descrição e e-mail aparecem quando disponíveis
- [ ] “Editar perfil” abre `/configuracoes`; clique externo, Escape e troca de rota fecham o resumo
- [ ] O resumo permite escolher cor ambiente local e conserva avatar, capa, descrição e e-mail legíveis
- [ ] URLs vazias mantêm o fallback do tema; URLs inválidas não quebram o layout
- [ ] Logout encerra a sessão; voltar no navegador não reabre conteúdo protegido
- [ ] Depois de entrar novamente, o botão de logout mostra “Sair” sem exigir F5

## Hub

- [ ] Resumos de estudo, Agenda e Revisão correspondem aos registros reais
- [ ] Carrossel de insights alterna manual/automaticamente e cobre os módulos com dados
- [ ] Atalhos abrem as rotas corretas e estados vazios/falhas parciais não quebram o restante
- [ ] Atualização manual reflete alterações feitas em outros módulos

## Treino

- [ ] Dashboard mostra planos, exercícios, duração semanal e sessões recentes corretamente
- [ ] Os sete módulos fixos aparecem; criar/editar/excluir treino e exercícios de força/cardio funciona com cancelamento seguro
- [ ] Imagem/GIF de exercício aceita JPG/PNG/WebP/GIF até 5 MB, reaparece por URL assinada e não deixa arquivo órfão se o cadastro falhar
- [ ] Modo Academia registra séries/cardio, conclui sessão e atualiza duração/histórico
- [ ] Shape salva peso/observação e aceita foto JPG/PNG/WebP de até 10 MB por URL assinada
- [ ] Arquivo inválido ou falha de upload em Shape exibe erro e não cria registro incompleto
- [ ] Arquivo inválido de exercício pode ser removido/substituído e bloqueia o envio enquanto inválido
- [ ] Clicar num Shape permite editar/excluir; dois registros no mesmo dia usam o mais atualizado em Saúde/Treino
- [ ] Card de Shape alterna fotos reais discretamente, não deixa faixa vazia no topo e mantém balança/peso/data/ação no rodapé em desktop/mobile
- [ ] Pontuação por modalidade corresponde às sessões concluídas

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
- [ ] “Fazer prova ENEM” inicia 5h30/5h, mantém o prazo após recarregar e salva o cartão ao finalizar
- [ ] Finalizar sem marcar respostas mostra 0 respondidas, 90 em branco, 0 acertos, 0 erros e total 90
- [ ] Resumo continua separando respondidas/em branco/acertos/erros/total após marcar algumas respostas e após corrigir
- [ ] No Dia 1, tema e imagem da redação podem ser salvos durante a prova; o vínculo reaparece em `/estudos/redacoes`
- [ ] Redação salva texto/notas/competências e foto privada; substituir/remover imagem mantém consistência
- [ ] Redação com C1–C5 em 200 salva nota total 1000 após a migration deste lote
- [ ] Controles C1–C5 avançam de 40 em 40 e rejeitam valores como 20, 201 ou negativos
- [ ] Tempo da redação aceita horas e minutos 0–59, rejeita tempo inválido e persiste após recarregar/editar

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
- [ ] CRUD de evento geral, estudo e treino preserva data, horário, duração e prioridade
- [ ] Prioridade inicia em normal, aceita baixa/normal/alta e reaparece após editar/recarregar
- [ ] No mesmo dia, eventos ficam por horário; empates usam alta, normal e baixa; sem horário fica no fim
- [ ] Provas aparecem por leitura de Estudos sem duplicação e apontam para a matéria correta
- [ ] Concluir/reabrir e excluir atualizam Hub e Agenda após recarregar
- [ ] Concluir/reabrir é visível por texto no card e no modal, não depende de interpretar apenas um ícone

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

## Temas claro, suave, nublado, estrelado e escuro

- [ ] Um único botão abre o controlador; a linha contínua indica claramente a opção selecionada
- [ ] Seleção claro/suave/nublado/estrelado/escuro funciona no login e em todas as rotas autenticadas e persiste após recarregar
- [ ] Texto, bordas, inputs, foco, alertas, favoritos, estrelas e ações destrutivas têm contraste suficiente
- [ ] Imagens, placeholders, signed URLs e background do perfil não ocultam conteúdo
- [ ] Animações respeitam `prefers-reduced-motion`

## Segurança básica

- [ ] Páginas e todas as API Routes recusam acesso sem usuário validado
- [ ] Dados continuam isolados por `user_id`/RLS; `service_role` aparece somente
      nas rotas server-side Google e nunca no bundle/cliente
- [ ] Buckets permanecem privados; arquivos abrem por signed URL e paths começam pelo usuário
- [ ] Arquivos fora de tipo/tamanho são rejeitados antes ou pelo contrato do bucket com mensagem visível
- [ ] Chaves YouTube, TMDB e BRAPI não aparecem em HTML, console, resposta ou bundle do cliente
- [ ] Nenhum fluxo usa `confirm()` ou `window.prompt`; exclusões usam `ConfirmDialog`
- [ ] Erros externos e do Supabase não exibem tokens, URLs de banco ou credenciais
- [ ] Logout, expiração e cookie inválido não liberam páginas nem APIs protegidas

## Lote de fechamento funcional — 2026-08-21

- [ ] Finanças: criar despesa em 3 parcelas com centavos, conferir soma, meses, `1/3`–`3/3`, recarga e exclusão individual.
- [ ] Finanças: criar recorrência mensal finita, conferir valor por mês e ausência de duplicação após recarga.
- [ ] Biblioteca: em cada uma das oito categorias, enviar JPG/PNG/WebP, recarregar, abrir card e substituir a capa; rejeitar formato inválido e arquivo acima de 3 MB.
- [ ] Artigos: colar URL pública, conferir título/site/autor/imagem/tempo sugeridos e cadastrar manualmente quando o site bloquear.
- [ ] Extensão: instalar/recarregar a pasta `browser-extension`, confirmar aviso antes de configurar, salvar a origem HTTPS e enviar uma página comum e um vídeo YouTube; o popup só fecha após abrir a Biblioteca.
- [ ] BRAPI: repetir consulta no intervalo curto sem quebrar fallback sem token/quota.
- [x] Testes automatizados locais: 23/23; reset Supabase e 16/16 scripts SQL.
- [ ] Após o deploy, conectar Calendar e YouTube com as contas desejadas e
      conferir os dois e-mails separadamente.
- [x] Grant server-only do cofre Google aplicado após diagnóstico `42501`;
      RLS permaneceu ativa e sem policy de cliente.
- [ ] Testar `.apkg` real com deck básico/cloze e manter CSV/TSV como fallback;
      mídia/template complexo não suportado não bloqueia a v2.1.

## Fechamento técnico de 2026-08-21

- [ ] Em Configurações, conectar/desconectar YouTube e Calendar separadamente;
      uma ação não deve alterar o estado exibido do outro serviço.
- [ ] Listar mais de uma página de playlists/vídeos, importar seleção, recarregar
      Biblioteca e confirmar que repetir a importação gera apenas duplicados.
- [ ] Exportar evento manual com e sem hora; reexportar após editar e conferir
      que o Calendar atualiza o mesmo evento. Prova de Estudos não deve ter ação.
- [ ] Perfil: enviar/substituir/remover avatar e background; recarregar e conferir
      topo global. Repetir upload privado em Receitas e Lugares.
- [ ] Provas/simulados: anexar PDF e imagem válidos, abrir por signed URL,
      substituir e rejeitar arquivo maior que 15 MB ou MIME não permitido.
- [ ] Biblioteca: além das oito capas, enviar banner em Filmes, Séries, Animes,
      Mangás, Livros e Podcasts e conferir prioridade sobre URL externa.
- [ ] Revisão: importar `.apkg` de até 25 MB, selecionar deck, revisar prévia,
      gravar, recarregar e confirmar deduplicação. Testar também pacote inválido.
- [ ] Confirmar em Network/bundle que client secret, service role, refresh token,
      chave AES e URL do banco não aparecem.
- [x] Reset local, suíte SQL, typecheck, 23 testes Node, build, audit de
      dependências, dry-run exclusivo, aplicação, pós-check e dry-run vazio.
