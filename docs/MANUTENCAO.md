# Manutenção e suporte

Responsável inicial: Gabriel. Operação sem painel admin próprio; chamados ficam
no Supabase e o e-mail opcional é apenas um aviso.

## Onde guardar cada informação

| Informação | Lugar |
|---|---|
| Trabalho da próxima rodada | [TASKS_NOW.md](TASKS_NOW.md) |
| Mudanças concluídas/publicadas | [CHANGELOG.md](CHANGELOG.md), com data, versão/commit e status real |
| Escopo e limitações da versão | [RELEASE_V0.2.0.md](RELEASE_V0.2.0.md) |
| Ideias sem compromisso | [BACKLOG.md](BACKLOG.md) / [VISION.md](VISION.md) |
| Teste que depende de uma pessoa | [teste.md](teste.md) |
| Usuários, e-mails, prints e relatos originais | Supabase privado, **nunca neste repositório público** |

## Receber e resolver um bug

1. A pessoa abre **Configurações → Bugs e sugestões**, envia texto/prints e
   recebe protocolo `SP-AAAAMMDD-XXXXXXXX`. Não pedir senha, cookie, token,
   HAR completo, chave ou dump de conta.
2. Gabriel recebe aviso opcional por e-mail e abre o registro completo apenas
   no Supabase Dashboard. E-mail não contém print nem link assinado.
3. Classificar P0–P3, reproduzir com dados descartáveis e alterar status/resposta.
   O trigger registra o histórico que a própria pessoa vê no site.
4. Reproduzir com dados descartáveis. No Git/backlog entra somente resumo
   anonimizado e instrução de teste, sem print de dados reais ou e-mail.
5. Corrigir um bloco, adicionar regressão quando possível, validar, pedir
   autorização de publicação e confirmar com quem reportou.
6. Proposta de retenção a aprovar antes da abertura: apagar print/relato bruto
   até 30 dias após resolver ou encerrar o piloto, salvo incidente em análise;
   preservar só resumo técnico anonimizado. Explicar exceções ao participante.

Prioridades: **P0** exposição/acesso cruzado → interromper cadastros e conter
acesso; **P1** perda de dados/login/salvamento impedido → não ampliar público;
**P2** defeito com alternativa segura → corrigir no próximo lote; **P3** melhoria
visual/ideia → backlog. Estado: recebido → reproduzido → em correção → aguardando
reteste → resolvido. Intermitente fica “precisa de evidência”, não “resolvido”.

## Toda semana (e após cada publicação)

- [ ] Vercel: confirmar deploy/CI e observar falhas 4xx/5xx, duração das funções
      e rotas afetadas; não copiar corpo, query OAuth ou logs brutos para Git.
- [ ] Bugs: revisar pendências/P0/P1, reproduzir as novas e avisar o participante.
- [ ] Smoke: login/logout, salvar/ler uma obra e um compromisso, mídia privada,
      tema claro/escuro e formulário de bugs; usar conta descartável autorizada.
- [ ] Supabase: conferir Auth/signup/anon, usuários convidados esperados,
      erros de banco, uso e limites de Storage. Não apagar usuário como teste.
- [ ] Google/integrações: conferir quotas/429/renovação e custo. Evitar repetir
      sincronização/busca agressivamente; desligar integração opcional se necessário.
- [ ] Conferir orçamento acordado nos painéis Vercel, Supabase e provedores;
      ausência de fatura hoje não garante custo zero depois.
- [ ] Registrar data, evidência sanitizada, resultado e próxima ação. Se houver
      P0/P1 aberto ou quota apertada, suspender novos convites.

## Todo mês

- [ ] Revisar participantes/acessos, administradores, MFA dos operadores e
      restrições de chaves; revogar credenciais comprovadamente expostas.
- [ ] Conferir versões/avisos oficiais de segurança e `npm audit`; não executar
      `npm audit fix --force` nem atualizar dependências cegamente.
- [ ] Conferir evolução de banco/armazenamento, limites, MIME e políticas;
      qualquer mudança de schema segue cadeia incremental e autorização remota.
- [ ] Ensaiar recuperação/exportação com dados fictícios. SQL não substitui
      backup dos arquivos do Storage. Nunca restaurar sobre produção como ensaio.
- [ ] Revisar retenção de relatos/prints, incidentes, canal de contato e aviso
      do beta; manter dados pessoais fora da documentação pública.
- [ ] Escolher no máximo um próximo bloco funcional; distinguir bug,
      manutenção, validação pendente e ideia futura.

## Publicar e comunicar uma atualização

1. Registrar escopo e se há migration. Sem mudança de banco, declarar isso.
2. Em `frontend/`: `npm run typecheck`, `npm test`, `npm run build`; lint é
   informativo pela dívida existente, mas novos erros do lote devem ser corrigidos.
3. Rever diff/stage, segredos, `confirm(` / `window.prompt` e links de documentação.
4. Atualizar versão/lock quando houver release nova, CHANGELOG, tarefa e testes.
5. **Pedir autorização de commit/push**. Se houver migration: validação local,
   dry-run e autorização remota específica, sem misturar com permissão de Git.
6. Conferir CI/deploy e smoke. Só então marcar “publicado”. Copiar uma nota curta
   aos participantes no canal privado: versão/data, o que mudou, o que testar,
   limites conhecidos e como reportar. Não existe mural público de atualizações.
7. Se o deploy regredir, decidir rollback para deploy conhecido e compatível
   com o schema. Nunca reverter migration apagando dados; incidente de segurança
   pode exigir bloquear acesso, não apenas voltar código.

## Conta, exclusão e incidentes

Procedimento e gates em [BETA_PRIVADO.md](BETA_PRIVADO.md#privacidade-exclusão-e-incidentes).
Não há exclusão/exportação completa em um clique; pedidos exigem identificação,
escopo e autorização registrados privadamente. Não prometer revogação instantânea
de JWTs, apagamento de backups de provedores ou conformidade legal integral.
