# TASKS.md

## Status Geral

**Fase atual:** 2 — Módulo de Treino  
**Bloqueio imediato:** validar `window.db.update` (merge parcial vs substituição total)

---

## 🔴 Bloqueante: validar window.db.update

**Por quê:** se `window.db.update` faz substituição total do registro (em vez de merge parcial), a função `moverExercicio` em `treino-plano.html` vai apagar todos os campos do exercício ao salvar apenas `{ ordem, updated_at }`.

**Como testar:**
1. Abrir `http://10.0.0.188:5000/treino-plano.html`
2. Criar exercício com todos os campos preenchidos (nome, séries, reps, carga, descanso)
3. Clicar ▲ ou ▼ para reordenar
4. Verificar se os outros campos continuam intactos

**Se for substituição total:** precisamos ajustar `moverExercicio` para ler o registro completo antes de atualizar.

---

## Fase 2 — Tarefas em ordem de execução

### ✅ Concluídas (aguardam "funcionou")

- [x] `treino-plano.html` gerado — CRUD divisões + exercícios
- [x] `treino-academia.html` gerado — Modo Academia mobile

### 🔄 Próximas (em ordem)

#### 3. app.py — atualizar

- [ ] Adicionar tabela `agenda` em `init_db()`:
  ```sql
  CREATE TABLE IF NOT EXISTS agenda (
    uuid TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    treino_uuid TEXT,
    google_event_id TEXT,
    titulo TEXT,
    updated_at TEXT NOT NULL,
    deleted INTEGER DEFAULT 0
  )
  ```
- [ ] Adicionar endpoint `POST /api/upload/shape`:
  - Aceita `multipart/form-data` com campo `file`
  - Salva em `backend/uploads/shape/`
  - Retorna `{ path: "uploads/shape/nome_do_arquivo.jpg" }`
- [ ] ~~Google Calendar OAuth~~ → **DEFERIDO** (ver seção Decisões de Escopo)

#### 4. db.js — atualizar

- [ ] Adicionar store `agenda` com os mesmos campos da tabela SQLite
- [ ] Verificar se a versão do IndexedDB (schema version) precisa ser incrementada para adicionar o store

#### 5. treino.html — criar

- [ ] Sub-nav (Calendário ativo)
- [ ] Calendário semanal: 7 dias × lista de divisões disponíveis
  - Cada dia: dropdown ou clique para atribuir divisão → escreve em `agenda`
- [ ] Calendário mensal: grid CSS, células coloridas por status
  - Verde: `sessao_treino` concluída no dia
  - Azul: sessão concluída + PR detectado
  - Vermelho: `agenda` no passado sem sessão
  - Cinza claro: `agenda` no futuro
- [ ] Seção cardio: form registro (tipo, duração, distância, obs) + tabela histórico
- [ ] Radar chart `type: 'radar'` com Chart.js
  - Disciplina, Força, Resistência (fórmulas em FEATURES.md)
- [ ] Galeria de fotos de shape (imagens em rolagem)
- [ ] ~~Integração Google Calendar~~ → **DEFERIDA**

#### 6. treino-shape.html — criar

- [ ] Form: data, peso (kg), caminho da foto (texto), observações
- [ ] Gráfico de linha: evolução de peso (Chart.js)
- [ ] Tabela de histórico: data, peso, observações
- [ ] Exibir `<img src="foto_path">` quando caminho preenchido
- [ ] ~~Upload real via POST /api/upload/shape~~ → path de texto por ora

---

## Bugs Conhecidos

| Bug | Severidade | Ação |
|---|---|---|
| `window.db.update` comportamento não confirmado | 🔴 Alta | Testar antes de avançar |
| `treino-academia.html` importa Chart.js CDN sem usar | 🟡 Média | Remover `<script src="cdnjs.../chart.umd.min.js">` da página |
| `treino-academia.html` não testado no celular real | 🔴 Alta | Testar após treino-plano.html funcionar |
| `foto_path` em `shape` com path absoluto Windows quebra em mobile | 🟡 Média | Documentado, aceitável para MVP |

---

## Backlog (pós-MVP Fase 2)

### Técnico
- [ ] Sistema de migração de schema (IndexedDB version bump + SQLite ALTER TABLE)
- [ ] Índice em `series_executadas.exercicio_uuid` (performance com histórico longo)
- [ ] Modularização do `app.py` com Flask Blueprints
- [ ] Testes automatizados do fluxo de sync
- [ ] Remover Chart.js CDN de páginas que não usam gráficos

### Funcionalidades
- [ ] Google Calendar OAuth via Flask (quando houver HTTPS na LAN ou no MVP v2)
- [ ] Upload real de fotos de shape (`POST /api/upload/shape`)
- [ ] Gráfico de evolução de carga por exercício (linha temporal)
- [ ] Volume semanal por grupo muscular
- [ ] Exportação de dados em CSV/JSON
- [ ] Histórico de sessões com detalhamento por exercício

---

## Decisões de Escopo

### ✅ Incluído no MVP

| Decisão | Justificativa |
|---|---|
| Agenda **manual** (tabela `agenda` sem Google Calendar) | Zero dependência externa, funciona offline, zero risco de falha OAuth |
| Foto de shape via **texto de caminho** | Funciona sem endpoint de upload no MVP |
| **Radar chart** via Chart.js nativo | `type: 'radar'` já está no Chart.js — sem dependência nova |
| **PR** calculado em memória (não persistido como flag) | Sem campo novo no schema; calculado retroativamente para o calendário |

### ❌ Deferido

| Decisão | Motivo técnico | Alternativa no MVP |
|---|---|---|
| Google Calendar OAuth | OAuth 2.0 exige `redirect_uri` `https://` ou `localhost`. LAN usa IP (`10.0.0.188`). Exige: endpoint `/auth/google`, `/auth/callback`, armazenamento de token, rota `/google/calendar/events`, tratamento de refresh token. Alto risco de bloqueio OAuth pela policy do Google. | Agenda manual |
| Upload real de arquivo | Novo endpoint Flask + gestão de pasta + path relativo vs absoluto + MIME validation | Campo texto |
| Sistema ENEM integrado | Já existe standalone e funcional; integração exige migração de localStorage → IndexedDB | Manter separado |
| Módulo Biblioteca | TMDB + Google Books requerem API keys, CORS handling, tratamento de resultados | Fase 4 |
| Módulo Revisão Espaçada UI | Backend pronto; UI é uma fase inteira | Fase 5 |
| Módulos Olimpíadas / Escola | Sem prioridade para o MVP | Fase 3 |

---

## Checklist de MVP Fase 2

```
[ ] treino-plano.html: criar divisão, adicionar exercício, reordenar — funcionando no browser
[ ] treino-academia.html: selecionar treino, completar série, timer toca — funcionando no celular offline
[ ] app.py: tabela agenda criada, endpoint upload criado
[ ] db.js: store agenda adicionado
[ ] treino.html: calendário semanal funciona, agenda manual funciona, calendário mensal colore
[ ] treino-shape.html: registrar peso, ver gráfico de evolução
[ ] sync: dados criados no celular aparecem no PC após sincronizar
```
