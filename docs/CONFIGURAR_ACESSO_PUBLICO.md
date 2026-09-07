# Configurar acesso público — guia para Gabriel

Atualizado em 2026-09-06. Estas configurações são externas ao código. Não
copiar chaves, senhas ou prints dos painéis para Git, documentação ou chamados.

## 1. O que o Supabase faz no suporte

Supabase não traz um painel pronto de bugs. O Sistema Pessoal usa:

- PostgreSQL para chamado, protocolo, histórico e resposta;
- RLS para cada pessoa ler somente os próprios chamados;
- Storage privado para prints;
- Dashboard do Supabase como painel operacional temporário de Gabriel.

Em `Table Editor > chamados_suporte`, Gabriel filtra por `status`, edita
somente `status`/`resposta` e não altera protocolo, `user_id` ou paths. O trigger
grava a mudança no histórico automaticamente.

## 2. SMTP e Resend

SMTP é o protocolo usado para entregar e-mails de confirmação, convite e
recuperação. O servidor padrão do Supabase é só para testes e não atende público.

**Recomendação inicial: Resend para as duas funções.** É um serviço de e-mail
transacional. Ele pode fornecer SMTP ao Supabase Auth e uma API para avisar
Gabriel quando chega um chamado. Assim existe um provedor e um domínio para
operar, sem painel admin no site.

Resend também oferece recebimento técnico por webhook, mas isso exige código e
não é uma caixa de entrada comum para Gabriel abrir e responder. Nesta fase,
usar Gmail/Workspace ou outro provedor como caixa humana; usar Resend somente
para envios automáticos e alertas.

Passos:

1. Ter um domínio próprio e acesso ao DNS. Preferir subdomínio como
   `mail.seudominio.com` para separar reputação de envio.
2. Criar conta no Resend e adicionar/verificar o domínio. Publicar os registros
   SPF e DKIM pedidos; DMARC é recomendado depois.
3. Criar uma API key de envio. Guardá-la no Resend/Supabase/Vercel, nunca no Git.
4. Supabase > Authentication > Email/Notifications > SMTP Settings:
   remetente `Sistema Pessoal <nao-responda@seudominio.com>`, host
   `smtp.resend.com`, porta 465, usuário `resend`, senha = API key.
5. Vercel > Environment Variables: `RESEND_API_KEY`,
   `SUPPORT_EMAIL_FROM` e `SUPPORT_NOTIFICATION_EMAIL`. A última é o endereço
   privado em que Gabriel quer receber os avisos.
6. Testar confirmação, convite, recuperação e um chamado usando contas teste.

Se Gabriel ainda não possui domínio, não abrir cadastro. Para teste fechado,
use somente os destinatários permitidos pelo SMTP padrão ou compre/configure o
domínio antes. Reavaliar preço e limites no dia da contratação.

## 3. URLs do Auth

Supabase > Authentication > URL Configuration:

- **Site URL:** domínio canônico de produção, com HTTPS, sem caminho interno;
- **Redirect URLs de produção:** cadastrar exatamente
  `https://SEU-DOMINIO/auth/confirm` e, se o painel exigir correspondência de
  query, `https://SEU-DOMINIO/auth/confirm**`;
- **Desenvolvimento:** `http://localhost:3000/auth/confirm**`;
- previews Vercel: não liberar wildcard amplo em produção. Adicionar somente
  quando houver necessidade de teste e remover depois.

Depois, ajustar os templates `Confirm signup`, `Invite user` e `Reset password`
para passar por `/auth/confirm` usando `TokenHash`/tipo compatíveis com o código.
Desativar rastreamento de links no provedor de e-mail, pois ele pode reescrever
ou consumir links de autenticação.

## 4. CAPTCHA

Recomendação: Cloudflare Turnstile no modo gerenciado. Ele reduz bots e costuma
ser menos incômodo que desafios visuais. Há duas chaves:

- **site key:** pública, usada pela interface;
- **secret key:** privada, cadastrada somente no Supabase.

Ordem correta:

1. Criar o site no painel do Cloudflare Turnstile com domínio de produção e localhost.
2. Implementar/testar o widget no cadastro, login e recuperação, enviando o
   `captchaToken` às chamadas do Supabase. Esta etapa de código ainda está pendente.
3. Só então Supabase > Authentication > Bot and Abuse Protection: ativar
   CAPTCHA, escolher Turnstile e informar a secret key.
4. Testar sucesso, token ausente, token expirado e domínio errado.

Nunca ativar CAPTCHA no Supabase antes de publicar o frontend compatível: isso
pode bloquear login e recuperação de todas as contas.

## 5. Configuração inicial do Auth

Manter até o smoke fechado terminar:

- anonymous sign-ins: desligado;
- public email signup: desligado no Supabase e
  `NEXT_PUBLIC_PUBLIC_SIGNUP_ENABLED=false` na Vercel;
- confirmação de e-mail: ligada antes do público;
- senha mínima: 12 caracteres; exigir maiúscula, minúscula, número e símbolo
  somente se a experiência for testada e um gerenciador de senhas for recomendado;
- proteção contra senhas vazadas: ativar se disponível no plano;
- troca segura de e-mail/senha e notificações de segurança: ativar/testar;
- JWT: manter 1 hora; não reduzir abaixo de 5 minutos;
- sessões avançadas (tempo máximo/inatividade/sessão única) podem depender do
  plano Pro; não são requisito para o primeiro piloto.

## 6. Limites iniciais recomendados

Não aumentar limites para “evitar erro”. Começar baixo e observar:

- e-mails do Auth: 10/h durante testes; 25–30/h na abertura pequena;
- novo envio para o mesmo e-mail: intervalo de 60 s;
- OTP: manter padrão até existir uso real;
- refresh/verificação: manter padrões do Supabase;
- chamados do site: já limitados a 10 por conta/24 h;
- prints: 3 por chamado, 2 MB cada.

O limite do provedor de e-mail e o limite do Supabase são independentes; vale o
mais restritivo. Um retorno 429 significa esperar, não repetir em loop.

## 7. Criar contas de teste

Com cadastro público ainda desligado:

1. Usar dois endereços que Gabriel controla e que não sejam sua conta real.
   Aliases `nome+teste-a@...` podem funcionar, mas é melhor usar duas caixas
   separadas para testar entrega de verdade.
2. Supabase > Authentication > Users > Add user > Send invitation.
3. Aceitar cada convite em perfis separados do navegador (normal e anônimo, ou
   Chrome e Edge). Nunca manter as duas contas na mesma sessão.
4. Nomear mentalmente `TESTE-A` e `TESTE-B`; usar somente dados fictícios.
5. Criar dados/chamado/print em A. Copiar UUIDs e tentar acessá-los estando em B.
   A resposta correta é nenhum dado/404/403, nunca conteúdo de A.
6. Testar logout, recuperação de senha, link usado duas vezes e link expirado.
7. Ao terminar, exportar evidência sanitizada e apagar os usuários teste somente
   depois de confirmar que não há dado que precise ser preservado. A exclusão
   de usuário apaga os dados em cascata.

Para testes locais, o Supabase Studio abre em `http://127.0.0.1:54323` e os
e-mails ficam no Mailpit local, sem entrega real. Para testar SMTP/URLs reais,
as contas precisam estar no projeto remoto e usar apenas dados descartáveis.

## Checklist de autorização separado

- [x] Migration de suporte em produção.
- [ ] Senha do banco rotacionada após exposição no log privado.
- [ ] Domínio/remetente escolhidos.
- [ ] Resend ou outro SMTP aprovado e configurado.
- [ ] URLs/templates testados.
- [ ] Turnstile implementado no frontend e depois ativado no Supabase.
- [ ] Duas contas passaram no isolamento.
- [ ] Aviso de privacidade aprovado.
- [ ] Commit/push e deploy autorizados.
- [ ] Cadastro público autorizado em decisão final separada.
