# Estudos, editores e módulos opcionais

Requisitos esclarecidos por Gabriel em 2026-09-10. Este documento distingue
direção de produto de implementação: não declara funcionalidades prontas nem
autoriza operações remotas, novas despesas ou alteração da versão.

## Prioridade atual

Corrigir integração, segurança e dívida de qualidade antes das expansões.
Acessibilidade física no celular, notificações e redesign de Treino ficam
para depois. Não repetir a homologação encerrada sem regressão concreta.

## ENEM — contrato solicitado

- Cadastrar prova com PDF, nome e identidade estruturada: ano, dia 1/2 e
  aplicação (regular, PPL etc.). Proposta técnica adicional: caderno/cor e
  língua estrangeira quando aplicável, para não cruzar gabaritos diferentes.
- Iniciar uma tentativa aciona o cronômetro. Permitir encerrar antes do prazo.
- Encerrar ou esgotar o tempo trava respostas; redação não é obrigatória.
  A etapa seguinte permite anexar/vincular redação e catalogar a prova.
- Catalogar fecha a tentativa. Correção posterior registra gabarito correto,
  classificação das questões e motivos conforme DEC-041, com gráficos de
  acertos/erros e motivos. Não apagar classificações existentes silenciosamente.
- Refazer cria tentativa identificável ligada à original, preservando as duas.
  Se já existir gabarito correto, mostrar novo resultado ao concluir, nunca
  revelar respostas corretas durante a tentativa. Percentual não é nota TRI.
- Redação pode ser escrita e vinculada posteriormente a uma prova existente.
  Preservar avaliações individuais de professores/outros avaliadores, com
  origem e data, e calcular a média aritmética pessoal solicitada. Não chamar
  essa média de nota oficial do ENEM; eventual nota oficial deve ficar separada.

### Diferenças verificadas no código atual

`frontend/lib/provas.ts` tem tipo/dia, título, arquivo, tempo, vínculo de
redação e flag `feita`; não possui identidade estruturada completa de edição.
`iniciarNovaTentativaEnem` arquiva respostas e reutiliza a mesma prova, em
operações separadas, em vez de criar a identidade independente solicitada.
Preserva o gabarito correto, e o lançamento já consegue recalcular acertos.
O modo de prova atual finaliza automaticamente ao expirar, tem relógio local
e não entrega todos os gráficos pedidos. Os testes do resumo de gabarito não
comprovam o ciclo completo de prova, interrupção, retorno, correção e repetição.

Antes de implementar: definir modelo incremental com tentativa independente,
prazo persistido, recuperação de rascunho, trava de respostas e finalização
consistente; revisar RLS, exportação e vínculos da redação. Preparar/testar SQL
local, solicitar autorização remota e confirmar schema aplicado antes do
frontend dependente. Não reutilizar migrations já aplicadas.

### Importação oficial — proposta, ainda não integrada

O Inep disponibiliza [provas e gabaritos](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos).
Planejar catálogo com origem, edição e correspondência conferidas; não copiar
todo acervo nem prometer sincronização automática antes de validar formato,
direitos, manutenção e custo de armazenamento. Upload manual continua válido.
Pesquisa atualizada em 2026-09-10: o serviço lembrado foi identificado como
**MEC Enem**, plataforma gratuita com correção automatizada de redação e
acesso pela conta Gov.br. [Notícia oficial do MEC](https://www.gov.br/mec/pt-br/assuntos/noticias/2026/julho/mec-enem-estudantes-podem-fazer-simulados-e-exercicios)
e [aplicativo web oficial](https://app.mecenem.mec.gov.br/).
Não foi encontrada documentação pública de API para integrar a correção ao
Sistema Pessoal. Existência da plataforma não autoriza consumir endpoints
privados nem automatizar login Gov.br. Integração automática não entra no
compromisso da v1; alternativa proposta é link externo e registro manual da
avaliação estimada, identificado como IA, separado da nota oficial do exame.
Gabriel dispensou a função caso não fosse encontrada; não há mais necessidade
de pedir o nome ao amigo. Após autorização, o link externo foi incluído em
Registrar redação (localmente em 2026-09-10), com aviso de IA/nota estimada e
sem envio de conteúdo. Não há integração automática nem importação de notas.
Não enviar redações pessoais a terceiros sem informação e autorização.

## Escola/Faculdade e matérias

Direção confirmada: usuário escolhe o rótulo Escola ou Faculdade e cria, edita
ou remove suas matérias desse contexto; demais comportamentos são preservados.
Isso revisa explicitamente a regra anterior de matérias escolares fixas, com
a nova necessidade informada pelo dono. Não é mudança já implementada.

O modelo atual usa uma matéria acadêmica compartilhada com `mostra_escola` e
`mostra_enem`: Matemática não precisa ser duplicada. Retirar da Escola não
deve excluir a matéria do ENEM nem seu histórico. Na implementação, distinguir
remoção de contexto de exclusão global, esclarecer o alcance da edição do nome
compartilhado e preservar contas existentes. O seed automático e a tela fixa
ainda precisam ser adaptados após conferir o schema e as decisões vigentes.

## Dois editores distintos

O BACKLOG já registrava visualizador/editor interno de PDF com desenho no
modo de prova. Não foi localizada especificação antiga de editor rico comum
a todos os comentários. Registrar agora os dois usos sem confundi-los:

1. Editor de comentários/anotações: campos de filmes, redações e demais textos,
   com área confortável/expansível. Formatação exata e desenho nesses campos
   ainda precisam de definição; não converter texto existente em HTML sem
   migração/compatibilidade e sanitização contra conteúdo executável.
2. Editor de PDF: abrir no site, digitar sobre páginas e desenhar com mesa
   digitalizadora/caneta. Preservar original e anotações editáveis, prever
   desfazer/refazer, salvar/reabrir e exportar. O pedido não esclarece se
   também precisa substituir o texto original, reorganizar páginas ou OCR;
   não prometer um editor equivalente ao Acrobat sem fechar esse escopo.

Antes de escolher biblioteca: verificar licença/custo zero, tamanho do pacote,
suporte a caneta/toque, documentos grandes, privacidade, acessibilidade e
compatibilidade de exportação. Nenhum editor novo foi implementado nesta rodada.

## Módulos e notificações — explicitamente futuros

- Perfil escolhe os módulos visíveis (ENEM, Treino, Programação etc.). Ocultar
  módulo não deve apagar dados nem substituir autorização/RLS.
- Treino guiado: mostrar máquina, carga e repetições; descanso só inicia após
  confirmação de conclusão. Aviso sonoro ao terminar descanso, com possibilidade
  de confirmar pelo próprio site e, quando suportado, notificação/fone.
- Gabriel usa Samsung, mas planejar Android e iOS, com alternativa visível
  funcional quando recursos de segundo plano/tela bloqueada não existirem.
  Não garantir ação pelo fone, entrega pontual ou execução com navegador
  encerrado. Verificação de compatibilidade e protótipo precedem compromissos.
- Redesign de Treino será tratado depois com Gabriel/v0, não nesta rodada.

## Operação gratuita, recuperação e privacidade

Piloto pessoal/amigos, sem cadastro público e sem serviço pago autorizado.
Domínio pago não é pré-requisito universal para recuperação manual. O SMTP
padrão do Supabase é restrito aos endereços da equipe e não serve como promessa
de entrega para amigos: [limites oficiais](https://supabase.com/docs/guides/auth/auth-smtp).
O administrador pode gerar um link de recuperação para entrega por canal
próprio: [generateLink](https://supabase.com/docs/reference/javascript/auth-admin-generatelink).

Procedimento a implementar e homologar em etapa autorizada: confirmar identidade
por contato conhecido, gerar link apenas para conta existente em ferramenta
administrativa privada, entregar individualmente e orientar definição da senha
pelo titular. Não pedir senha, adicionar amigos à equipe administrativa, salvar
tokens em logs/Git ou expor chave administrativa no site. Testar expiração,
reutilização e retorno a `/nova-senha`; não considerar o envio automático do
painel uma forma de contornar as restrições SMTP. Nenhum link foi gerado agora.

Gabriel não precisa escrever linguagem jurídica. A revisão deve conferir se o
aviso descreve a operação real (contato, fornecedores, acesso administrativo,
retenção/exclusão e público). Idade mínima de 18 anos já consta do aviso atual;
confirmar compatibilidade dos convidados antes de ampliar o piloto. Gratuidade
não permite prometer segurança absoluta ou ausência de obrigações.

Aceite local de termos usa `user_metadata`, controlado pelo próprio usuário,
e trava de navegação/API da aplicação. Não é prova imutável de consentimento,
não impede criar previamente conta por convite e não substitui RLS/controle
de acesso do Supabase. Validar o primeiro uso antes de publicar como concluído.
