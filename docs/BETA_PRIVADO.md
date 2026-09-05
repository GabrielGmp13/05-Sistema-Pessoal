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

## Estado e abertura gradual

**Em 2026-08-31: preparação local da v0.2.0; NÃO enviar convites ainda.** O login
por senha existe, mas faltam telas/fluxo de aceitar convite, definir a primeira
senha e recuperar senha. O callback Google existente conecta integrações; não
é callback do Supabase Auth. A instrução anterior de simplesmente convidar e
pedir definição de senha era incompleta.

Proposta operacional: Gabriel valida primeiro; piloto com até **três amigos**,
dados fictícios ou de baixo risco; revisar após uma semana sem defeitos de
segurança/perda de dados/login. Só ampliar mediante aprovação, até dez pessoas.
Essa janela é escolha prática deste projeto, não garantia estatística.

## Convidar uma pessoa — somente após fechar os gates

1. Implementar/testar convite e recuperação, incluindo link expirado/reutilizado,
   senha definida pela própria pessoa e logout/login em janela privada.
2. No Supabase, confirmar **Allow new users to sign up** desativado e entrada
   anônima desativada. Não ter botão de cadastro não fecha a API de Auth.
   [Configuração oficial](https://supabase.com/docs/guides/auth/general-configuration).
3. Escolher/configurar SMTP e testar entrega real. O SMTP padrão do Supabase é
   restrito a endereços da equipe do projeto e não é adequado aos amigos.
   **Não adicionar amigos à equipe administradora para contornar essa restrição.**
   Serviço/custo externo exige aprovação prévia. [SMTP oficial](https://supabase.com/docs/guides/auth/auth-smtp).
4. Conferir Site URL e Redirect URLs exatos do domínio publicado e do fluxo
   implementado, sem curingas amplos; não inventar uma rota que ainda não existe.
5. Após autorização nominal, **Authentication → Users → Add user → Send invitation**.
   Preferir Dashboard ao invés de construir admin próprio; jamais mandar senha
   compartilhada ou incluir chave administrativa no navegador.
   [Convites oficiais](https://supabase.com/docs/guides/auth/users).
6. Registrar privadamente participante/data/aviso aceito e ambiente de teste.
   Enviar aviso de privacidade e canal de suporte antes de receber dados reais.

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

- [ ] Convite, primeira senha e recuperação implementados e homologados.
- [ ] SMTP entrega para amigos; signup público/anon desativados remotamente.
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
- [ ] Canal privado de suporte, retenção de prints e limite de gasto aprovados.
- [ ] Google Cloud: cada conta convidada que usar OAuth está na lista de testadores;
      conectar/desconectar Calendar e YouTube não cruza usuários/contas.

## Durante o beta

- Liberar poucas contas por vez e registrar navegador/dispositivo do teste.
- Bugs devem vir com módulo, passos, esperado, obtido e print sem dados sensíveis.
- Não pedir cookies, senha, token Google, chave Supabase ou export de sessão.
- Observar erros e volume das integrações; quota não deve virar repetição agressiva.
- Tratar uploads reais como privados, mas lembrar que signed URLs temporárias
  podem ser compartilhadas por quem as recebe.

## Privacidade, exclusão e incidentes

- **Nunca excluir usuário por impulso:** as FKs `ON DELETE CASCADE` apagam seus
  dados. Confirmar identidade, combinar exportação/backup e registrar a ação.
- Para encerrar acesso sem apagar dados, definir primeiro um procedimento
  operacional de suspensão; o projeto não possui painel administrativo. Revogar
  sessões/refresh tokens pelo provedor não implica invalidar instantaneamente
  todos os access tokens já emitidos. Confirmar expiração/controles aplicáveis;
  em incidente ativo, conter acesso no provedor/hosting antes de reabrir.
- Se um segredo aparecer em log, print ou Git, revogar/rotacionar no provedor,
  redeployar e verificar acesso. Apagar a mensagem não substitui rotação.
- Se houver suspeita de acesso cruzado, congelar novos convites, preservar
  evidências sem segredos e corrigir/testar RLS antes de reabrir o beta.

Exclusão solicitada: verificar identidade por canal combinado, confirmar
escopo e oferecer exportação do **próprio usuário**. A exportação CSV do
Histórico não é exportação integral. Um dump completo contém outras contas e
nunca deve ser entregue ao participante. Arquivos precisam de exportação
separada; guardar cópias de recuperação sob acesso restrito e prazo acordado.

Depois da autorização específica, remover apenas objetos Storage pertencentes
à pessoa, desconectar integrações e excluir dados/conta conforme dependências.
O Supabase pode impedir exclusão de usuário que ainda possui objetos Storage;
o cascade pode remover muitos registros e não é lixeira. Ensaiar o procedimento
com conta descartável antes de prometer atendimento. Backups e retenção dos
provedores exigem verificação separada; não prometer apagar todas as cópias na
hora. [Gestão/exclusão oficial](https://supabase.com/docs/guides/auth/managing-user-data).

### Aviso curto para aprovação de Gabriel (antes dos convites)

“Este é um beta privado experimental, sem garantia de disponibilidade ou
preservação de dados. Use inicialmente dados fictícios ou de baixo risco;
não envie documentos de identidade, dados bancários, saúde sensível ou dados
de terceiros. A aplicação usa Vercel e Supabase para funcionar e armazenar
conta, registros e uploads. Gabriel administra esses serviços e pode acessar
dados para operação/suporte; RLS isola participantes, não administradores.
Google é opcional e pede autorização por serviço. Buscas/imagens externas
podem transmitir consultas, endereço IP e requisições aos provedores.
Reportar bug apenas prepara texto para você copiar; revise e oculte dados de
prints antes de enviar. Para suporte, acesso, exportação ou exclusão, use
**[Gabriel preencher o canal privado]**. O piloto não é serviço público nem
possui certificação de conformidade legal.”

Gabriel deve aprovar o texto, preencher contato e combinar prazos/retenção
antes de usá-lo. Isso não substitui revisão jurídica/LGPD para público geral.

## Auditoria local de segurança — 2026-08-31

Escopo: revisão de código/configuração versionada, contratos documentados e
testes locais. **Não** é pentest, dump novo, leitura de logs de produção ou
certificação do estado remoto. Nenhum segredo de ambiente foi publicado.

| Controle | Evidência no repositório / resultado |
|---|---|
| Páginas protegidas | `frontend/proxy.ts` verifica `getUser()`; somente `/login` público. Assets estáticos continuam públicos, sem substituir RLS/API auth. |
| APIs protegidas | 14 arquivos `route.ts` em `frontend/app/api`; todos têm `getApiUser()`. Proxy corrigido para JSON 401 sem sessão, não HTML redirecionado. |
| Service role | `frontend/lib/server/supabase.ts` e `server/google.ts` usam `server-only`. Rotas Google filtram `user_id` da sessão; credencial não é autorização do participante. |
| OAuth | State + PKCE + cookies HttpOnly/SameSite Lax/Secure em produção; novo vínculo ao usuário inicial. Falha se trocar usuário durante consentimento. |
| Troca de conta Google | Refresh token anterior só pode ser reaproveitado para o mesmo e-mail confirmado; erro de leitura/perfil não grava conexão parcial. |
| Tokens | Cifra AES-256-GCM, chave server-side; `integracoes_google` tem RLS sem policy de cliente. Não é criptografia ponta a ponta. |
| Banco | Schema/RLS/GRANTs documentados; 24 migrations e 19 testes SQL existentes. Prova comportamental com duas contas continua gate; não foi executada neste lote. |
| Storage | Seis buckets documentados privados, paths por `auth.uid()`, signed URLs; policies em baselines/incrementais. URL assinada é acesso temporário compartilhável, não segredo permanente. |
| Logs | `sbErr` e logs Google/Places passam a registrar só operação, código/status; detalhes de banco e paths removidos. Logs da plataforma/URLs precisam de revisão operacional separada. |
| Ambiente | Apenas URL/chave pública Supabase usam `NEXT_PUBLIC_`; APIs e cofre usam segredos server-side. `.env.example` contém campos vazios, não credenciais. |
| Upload / importação | Limites de MIME/tamanho e importação Anki já existem. Não há scanner antivírus; não aceitar arquivos sensíveis/desconhecidos no piloto. |

Inventário das 14 APIs: metadados Biblioteca, cotação Finanças, Anki, Places;
Google connect/callback/disconnect/status; Calendar import/export; YouTube
playlists/playlist-videos/playlist-link/import. A auditoria não adicionou rota
de bugs nem endpoint administrativo.

Correções de baixo risco desta preparação: limite exato de rota pública;
401 de APIs; remoção de query ao redirecionar; cookies preservados; logs sem
payload; mensagens Google controladas; vínculo OAuth e renovação na conta correta.
Fluxos de conexão já iniciados antes do deploy podem exigir recomeçar, pois
não terão o novo cookie de vínculo. Nenhum token do banco foi migrado/apagado.

### Pendências por risco

- **Gate / acesso:** convite/senha/recuperação, SMTP e configuração real de Auth.
- **Gate / isolamento:** CRUD/relações/Storage/API com dois usuários descartáveis;
  verificar recarga/logout para evitar dados locais da conta anterior.
- **Gate / operação:** contatos, aviso, orçamento/quota, exportação/exclusão
  ensaiadas e plano de contenção. Sem esses itens, não liberar o piloto.
- **Antes de ampliar:** rate limiting por usuário, controle de fan-out de
  buscas/sincronização, testes E2E autenticados e revisão completa de CSP/headers.
  Login limita acesso, não impede abuso/quota por uma conta autorizada.
- **Hardening restante:** chamadas antigas de `console.error` em Treino/Shape,
  gêneros e componentes do shell ainda podem registrar erros brutos no navegador.
  Não enviar console/HAR completo como relato; revisar esses callers antes de
  receber dados sensíveis. A sanitização deste lote cobre o helper comum e as
  integrações citadas, não todos os logs possíveis do app/provedores.
- **Limitação conhecida:** SSRF de artigos possui controles de DNS/redirect/
  tamanho já implementados; leitura local não certifica resistência a todos
  os cenários de rede. Revisão adversarial fica separada antes de público maior.
- **Google em Testing:** tokens de apps External com escopos Calendar/YouTube
  podem expirar em sete dias. Expiração não significa dados perdidos; reconectar
  e retestar. Publicar/verificar o app no Google é etapa distinta de publicar o
  site na Vercel. [OAuth oficial](https://developers.google.com/identity/protocols/oauth2).

O repositório público é documentação/código, não lugar de armazenar e-mails,
prints, orçamento pessoal, logs brutos ou inventário nominal dos convidados.

## Bloqueios conhecidos

- Testes E2E autenticados amplos continuam pós-v2; o checklist manual é
  obrigatório nesta etapa.
- Proteção do domínio de produção depende do plano/configuração da Vercel.
- Não existe UI de gestão de participantes ou suspensão de conta.
- Política/aviso de privacidade precisa ser aprovado pelo responsável antes de
  coletar dados reais de terceiros; este documento é checklist técnico.
