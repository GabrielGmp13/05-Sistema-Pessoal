# V2 — como decidir o que ainda não foi especificado

> Alternativas históricas para consulta. `TASK_V2_FECHAMENTO.md` registra as
> escolhas posteriores do Gabriel; não reabrir PDF, metas de estudo ou troca
> de aparelho durante o Treino por causa das opções antigas abaixo.

Atualizado em 2026-09-17. Este documento separa escolha de produto de trabalho
de implementação. Responder por ID com **V2 + opção/ajuste** ou **V3**. Silêncio
não adia nada. Hábitos, Metas e Arquivos já foram adiados para V3. O orçamento
continua zero; recurso sem fonte gratuita comprovada permanece pendente, não
“concluído”. O inventário técnico de implementação é
`V2_DECISOES_PENDENTES.md`; o roteiro do redesign é `TASK_V2_DESIGN.md`.

## Funcionalidades que dependem de definição

| ID | Estado hoje | Escolhas possíveis e como funcionariam |
|---|---|---|
| D01 Disciplina de Treino | Há planejamento semanal, mas não há falta registrada. | **A:** só marcar comparecimento manual nos dias planejados, sem inferir passado. **B:** gerar faltas automaticamente após horário/tolerância definidos e permitir justificar/reagendar. B exige regras de fuso, atraso e edição retroativa. |
| D02 Duas abas/aparelhos no Treino | Rascunho fica no navegador; UUIDs estáveis evitam duplicação num reenvio. Divergência do plano agora bloqueia finalização, mas simultaneidade não é resolvida. | **A:** uma aba ativa; detectar segunda abertura e oferecer somente leitura/retomar na primeira. **B:** sincronizar rascunho no banco e permitir trocar aparelho; conflito mostra as duas versões e exige escolha. B precisa migração e teste entre dispositivos. |
| D03 Avisos/fone | Som de descanso funciona com página aberta e gesto prévio. | **A:** aviso na tela + som local, sem promessa em segundo plano. **B:** notificação com navegador fechado/tela bloqueada e controles pelo fone, dependente de permissões, infraestrutura gratuita e teste físico. |
| D04 Metas/sequência de Estudos | Módulo Metas foi à V3; Estudos registra tempo/questões, mas não uma meta diária independente. | **A:** adiar junto com Metas. **B:** meta interna de minutos, sessões ou questões, com alvo e regra de dias sem estudo/férias definidos. A sequência só pode ser calculada após escolher unidade e corte do dia. |
| D05 Estatísticas de Estudos | ENEM já tem percentuais e motivos básicos; não há definição de “eficiência”. | **A:** indicadores descritivos por período (tempo, respondidas, acertos) sem ranking. **B:** classificar conteúdos fortes/fracos e eficiência, exigindo peso, mínimo de amostra e denominador; não inventar TRI. |
| D06 Revisão/Agenda | Revisão tem data própria; Agenda guarda eventos separados. | **A:** mostrar revisões na Agenda como leitura derivada, sem duplicar registro. **B:** criar evento vinculável e sincronizar alterações nos dois sentidos, com regra de precedência e cancelamento. |
| D07 Texto formatado | Entradas atuais são texto simples/formatos próprios. | **A:** negrito, itálico, listas e links só nos campos escolhidos, preservando texto legado. **B:** editor rico com imagens/desenho, sanitização e armazenamento de mídia; indicar módulos exatos. |
| D08 PDF interno | Documentos podem ser guardados/abertos; não há anotador completo. | **A:** camada de anotações (texto/caneta), desfazer, salvar/reabrir e exportar, sem alterar o PDF original. **B:** também OCR, edição do texto original e páginas; aumenta muito complexidade. Definir tamanho/páginas máximos para qualquer opção. |
| D09 Vídeo→Curso | “Vídeo assistido”, aula e domínio são estados independentes. | **A:** só sugerir uma aula relacionada, confirmação manual. **B:** marcar automaticamente aula/teoria/domínio; dizer qual estado e se desfazer vídeo reverte o curso. |
| D10 Metadados de temporadas | Editores locais ampliados sem sobrescrever episódios/IDs. | Não há decisão pendente para essa edição. Falta homologação e publicação. Sincronização automática de metadados externos seria outro pedido. |
| D11 Velocidade de leitura | Progresso de páginas não tem tempo confiável. | **A:** sessões com início/fim, páginas lidas e pausa explícita; velocidade = páginas/tempo ativo. **B:** cronômetro contínuo automático; decidir tempo ocioso, releitura e edição de sessão. |
| D12 Anki avançado | Importação básica/cloze existe. | **A:** suportar tipos/templates de um pacote real anonimizado. **B:** compatibilidade ampla com mídia e cartões customizados, sem executar scripts arbitrários. Fornecer pacote de exemplo e resultado esperado. |
| D13 Banners | Há assets/fallbacks atuais. | **A:** conservar até o redesign. **B:** fornecer ou autorizar novas imagens por categoria, com licença/estilo e critério de fallback. |
| D14 Lembretes de Saúde | Há acompanhamento e gráficos locais, não lembretes gerais. | **A:** lembrete dentro da página ao abrir. **B:** horários e push/segundo plano; definir o evento (medicação, medida, consulta etc.), recorrência e canal. |
| D15 Fotos de Saúde | Shape já guarda fotos corporais privadas. | **A:** reaproveitar Shape, sem segundo acervo. **B:** acervo de Saúde com finalidade distinta, organização, limite, retenção e exclusão definidos. |
| D16 Finanças avançadas | Há registros e alguns dados sob demanda; não há contrato para proventos/alertas. | **A:** gráficos apenas dos lançamentos próprios, sem preço externo. **B:** cotação, proventos e alertas para ativos/fontes/frequência especificados; ausência de fonte gratuita aparece como indisponível. |
| D17 Importação bancária | Não existe fluxo validado. | **A:** importar CSV/OFX de banco/formato escolhido, mostrar prévia e deduplicar antes de gravar. **B:** integração direta com banco, dependente de API autorizada e possivelmente custo. Nunca fornecer senha bancária. |
| D18 Ocultação de módulos | Atalhos por conta já são ocultáveis; dados e permissões permanecem. | **A:** limitar ocultação à navegação. **B:** ocultar também cards/resumos/referências no painel e busca, mantendo acesso por URL e exportação; especificar superfícies. |
| D19 Exportação com arquivos | JSON integral e inventário de anexos existem; binários não vão no pacote. | **A:** manter JSON + solicitar arquivos separadamente. **B:** ZIP com todos os binários privados, limite de tamanho, paginação e falhas parciais definidos. |
| D20 Exclusão da conta | Solicitação/execução administrativa documentada, sem botão de apagamento imediato. | **A:** manter atendimento administrativo com confirmação. **B:** self-service com reautenticação, janela de recuperação e política de backups definidas. |
| D21 Importação em lote/scraping | Não há fonte ou formato contratado. | **A:** importar arquivo fornecido com prévia e regra de duplicatas. **B:** coletar de fontes externas permitidas, com URL, frequência, termos de uso e limites; não contornar login/proteção. |

## Serviços e decisões operacionais

| ID | Estado hoje | Escolha/condição para V2 |
|---|---|---|
| E01 Places/Maps | Desligado por custo zero. | Adiar ou indicar serviço gratuito permitido e quota suficiente; mapa estático/manual é alternativa funcional distinta. |
| E02 BRAPI | Consultas gratuitas não garantem todo histórico/automação. | Definir D16 e verificar endpoints/quota atuais; sem cobertura, exibir indisponibilidade ou adiar. |
| E03 MEC Enem | Link externo disponível, sem API de correção. | Manter link/manual ou fornecer API/exportação oficial documentada; não automatizar login Gov.br. |
| E04 YPT | Sem API/arquivo validado. | Enviar exportação real anonimizada ou documentação pública estável; caso contrário V3. |
| E05 Catálogo ENEM | Upload manual existe; catálogo oficial completo não. | Escolher links oficiais mantidos externamente ou cópia privada de PDFs/gabaritos, com checagem de edição/dia/caderno e direitos. |
| E06 Legado ENEM | Não há amostra do acervo antigo para migrar. | Fornecer arquivo anonimizado e mapa esperado ou declarar que não existe; então encerrar como não aplicável. |
| E07 Google Photos | Sem Picker homologado. | Configurar OAuth/consentimento e decidir cópia durável privada versus referência externa; verificar quota/custo antes de integrar. |
| E08 Calendar fechado | Integração atual não demonstra entrega confiável com navegador fechado. | Definir calendários e conflitos; exigir webhook/renovação/retry gratuitos, ou restringir a sincronização manual com página aberta. |
| E09 Loja de extensão | Extensão local não é publicada. | Conta de publicador, eventual taxa e revisão da loja; sem isso permanecer local/não concluída. |
| E10 Cadastro público | Piloto fechado para amigos. | V3 ou definir provedor de e-mail, domínio, proteção contra abuso e suporte, sem ampliar acesso implicitamente. |
| E11 Recuperação administrativa | Procedimento privado documentado, sem ensaio final. | Testar com conta descartável e canal de entrega conhecido; nunca colocar senha/token no chat ou Git. |
| E12 Retenção/backup/limites | Sem política completa de quotas e restauração ensaiada. | Definir limites por conta/anexo, prazo de retenção e restaurar em ambiente separado; não testar sobre produção. |
| E13 Uso real/celular/tempo | Automação não substitui observação de amigos. | Definir participantes, aparelhos e janela 24h/7d após publicar; registrar falhas e corrigir antes de declarar lançamento concluído. |

## Dependências de banco já definidas, sem decisão de produto

- `20260917000100` Biblioteca: **manter local**, conforme orientação explícita
  de Gabriel. É a ordem de elenco/trilha/aberturas **dentro da obra**, não dos
  cards do catálogo. UI não será ativada antes da aplicação autorizada.
- `20260917000200` Avaliações/anuladas: SQL local validado; falta autorização
  específica para precheck/dry-run/aplicação isolada e depois UI.
- `20260917000300` ENEM/Redações: SQL local validado; falta revisão/aplicação
  autorizada e transição de interface/legado. Não executar `db push` da cadeia
  inteira, pois incluiria Biblioteca sem autorização.

Nenhuma dessas três migrations foi aplicada em produção nesta rodada.
