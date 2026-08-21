# Checklist de Teste Manual — Sistema Pessoal v2.1

## Reteste pendente — commit d5a8b7e

O lote está publicado, mas os itens abaixo **ainda não foram confirmados por Gabriel em produção**. Marcar somente após o teste manual, preservando os relatos históricos deste documento.

- [ ] Redação com C1–C5 = 200 e total 1000.
- [ ] Rejeitar competência 20, negativa e acima de 200.
- [ ] Tempo de redação: 00:00, 01:30, minuto 60, edição e recarga.
- [ ] Prova ENEM finalizada em branco: 0 respondidas, 90 em branco.
- [ ] Prova ENEM com algumas e todas respondidas.
- [ ] Dia 1: anexar imagem válida da redação.
- [ ] Dia 1: rejeitar imagem inválida e maior que 10 MB.
- [ ] Redação vinculada aparece depois em `/estudos/redacoes`.
- [ ] Card de Shape com foto, sem foto, peso/data/botão no rodapé.
- [ ] Card de Shape nos temas claro, suave e escuro.
- [ ] Desktop e mobile.

O novo topo deste lote também precisa de homologação separada nos cinco temas:

- [ ] Controlador de clima abre no login e no topo autenticado; seleção persiste após recarregar.
- [ ] Nublado e estrelado mantêm contraste em Hub, Biblioteca e Treino.
- [ ] Dropdown de perfil mostra os dados disponíveis, fecha por clique externo/Escape/troca de rota e abre “Editar perfil”.

Baseado no roteiro gerado pelo Codex (commits `740ada1`/`3b4cbd6`). Este é o
formato de execução: sessões curtas, marcáveis, com prioridade. O roteiro
completo continua sendo a referência pra "Não É Bug Se" quando alguma coisa
parecer estranha — antes de registrar como bug, confira lá.

**Legenda de prioridade**
- 🔴 Novo/recente — sem histórico de correção anterior, testar com atenção total
- 🟢 Módulo antigo — já passou por várias rodadas de correção, teste mais leve serve

## Correções publicadas para reteste — 2026-08-20

O relato original abaixo foi preservado. Estes itens foram corrigidos,
validados e publicados; ainda precisam do reteste manual de Gabriel:

- [x] Estado “Saindo...” resetado entre logout e novo login.
- [x] Contraste dos botões primários de Treino alinhado a tokens compartilhados.
- [x] Arquivo inválido de exercício ganhou erro, remoção, substituição e bloqueio de envio.
- [x] Shape ganhou edição/exclusão por clique; Saúde usa o registro mais atualizado do dia.
- [x] Dashboard de Treino ganhou fotos reais do Shape e pontuação derivada de sessões.
- [x] Agenda expõe “Concluir/Reabrir” com texto no card e no modal.
- [x] Tema suave, metadados adicionais e base cronometrada do ENEM implementados.
- [x] Falha de Redações rastreada ao tipo de `nota`; migration incremental criada.
- [x] Reset/12 testes, dry-run exclusivo, aplicação autorizada e pós-check vazio concluídos.

**Antes de começar**
- [x] URL de produção aberta, conta Supabase existente à mão
- [x] Arquivos de teste prontos: 1 imagem, 1 GIF, 1 PDF, 1 CSV, 1 TSV (pequenos)
- [ ] Navegador + versão anotados
- [x] Anotar se `TMDB_API_KEY`/`YOUTUBE_API_KEY`/`BRAPI_TOKEN` estão configuradas (senão, pular os passos que dependem delas — não é bug)

---

## Sessão 0 — Smoke test (10–15 min, rodar primeiro)

Passada rápida em tudo, só pra achar quebra óbvia antes de investir tempo no
resto.

- [x] Abrir `/` deslogado → confirma redirect pra `/login` BUG: quando entro no site pela primeira vez, deslogo dele e entro de novo o botão "sair" fica como "saindo..." onde só volta a deslogar caso eu de f5
- [x] Login com credencial errada → erro sem entrar
- [x] Login com credencial certa → entra
- [x] Clicar em cada item da navegação uma vez — nenhum dá erro/tela branca
- [x] Alternar tema claro/escuro uma vez SUG:adicionar mais temas a escolha do usuário
- [x] Abrir o Hub, confirmar que carrega sem travar

Se algo cair aqui, corrigir antes de seguir pras sessões detalhadas.

---

## Sessão 1 — Login, Perfil, Navegação, Temas 🟢

- [x] Logout → tentar Voltar/recarregar rota privada → deve pedir login de novo
- [x] Abrir `/configuracoes`: editar nome, descrição, URL de avatar e background
- [x] Salvar, conferir topo, **recarregar** e confirmar que persistiu
- [x] Testar nome vazio e URL inválida → devem ser rejeitados
- [x] Navegação: abrir cada item do menu, conferir destaque da seção ativa
- [x] Abrir Saúde/Finanças/Lugares/Receitas pelo Diário (não ficam no topo)
- [x] Tema claro → recarregar → confirma que persistiu; repetir no escuro
- [x] Testar navegação em tela estreita (~360px)

---

## Sessão 2 — Treino + Shape 🟢

- [x] Confirmar os 7 módulos fixos (Cardio, Força, Resistência, Hipertrofia, Flexibilidade, Mobilidade, Potência)
- [x] Criar treino, adicionar exercício de força E de cardio no mesmo treino BUG: cores da página que criar treinos não está com o novo contraste dos botões. ao criar exercicio dentro de algum treino ao tentar adicionar imagem maior que o limite de 5mb ele avisa, mas não tem a opção de deletar a imagem precisando que o usuario coloque outra imagem dentro do limite ou atualize a página, uma vez que não consegue adicionar o novo exercicio.

AVISO DE ERRO RECORRENTE EM MUITAS PARTES DO SITE: o botão no tema claro tem um tom de verde claro enquanto no modo escuro um tom de cinza claro. ambos não tem um bom contraste com os temas, esse problema foi mencionado e solucionado isoladamente em biblioteca.
- [x] Abrir Academia, registrar séries, marcar cardio, finalizar sessão SUG: o card de shape que fica na página de treino, poderia mostrar de backgroud imagens que estão salvas em shape, matenha tudo o nome evolução, o nome shape, o simbolo, a pesagem a data e o botão abrir shape, apenas faça com que mostre dados de shapes e sua foto e fique passando para o lado sozinho
- [x] Conferir resumo no dashboard de Treino SUG: não sei se faz parte das funções que ainda não foram adicionadas, mas gostei de todo o dashboard de treino, falta apenas o esquema de gráficos como se fosse pontuação pessoal. aquilo de eu ao longo do tempo ter pontos em cada modulo de treino e ter um grafico gamificado.
- [x] Excluir exercício e treino (confirma modal, não `confirm()` nativo)
- [x] Shape: registrar peso sem foto, depois com foto válida
- [x] Testar imagem >10MB ou formato errado → deve rejeitar
- [ ] Recarregar, conferir foto e peso persistidos BUG: depois de registrar um shape, ao clicar no shape não consigo editar os dados dele nem mesmo apagar, crie uma forma de eu poder editar e apagar o shape ao clicar na foto dele
- [ ] Abrir Saúde e confirmar que o peso aparece lá **sem duplicar** o dado BUG: o dado aparece sem erro, mas ele não mostra o ultimo shape criado e sim o primeiro shape criado do dia. ou seja, como shape de certa forma é algo adicionado uma vez por dia vai funcionar, mas caso seja adicionado outro no mesmo dia ele fica preso ao primeiro.

---

## Sessão 3 — Biblioteca + Metadados + Vídeo→Curso

🟢 CRUD básico / 🔴 Vídeo→Curso e metadados externos são mais recentes

- [ ] Cadastrar 1 item de cada categoria: Filmes, Séries, Animes, Mangás, Livros, Podcasts, Vídeos, Artigos SUG: importar mais dados das apis, da imdb apenas foi importado nome, foto, ano e duração. PEN: api para importar dados para animes, mangas, livros. a criação de playlist dos vídeos de biblioteca, até mesmo vinculado a conta google exibir em playlist as salvas da conta google no youtube, como assistir mais tarde etc. importar artigo pelo edge, pendencia de extensão.
- [x] Clicar no coração do card → favorita sem abrir o detalhe
- [x] Abrir detalhe clicando no corpo do card → favoritar de lá também → checar se os dois lados ficam sincronizados
- [x] Buscar dentro de cada categoria, testar as 5 ordenações (recente/título/nota/favorito/status)
- [x] Editar um item, recarregar, confirmar persistência
- [x] Excluir com modal de confirmação
- [ ] 🔴 Buscar metadado real: TMDB (filme/série), Jikan (anime/mangá), Google Books, iTunes, URL do YouTube — conferir que é só **prévia**, e que salvar ainda exige confirmação manual
- [x] 🔴 Testar um fluxo de metadado **sem** a API key configurada → deve cair pro cadastro manual sem quebrar
- [x] 🔴 Vídeo→Curso: abrir detalhe do vídeo, "Usar em Curso", vincular a módulo existente e a um módulo novo
- [x] 🔴 Tentar vincular o mesmo vídeo de novo no mesmo curso → deve bloquear duplicata
- [x] 🔴 Conferir que a aula aparece certinho dentro do curso em Estudos

---

## Sessão 4 — Estudos + Revisão Espaçada 🟢
SUG/BUG: não sei se ainda não foi implementado mas não tem a função fazer prova enem que tanto comentei, onde eu aperto em fazer prova, e começa um cronometro com o tempo real de prova do enem e eu tenho que até esse tempo chegar em 0, colocar o gabarito, ficando apenas de fora de por na hora a redação. pergunte caso tenha dúvidas.
- [x] Criar matéria, criar conteúdo, vincular o **mesmo conteúdo** a duas matérias (checa N:N)
- [x] Marcar teoria vista e domínio manual
- [x] Criar prova/atividade, questão avulsa, simulado
- [x] 🔴 Confirmar que **simulado com conteúdo** cria/atualiza card em Revisão Espaçada, e que **prova** nunca faz isso
- [x] Criar curso → módulo → aula, marcar aula concluída e desmarcar
- [x] Anexar material por URL e por upload de arquivo — abrir depois via URL assinada
- [x] Criar redação com notas C1–C5 BUG:Não foi possível salvar a redação. (Nâo foi possível crir a redação)
- [x] Registrar sessão de estudo (tempo) e conferir se aparece em algum resumo (: ESSA FUNÇÃO DEVE APENAS SER IMPORTADA DO YPT, mas está funcionando)
- [x] Revisão Espaçada: avaliar um card, conferir que intervalo/próxima data mudam
- [ ] Importar CSV e depois TSV com prévia antes de gravar
- [ ] 🔴 Testar duplicata na importação → deve ignorar, não duplicar
- [ ] Arquivar e restaurar um card

---

## Sessão 5 — Agenda 🔴

- [x] Criar evento geral, evento de estudo (matéria+conteúdo) e evento de treino (vinculado a treino real)
- [x] Alternar visão semana/mês, navegar com anterior/próximo/hoje
- [ ] Concluir e reabrir evento Não achei nada sobre concluir
- [x] Editar e excluir evento
- [x] Criar prova em Estudos → conferir que aparece na Agenda **sem duplicar**
- [x] Testar virada de mês (evento no último/primeiro dia)

---

## Sessão 6 — Diário / Saúde / Finanças / Investimentos / Lugares / Receitas 🔴 (tudo novo)

- [x] Diário: abrir `/diario`, conferir os 4 resumos, abrir cada módulo pelo atalho
- [x] Saúde: registrar sono, água, humor, energia, observação numa data
- [x] Saúde: criar medicamento, marcar/desmarcar tomado hoje
- [x] Testar limites de campo (sono fora da faixa, escala 1–5 fora do range)
- [ ] Finanças: criar categorias de entrada/saída, lançar 2 movimentos, conferir saldo do mês
- [ ] Trocar mês selecionado, editar e excluir lançamento
- [ ] Criar orçamento por categoria/mês → salvar de novo a mesma combinação → deve **atualizar**, não duplicar
- [ ] Criar meta de economia, atualizar valor
- [ ] Investimentos: cadastrar posição manual (tipo/ticker/qtd/preço médio)
- [ ] Se tiver `BRAPI_TOKEN`: consultar cotação, conferir valor atual/resultado
- [ ] Testar sem token → interface deve avisar sem quebrar Finanças
- [ ] Lugares: cadastrar com endereço e com lat/long, testar link do Maps
- [ ] Receitas: cadastrar com e sem foto, marcar favorita e "feita"
- [ ] Reload em cada um dos 5 sub-módulos, confirmar persistência

---

## Sessão 7 — Projetos + Programação 🔴

- [ ] Criar projeto, adicionar tarefas nas 3 colunas (a fazer/fazendo/feito)
- [ ] Mover tarefas entre colunas, mudar estado do projeto (ativo/pausado/concluído)
- [ ] Criar projeto pela tela de Programação (linguagem, URL de repo)
- [ ] Testar URL de repo inválida
- [ ] Marcar destaque → conferir se aparece como insight no Hub
- [ ] Confirmar que o mesmo projeto aparece nas duas telas (Projetos e Programação) — editar/excluir num lado reflete no outro, sem duplicar

---

## Sessão 8 — Idiomas 🔴

- [ ] Criar idioma (nível, objetivo, cor, ativo)
- [ ] Adicionar 2 palavras de vocabulário, marcar/desmarcar como dominada
- [ ] Registrar práticas de tipos diferentes em datas diferentes
- [ ] Conferir totais da semana e do mês (testar perto da virada de semana se der)
- [ ] Excluir palavra, prática e idioma (checar que não afeta outros idiomas)

---

## Sessão 9 — Histórico / Heatmap 🔴

Rodar **depois** de já ter dado nas sessões 2–8, pra ter dado real de todas as
7 áreas (Treino, Estudos, Agenda, Revisão, Saúde, Finanças, Idiomas).

- [ ] Abrir `/historico`, selecionar o ano
- [ ] Filtrar por cada uma das 7 áreas
- [ ] Clicar num dia com atividade, conferir detalhe
- [ ] Comparar a contagem do dia com o dado de origem real
- [ ] Exportar CSV, abrir e conferir datas/áreas/totais
- [ ] Confirmar que treino não finalizado e evento não concluído **não** entram na contagem
- [ ] Confirmar que posições de investimento **não** aparecem no heatmap

---

## Sessão 10 — Uploads / Storage (passe transversal)

Já tocado nas sessões acima (Shape, exercício, redação, materiais) — usar
esta sessão só pra reforçar os casos de erro:

- [ ] Cada tipo de upload aceita o formato certo e rejeita o errado
- [ ] Cada tipo respeita o limite de tamanho (Shape 10MB / exercício 5MB / redação 10MB / materiais 50MB)
- [ ] Arquivo abre autenticado depois de recarregar a página
- [ ] Substituir um arquivo já enviado não deixa link quebrado apontando pro antigo

---

## Sessão 11 — Segurança básica + Persistência final

- [ ] Rota privada sem sessão → bloqueia
- [ ] Depois de logout, nenhuma página privada aparece brevemente com dado antigo
- [ ] Inspecionar network/código-fonte da página → nenhuma key (TMDB/YouTube/BRAPI) aparece no cliente
- [ ] **Recarregar cada módulo principal uma última vez** e conferir que tudo que foi criado nesta rodada de testes ainda está lá

---

## Registro de bug (usar pra cada problema encontrado)

```
Módulo:
Página:
Passos:
Esperado:
Obtido:
Print:
Tema (claro/escuro):
Dispositivo/largura:
Navegador:
Persiste após recarregar?:
```

---

## Ordem sugerida de execução

Se for testar em blocos de tempo separados, essa ordem prioriza o que tem
mais chance de esconder bug real primeiro:

1. Sessão 0 (smoke test) — sempre primeiro
2. Sessão 6 (Diário/Saúde/Finanças/Investimentos/Lugares/Receitas) — mais novo, mais superfície
3. Sessão 5 (Agenda) — cruza dado de vários módulos, propenso a duplicação
4. Sessão 3 (Biblioteca, foco em Vídeo→Curso e metadados)
5. Sessão 7 (Projetos/Programação) — dois telas, um dado só, risco de duplicar
6. Sessão 8 (Idiomas)
7. Sessão 9 (Histórico) — depende de dado das outras, rodar quase por último
8. Sessões 1, 2, 4 (Perfil/Nav, Treino, Estudos/Revisão) — módulos mais maduros, teste mais rápido
9. Sessões 10 e 11 (Uploads/Segurança/Persistência) — fechamento

---

## Segunda rodada de homologação — relato e tratamento em 2026-08-20

Os relatos abaixo foram acrescentados sem alterar os registros anteriores.
`[x]` significa **corrigido em código**; a confirmação na versão publicada
continua separada em `[ ]`.

### Redações

- Relato: competências C1–C5 precisavam seguir os passos reais do ENEM
  (`0`, `40`, `80`, `120`, `160`, `200`) e a redação precisava registrar o
  tempo em horas/minutos.
- [x] Inputs e validação rejeitam notas fora da sequência; a soma permanece 0–1000.
- [x] Tempo opcional foi adicionado ao formulário, à edição e ao resumo do card;
  minutos fora de 0–59 e tempo negativo são rejeitados.
- [x] Migration de duração passou validação local e foi aplicada em produção com pós-check vazio.
- [ ] Retestar criação e edição com C1–C5 em 200 e tempos `00:00`, `01:30`,
  minuto `60`, valor `20` em competência e recarga da página.

### Fazer prova ENEM

- Relato: finalizar sem responder mostrava `90/90 lançadas`; no Dia 1 também
  faltava anexar a redação feita durante a prova.
- [x] O resumo separa respondidas, em branco, acertos, erros e total, contando
  `letra_marcada = NULL` como branco.
- [x] Dia 1 permite informar tema, anexar/substituir imagem e salvar o vínculo
  existente `provas.redacao_uuid`; a redação fica disponível para completar em
  `/estudos/redacoes`.
- [ ] Retestar finalização com 0, algumas e 90 respostas, antes/depois da correção.
- [ ] Retestar upload válido, arquivo inválido/maior que 10 MB, recarga e abertura
  posterior da redação vinculada.

### Card de Shape no dashboard de Treino

- Relato: mover balança, peso, data e “Abrir Shape” para baixo, preservar a foto
  rotativa e remover a pequena faixa sem imagem no topo do card.
- [x] Conteúdo de evolução foi dividido em cabeçalho limpo e rodapé; fundo e
  máscara cobrem toda a área interna, inclusive a borda superior.
- [ ] Retestar com/sem foto e peso em desktop/mobile, nos temas claro, suave e escuro.
