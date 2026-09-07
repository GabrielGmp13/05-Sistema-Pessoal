# Aviso de privacidade — rascunho para aprovação

**Não publicar ainda.** Este é um rascunho operacional, não parecer jurídico.
Gabriel precisa aprovar os itens marcados e buscar revisão profissional antes
de uma abertura ampla, especialmente porque o sistema pode guardar saúde,
finanças, diário e outros dados de alto impacto.

## Decisões que Gabriel precisa aprovar

1. **Responsável/controlador:** nome público usado no aviso.
2. **Canal de privacidade:** e-mail exclusivo para acesso, correção, exportação,
   exclusão e incidentes. Não usar somente formulário que exige login.
3. **Público:** recomendação inicial de uso apenas por maiores de 18 anos.
4. **Dados sensíveis:** confirmar se Saúde/Diário aceitarão público agora ou
   ficarão fora do primeiro piloto até revisão jurídica específica.
5. **Bases legais:** validar com profissional quais bases se aplicam a conta,
   segurança, dados voluntários e integrações; não chamar tudo de “consentimento”.
6. **Retenção proposta:** chamados/prints até 30 dias após fechamento; conta e
   conteúdo enquanto ativa; após pedido de exclusão, apagar dados ativos em até
   30 dias, ressalvadas obrigações e ciclos técnicos documentados dos provedores.
7. **Inatividade:** decidir se contas inativas serão preservadas ou apagadas
   depois de aviso prévio. Recomendação inicial: não apagar automaticamente.
8. **Exportação:** definir formato e prazo operacional. Recomendação inicial:
   pedido pelo canal de privacidade, confirmação de identidade e resposta em
   até 15 dias, sem prometer portabilidade perfeita ainda inexistente.
9. **Provedores/transferência:** aprovar a lista Supabase, Vercel, Resend,
   Cloudflare e integrações opcionais Google/APIs, com links aos avisos deles.
10. **Incidentes:** aprovar quem recebe alerta, como bloquear cadastro e como
    avaliar comunicação ao titular/ANPD.

## Texto-base futuro

O Sistema Pessoal trata o e-mail e dados de autenticação para criar e proteger
a conta. Os conteúdos inseridos voluntariamente — inclusive dados de estudos,
agenda, treino, saúde, finanças, diário e coleções — são usados para oferecer as
funções escolhidas pelo usuário. Integrações opcionais tratam somente os dados
necessários à função ativada.

Também tratamos informações técnicas mínimas para segurança, prevenção de abuso,
diagnóstico e funcionamento. Chamados de suporte podem conter texto, contexto
do dispositivo e prints enviados voluntariamente. Senhas não são acessíveis a
Gabriel e nunca devem ser enviadas em chamados.

Os dados são hospedados ou processados por provedores contratados para banco,
autenticação, armazenamento, hospedagem, proteção contra abuso e e-mail. Alguns
podem processar dados fora do Brasil. A lista atual e suas finalidades deve ficar
disponível e ser atualizada quando um provedor mudar.

Cada pessoa pode solicitar confirmação de tratamento, acesso, correção,
informações, exportação possível e exclusão pelo canal público de privacidade.
Antes de atender um pedido, o Sistema Pessoal poderá confirmar a identidade para
evitar entregar ou apagar dados da pessoa errada.

Aplicamos isolamento por conta, armazenamento privado, links temporários,
validação de sessão, limites e revisão de acesso. Nenhum sistema é totalmente
livre de risco. Incidentes relevantes serão avaliados e comunicados conforme a
legislação e orientação aplicáveis.

## Retenção operacional proposta

| Dado | Prazo proposto | Ação |
|---|---|---|
| Conta e conteúdo pessoal | enquanto a conta estiver ativa | excluir após pedido confirmado, respeitando ciclos técnicos declarados |
| Chamado aberto | enquanto necessário para tratar | restringir acesso e evitar cópia para Git |
| Chamado fechado e print | até 30 dias após fechamento | apagar conteúdo bruto/arquivo; manter resumo técnico anônimo se necessário |
| Aviso de e-mail | conforme política do provedor | não usar como arquivo do chamado |
| Logs técnicos | menor prazo oferecido/configurável compatível com segurança | não registrar conteúdo pessoal deliberadamente |
| Backup | conforme plano/política de cada provedor | documentar que exclusão pode não ser instantânea em cópias técnicas |

## Antes de publicar o aviso

- substituir todos os conceitos genéricos por nome, contato, data e versão;
- confirmar o inventário real de dados e provedores contra código/painéis;
- implementar o procedimento que o texto promete;
- testar solicitação de acesso/exportação/exclusão com conta descartável;
- disponibilizar link público no cadastro, login e configurações;
- registrar aceite/versionamento somente se juridicamente necessário e definido.
