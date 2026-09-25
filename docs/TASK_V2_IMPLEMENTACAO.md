# Task — versão 2: fechamento de todas as implementações

## Pedido e estado

Triagem individual para resposta do Gabriel: `V2_DECISOES_PENDENTES.md`.
O documento separa implementação restante de escolhas e bloqueios externos.

Em 2026-09-15, Gabriel incluiu **todas as ideias futuras** de BACKLOG/VISION
no objetivo da versão 2, além das funcionalidades anteriormente especificadas.
Autorizou commit e push após concluir as pendências, seguidos de planejamento
do redesign de todo o site. O redesign será uma etapa posterior.

**Estado: em execução, incompleto.** Este documento não é um anúncio de release,
uma homologação, nem autorização para despesas ou alterações remotas de banco.
O manifesto permanece 0.2.0. A “versão 2” deste pedido é o próximo marco do
produto, distinto das fases históricas v2/v2.1 de migração do frontend.

### Ajuste aprovado em 2026-09-16

Gabriel adiou **Hábitos, Metas e Arquivos** para a **v3**, após reformular suas
expectativas e documentar especificações/mudanças depois do lançamento da v2.
Esses três módulos não bloqueiam mais a v2 e não estão implementados.
O orçamento permanece **zero**. Integrações indisponíveis ou dependentes de
custo devem permanecer explicitamente bloqueadas, nunca marcadas concluídas.
As demais pendências funcionais abaixo não foram automaticamente adiadas.

Fontes: `BACKLOG.md`, `VISION.md`, `EVOLUCAO_ESTUDOS_EDITORES.md`, `ROADMAP.md`,
`ideigeral.txt`, `TASKS_NOW.md`, código e schema documentado. Checkboxes antigos
podem estar superados. A prioridade de implementação deixou de ser o escopo
congelado da v1, mas segurança, custo aprovado e schema-first permanecem.

## Ordem de execução e critério de pronto

1. Conferir cada item abaixo no código; separar registro histórico de falta real.
2. Concluir integridade e persistência de Treino, incluindo falhas de conexão.
3. Preparar migrations incrementais para cada domínio; testar em banco local.
4. Antes do frontend que usa coluna nova: dry-run revisado, autorização remota
   específica e confirmação de aplicação no banco de produção.
5. Implementar Estudos/ENEM, Biblioteca, personalização e módulos novos em
   lotes que possam ser testados sem misturar dados dos participantes.
6. Integrar serviços após confirmar API, credenciais, quota, consentimento e
   custo; indisponibilidade externa não pode ser apresentada como concluída.
7. Testes comportamentais, isolamento de duas contas, recarregamento, caminhos
   de erro, mobile físico, regressões e revisão de dados privados no diff.
8. Commit/push autorizados pelo pedido, **após a conclusão solicitada**. Não
   confundir o envio de um lote parcial com o fechamento deste objetivo.
9. Iniciar `TASK_V2_DESIGN.md` depois do fechamento funcional; reconciliar seu
   inventário, pois novas páginas poderão ter sido criadas até lá.

Um item só fica concluído com implementação, teste e evidência registrada.
“Preparado”, “planejado”, “depende de terceiro” e “aceito para depois” não
significam implementado. Nenhuma integração deve virar um botão sem ação.

## Lote de Treino iniciado neste chat

| Item | Estado atual / próxima ação |
|---|---|
| Gráficos de peso/carga e página Cardio | Código local herdado da rodada anterior; revisão encontrou limite buscando registros antigos e agrupamento sem ano. Corrigidos localmente; revisão visual continua pendente. |
| Reordenação força/cardio | Migration `20260915000100` aplicada, pós-checks e dry-run final aprovados. UI local com setas e função transacional integrada; homologação autenticada pendente. |
| Grupo muscular e instruções/dicas | Banco aplicado; formulário e exibição local implementados. Registros antigos preservados sem classificação inventada. Homologar. |
| Volume por grupo | Implementado localmente com paginação semanal, somente séries concluídas de sessões finalizadas. Séries e carga × repetições separadas; grupo atual e “Sem classificação”. Teste unitário aprovado; homologar UI. |
| Modo Academia: falhas | Verifica gravações antes do sucesso; UUIDs persistidos em rascunho antes do envio e recuperados do banco após envio parcial. Não oferece transação completa; testar queda/recarga autenticada. |
| Descanso | Timer visual com prazo absoluto recuperável no mesmo navegador. Som opcional implementado localmente, ativado/testado por gesto explícito. Homologar áudio real; notificações/segundo plano seguem pendentes, sem garantia com navegador fechado. |
| PR | Consulta somente séries concluídas de sessões finalizadas e ativas. Falha de histórico não inventa recorde zero. Homologar. |
| Edição de planos/exercícios | UI local implementada, incluindo imagem/grupo/instruções. Homologar CRUD e substituição de imagem. |
| Calendário de disciplina | Pendente auditoria/implementação: concluído, com PR, previsto e faltante. Planejamento semanal editável não é prova histórica de falta; não fabricar retrospecto. |
| Continuidade de sessão | Implementação local: início explícito, retomada da última sessão aberta, rascunho por conta/sessão e IDs estáveis. Alteração incompatível do plano agora é detectada no rascunho **e** nas execuções salvas; a finalização é bloqueada sem sobrescrever dados até restaurar exercícios. E2E pendente. Não sincroniza entre dispositivos nem resolve edição simultânea (D02). Tempo de sessão inclui pausas. |

Retomada de 2026-09-16: banco aplicado após autorização, dry-run e pós-check;
23 scripts SQL aprovados (105 checks/quatro funções). Frontend local integrado
conforme tabela. 114 testes Node, typecheck e lint aprovados. Revisão visual
autenticada pendente: o navegador disponível não conserva o login informado.
Não reaplicar migration, não tratar este lote como fechamento da v2 integral.

## Inventário completo de trabalho restante

### Conta, operação e qualidade

- [ ] Conferir primeiro ciclo real dos amigos, troca de senha, recuperação,
  exportação, exclusão e suspensão; o uso de amigos foi relatado por Gabriel,
  mas não comprova individualmente cada caminho de homologação.
- [ ] Recuperação administrativa privada: ferramenta/fluxo revisados com
  identidade confirmada, expiração e reutilização testadas; nunca chave admin
  no navegador, token no Git ou senha solicitada ao titular.
- [ ] Gestão de conta self-service e exportação integral incluindo binários:
  JSON de registros e inventário já existem; dimensionar streaming, autorização,
  expiração e limites para os arquivos privados e confirmar exclusão destrutiva.
- [ ] Limites persistentes por usuário, orçamento de chamadas externas e testes
  E2E autenticados; configurar contas fictícias e isolamento do ambiente.
- [ ] SMTP/remetente, URLs/templates, limites, CAPTCHA e OAuth publicado/verificado
  para cadastro irrestrito. Piloto continua fechado enquanto não concluídos.
- [ ] Aprovar operação de retenção/prints, incidentes, acesso administrativo e
  orçamento de armazenamento; ensaiar restauração separada sem sobrescrever produção.
- [ ] Hardening de GRANTs e `rls_auto_enable()`/`search_path`, revisão incremental
  de Storage, snapshots de schema e comparação com migrations ativas.
- [ ] Revisar tipos Node 20 versus runtime 24 e pós-script `unrs-resolver`
  bloqueado. Não liberar scripts nem atualizar pacotes por aparência.
- [ ] Observação de 24 horas/7 dias, revisão semanal/mensal e quotas reais.
- [ ] Reconciliar documentação de testes, versões e itens históricos superados
  (exportação JSON, uploads de simulados, Anki básico, Calendar bilateral, lint).

### Estudos / ENEM / Redações

- [ ] Prova com identidade estruturada (ano, dia, aplicação, caderno/língua),
  upload, tentativa independente ligada à original e histórico preservado.
  Modelo SQL incremental `20260917000300` preparado/testado somente local;
  interface, transição do legado e aplicação remota ainda pendentes (DEC-085).
- [ ] Prazo persistido, rascunho, retorno/interrupção, término antecipado ou por
  expiração, trava de respostas, catalogação e correção consistente.
- [ ] Refazer com gabarito preservado, sem revelar resposta durante a prova;
  gráficos de acertos/erros/motivos, percentuais identificados sem confundir TRI.
- [ ] Redação posterior vinculada à prova; versões, avaliações individuais com
  origem/data, competências, média pessoal e nota oficial separadas.
  Versões/avaliações e nota oficial têm modelo SQL local em `20260917000300`;
  UI, retenção das imagens antigas e aplicação remota ainda pendentes.
- [ ] Escola/Faculdade configurável; criar/editar/retirar matérias por contexto,
  preservar ENEM e histórico; adaptar seed para não restaurar nomes removidos.
  Implementação local em 2026-09-17 (DEC-083); CRUD/persistência/falhas na UI
  e isolamento via API local aprovados; troca de contas na UI ainda pendente.
- [ ] Avaliações com peso e nota máxima por avaliação; média ponderada validada.
  SQL local `20260917000200` validado por reset e 25 scripts (DEC-084),
  sem aplicação remota/UI. Notas legadas não foram convertidas.
- [ ] Questões anuladas de simulados com domínio/coerência de totais; conferir
  uploads existentes antes de criar novas colunas para prova/gabarito.
- [ ] Metas diárias/semanais/mensais e sequência de dias, compartilhadas com
  Hábitos/Metas sem dois motores concorrentes de contagem.
- [ ] Estatísticas avançadas (conteúdo forte/fraco, eficiência) com denominador,
  período, dados insuficientes e ausência de inferências sem base observável.
- [ ] Relacionar explicitamente revisão e compromisso da Agenda sem gerar
  duplicatas ou sobrescrever o planejamento de Estudos.
- [ ] Importar dados ENEM legado se houver exportação real a resgatar; precisa
  amostra anonimizada e prévia, nunca parser fictício.
- [ ] Catálogo oficial de provas/gabaritos com correspondência verificada e
  direitos/origem/armazenamento avaliados antes de copiar acervo.
- [ ] MEC Enem: link externo já existe; integração automática/importação de
  notas depende de interface oficial disponível. Não automatizar Gov.br.
- [ ] YPT: depende de API pública ou exportação real estável e anonimizada.

### Editores e Biblioteca

- [ ] Texto confortável/expansível e formatação de anotações/comentários em
  todos os módulos; contrato de conteúdo, compatibilidade do texto antigo,
  sanitização e exportação. Escopo de desenho no texto precisa especificação.
- [x] PDF privado abre em outra aba pelo navegador (ou baixa, conforme suporte).
  A implementação existe; falta homologar. **DEC-086 substituiu** o pedido
  anterior de editor interno para a V2. Caderno digital futuro é ideia
  distinta, sem versão ou especificação.
- [ ] Relógio de prova alternativo em blocos de 30 minutos.
  Implementado localmente em 2026-09-16, com testes dos limites e prazo único;
  aguarda homologação autenticada.
- [ ] Editar itens aninhados de elenco, trilhas, temporadas, OP/ED e volumes;
  reordenar quando o schema tem `ordem`, mantendo vínculos e progresso.
  Edição local de elenco, trilhas, temporadas de séries, OP/ED/OST e volumes
  integrada. Temporadas de anime agora permitem editar número, episódios,
  nomes e sinopse sem regravar identidade externa, episódios ou progresso;
  Edição ampliada localmente em 2026-09-17 para período, duração, equipe,
  links/capa e data, sem mudar IDs externos nem episódios. Séries também
  oferecem data de conclusão e nota IMDb.
  Reordenação transacional da Biblioteca continua pendente. Homologar CRUD.
  Migration preparada/testada localmente; Gabriel determinou manter somente
  local. Não há frontend dependente dessa função em produção.
- [ ] Sincronização opcional de progresso Vídeo → Curso com política explícita
  para `assistido`, `teoria_vista` e domínio que hoje são independentes.
- [ ] Sessões de leitura para páginas/hora; definir releitura, intervalo e
  pausas antes de calcular, sem derivar velocidade só da página atual.
- [ ] Anki avançado: mídias/templates compatíveis em ambiente isolado. Não
  executar JavaScript de um pacote importado na origem autenticada do site.
- [ ] Banners estáticos opcionais por categoria: verificar os existentes;
  assets novos precisam ser fornecidos/autorizados, fallback já é funcional.

### Saúde / Finanças / Lugares / integrações

- [ ] Saúde: tendências de sono, hidratação, humor; lembretes/fotos com contrato
  de dados, sem duplicar o histórico corporal do Shape.
  Tendências locais implementadas para 7/30/90 dias; lembretes/fotos seguem
  pendentes. Dias sem registro não contam como zero. Homologar gráficos.
- [ ] Finanças: dashboards, histórico de cotações, proventos, análises e
  alertas; fontes, atualização e ausência de preço claramente identificadas.
- [ ] Importação bancária com arquivo ou integração consentida, formato real,
  prévia/deduplicação e tratamento de estornos; nenhuma senha bancária no site.
- [ ] BRAPI avançada: confirmar endpoints, disponibilidade no plano e quota
  antes de assumir histórico/automação gratuitos.
- [ ] Places/Maps: desativado por decisão de custo zero. Inclusão na v2 pede
  estimativa aprovada/configuração; não ligar a chave só por estar no ambiente.
- [ ] Google Photos Picker com OAuth/consentimento e armazenamento durável.
- [ ] Calendar com navegador fechado, seleção de calendários e resolução
  de conflitos; webhook, renovação, sync token, revogação e retries testados.
- [ ] Extensão em loja e captura avançada/autenticada: políticas, conta de
  publicador, pacote e revisão da loja; publicação depende de terceiro.
- [ ] Importação/scraping em lote: especificar fontes permitidas, formatos,
  limites, prévia e deduplicação; não contornar acesso privado ou proteções.

### Novos módulos e preferências

- **V3, adiado por Gabriel:** Hábitos: ainda sem tabela/contrato. Definir frequência, registro, pausa,
  histórico e relação com metas sem duplicar sessões reais.
- **V3, adiado por Gabriel:** Metas: ainda sem contrato transversal. Definir unidade, prazo, progresso
  manual/derivado e escopo; preservar metas financeiras já existentes.
- **V3, adiado por Gabriel:** Arquivos: avaliar domínio comum versus materiais de Estudos, acesso
  privado, organização, limites e exclusão dos vínculos.
- [ ] Perfil escolhe módulos visíveis; ocultar não apaga dados nem altera RLS.
  Implementados atalhos por conta em `user_metadata.app_hidden_modules`,
  restritos à navegação e lista do Início (DEC-082). Resumos e links diretos
  continuam acessíveis; homologação de duas contas pendente.
- [ ] Notificações de Treino/Revisão, som de descanso e ações suportadas no
  celular/fone; testar Android/iOS e preservar alternativa visível. Não
  prometer entrega pontual com navegador fechado sem infraestrutura validada.

### Redesign e processo

- [ ] Executar inventário/revisão de todas as páginas em `TASK_V2_DESIGN.md`
  somente depois dos itens funcionais; incluir novas rotas criadas nesta fase.
- [ ] Conferir CSS real versus DESIGN, nomenclatura e corte de “Agenda” por zoom.
- [ ] Avaliar a ideia de migração CSS Modules → Tailwind. Não é requisito de
  redesign: DEC-038 mantém stack mista; uma migração exige justificativa e
  decisão explícita, não substituição automática de todos os arquivos.

## Dependências que precisam de resolução real

- Banco local: Docker disponível, reset local concluído e 23 scripts SQL
  aprovados. Nenhum reset remoto executado.
- Migration Treino aplicada em 2026-09-16 após resolver autenticação, conferir
  alvo, dry-run e autorização. Pós-checks e dry-run final passaram; não reaplicar.
  Nenhuma migration adicional foi criada neste lote de Biblioteca/Saúde/ENEM/perfil.
- Contas de serviços, orçamento pago, arquivos legados e aprovação de lojas
  não são substituídos por código. A inclusão no escopo não comprova disponibilidade.
- Redesign ainda não iniciou; esta lista não muda a identidade visual por si.
