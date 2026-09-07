# Plano de abertura pública

O site ainda não está aberto. “Código pronto”, “publicado” e “cadastro público”
são três estados diferentes e devem ser aprovados separadamente.

FAQ significa “perguntas frequentes”: é a página pública `/ajuda`. Sugestão é
feedback enviado por uma pessoa e, por isso, entra na central autenticada com protocolo.

Configuração passo a passo: [CONFIGURAR_ACESSO_PUBLICO.md](CONFIGURAR_ACESSO_PUBLICO.md).
Decisões de dados: [AVISO_DE_PRIVACIDADE_RASCUNHO.md](AVISO_DE_PRIVACIDADE_RASCUNHO.md).

## Ordem segura

1. **Código local:** validar frontend e migration sem tocar produção.
2. **Banco:** aplicar migration aprovada antes do frontend que depende dela.
3. **Auth/e-mail:** URLs, templates, SMTP, CAPTCHA e limites.
4. **Publicação fechada:** deploy com cadastro ainda desligado e smoke com contas teste.
5. **Abertura:** habilitar signup no Supabase e na variável do site na mesma janela.
6. **Observação:** acompanhar falhas, quotas e chamados; fechar signup se surgir P0/P1.

## Como separar problemas

| Tipo | Exemplos | Onde registrar | Prioridade |
|---|---|---|---|
| Segurança/privacidade | acesso de outra conta, URL privada, segredo em log | incidente privado; Git só com resumo sanitizado | P0 |
| Perda/bloqueio | não entra, não salva, dado desaparece | chamado `bug` | P1 |
| Funcional | cálculo, filtro ou integração incorreta | chamado `bug` | P2 |
| Visual/acessibilidade | corte mobile, contraste, teclado | chamado `bug` | P2/P3 |
| Sugestão | função nova ou melhoria | chamado `sugestao` | backlog após triagem |
| Operação | quota, custo, deploy, SMTP | `TASKS_NOW`/manutenção, sem dados pessoais | P1/P2 |

P0: conter acesso e suspender abertura. P1: não ampliar público. P2: corrigir no
próximo lote. P3: agrupar e priorizar. Um problema por chamado evita misturar
causas; duplicados podem manter protocolos distintos e apontar para a mesma correção.

## Configuração externa que não fica no Git

- Supabase Auth: Site URL, Redirect URLs exatas, confirmação de e-mail,
  signup/anonymous, comprimento de senha, CAPTCHA e rate limits.
- SMTP do Auth para confirmação, convite e recuperação.
- Opcional: Resend para avisar Gabriel sobre chamado (`RESEND_API_KEY`,
  `SUPPORT_EMAIL_FROM`, `SUPPORT_NOTIFICATION_EMAIL`).
- Vercel: as mesmas variáveis, sem prefixo `NEXT_PUBLIC_` para qualquer segredo.

O e-mail de chamado é redundância operacional. Se ele falhar, o protocolo
continua salvo. Prints só são abertos pelo usuário dono ou por Gabriel no
Dashboard/Storage; o link do site expira em 60 segundos.

## Testes obrigatórios antes e depois de publicar

### Antes, local/staging

- criar/confirmar conta, entrar/sair, recuperar senha e invalidar link expirado;
- tentar cadastro quando a chave está desligada;
- duas contas: CRUD de todos os módulos, relações, APIs, Google e arquivos privados;
- conta A não lê protocolo, histórico, resposta ou print da conta B, mesmo com UUID;
- rejeitar arquivo não imagem, acima de 2 MB e quarto print;
- dez chamados aceitos/24 h e o seguinte bloqueado sem perder os anteriores;
- editar status/resposta no Dashboard e confirmar evento no histórico do usuário;
- e-mail ausente/falhando não impede protocolo; e-mail válido não leva anexo/link;
- textos com `<script>`, Markdown e instruções para IA aparecem apenas como texto;
- teclado, leitor de tela básico, zoom 200%, celular e temas claros/escuros.

### Imediatamente após o deploy fechado

- CI e deploy verdes; banco mostra migration aplicada uma vez;
- login e recuperação no domínio real; callback não volta para domínio estranho;
- chamado, protocolo, print e histórico reais usando apenas dados descartáveis;
- rotas `/api/*` sem sessão retornam 401 JSON; páginas internas redirecionam ao login;
- conferir logs sem conteúdo do chamado, e-mail, path privado, token ou mensagem bruta;
- signup continua indisponível até a aprovação final.

### Após abrir cadastro

- nova conta externa confirma e entra; conta não confirmada não acessa dados;
- CAPTCHA e limites bloqueiam abuso sem bloquear o fluxo normal;
- acompanhar Auth, banco, Storage, funções, e-mail e chamados nas primeiras 24 h;
- repetir smoke em 24 h e 7 dias; se houver P0/P1, desligar signup e conter o problema.

## Operação sem painel admin

No Supabase Dashboard, Gabriel filtra `chamados_suporte` por `status` e
`created_at`. Para responder, altera `status` e/ou `resposta`; o trigger cria a
linha correspondente em `chamados_suporte_historico`. Nunca editar `user_id`,
`protocolo`, dono do anexo ou path. Não apagar conta para encerrar chamado.

Retenção inicial proposta para aprovação: remover prints e texto bruto até 30
dias depois de `fechado`, preservando somente resumo técnico anônimo. A rotina
de exclusão automatizada ainda não foi implementada.
