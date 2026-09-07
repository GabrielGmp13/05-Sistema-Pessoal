# Handoff de engenharia — acesso e suporte público

Atualizado em 2026-09-07. Leia `AGENTS.md`, `AI_CONTEXT.md`, `TASKS_NOW.md` e o
pedido vigente antes de editar. Decisões e schema devem ser conferidos quando
a tarefa tocar esses contratos. Toda comunicação em português.

## Estado e autoridade

> Atualização de 2026-09-07: DEC-075/076/077 superam a direção privada descrita
> abaixo. Cadastro/recuperação, suporte com protocolos/prints e login Google
> foram publicados pelo commit `118e487`. A migration de suporte está em
> produção. Cadastro público e SMTP/Resend continuam bloqueados; CAPTCHA já
> foi configurado e ativado após smoke.

- Repositório: `C:\Gabriel Oliveira\05-Sistema-Pessoal`, aplicação em `frontend/`.
- Lote de acesso/suporte publicado em `main` em 2026-09-07. Login, FAQ,
  recuperação, cabeçalhos e 401 da API sem sessão passaram no smoke. Login
  Google concluiu o retorno autenticado e vinculou a identidade à conta já
  existente, sem duplicata. Suporte criou protocolo e histórico em produção;
  print e isolamento básico entre duas contas passaram; a matriz completa de
  módulos continua pendente.
- A migration `20260905000100_suporte_publico.sql` foi aplicada e validada em
  produção em 2026-09-06.
- O usuário autorizou e o lote foi commitado/pushado. Isso não autoriza novas
  alterações remotas, contratação de e-mail, custo ou abertura pública.
- Beta de até dez pessoas já autorizado conceitualmente pela DEC-069; piloto
  proposto de até três. Convites bloqueados até os gates em `BETA_PRIVADO.md`.

## Bloco implementado

- `frontend/app/configuracoes/BugReportForm.tsx` e `lib/bug-report.ts`: relato
  guiado, prévia editável e copiar; sem fetch, banco, captura ou envio. Integração
  em `configuracoes/page.tsx`; versão vem do `package.json`, agora 0.2.0.
- `proxy.ts` / `lib/route-access.ts`: login público exato, JSON 401 em APIs,
  redirect sem query e preservação de cookies de Auth.
- `lib/safe-diagnostics.ts`, helper Supabase e rotas Google/Places: log por
  operação/código/status, sem message/details/hint ou paths. Callers legados
  fora desse helper ainda precisam de revisão, explicitados na auditoria.
- `lib/google-service.ts`, `lib/server/google.ts`, connect/callback: contexto
  OAuth vinculado ao usuário inicial; não herda refresh token de outra conta.
- CI passou a executar `npm test` como bloqueante. Sem dependências novas.

## Documentação e testes

- Produto/release/resultados finais: `docs/RELEASE_V0.2.0.md`.
- Gates, auditoria local, privacidade e exclusão: `docs/BETA_PRIVADO.md`.
- Rotina, triagem privada e publicação: `docs/MANUTENCAO.md`.
- APIs/variáveis: `docs/INTEGRACOES_EXTERNAS.md`.
- Tarefas antigas preservadas integralmente em
  `docs/archive/TASKS_HISTORY_2026-08.md`. Não tratar fotografias antigas de
  “nenhum bloqueio” como estado atual. Pendências vigentes em `TASKS_NOW.md`.
- Smoke visual local concluído no computador e em viewport de celular:
  Configurações e o formulário de relato abriram, a prévia editável foi gerada
  com a versão 0.2.0 e nenhum dado foi enviado. Uma falha sanitizada e
  transitória de Agenda apareceu na primeira carga e a linha do tempo carregou
  depois. Google local permanece sem variáveis server-side. Retestes reais de
  módulos, duas contas, integrações e produção seguem manuais.

## Próximo bloco (se autorizado)

Publicar o frontend da exportação; `20260907000100` já passou reset completo,
21 testes SQL, aplicação autorizada e dry-run final vazio. A ferramenta local
de exclusão está implementada, mas ainda não foi ensaiada. Preservar cadastro
público fechado e concluir recuperação de senha e a matriz completa de duas
contas. SMTP próprio foi adiado enquanto Gabriel mantiver o projeto sem domínio
pago; nunca adicionar participantes à equipe administradora nem compartilhar
senha.

Antes de abrir: testar duas contas descartáveis e dados cruzados, Storage,
Google por usuário/serviço, expiração/troca de conta, exportação/exclusão e
checklist `teste.md`. Não apagar a conta real do Gabriel como teste.

## Comando de retomada das validações

Executar sequencialmente, no PowerShell, preservando alterações locais:

```powershell
Set-Location 'C:\Gabriel Oliveira\05-Sistema-Pessoal\frontend'
npm run typecheck
npm test
npm run build
npm run lint
Set-Location 'C:\Gabriel Oliveira\05-Sistema-Pessoal'
git diff --check
git status --short
```

Typecheck/test/build bloqueiam; lint tem dívida preexistente. Nunca registrar
uma execução interrompida como aprovada. Conferir diff/stage e segredos antes
de pedir publicação. Não repetir migrations sem necessidade/dry-run/permissão.

## Prompt exato para continuar

“Continue a preparação v0.2.0 no repositório Sistema Pessoal. Leia AGENTS.md,
docs/NEXT_ENGINEER_HANDOFF.md, docs/TASKS_NOW.md e docs/RELEASE_V0.2.0.md.
Confira git status e os resultados registrados antes de repetir trabalho.
Finalize somente validações/revisões pendentes do lote local. Depois prepare
o bloco separado de convite e recuperação de senha com Supabase Auth,
preservando cadastro público fechado. Não altere Supabase remoto, contrate
serviço, envie convites nem faça commit/push sem autorização explícita.”
