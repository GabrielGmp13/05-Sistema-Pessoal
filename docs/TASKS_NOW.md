# Tarefas atuais — acesso e suporte público

Atualizado em 2026-09-07. A v0.2.0 continua publicada. O lote de acesso e
suporte foi publicado pelo commit `118e487` e a migration de suporte foi
aplicada em produção em 2026-09-06. O cadastro continua fechado e o site
**não foi aberto ao público**.

## Implementado e publicado com cadastro fechado

- [x] Cadastro por e-mail atrás de `NEXT_PUBLIC_PUBLIC_SIGNUP_ENABLED=false`.
- [x] Confirmação de e-mail/convite, recuperação e definição de nova senha.
- [x] Bugs e sugestões com protocolo, status, resposta e histórico por usuário.
- [x] Até três prints PNG/JPG/WebP privados de 2 MB por pedido.
- [x] Aviso opcional por e-mail sem anexo; banco é a fonte da verdade.
- [x] FAQ público com dúvidas gerais; sugestões continuam sendo pedidos autenticados.
- [x] Cabeçalhos básicos contra clickjacking, MIME sniffing e permissões não usadas.
- [x] Sem painel admin: operação inicial pelo Supabase Dashboard e trigger de histórico.
- [x] Validação server-side, limite de 10 pedidos/24 h e testes de entrada.
- [x] Decisões, princípios, mapa do projeto e plano de abertura atualizados.
- [x] Solicitações autenticadas de cópia e exclusão com protocolo, histórico e
      frase exata de confirmação; nenhuma exclusão acontece automaticamente.
      Pedido real de cópia homologado em produção com protocolo e histórico.

## Gates antes de aplicar/publicar este lote

1. [x] Reset completo e teste SQL local da migration `20260905000100`;
       schema, bucket, RLS, isolamento, bloqueio de escrita e trigger aprovados.
2. [x] Diff/segredos, typecheck, 80 testes, build (46 rotas), lint do recorte e
       dependências de produção revisados; zero vulnerabilidades no `npm audit --omit=dev`.
3. [x] Migration remota aprovada e aplicada; precheck/dry-run listaram somente
       `20260905000100`, histórico final alinhado e dry-run posterior vazio.
   - [x] Segurança operacional: senha do banco exposta no log privado foi
         trocada por Gabriel em 2026-09-07. A conexão local antiga deve ser
         atualizada somente quando o próximo acesso remoto for necessário.
4. [~] URLs de Auth configuradas para produção em 2026-09-07; SMTP ainda
       depende de domínio próprio e escolha de remetente.
5. [x] Login Google configurado no Supabase com cliente OAuth separado;
       fluxo completo aprovado em produção com a conta manual já existente,
       sem criar usuário duplicado. A conta de Gabriel está na lista de teste
       do projeto Google. O cadastro público permanece fechado.
6. [ ] Se desejar aviso: criar remetente Resend verificado e variáveis server-only.
7. [~] Segunda conta real confirmou perfil/Home sem dados da principal e
       “Meus pedidos” vazio apesar dos três chamados existentes em Gabriel.
       Storage cruzado já passou no teste SQL local; o Edge bloqueou a tentativa
       manual da rota técnica antes de chegar ao site. APIs/módulos restantes
       ainda exigem a rodada completa de `teste.md`.
8. [x] Aviso de privacidade aprovado e publicado: Gabriel Oliveira como
       responsável, canal `sistemapessoa007@gmail.com`, piloto para maiores de
       18 anos, retenção e procedimento de acesso/exclusão definidos. Todos os
       módulos permanecem disponíveis e cada pessoa escolhe o que usar e inserir.
9. [x] Cloudflare Turnstile criado em modo Managed para o domínio de produção;
       site key na Vercel, deploy aprovado e secret key no Supabase. CAPTCHA
       ativado somente após o widget responder com sucesso no login. Manter
       signup remoto/UI fechados.
       Troca segura de senha e exigência da senha atual foram ativadas no Auth
       em 2026-09-07; a recuperação por e-mail precisa ser testada no deploy.
10. [x] Commit/push e deploy concluídos (`118e487`); tela de login, FAQ,
        recuperação, cabeçalhos e API sem sessão passaram no smoke. Login Google
        concluiu o retorno autenticado e o suporte criou o protocolo
        `SP-20260907-1CE35332`, com histórico inicial visível somente ao autor.
        O protocolo `SP-20260907-C929B5FD` confirmou também upload privado e
        abertura do print por URL assinada.
    - [x] A conta principal foi reiniciada em produção em 2026-09-07: todos os
          registros dos módulos e pedidos de teste foram removidos, os nove
          arquivos correspondentes foram apagados do Storage e o pós-check
          retornou zero arquivo fora de `midias-pessoais`. Login, perfil e as
          duas conexões Google foram preservados; a Agenda pode voltar a receber
          eventos pela sincronização autorizada do Calendar.
11. [ ] Só depois autorizar abertura: habilitar signup remoto e a variável pública juntos.

## Próxima ação

Operar inicialmente sem custo: manter o endereço `*.vercel.app`, cadastro
público fechado e testes restritos. Gabriel definiu **Projeto Pessoal** como
nome provisório e adiou compra de domínio, marca e telefone público. Um domínio
próprio será necessário mais adiante para e-mail de autenticação confiável a
usuários externos; sem ele, não configurar SMTP/Resend nem abrir cadastro.
Nenhuma autorização de uma etapa vale automaticamente para Git/deploy ou
abertura.

Próximo bloco técnico: transformar o pedido de cópia em exportação realmente
entregável e documentar/ensaiar o procedimento de exclusão integral usando uma
conta descartável. Em paralelo, concluir a recuperação de senha e a matriz de
isolamento de `teste.md`; nunca usar novamente a conta principal para ensaiar
apagamento.

Plano e testes: [ABERTURA_PUBLICA.md](ABERTURA_PUBLICA.md). Estrutura e arquivos:
[MAPA_DO_PROJETO.md](MAPA_DO_PROJETO.md). Histórico anterior:
[archive/TASKS_HISTORY_2026-08.md](archive/TASKS_HISTORY_2026-08.md).
