# BACKLOG.md

Ideias futuras e funcionalidades não priorizadas. Nada aqui é compromisso — é uma lista de possibilidades para quando o núcleo do sistema estiver estável. Ver também `ROADMAP.md` → Fase 6 (Integrações Externas) e `VISION.md` para módulos ainda mais distantes.

---

## Treino

- [ ] Notificações push (Service Worker Push API) — lembrete de treino — **depende de M2, fora de escopo v1**
- [ ] Gráfico de evolução de carga por exercício
- [ ] Volume semanal por grupo muscular
- [ ] Página dedicada para `cardio` — **adiado para v2**, módulo de Treino será revisado por completo

## Geral

- [ ] Exportação de dados CSV/JSON via Supabase
- [ ] Google Calendar OAuth via Supabase Edge Function (ver DEC-009 — decisão de não fazer isso no MVP)
- [ ] Dashboard analytics avançado
- [ ] Modo múltiplos usuários (RLS já suporta — bastaria criar contas; não é objetivo do projeto por princípio, ver PROJECT_PRINCIPLES.md)

## Estudos

- [ ] Questões individuais estruturadas (hoje `sessoes_questoes` só registra desempenho agregado por sessão, não questão a questão)
- [ ] Importação de dados do sistema ENEM standalone antigo, se houver conteúdo relevante a resgatar

## Documentação / processo

- [ ] Revisar `NAMING_CONVENTIONS.md` de classes CSS  hoje há mistura de prefixo por página (`.rev-`, `.cal-`, `.ex-`) com nomes genéricos (`.btn-sm`, `.toast`); avaliar se vale padronizar
- [ ] Auditoria completa de `style.css` contra `DESIGN.md` para confirmar que todas as classes documentadas realmente existem

## Biblioteca

## Treino v2

- [ ] Substituir `confirm()` nativo do navegador por modal de confirmação (padrão `.open`) ao apagar treino — inconsistência com `DESIGN.md` introduzida na geração inicial das páginas v2, adiada por decisão explícita (2026-07-16)
- [ ] Gráfico de evolução de peso em `app/treino/shape/page.tsx` — decisão de dependência (Chart.js via CDN solto vs. `react-chartjs-2`) ainda não tomada para v2
- [ ] Upload de imagem/GIF de exercício (`imagem_path`, bucket `exercicios`) — CRUD de exercício ficou só textual na primeira leva
- [ ] Reordenação de exercícios (`ordem`) via drag-and-drop ou setas — hoje `ordem` só reflete sequência de criação


## v3 (futuro distante)

- [ ] Migrar estilização de CSS Modules para Tailwind — decisão tomada durante planejamento da v2 (2026-07-14), fora de escopo da v2