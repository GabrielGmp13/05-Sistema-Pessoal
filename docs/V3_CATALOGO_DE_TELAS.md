# V3 — catálogo de telas e estados do sistema

> Inventário de produto para evolução posterior. Este documento **não autoriza
> implementação antecipada**, não cria rotas, tabelas ou serviços pagos e não
> substitui as fichas de rotas reais em `TASK_V2_DESIGN.md`.

## Objetivo

Toda experiência importante precisa de uma resposta humana, acessível e
coerente quando algo não existe, falha, demora, exige permissão ou está em
manutenção. O sistema atual já tem estados locais de carregamento, vazio e
formulários; a V3 deve consolidar os pontos transversais abaixo antes de abrir
novos cômodos ou integrações.

## Telas de sistema a desenhar e validar

| Prioridade | Tela/estado | Quando aparece | Ação principal | Critérios mínimos |
|---|---|---|---|---|
| V3 | 404 — página não encontrada | URL inexistente, link antigo ou item removido | Voltar ao Início e, quando seguro, retornar à página anterior | Não revelar rota/dado privado; `noindex`; foco no título; funciona com URL direta e tema ativo. |
| V3 | Erro inesperado da rota | Falha de renderização que o framework pode recuperar | Tentar novamente e voltar ao Início | Explicação simples, identificador técnico seguro, sem stack trace/segredo; preservar tema e navegação quando possível. |
| V3 | Erro global | Falha do layout/base da aplicação | Recarregar e entrar novamente | Independe do AppChrome, tem HTML/tema mínimo e não entra em loop. |
| V3 | Indisponibilidade temporária | Manutenção, dependência externa indisponível ou serviço próprio fora do ar | Atualizar/repetir mais tarde | Diferenciar de 404; linguagem honesta; não prometer prazo nem expor infraestrutura. |
| V3 | Sem conexão / falha de rede | Navegador offline, timeout ou erro transitório de gravação | Tentar de novo, manter o formulário quando possível | Nunca perder texto/seleção sem aviso; estado anunciável por leitor de tela; sem reenvio duplicado. |
| V3 | Acesso negado | Sessão sem direito ao recurso, convite revogado ou item de outra pessoa | Entrar novamente ou voltar | Não confirmar existência de conteúdo de outra conta; 401/403 coerentes entre página e API. |
| V3 | Sessão expirada | Token inválido/expirado durante uma ação | Entrar de novo | Explicar que alterações não confirmadas podem exigir revisão; nunca redirecionar com token/query privado. |
| V3 | Confirmação de ação concluída | Salvar, importar, exportar, conectar ou remover algo | Ver resultado ou continuar | Toast/status acessível, texto específico e sem depender apenas de cor. |
| V3 | Carregando | Consulta, arquivo, integração ou transição lenta | Aguardar/cancelar quando aplicável | Skeleton não simula dados; progresso real quando houver tamanho/etapas; respeita redução de movimento. |
| V3 | Vazio inicial | Módulo sem registros | Criar primeiro item ou aprender como funciona | Explicar o que falta, preservar contexto e não mostrar chamada para recurso em pausa. |
| V3 | Vazio filtrado | Busca/filtro não encontra resultado | Limpar filtro | Mostrar o filtro aplicado e permitir desfazer com teclado. |
| V3 | Formulário inválido | Validação local ou remota falha | Corrigir campo | Erro junto do campo e resumo quando necessário; foco no primeiro erro; valores válidos preservados. |
| V3 | Conflito de edição | Outra aba/dispositivo alterou o mesmo registro | Recarregar, comparar ou escolher versão | Nunca sobrescrever silenciosamente; declarar qual versão/data será mantida. |
| V3 | Ação destrutiva | Arquivar, remover, limpar ou excluir conta | Confirmar em modal | Consequência e reversibilidade explícitas; foco preso/restaurado; nunca `confirm()` nativo. |
| V3 | Permissão do navegador | Notificação, arquivo, câmera ou localização recusada | Abrir instrução ou seguir sem recurso | Não bloquear o fluxo principal; explicar alternativa sem prometer comportamento entre celulares. |
| V3 | Integração externa | OAuth recusado, quota, token vencido, API sem resposta ou fallback | Reconectar, atualizar ou usar opção manual | Nomear serviço e próxima ação; nunca expor token; manter alternativa manual quando definida. |
| V3 | Cômodo em pausa | Recurso temporariamente retirado da superfície | Voltar ao Início | Já existe na V2.1 para módulos escolhidos; V3 deverá decidir se mantém esse padrão, cria calendário de liberação ou remove o conceito. |

## Fluxos públicos e de conta

- Entrada, convite, confirmação de e-mail, recuperação e nova senha: estados
  de link expirado, token inválido, e-mail não reconhecido e sucesso.
- Termos, privacidade, exportação e solicitação de exclusão: estados de
  aceite pendente, protocolo criado, erro de geração e acompanhamento seguro.
- Ajuda e reporte de problema: sucesso, limite de envios, anexo inválido,
  armazenamento indisponível e retorno sem expor detalhes administrativos.

## Regras de implementação futura

1. Antes de criar uma rota de erro, definir se o erro é por página, global,
   API ou integração e preservar o código HTTP correto.
2. Usar tokens de `DESIGN.md`, contraste, foco visível, texto em português e
   `aria-live` somente para mudanças relevantes; ícones nunca carregam o
   significado sozinhos.
3. Testar 360/768/1280 px, teclado, leitor de tela, tema claro/escuro,
   redução de movimento, recarga e URL direta.
4. Não registrar em tela, analytics ou logs o conteúdo privado, token, e-mail
   completo, URL assinada ou detalhe interno de banco.
5. Cada tela só sai deste catálogo após ter rota/arquivo real, testes e uma
   ficha atualizada em `TASK_V2_DESIGN.md`.
