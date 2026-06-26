# ROADMAP.md

## Visão de Produto

Sistema local de gestão pessoal. MVP em 1 semana. Fases independentes e entregáveis por si sós.

---

## Fase 1 — Fundação ✅ COMPLETA

**Entregáveis confirmados e funcionando:**
- 20 tabelas SQLite (WAL mode)
- CRUD genérico: 5 rotas cobrindo todas as tabelas
- Algoritmo SM-2 para revisão espaçada
- Sync bidirecional last-write-wins (`POST /api/sync`)
- Biblioteca CSS completa (1105 linhas, mobile-first)
- PWA manifest + ícones
- Fontes self-hosted (JetBrains Mono + Syne, 10 arquivos .woff2)
- Dashboard (`index.html`): 4 cards + gráfico semanal
- `iniciar.bat` para Windows

---

## Fase 2 — Módulo de Treino 🔄 EM ANDAMENTO

**Objetivo:** sistema completo de gestão de treino físico funcional no MVP.

### Arquivos e status

| Arquivo | Descrição | Dependências | Status |
|---|---|---|---|
| `treino-plano.html` | CRUD divisões + exercícios (PC) | nenhuma | ✅ Gerado |
| `treino-academia.html` | Modo Academia mobile | nenhuma | ✅ Gerado |
| `app.py` (update) | Tabela `agenda` + endpoint upload | — | 🔄 Pendente |
| `db.js` (update) | Store `agenda` | `app.py` update | 🔄 Pendente |
| `treino.html` | Hub: calendário + radar chart | `app.py` + `db.js` | 🔄 Pendente |
| `treino-shape.html` | Shape: fotos + gráfico peso | `app.py` update | 🔄 Pendente |

### Critério de conclusão da Fase 2

- [ ] Criar divisão de treino com exercícios no PC
- [ ] Executar treino no celular (offline, sem WiFi) com timer e PR
- [ ] Sincronizar dados ao retornar para WiFi
- [ ] Ver calendário mensal de treinos (verde/azul/vermelho/cinza)
- [ ] Registrar peso e foto de shape
- [ ] Radar chart de aptidão (Disciplina / Força / Resistência)

### Funcionalidades deferidas do MVP (ver TASKS.md)

- Google Calendar OAuth → agenda manual substitui no MVP
- Upload real de arquivo de foto → texto de caminho substitui no MVP

---

## Fase 3 — Módulo de Estudos ⏳ PLANEJADA

**Arquivos:** `enem.html` · `olimpiadas.html` · `escola.html`

| Funcionalidade | Origem |
|---|---|
| Banco de provas ENEM 2009–2024 | Sistema standalone existente (localStorage) |
| Simulados feitos + log de erros | Sistema standalone existente |
| Mapa de conteúdo por área (3 estados) | Sistema standalone existente |
| Tracker de redação C1–C5 | Sistema standalone existente |
| Análise de desempenho | Sistema standalone existente |
| Gestão de problemas de olimpíadas | Novo |
| Controle de atividades escolares | Novo |

> **Nota:** sistema ENEM standalone existe em `C:\Gabriel Oliveira\04-Educacional\Enem\` (13 páginas, localStorage, mesmo design system). Será refinado em chat dedicado. Decidir se integra ao sistema principal ou permanece separado.

---

## Fase 4 — Biblioteca ⏳ PLANEJADA

**Arquivo:** `biblioteca.html`

| Mídia | API | Status |
|---|---|---|
| Livros | Google Books API | ⏳ |
| Filmes / Séries | TMDB API | ⏳ |
| Mangás | Manual | ⏳ |
| Podcasts | Manual | ⏳ |

Funcionalidades: status de leitura/visualização, avaliações, notas pessoais.

---

## Fase 5 — Revisão Espaçada Global ⏳ PLANEJADA

**Arquivo:** `revisao.html`

> Backend SM-2 já está implementado (`app.py`). Esta fase é só o frontend.

| Funcionalidade | Endpoint já existe? |
|---|---|
| Revisão diária de cards vencidos | ✅ `GET /api/revisao_espacada/hoje` |
| Avaliação de card (qualidade 0–3) | ✅ `POST /api/revisao_espacada/<uuid>/avaliar` |
| Criação de cards por qualquer módulo | 🔄 A definir |
| Estatísticas de retenção | 🔄 A definir |

---

## Integrações Externas ⏳ FUTURO

| Integração | Finalidade | Fase | Complexidade |
|---|---|---|---|
| Google Calendar OAuth | Importar agenda de treinos | 4+ | Alta — requer OAuth server-side via Flask (LAN não suporta redirect OAuth diretamente) |
| TMDB API | Metadados filmes/séries | 4 | Baixa — API key simples |
| Google Books API | Metadados livros | 4 | Baixa — API key simples |

---

## MVP da Fase 2 (1 semana)

### Incluído

| Item | Justificativa |
|---|---|
| Agenda manual (tabela `agenda`) | Zero dependência externa, funciona offline |
| Timer de descanso (Web Audio API) | Já implementado, sem dependência |
| Detecção de PR em memória | Já implementado |
| Foto via texto de caminho | Funciona sem endpoint de upload |
| Radar chart (Chart.js `type: 'radar'`) | Chart.js já na stack |
| Calendário mensal colorido | CSS Grid puro, sem biblioteca extra |

### Excluído

| Item | Motivo | Alternativa no MVP |
|---|---|---|
| Google Calendar OAuth | Requer OAuth2 server-side + HTTPS/localhost, múltiplos endpoints, alta chance de bloqueio | Agenda manual |
| Upload real de arquivo | Novo endpoint Flask + gestão de pasta | Campo texto com caminho local |
