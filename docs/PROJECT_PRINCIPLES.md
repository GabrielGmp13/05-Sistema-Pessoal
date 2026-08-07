# PROJECT_PRINCIPLES.md

Princípios permanentes do Sistema Pessoal. Servem para impedir que futuras IAs (ou o próprio Gabriel, sob pressão de prazo) proponham mudanças incompatíveis com a visão original do projeto. Alterar algo aqui exige justificativa forte e, idealmente, uma nova entrada em `DECISIONS.md`.

---

1. **Sistema pessoal, não produto.** Uso individual de longo prazo. Nenhuma decisão deve ser tomada pensando em múltiplos usuários pagantes, crescimento de base ou monetização.

2. **Sem monetização, sem anúncios.** Não há e não haverá modelo de receita. Isso remove classes inteiras de complexidade (billing, planos, analytics de conversão) do escopo do projeto permanentemente.

3. **Simplicidade acima de complexidade.** Entre uma solução simples e uma "inteligente", vence a simples. Ver DEC-002 (eliminação do Flask) e DEC-006 (sem framework front-end) como exemplos concretos dessa escolha em ação.
> Nota (2026-07-14, DEC-018): simplicidade nunca deve ser usada para justificar
> insegurança (ex: segredo exposto no frontend). Entre duas soluções seguras,
> vence a mais simples — mas segurança não é barganhável por simplicidade.

4. **Segurança acima de conveniência.** Storage sempre privado, sempre via signed URL (DEC-010). RLS em toda tabela sem exceção. Nunca trocar isolamento de dados por facilidade de implementação.

5. Frontend componentizado por decisão arquitetural (Next.js/React, DEC-018), não por modismo. A escolha de framework segue a mesma régua do item 3: resolve um problema real (reaproveitamento de componentes com estado aninhado, segredo protegido do navegador) que a alternativa mais simples (HTML puro) parou de resolver bem. Não reabrir essa decisão sem uma limitação real e documentada — mesma régua aplicada quando HTML puro foi escolhido em DEC-006.

6. **Evitar dependências desnecessárias.** Cada biblioteca externa é uma superfície de manutenção a mais pelos próximos anos. Antes de adicionar uma dependência, perguntar se o problema pode ser resolvido com o que já está no stack.

7. **Código simples é preferível a soluções "inteligentes".** Preferir uma função de 10 linhas óbvia a uma de 3 linhas que exige releitura. Este projeto será mantido por uma pessoa, possivelmente sozinha, por anos — legibilidade futura importa mais que elegância presente.

8. **Offline sempre que possível.** Onde fizer sentido para o uso real (ex: modo Academia sem internet no ginásio), o sistema deve degradar graciosamente em vez de travar. Ver DEC-004.

9. **Não alterar stack sem justificativa forte e nova informação.** A stack atual (Next.js/TypeScript + Supabase + Vercel, ver DEC-018) foi escolhida depois de comparar alternativas reais (ver DEC-001, DEC-006, DEC-018). Reabrir essa escolha exige um motivo concreto, não preferência estética.

10. **Custo zero.** O projeto deve continuar operando dentro do free tier do Supabase e do Vercel indefinidamente. Qualquer decisão que arrisque sair do free tier (ex: armazenar arquivos de mídia pesados) precisa ser questionada — ver DEC-011 como exemplo desse limite sendo respeitado deliberadamente.

11. **Escopo proporcional.** Cada módulo deve fazer bem uma coisa e não crescer para além do que resolve. A Biblioteca é catálogo, não repositório de mídia (DEC-011); a Agenda é manual, não uma integração OAuth completa (DEC-009). Resistir à tentação de generalizar antes de precisar.

12. **Nome de coluna sempre confere com `DATABASE.md` antes de escrever código.** Regra nascida de bugs reais já cometidos neste projeto (ver `DATABASE.md` → Gotchas). Nunca assumir um nome de coluna de memória.

---

## Fluxo de trabalho com IAs

**Atualização (2026-08):** o projeto passou a ser desenvolvido com apoio de
mais de um agente de IA — Claude (via chat, arquitetura/documentação/decisões
maiores) e Codex (via `AGENTS.md`, análise de repositório e execução de
tarefas de código). Não há mais um "codificador principal" fixo amarrado a
uma ferramenta específica — qualquer agente que assumir esse papel numa
sessão deve seguir a mesma disciplina:

1. Ler `AI_CONTEXT.md` primeiro, depois este documento, antes de propor
   qualquer mudança estrutural.
2. Nunca commitar diretamente — geração de código é entregue como arquivo
   completo (criação nova) ou diff old→new (alteração), para Gabriel aplicar
   manualmente.
3. Nunca reabrir uma decisão de `DECISIONS.md` sem informação nova e concreta.
4. Nunca assumir nome de coluna/tabela/rota de memória — conferir em
   `DATABASE.md` ou no código real do repositório (público em
   `github.com/GabrielGmp13/05-Sistema-Pessoal`).

**Histórico:** Cline+DeepSeek (VS Code) foi usado situacionalmente até
2026-07-23, quando foi desativado — o fluxo passou a ser geração direta de
arquivo/diff completo por chat, sem ferramenta intermediária de execução.