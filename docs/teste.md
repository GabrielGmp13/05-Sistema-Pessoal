# Retestes Manuais — lote de homologação v2.1

Este arquivo contém somente verificações que dependem do deploy, de uma conta
real, de upload, de APIs externas, de mouse/toque ou de julgamento visual. Não
repita typecheck, build, testes Node/SQL ou buscas de segurança registrados pelo
Codex.

## Antes de começar

- [ ] Confirmar que o deploy contém o commit deste lote e que a migration
      `20260827000100_homologacao_fluxos_pessoais.sql` foi aplicada.
- [ ] Usar uma conta de teste com dados descartáveis; não apagar o usuário real
      no Supabase Auth, pois isso remove seus dados por cascade.
- [ ] Testar ao menos uma vez em desktop e uma vez em celular real ou em largura
      próxima de 360 px.
- [ ] Repetir a inspeção visual em um tema claro e um escuro.

## Hub

- [ ] Confirmar que “Insight pessoal” mostra somente próxima revisão, próxima
      prova e obras realmente em andamento.
- [ ] Confirmar que não aparecem vídeo genérico não assistido, total de acervo,
      curso em andamento nem tempo estudado nesse bloco.
- [ ] Criar duas obras em andamento da mesma família e observar a troca interna
      aproximadamente a cada cinco segundos, sem perder os demais cards visíveis.

## Biblioteca e metadados

- [ ] Confirmar que distribuidora, orçamento e bilheteria não aparecem em
      formulário, card ou detalhes de Filmes/Séries/Animes.
- [ ] Em Gêneros, pesquisar nomes no catálogo ampliado e criar/editar uma obra
      usando os gêneros encontrados.
- [ ] Com `TMDB_API_KEY`, pesquisar um filme e uma série; salvar e conferir
      gêneros e elenco/créditos importados nos detalhes.
- [ ] Pesquisar Anime e Mangá pelo Jikan e Livro pelo Google Books; conferir
      mensagem de busca, seleção, gêneros e salvamento.
- [ ] Simular uma busca sem resultado ou API indisponível e confirmar que o
      cadastro manual continua utilizável sem perder o que já foi digitado.

## ENEM e Redações

- [ ] Finalizar uma prova curta de teste e confirmar que o botão vira **Refazer
      prova**.
- [ ] Refazer marcando respostas diferentes; confirmar que as alternativas ficam
      editáveis e que gabarito correto, matérias e conteúdos anteriores continuam.
- [ ] Confirmar no novo resultado que respondidas, em branco, acertos, erros e
      total estão coerentes; repetir com todas em branco.
- [ ] No Dia 1, anexar uma imagem real de redação durante a prova, finalizar e
      localizar a redação em `/estudos/redacoes` para completar a correção.
- [ ] Em Redações, testar C1–C5 somente em 0/40/80/120/160/200 e duração em
      horas/minutos; salvar, recarregar e conferir total e tempo.
- [ ] Em Estudos, conferir visualmente Redações ao lado de ENEM e Escola na
      posição antes ocupada por Redações.

## Revisão e flashcards

- [ ] Importar um CSV/TSV real escolhendo matéria e conteúdo; recarregar e
      confirmar que todos os cards do lote aparecem nesses filtros.
- [ ] Repetir com um `.apkg` real: escolher deck, revisar prévia e confirmar o
      mesmo vínculo acadêmico. Mídias e templates JavaScript complexos não são
      suportados e não devem bloquear este teste.
- [ ] Em uma matéria de Estudos, abrir **Flashcards** em um conteúdo e confirmar
      que a importação já sugere esse destino.
- [ ] Iniciar a sessão focada: toque/clique revela a resposta; arrastar à esquerda
      registra erro; arrastar à direita revela as opções Difícil/Bom/Fácil.
- [ ] Repetir o gesto com mouse e touch e conferir inclinação, avanço do card e
      próxima data após recarregar.
- [ ] Confirmar que arquivar, restaurar e excluir continuam funcionando na tela
      normal de Revisão.

## Agenda e Google Calendar

- [ ] Conectar a conta **Calendar** em Configurações e manter a conexão YouTube
      independente.
- [ ] Criar no Google Calendar um evento com hora, um de dia inteiro e uma
      ocorrência recorrente dentro do período visível da Agenda.
- [ ] Clicar **Importar Calendar**, revisar a prévia e aplicar; confirmar horários
      em `America/Recife` e ausência de duplicação ao importar novamente.
- [ ] Alterar o evento no Google, consultar outra vez e confirmar “Atualizar”.
- [ ] Alterar um evento importado localmente e também no Google; confirmar que a
      prévia marca conflito e não sobrescreve automaticamente a edição local.
- [ ] Cancelar um evento no Google, importar e confirmar que ele sai da Agenda
      por exclusão lógica sem afetar provas de Estudos.
- [ ] Editar um evento importado e usar o ícone de exportação; confirmar que o
      mesmo evento remoto é atualizado, não duplicado.
- [ ] Confirmar que provas continuam visíveis, mas não selecionáveis para
      importação/exportação como compromisso comum.
- [ ] Confirmar que mês e semana aparecem juntos; escolher um dia no mês deve
      atualizar a semana abaixo sem esconder o calendário mensal.
- [ ] Com o site aberto em outra página, editar e apagar eventos no Google e
      confirmar atualização automática em até dois minutos ou ao retomar a aba.
- [ ] Criar, editar e apagar um compromisso no Sistema Pessoal e confirmar que
      a mesma mudança aparece imediatamente no Google Calendar.

## Treino

- [ ] No dashboard, adicionar um treino a um dia da semana atual; recarregar e
      confirmar persistência.
- [ ] Editar dia/treino, remover o planejamento e conferir desktop/mobile.
- [ ] Confirmar que o planejamento não cria automaticamente item duplicado na
      Agenda.

## Lugares e Google Places

- [ ] Com `GOOGLE_MAPS_API_KEY` configurada na Vercel, pesquisar um restaurante,
      parque ou cidade e selecionar um resultado visual.
- [ ] Confirmar preenchimento de nome, endereço, cidade/país quando disponíveis,
      sem campos visíveis de latitude/longitude.
- [ ] Salvar, recarregar e abrir no Google Maps; conferir que o destino é o lugar
      selecionado, não apenas uma busca aproximada.
- [ ] Testar o cadastro manual quando a busca não encontra resultado.
- [ ] Conferir capa privada, favorito, edição e exclusão lógica de um lugar.

## Responsividade, acessibilidade e beta privado

- [ ] Em tela larga, confirmar que as páginas comuns exibem coluna pessoal à
      esquerda do topo ao rodapé e conteúdo principal à direita sem comprimir
      textos, cards ou menus.
- [ ] Na Biblioteca e em Gêneros, confirmar que aparece somente a sidebar da
      Biblioteca, sem perfil/relógio/calendário como segunda coluna esquerda.
- [ ] Ao entrar na Biblioteca em tela larga, confirmar que o perfil aparece
      compacto no início do topo, transformando-se a partir do card da coluna
      esquerda; ao sair da Biblioteca, confirmar o caminho inverso. O indicador
      ativo da barra deve deslizar e o conteúdo trocar suavemente, sem piscar.
      Atmosfera e sair continuam acessíveis sem criar espaços vazios ou apertar
      a navegação.
- [ ] Ativar “reduzir movimento” no sistema e confirmar que as páginas ainda
      navegam normalmente, sem a transformação animada.
- [ ] No catálogo da Biblioteca, rolar uma coleção longa e confirmar que a
      sidebar de categorias permanece imóvel enquanto somente a área de capas
      rola; em Gêneros e no mobile, confirmar rolagem normal da página.
- [ ] Reduzir a altura da janela ou aumentar temporariamente o zoom e confirmar
      que a coluna pessoal esquerda rola com o mouse/trackpad sem cortar relógio,
      calendário, linha temporal, perfil, tema ou sair.
- [ ] Confirmar que a barra superior autenticada mostra somente navegação, sem
      perfil, seletor de tema ou botão sair.
- [ ] Confirmar que editar perfil, trocar atmosfera e sair funcionam pela coluna
      pessoal.
- [ ] Conferir relógio digital, calendário mensal, marcação de dias com eventos
      e linha temporal de Agenda/provas nos temas Sol, Nublado, Estrelado e Lua.
- [ ] Confirmar que login, prova ENEM e sessão focada de Revisão não exibem a
      coluna lateral.
- [ ] Nas páginas comuns, confirmar que o título principal começa diretamente
      no topo do conteúdo, sem rótulo pequeno como “Sistema Pessoal v2”,
      “Módulo”, “Conta” ou equivalente acima dele.
- [ ] Criar ou importar um flashcard vencido e confirmar que ele continua na
      ferramenta de Revisão Espaçada, mas não aparece como pendência de conteúdo
      no Início nem no hub de Estudos.
- [ ] Em notebook estreito/mobile, confirmar que a coluna lateral recolhe e que
      nenhuma página ganha rolagem horizontal por causa dela.
- [ ] No bloco inferior da coluna, testar acesso a Configurações e troca de
      atmosfera sem conflito com o seletor do topo.
- [ ] Nas páginas alteradas, navegar apenas por teclado e confirmar foco visível,
      fechamento de modais e ausência de armadilhas de foco.
- [ ] Conferir que cards, prévias, selects e botões não vazam horizontalmente em
      360 px e permanecem legíveis nos temas claro/escuro.
- [ ] Em janela anônima sem sessão, acessar diretamente as novas API Routes de
      Calendar e Places e confirmar resposta não autenticada, sem dados.
- [ ] Nos logs Vercel, confirmar que falhas de Calendar/Places não exibem tokens,
      cookies, headers, URLs de banco ou valores de variáveis.
- [ ] Com uma segunda conta de beta, confirmar que não aparecem eventos,
      tentativas, flashcards, planejamentos ou lugares da primeira conta.

## Modelo curto de bug

- Módulo/página:
- Navegador, dispositivo e tema:
- Dados mínimos usados:
- Passos:
- Esperado:
- Obtido:
- Print ou vídeo (sem dados sensíveis):
