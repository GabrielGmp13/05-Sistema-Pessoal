# Beta privado — operação segura

Este documento descreve uma homologação privada com no máximo dez pessoas.
Ela não transforma o Sistema Pessoal em produto público, não cria cadastro
aberto e não substitui revisão jurídica ou de privacidade.

## Limites desta etapa

- Acesso somente por convite nominal; não divulgar a URL como cadastro aberto.
- Sem painel administrativo, cobrança, organizações ou papéis adicionais.
- Cada pessoa usa seu próprio usuário Supabase; nunca compartilhar login.
- Dados e uploads permanecem isolados por `user_id`, RLS e primeira pasta do
  Storage. As rotas server-side validam a sessão antes de usar credenciais.
- A migration de playlists foi aplicada antes do frontend dependente; qualquer
  migration futura deve preservar essa mesma ordem schema-first.

## Convidar uma pessoa

1. Em Supabase Dashboard, abrir **Authentication > Users**.
2. Usar **Add user > Send invitation** e informar somente o e-mail autorizado.
3. Confirmar antes que **Site URL** e **Redirect URLs** apontam para o domínio
   correto. Convites expirados devem ser reenviados, nunca improvisados.
4. Pedir que a pessoa defina senha própria e teste login/logout em janela
   privada. Não criar ou transportar senha em mensagem.
5. Registrar externamente quem foi convidado e a data; limitar a dez contas.

O convite pelo Dashboard é preferido porque não exige criar UI administrativa
nem levar uma chave secreta ao navegador. A documentação oficial do Supabase
também permite `inviteUserByEmail()` apenas em servidor confiável:
https://supabase.com/docs/guides/auth/users#inviting-users

## Proteção do deploy

- Em Vercel, habilitar **Standard Protection** para previews/deployment URLs.
- No plano Hobby, isso não fecha o domínio de produção. Proteger todos os
  domínios de produção exige plano/recurso compatível; conferir **Settings >
  Deployment Protection** antes de afirmar que o site está privado.
- Se produção continuar publicamente alcançável, o portão efetivo é o login do
  app. Testar que toda rota autenticada redireciona e toda API retorna 401 sem
  sessão. A página de login continuará visível na internet.
- Não compartilhar bypass de automação ou links protegidos em canais públicos.

Referência operacional atual da Vercel:
https://vercel.com/docs/deployment-protection

## Antes do primeiro convite

- [ ] Homologação do Gabriel concluída nos módulos que receberão dados reais.
- [ ] Migration local/remota e frontend publicados na ordem correta.
- [ ] RLS comportamental validada entre dois usuários e acesso anônimo negado.
- [ ] Buckets privados, MIME, tamanho e primeira pasta por usuário retestados.
- [ ] Todas as API Routes autenticadas retornam 401 sem sessão.
- [ ] Segredos existem somente na Vercel/Supabase e não em bundle, logs ou Git.
- [ ] URL, Site URL, redirects de Auth/OAuth e domínio de produção conferidos.
- [ ] Texto curto de privacidade informa finalidade, dados armazenados, serviços
      externos, contato e como pedir exclusão antes de terceiros enviarem dados.
- [ ] Escopo e retenção de dados explicados; não coletar dados desnecessários.
- [ ] Backup/exportação definido antes de apagar usuário ou dados.

## Durante o beta

- Liberar poucas contas por vez e registrar navegador/dispositivo do teste.
- Bugs devem vir com módulo, passos, esperado, obtido e print sem dados sensíveis.
- Não pedir cookies, senha, token Google, chave Supabase ou export de sessão.
- Observar erros e volume das integrações; quota não deve virar repetição agressiva.
- Tratar uploads reais como privados, mas lembrar que signed URLs temporárias
  podem ser compartilhadas por quem as recebe.

## Remoção e incidente

- **Nunca excluir usuário por impulso:** as FKs `ON DELETE CASCADE` apagam seus
  dados. Confirmar identidade, combinar exportação/backup e registrar a ação.
- Para encerrar acesso sem apagar dados, definir primeiro um procedimento
  operacional de suspensão; o projeto não possui painel administrativo.
- Se um segredo aparecer em log, print ou Git, revogar/rotacionar no provedor,
  redeployar e verificar acesso. Apagar a mensagem não substitui rotação.
- Se houver suspeita de acesso cruzado, congelar novos convites, preservar
  evidências sem segredos e corrigir/testar RLS antes de reabrir o beta.

## Bloqueios conhecidos

- Testes E2E autenticados amplos continuam pós-v2; o checklist manual é
  obrigatório nesta etapa.
- Proteção do domínio de produção depende do plano/configuração da Vercel.
- Não existe UI de gestão de participantes ou suspensão de conta.
- Política/aviso de privacidade precisa ser aprovado pelo responsável antes de
  coletar dados reais de terceiros; este documento é checklist técnico.
