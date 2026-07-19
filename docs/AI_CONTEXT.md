# AI_CONTEXT.md

> **Leia este arquivo primeiro.** Ele é o ponto de entrada do projeto — um bootstrap para qualquer IA (ou você mesmo) retomar o trabalho sem precisar reler tudo. Detalhes técnicos vivem nos documentos linkados abaixo, não aqui.

---

## Projeto

**Sistema Pessoal** — gestão pessoal online, multi-dispositivo, para uso individual de longo prazo.
**Desenvolvedor:** Gabriel, 18 anos, estudante (Pernambuco, BR).
**Editor:** VS Code · Windows
**Comunicação:** Português · tom direto · sem rodeios

Qualquer IA que retomar este projeto assume o papel de **codificador principal**, a menos que o usuário diga o contrário. Ver `PROJECT_PRINCIPLES.md` para o fluxo de trabalho com outras ferramentas de IA (Cline+DeepSeek, ChatGPT).

---

## Estado atual

**Fase:** Fase 7 — v2 é o único frontend ativo (v1 removida do projeto em 2026-07-19)
**v1:** removida da pasta do projeto (mantida só como backup local, fora do repositório)
**Decisão-chave:** DEC-018 (reabre DEC-006) — frontend migrou de HTML puro para Next.js/React · DEC-031 formaliza a virada definitiva
**Próxima tarefa imediata:** ver TASKS_NOW.md

---

## Stack (resumo — detalhes em ARCHITECTURE.md)

| Camada | Tecnologia |
|---|---|
| Banco de dados | PostgreSQL via Supabase |
| Auth | Supabase Auth (email+senha) |
| Storage | Supabase Storage — 3 buckets privados |
| Frontend | Next.js (React) + TypeScript — pasta `frontend/` (renomeada de `frontend-v2/`), único frontend do projeto, ver DEC-018/DEC-031 |
| Backend leve | API Routes (Next.js, serverless no Vercel) — só para segredo/lógica servidor |
| Gráficos | Chart.js 4.5.0 (CDN) |
| Offline | Service Worker (planejado — Fase M2) |
| Hosting | Vercel (pronto para deploy) |

---

## Regras gerais

1. Um arquivo completo por resposta — sem cortes, sem placeholders.
2. Aguardar confirmação do usuário antes do próximo arquivo.
3. Avisar se um arquivo passar de 400 linhas antes de gerar.
4. Não alterar stack sem justificativa forte (ver `PROJECT_PRINCIPLES.md`).
5. Toda nova página segue o padrão descrito em `ARCHITECTURE.md` → Frontend.
6. Todo nome de coluna/tabela deve ser conferido em `DATABASE.md` antes de escrever queries — a causa mais comum de bugs neste projeto até agora foi nome de coluna inventado sem checar o schema real.

---

## Mapa da documentação

| Documento | Conteúdo |
|---|---|
| `ARCHITECTURE.md` | Diagrama do sistema, componentes Supabase, camadas do frontend, Service Worker, Realtime |
| `DATABASE.md` | Todas as tabelas, colunas, relacionamentos, RLS, convenções de migração, gotchas de nomes |
| `DESIGN.md` | Paleta, tipografia, componentes de UI, responsividade |
| `PROJECT_PRINCIPLES.md` | Princípios permanentes do projeto |
| `MODULE_TEMPLATE.md` | Modelo para documentar novos módulos |
| `DECISIONS.md` | Decisões arquiteturais com alternativas consideradas |
| `ROADMAP.md` | Fases do projeto e o que falta em cada uma |
| `VISION.md` | Visão macro de módulos futuros |
| `TASKS_NOW.md` | Tarefas ativas e próximas ações |
| `BACKLOG.md` | Ideias futuras, não priorizadas |
| `CHANGELOG.md` | Histórico de mudanças por marco |
| `NAMING_CONVENTIONS.md` | Padrões de nomenclatura (arquivos, SQL, JS, CSS) |
| `COMMIT_CONVENTIONS.md` | Padrão de mensagens de commit |