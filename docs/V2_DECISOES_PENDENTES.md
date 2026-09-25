# V2 — decisões pendentes, sem confundir com implementação

> Histórico de triagem. O estado consolidado e as decisões posteriores do
> Gabriel estão em `TASK_V2_FECHAMENTO.md`; D01/D02/D04/D06/D08/D09 desta
> fotografia não devem ser usados como perguntas ainda integralmente abertas.

Atualizado em 2026-09-17. Resposta ao pedido de Gabriel para individualizar
o que precisa de definição ou pode ser adiado para v3.

Responder por identificador: `D01: v3`, `D02: manter na v2, com ...`.
Nenhum item será considerado adiado por silêncio. Não representam entregas.
Hábitos, Metas e Arquivos já estão na v3; orçamento zero já está decidido.
O documento de redesign existe em `TASK_V2_DESIGN.md` e não é refeito aqui.
As opções e consequências de cada ID abaixo estão detalhadas em
`V2_ESCOLHAS_POR_TOPICO.md`.

## Já definido, mas ainda não concluído — não exige redefinir a ideia

| ID | Trabalho restante | Dependência real |
|---|---|---|
| I01 | ENEM: identidade de prova, tentativa independente, prazo/rascunho persistido, encerramento e trava, refazer preservando gabarito e histórico | Modelo incremental `20260917000300` preparado localmente; falta aplicação remota autorizada, migração do fluxo de UI, legado e E2E. |
| I02 | Redações: versões, avaliações com origem/data, média pessoal e nota oficial separadas; vínculo posterior à prova | Tabelas/coluna novas em `20260917000300` somente local; falta aplicação autorizada, UI, retenção das imagens de versões e E2E. Não confundir com integração automática MEC. |
| I03 | Escola/Faculdade: rótulo por conta e criar/renomear/retirar/reincluir matérias | Implementado localmente (DEC-083). CRUD de contexto, persistência, seed, falha/recuperação e duplicatas conferidos na UI local; Matemática preservada no ENEM. Leitura/alteração cruzadas recusadas na API com duas contas fictícias, rótulos independentes. Troca de contas pela UI ainda em I08. |
| I04 | Avaliações: nota máxima/peso e média ponderada; simulados: questões anuladas com totais coerentes | Migration 20260917000200 local validada: tabela privada de lançamentos, RPC invoker de média e total_anuladas. Reset/25 scripts passaram. Falta autorização remota específica, aplicação e UI/SM-2 dependentes. Não incluir Biblioteca na aplicação. |
| I05 | Biblioteca: reordenar listas dentro da obra (elenco/trilha/OP-ED), não cards do catálogo | Migration 20260917000100 preparada/testada localmente. Gabriel determinou manter local; não aplicar remotamente. UI ainda não integrada por schema-first. |
| I06 | Completar edição dos metadados já existentes nas temporadas | Anime: nomes, período/duração, equipe, links/capa, sinopse e data; séries: número/episódios/notas/data implementados localmente. Identidade externa e episódios preservados. Homologar. |
| I07 | Treino: recuperar finalização parcial, plano modificado e edição concorrente sem perder execuções | Plano divergente detectado no rascunho e nas execuções salvas, bloqueando finalização sem apagar dados. Reenvio confirma sessão já fechada sem alterar horário. Faltam E2E e política D02 de simultaneidade. |
| I08 | Homologar candidato autenticado: CRUD/recarga, reordenação, treino/falhas, gráficos, relógio e atalhos de duas contas | Login na versão local e contas de teste identificadas; aba publicada não comprova código local. |
| I09 | Regressão de segurança/dados: exportação, RLS/Storage e diff sem segredos; revisar grants incrementais | Verificações técnicas. Não fazer reset remoto nem ensaio destrutivo com conta real. |

Esses itens continuam pendentes de execução, não foram transformados em
perguntas de produto para esconder trabalho. I01–I06 podem ser mantidos sem
novas especificações funcionais; alterações remotas seguem o rito do projeto.

## Precisa de uma escolha de produto

| ID | Pendência | O que definir para manter na v2 |
|---|---|---|
| D01 | Calendário de disciplina de Treino | O que conta como falta, tolerância e reagendamento? Registrar previsões apenas de hoje em diante; não inventar faltas anteriores usando o plano atual. |
| D02 | Treino em dispositivos/abas simultâneos | Basta retomada no mesmo navegador, ou precisa trocar de aparelho durante a sessão? Em conflito, bloquear segunda edição ou escolher versão explicitamente? |
| D03 | Notificações de Treino/Revisão e ação pelo fone | Aviso na página basta, ou precisa segundo plano/tela bloqueada? Som local está implementado; entrega com navegador fechado exige infraestrutura e teste físico. |
| D04 | Metas de estudo e sequência de dias | Como o módulo Metas foi para v3, adiar também metas de estudo ou definir contagem independente? Unidade: minutos, sessões ou questões? O que interrompe a sequência? |
| D05 | Estatísticas avançadas de Estudos | Quais indicadores além de acertos/erros e motivos? Definir período, denominador e sentido de “eficiência” e conteúdo forte/fraco. |
| D06 | Revisão vinculada à Agenda | Criar evento ao agendar revisão, ligação manual ou exibição sem duplicar? Qual lado prevalece ao mudar a data? |
| D07 | Texto formatado e expansível | Quais módulos e quais ferramentas: negrito, itálico, listas, links, imagens? Desenho dentro do texto é necessário? Preservar texto legado. |
| D08 | PDF interno | Confirmar escopo: texto/desenho por cima, caneta, desfazer/refazer, salvar/reabrir e exportar. Esse núcleo foi solicitado; OCR, substituir texto original e reorganizar páginas entram ou ficam para v3? Definir limite de tamanho/páginas para protótipo. |
| D09 | Vídeo → Curso | Marcar vídeo assistido deve alterar apenas aula assistida, teoria vista ou domínio? Automático ou confirmação? Hoje são independentes. |
| D10 | Sem nova decisão exigida para edição já solicitada | Edição de metadados implementada; IDs/vínculos preservados. Não foi criado sincronizador automático para sobrescrever alterações manuais. |
| D11 | Velocidade de leitura | Contar sessões com início/fim/páginas; releitura entra? Pausas descontadas? Sem isso páginas/hora não é calculável corretamente. |
| D12 | Anki avançado | Quais tipos de cards, mídias e templates precisam funcionar? Fornecer pacote de exemplo sem dados pessoais. Scripts arbitrários não serão executados no site autenticado. |
| D13 | Banners opcionais | Manter assets/fallback existentes ou fornecer/autorizar imagens novas por categoria? |
| D14 | Saúde: lembretes | Lembrar o quê, em quais horários/frequência, e por qual canal? Tendências já têm implementação local. |
| D15 | Saúde: fotos | Qual finalidade e diferença das fotos corporais já existentes no Shape? Definir organização, limite e retenção de arquivos privados. |
| D16 | Finanças avançadas | Quais gráficos, análises, proventos e alertas? Quais ativos/fontes e frequência? Sem preço disponível, mostrar ausência, não inventar cotação. |
| D17 | Importação bancária | Qual banco/formato? Fornecer arquivo anonimizado para prévia, estornos e deduplicação. Não solicitar senha bancária. |
| D18 | Ocultação de módulos | Atalhos já implementados bastam, ou ocultar também resumos e referências no resto do site? Nunca apagar dados nem alterar permissões. |
| D19 | Exportação integral com arquivos | Exportação JSON já existe. Precisa baixar também todos os binários num pacote? Definir limite e tratamento de grandes acervos. |
| D20 | Exclusão self-service | Confirmar se manter solicitação/execução administrativa atual ou excluir diretamente pela conta, com reautenticação e prazo de recuperação. |
| D21 | Importação/scraping em lote | Quais fontes, formatos, limites e regra de duplicação? Não contornar login ou proteção de terceiros. |

## Dependências externas ou operacionais — escolher resolver ou v3

| ID | Pendência | Informação/ação necessária |
|---|---|---|
| E01 | Google Places/Maps | Mantido desligado por custo zero. Não ativar serviço faturável; adiar ou indicar alternativa gratuita permitida. |
| E02 | BRAPI avançada | Validar disponibilidade dos endpoints no plano gratuito após definir D16; sem quota não prometer histórico/automação. |
| E03 | MEC Enem automático | Link já existe. Integração depende de API oficial ou exportação permitida; não automatizar Gov.br. |
| E04 | YPT | API pública ou arquivo real anonimizado e estável. Sem isso, não há importador verificável. |
| E05 | Catálogo oficial ENEM | Aprovar estratégia de links versus cópia/armazenamento; conferir correspondência prova/gabarito, origem e manutenção. |
| E06 | Dados ENEM legados | Fornecer exportação anonimizada, se ainda existe acervo a migrar; caso contrário declarar não aplicável. |
| E07 | Google Photos Picker | Configuração/consentimento OAuth e política de cópia privada durável; disponibilidade/quota precisam verificação. |
| E08 | Google Calendar fechado | Definir calendários/conflitos e infraestrutura gratuita de webhook/renovação/retries; navegador aberto atual não entrega esse comportamento. |
| E09 | Extensão em loja | Conta de publicador, eventual taxa e revisão externa. Extensão local não equivale a publicação em loja. |
| E10 | Cadastro público | SMTP/domínio, OAuth, abuso/CAPTCHA e suporte. O piloto atual continua fechado; manter essa expansão para v3? |
| E11 | Recuperação administrativa | Fluxo privado documentado; homologação exige conta descartável autorizada e entrega por canal conhecido, sem senha/token no chat ou Git. |
| E12 | Retenção, limites, backup e orçamento de APIs | Definir limites por conta, duração de anexos e ensaio de restauração separado; não sobrescrever produção. |
| E13 | Uso real, celular e observação 24h/7d | Testes físicos e acompanhamento temporal não podem ser substituídos por testes automáticos de código. Confirmar participantes e período após publicação. |

## Evidência desta rodada

- Adicionado som opcional do descanso com ativação/teste por gesto, alternativa
  visual preservada e aviso das limitações em segundo plano. Sem notificação push.
- Nota de temporada de série voltou ao seletor de estrelas exigido por DESIGN.
- Remoção do planejamento semanal passou a exigir confirmação, sem apagar treino.
- Navegador acessível não tinha aba do site nem sessão local aberta. Homologação
  autenticada não foi executada e permanece I08; não copiar cookies de outro perfil.
- Resultados automatizados finais são registrados em TASKS_NOW/CHANGELOG.
- Nenhuma nova migration ou operação remota de banco nesta rodada.
- Sem commit/push enquanto não resolvido o fechamento autorizado da v2.
