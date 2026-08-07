# COMMIT_CONVENTIONS.md

Padrão de commits baseado em Conventional Commits, adaptado ao vocabulário do projeto.

## Formato

```
tipo(escopo): descrição curta no imperativo

[corpo opcional explicando o porquê, não o quê]
```

## Tipos

| Tipo | Uso |
|---|---|
| `feat` | Nova funcionalidade ou página |
| `fix` | Correção de bug |
| `docs` | Mudança só em documentação |
| `refactor` | Mudança de código que não altera comportamento |
| `style` | Formatação, espaçamento, sem mudança de lógica |
| `test` | Testes (ainda não há suíte formal no projeto) |
| `chore` | Manutenção — remoção de arquivos mortos, dependências, config |

## Escopo

Usar o nome do módulo ou arquivo afetado: `treino`, `estudos`, `auth`, `db`, `shape`, `revisao`.

## Exemplos reais do projeto

```
feat(estudos): cria schema 002_estudos.sql com 5 tabelas
fix(treino-academia): corrige nomes de coluna para bater com o schema real
fix(revisao): corrige colunas pergunta/resposta/intervalo_dias/ef
chore: remove arquivos mortos da arquitetura LAN (db.js, api.js, sync.js, backend/)
docs: adiciona DATABASE.md e move schema de ARCHITECTURE.md
refactor(supabase): softDelete passa a retornar {error} em vez de boolean
```

## Regras

- Descrição curta sempre no imperativo ("corrige", não "corrigido" ou "corrigindo").
- Um commit, uma mudança lógica — evitar misturar `feat` com `fix` não relacionado no mesmo commit.
- Commits de documentação (`docs`) separados de commits de código, mesmo quando nascem da mesma sessão de trabalho.

> **Nota (2026-08):** nem todo commit real do projeto até agora segue esse
> formato à risca (ex: commits de aplicação manual de arquivo gerado por
> chat, sem prefixo `tipo(escopo):`). A convenção vale como padrão daqui pra
> frente, especialmente para commits gerados por um agente de IA — não é
> motivo pra reescrever histórico de commit já feito.
