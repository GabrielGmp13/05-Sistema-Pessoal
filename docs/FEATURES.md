# FEATURES.md

## Módulo: Dashboard

**Arquivo:** `index.html` · **Status:** ✅ Completo · **Uso:** PC e celular

| Funcionalidade | Fonte de dados | Status |
|---|---|---|
| Card: treinos na semana | `sessoes_treino` | ✅ |
| Card: revisões pendentes | `revisao_espacada` (SM-2) | ✅ |
| Card: peso atual | `shape` (último registro) | ✅ |
| Card: streak de treino | `sessoes_treino` (dias consecutivos) | ✅ |
| Gráfico de volume semanal (barras) | `series_executadas` | ✅ |

---

## Módulo: Treino

### Plano de Treino

**Arquivo:** `treino-plano.html` · **Status:** ✅ Gerado, aguardando validação · **Uso:** PC

| Funcionalidade | Status | Notas |
|---|---|---|
| Listar divisões de treino | ✅ | Filtra `deleted=0` |
| Criar divisão (nome + descrição) | ✅ | Modal |
| Editar divisão | ✅ | Modal, pré-preenchido |
| Excluir divisão (soft delete) | ✅ | Cascade: apaga exercícios vinculados |
| Listar exercícios da divisão selecionada | ✅ | Ordenado por `ordem` |
| Criar exercício (nome, séries, reps, carga, descanso) | ✅ | Modal |
| Editar exercício | ✅ | |
| Excluir exercício (soft delete) | ✅ | |
| Reordenar exercícios ▲▼ | ✅ | Swap do campo `ordem` no IndexedDB |
| Layout 2 colunas (divisões / exercícios) | ✅ | Responsivo: empilha em mobile |

---

### Modo Academia

**Arquivo:** `treino-academia.html` · **Status:** ✅ Gerado, aguardando validação · **Uso:** Celular (offline)

| Funcionalidade | Status | Notas |
|---|---|---|
| Seleção manual de divisão de treino | ✅ | Cards clicáveis |
| Detectar sessão em aberto (recovery) | ✅ | Busca `sessao_treino` com `data_fim=null` |
| Retomar sessão interrompida | ✅ | Reconstrói `seriesFeitas` do IndexedDB |
| Descartar sessão aberta | ✅ | Soft delete sessão + séries |
| Criar `sessao_treino` imediatamente ao iniciar | ✅ | Sem perda de dados em crash |
| Navegar entre exercícios (← →) | ✅ | Botões, sem swipe |
| Exibir nome e parâmetros alvo do exercício | ✅ | |
| Input de carga real (teclado numérico grande) | ✅ | `font-size: 2.8rem`, `inputmode="decimal"` |
| Input de reps reais | ✅ | |
| Sugestão da carga alvo como placeholder | ✅ | |
| Salvar `serie_executada` imediatamente ao confirmar | ✅ | Não espera "Concluir" |
| Detecção de PR em tempo real (ao digitar carga) | ✅ | Compara com `maxCargas` em cache |
| Badge "🏆 PR" visível durante o input | ✅ | |
| Atualizar cache de máximos quando PR ocorre | ✅ | |
| Timer de descanso regressivo (full-screen overlay) | ✅ | Contagem em segundos |
| Timer muda de cor (vermelho < 5s) | ✅ | |
| Alerta sonoro ao fim do timer (3 beeps 880Hz) | ✅ | Web Audio API — sem arquivo externo |
| Pular timer | ✅ | |
| Auto-avançar para próximo exercício (após completar séries alvo) | ✅ | |
| Pills de progresso por exercício (ativo / feito / pendente) | ✅ | |
| Botão "Concluir treino" sempre visível (pisca quando tudo feito) | ✅ | |
| Tela de resumo pós-treino (séries, exercícios, duração) | ✅ | |
| Campo de observações pós-treino | ✅ | Salvo em `sessao_treino.observacoes` |
| Salvar `data_fim` e observações ao finalizar | ✅ | |
| Voltar para seleção de treino | ✅ | |

---

### Hub / Calendário

**Arquivo:** `treino.html` · **Status:** 🔄 Pendente

| Funcionalidade | Status | Notas |
|---|---|---|
| Sub-nav: Calendário / Plano / Academia / Shape | ⏳ | |
| Calendário semanal: 7 colunas × divisões | ⏳ | Atribuir divisão a cada dia da semana |
| Atribuir divisão de treino a um dia da agenda | ⏳ | Escreve na tabela `agenda` |
| Calendário mensal colorido | ⏳ | Ver tabela de cores abaixo |
| Seção de cardio: form de registro | ⏳ | `cardio`: tipo, duração, distância, obs |
| Seção de cardio: histórico em tabela | ⏳ | |
| Radar chart: Disciplina / Força / Resistência | ⏳ | Chart.js `type: 'radar'` |
| Galeria de fotos de shape ao lado do calendário | ⏳ | Rolagem horizontal ou grid |

**Cores do calendário mensal:**

| Cor | Condição |
|---|---|
| 🟢 Verde | Dia com `sessao_treino` concluída (`data_fim != null`) |
| 🔵 Azul | Sessão concluída + pelo menos 1 serie com carga > máximo histórico anterior |
| 🔴 Vermelho | Dia na tabela `agenda` (data passada) sem `sessao_treino` correspondente |
| ⬜ Cinza claro | Dia na tabela `agenda` com data futura |
| ○ Sem marcação | Sem agenda e sem sessão |

**Fórmulas do radar:**

| Métrica | Fórmula | Fontes |
|---|---|---|
| Disciplina | `(sessões feitas / sessões agendadas) × 100` nos últimos 30 dias | `agenda` × `sessoes_treino` |
| Força | média de `(carga_real × reps_real)` por sessão de musculação, normalizada 0–100 pelo máximo histórico | `series_executadas` |
| Resistência | total de minutos de cardio nos últimos 30 dias, normalizado 0–100 pelo melhor mês histórico | `cardio` |

---

### Shape

**Arquivo:** `treino-shape.html` · **Status:** 🔄 Pendente

| Funcionalidade | Status | Notas |
|---|---|---|
| Registrar peso + data | ⏳ | |
| Campo de caminho de foto (texto livre) | ⏳ | MVP: não há upload real |
| Campo de observações | ⏳ | |
| Gráfico de evolução de peso (linha) | ⏳ | Chart.js |
| Exibir foto como `<img src="caminho">` | ⏳ | Funciona em desktop com path local; limitado em mobile |
| Histórico em tabela (data, peso, observação) | ⏳ | |

---

## Módulo: Estudos ⏳ Fase 3

### ENEM

> Sistema standalone em `C:\Gabriel Oliveira\04-Educacional\Enem\` já implementado com localStorage. Decidir se integra ou permanece separado.

| Funcionalidade | Status |
|---|---|
| Banco de provas 2009–2024 | ✅ (standalone) |
| Log de simulados feitos | ✅ (standalone) |
| Fila de correção | ✅ (standalone) |
| Log de erros (A/B/C) | ✅ (standalone) |
| Mapa de conteúdo por área (3 estados por tópico) | ✅ (standalone) |
| Tracker de redação (competências C1–C5) | ✅ (standalone) |
| Análise de desempenho + countdown | ✅ (standalone) |

### Olimpíadas

| Funcionalidade | Status |
|---|---|
| Gestão de problemas por competição e área | ⏳ |
| Classificação de dificuldade | ⏳ |
| Integração com revisão espaçada | ⏳ |

### Escola

| Funcionalidade | Status |
|---|---|
| Controle de atividades e prazos | ⏳ |
| Registro de notas | ⏳ |

---

## Módulo: Biblioteca ⏳ Fase 4

**Arquivo:** `biblioteca.html`

| Funcionalidade | API | Status |
|---|---|---|
| Tracking de livros | Google Books API | ⏳ |
| Tracking de filmes | TMDB API | ⏳ |
| Tracking de séries | TMDB API | ⏳ |
| Tracking de mangás | Manual | ⏳ |
| Tracking de podcasts | Manual | ⏳ |
| Status: lendo / pausado / concluído / abandonado | — | ⏳ |
| Avaliações e notas pessoais | — | ⏳ |

---

## Módulo: Revisão Espaçada ⏳ Fase 5

**Arquivo:** `revisao.html` · Backend SM-2 já implementado no `app.py`

| Funcionalidade | Endpoint | Status |
|---|---|---|
| Listar cards vencidos do dia | `GET /api/revisao_espacada/hoje` | ⏳ frontend |
| Avaliar card (0–3) | `POST /api/revisao_espacada/<uuid>/avaliar` | ⏳ frontend |
| Criar cards manualmente | Pendente de definição | ⏳ |
| Criar cards por outros módulos | Pendente de definição | ⏳ |
| Estatísticas de retenção | Pendente de definição | ⏳ |
