# CHANGELOG.md

Histórico de marcos do projeto. Bugs corrigidos e seus detalhes técnicos vivem em `DATABASE.md` → Gotchas (se forem de schema/coluna) ou ficam registrados apenas aqui em 1 linha (se forem pontuais e sem risco de repetição). Decisões arquiteturais vivem em `DECISIONS.md`, não aqui.

> Entradas até 2026-07-09 foram reconstruídas retroativamente nessa data. A partir dali, cada entrada leva a data real do evento.

---

## v1 (HTML puro) — histórico resumido

- **2026-07-09** — Migração LAN → Supabase decidida e executada (DEC-001 a DEC-011). Schema inicial (`001_schema_inicial.sql`, 8 tabelas) executado. Auth + Core JS (`login.html`, `supabase.js`, `auth.js`, `sm2.js`) implementados. Módulo de Treino completo (`treino.html`, `treino-shape.html`, `treino-plano.html`, `treino-academia.html`). `revisao.html` implementado com bug de schema conhecido (corrigido depois, ver abaixo).
- **2026-07-09/10** — Schema de Estudos (`002_estudos.sql`) criado; `estudos.html` gerado antes da confirmação de execução (a pedido do usuário, risco assumido).
- **2026-07-11** — `002_estudos.sql` executado e verificado. `estudos.html` validado contra o schema real, sem incompatibilidades. `revisao.html` corrigido (colunas e assinatura de `calcularSM2()` — ver DATABASE.md → Gotchas). Módulo Biblioteca planejado (DEC-014) e `003_biblioteca.sql` (11 tabelas) executado.
- **2026-07-11 a 07-13** — GRANT retroativo aplicado a todas as tabelas (DEC-015, badge "API DISABLED" era falta de GRANT, não erro de RLS). `biblioteca.html` gerado, testado end-to-end, path de CSS corrigido. Auditoria de modais (`abrirModal`/`.open`) corrigiu 4 páginas (`treino-academia.html`, `treino-shape.html`, `revisao.html`, `estudos.html`). RLS de Estudos confirmada. Podcasts ganham iTunes Search API (DEC-016).
- **2026-07-13** — Deploy no Vercel (`sistemapessoal`). Incidente: usuário deletado manualmente em Auth causou `ON DELETE CASCADE` e apagou todos os dados de teste (ver DATABASE.md → Gotchas, nunca repetir). Fase M (migração + deploy) encerrada: e2e e multi-dispositivo confirmados. Links quebrados do dashboard (Enem/Olimpíada/Escola) corrigidos via `?tipo=` (DEC-017). Classes `.btn-icon`/`.btn-salvar` faltantes adicionadas.

**v1 congelada em 2026-07-14** (DEC-018) — todas as fases (1–6, M) concluídas. Removida do projeto em 2026-07-19 (DEC-031), mantida só como backup local.

---

## v2 (Next.js) — em andamento

- **2026-07-14** — Decisão de migrar para Next.js/React + TypeScript (DEC-018). Estrutura da v2 definida: `frontend-v2/`, App Router, CSS Modules (DEC-019).
- **2026-07-15** — Fase 7.0 (setup técnico) concluída: projeto Next.js criado, `lib/supabase.ts` (bug real: precisa de `createBrowserClient`, não `createClient` — ver ARCHITECTURE.md), `middleware.ts` (DEC-021), login testado, CSS global com tokens de `DESIGN.md`. Treino v2 planejado (Fase 7.1, DEC-020): hierarquia `modulos_treino` → `treinos` → `exercicios_forca`/`exercicios_cardio`. `005_treino_v2.sql` executado.
- **2026-07-16** — DEC-022: módulos de treino viram fixos (reabre parte da DEC-020). Páginas do Treino v2 geradas (hub, CRUD de treino/exercícios, modo academia, shape). Teste e2e: 3 bugs corrigidos (inputs numéricos com `useState<number>`, `.linhaSerie`/`.linhaCardio` vazando borda; `confirm()` nativo adiado deliberadamente, ver BACKLOG.md). Biblioteca v2: escopo completo definido, fatiado em B1–B6 (DEC-023 a DEC-025 abrem o desenho). B1 executado e gerado (`generos`, remoção de `tags`).
- **2026-07-17** — Biblioteca v2 B2 (`elenco`/`trilha_sonora` polimórficos, `series_temporadas` — DEC-024) e B3 (`animes`, `animes_episodios`, `openings_endings`, complementos como filmes reais — DEC-025) executados. Campo `tecnologias` de `filmes` removido antes de qualquer uso (DEC-026). Padrão de UI da Biblioteca definido: `PainelDetalheObra`/`PainelSimples` somente leitura + menu "⋯" (DEC-027).
- **2026-07-18** — Biblioteca v2 B4 (Mangás — DEC-028), B5 (Livros — DEC-029), B6 (Podcasts — DEC-030) desenhados, executados e com frontend gerado. Fecha o frontend das 6 sub-fases da Biblioteca. 2 bugs corrigidos: tipos `Update` vs `Input` para toggles simples (ver DATABASE.md → Gotchas); `AnotacoesLivroEditor.tsx` sobrescrito por engano com lógica de `VolumesEditor.tsx`, restaurado.
- **2026-07-19** — v1 aposentada, `frontend-v2/` renomeada para `frontend/`, único frontend ativo (DEC-031). Cutover de infra Vercel: projeto recriado, env vars configuradas, `middleware.ts` renomeado para `proxy.ts` (bug real: `@supabase/ssr` incompatível com Edge Runtime — ver ARCHITECTURE.md). Deploy concluído, teste de login pendente de confirmação final. Biblioteca v2: decisão de consolidar as 6 rotas numa página única com sidebar por categoria (DEC-032) — código pendente, ver TASKS_NOW.md.

### Pendências ativas
Ver `TASKS_NOW.md` para o que está em aberto agora. Ver `BACKLOG.md` para polimento não bloqueante (gráficos, upload de imagem, reordenação, `confirm()` nativo, etc.).