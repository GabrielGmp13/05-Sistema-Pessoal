# BACKLOG.md

Ideias futuras e funcionalidades não priorizadas. Nada aqui é compromisso — é uma lista de possibilidades para quando o núcleo do sistema estiver estável. Ver também `ROADMAP.md` → Fase 6 (Integrações Externas) e `VISION.md` para módulos ainda mais distantes.

---

## Treino

 [ ] Notificações push (Service Worker Push API) — lembrete de treino
 [ ] Gráfico de evolução de carga por exercício
 [ ] Volume semanal por grupo muscular
 [ ] Página dedicada para `cardio` (tabela já existe no schema, sem página ainda)

## Geral

 [ ] Exportação de dados CSV/JSON via Supabase
 [ ] Google Calendar OAuth via Supabase Edge Function (ver DEC-009 — decisão de não fazer isso no MVP)
 [ ] Dashboard analytics avançado
 [ ] Modo múltiplos usuários (RLS já suporta — bastaria criar contas; não é objetivo do projeto por princípio, ver PROJECT_PRINCIPLES.md)

## Estudos

 [ ] Questões individuais estruturadas (hoje `sessoes_questoes` só registra desempenho agregado por sessão, não questão a questão)
 [ ] Importação de dados do sistema ENEM standalone antigo, se houver conteúdo relevante a resgatar

## Documentação / processo

 [ ] Revisar `NAMING_CONVENTIONS.md` de classes CSS  hoje há mistura de prefixo por página (`.rev-`, `.cal-`, `.ex-`) com nomes genéricos (`.btn-sm`, `.toast`); avaliar se vale padronizar
 [ ] Auditoria completa de `style.css` contra `DESIGN.md` para confirmar que todas as classes documentadas realmente existem

 ## Biblioteca
 
 [ ] Validar tamanho do arquivo de capa no frontend antes do upload (checar `file.size` e bloquear/avisar antes de chamar o Storage), evitando a chamada desnecessária que hoje só falha depois, no bucket