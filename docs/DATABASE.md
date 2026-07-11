# DATABASE.md

Documento único de referência para o banco de dados. Qualquer dúvida sobre nome de tabela, coluna ou relacionamento é resolvida aqui — não em memória, não por suposição.

---

## Convenção universal

Toda tabela do projeto segue este padrão:

```sql
uuid        TEXT PRIMARY KEY,               -- gerado no cliente: crypto.randomUUID()
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE            -- soft delete universal, nunca DELETE físico

ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON <table>
  FOR ALL USING (auth.uid() = user_id);
```

Chaves estrangeiras seguem `<tabela_singular>_uuid` (ex: `treino_uuid`, `materia_uuid`), nunca `_id`. Essa é a causa mais comum de bug neste projeto até agora — ver seção Gotchas.

Índices parciais `WHERE NOT deleted` existem nas tabelas principais para acelerar as queries que sempre filtram registros ativos.

---

## Migrações

| Arquivo | Status | Conteúdo |
|---|---|---|
| `001_schema_inicial.sql` | ✅ Executado e verificado no Supabase | 8 tabelas do núcleo (treino, shape, cardio, agenda, revisão) |
| `002_estudos.sql` | ✅ Executado e verificado no Supabase (2026-07-11) | 5 tabelas do módulo de Estudos |
| `003_biblioteca.sql` | ⏳ Planejado (Fase 4) | Catálogo de mídia — ver DEC-011 |

**Convenção para novas migrações:** numeração sequencial de 3 dígitos + nome do módulo em snake_case (`00N_nome-modulo.sql`). Depois de rodar no SQL Editor, atualizar a tabela acima e a seção correspondente deste documento.

---

## Schema — `001_schema_inicial.sql`

### `treinos`
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
nome        TEXT NOT NULL,
descricao   TEXT,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE
```

### `exercicios`
```sql
uuid               TEXT PRIMARY KEY,
user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
treino_uuid        TEXT NOT NULL REFERENCES treinos(uuid),
nome               TEXT NOT NULL,
series_alvo        INTEGER,
reps_alvo          INTEGER,
carga_alvo         NUMERIC(6,2),
descanso_segundos  INTEGER,
ordem              INTEGER DEFAULT 0,
updated_at         TIMESTAMPTZ DEFAULT NOW(),
deleted            BOOLEAN DEFAULT FALSE
```
> Não existe coluna `grupo_muscular`. Nunca existiu no schema.

### `sessoes_treino`
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
treino_uuid TEXT NOT NULL REFERENCES treinos(uuid),
data_inicio TIMESTAMPTZ NOT NULL,
data_fim    TIMESTAMPTZ,
observacoes TEXT,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE
```

### `series_executadas`
```sql
uuid            TEXT PRIMARY KEY,
user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
sessao_uuid     TEXT NOT NULL REFERENCES sessoes_treino(uuid),
exercicio_uuid  TEXT NOT NULL REFERENCES exercicios(uuid),
serie_numero    INTEGER,
carga_real      NUMERIC(6,2),
reps_real       INTEGER,
concluida       BOOLEAN DEFAULT FALSE,
data_hora       TIMESTAMPTZ DEFAULT NOW(),
updated_at      TIMESTAMPTZ DEFAULT NOW(),
deleted         BOOLEAN DEFAULT FALSE
```

### `shape`
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
data        DATE NOT NULL,
peso        NUMERIC(5,2),
foto_path   TEXT,  -- path no bucket 'shape', ex: '{user_id}/2024-01-15.jpg'
observacoes TEXT,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE
```

### `cardio`
```sql
uuid             TEXT PRIMARY KEY,
user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
data             DATE NOT NULL,
tipo             TEXT,
duracao_minutos  INTEGER,
distancia_km     NUMERIC(6,3),
observacoes      TEXT,
updated_at       TIMESTAMPTZ DEFAULT NOW(),
deleted          BOOLEAN DEFAULT FALSE
```
> Ainda sem página própria. Nenhuma tela consome esta tabela até agora.

### `agenda`
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
data        DATE NOT NULL,
treino_uuid TEXT REFERENCES treinos(uuid),
titulo      TEXT,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE
```

### `revisao_espacada`
```sql
uuid            TEXT PRIMARY KEY,
user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
pergunta        TEXT NOT NULL,
resposta        TEXT,
modulo          TEXT,            -- 'treino', 'enem', 'olimpiadas', etc.
referencia_uuid TEXT,
ef              NUMERIC(4,2) DEFAULT 2.5,
repeticoes      INTEGER DEFAULT 0,
intervalo_dias  INTEGER DEFAULT 1,
proxima_revisao DATE DEFAULT CURRENT_DATE,
updated_at      TIMESTAMPTZ DEFAULT NOW(),
deleted         BOOLEAN DEFAULT FALSE
```
> ⚠️ Ver Gotchas — `revisao.html` foi implementado com nomes de coluna diferentes destes.

---

## Schema — `002_estudos.sql`

### `materias`
```sql
uuid       TEXT PRIMARY KEY,
user_id    UUID NOT NULL REFERENCES auth.users(id),
nome       TEXT NOT NULL,
tipo       TEXT NOT NULL DEFAULT 'escola',  -- 'enem' | 'olimpiada' | 'escola' | 'concurso' | 'outro'
cor        TEXT,                             -- hex, ex: '#b8f566'
updated_at TIMESTAMPTZ DEFAULT NOW(),
deleted    BOOLEAN DEFAULT FALSE
```

### `assuntos`
```sql
uuid         TEXT PRIMARY KEY,
user_id      UUID NOT NULL REFERENCES auth.users(id),
materia_uuid TEXT NOT NULL REFERENCES materias(uuid),
nome         TEXT NOT NULL,
progresso    INTEGER DEFAULT 0,   -- 0 a 100
updated_at   TIMESTAMPTZ DEFAULT NOW(),
deleted      BOOLEAN DEFAULT FALSE
```

### `anotacoes`
```sql
uuid         TEXT PRIMARY KEY,
user_id      UUID NOT NULL REFERENCES auth.users(id),
materia_uuid TEXT NOT NULL REFERENCES materias(uuid),
assunto_uuid TEXT REFERENCES assuntos(uuid),  -- nullable: anotação geral da matéria
titulo       TEXT,
conteudo     TEXT NOT NULL,
updated_at   TIMESTAMPTZ DEFAULT NOW(),
deleted      BOOLEAN DEFAULT FALSE
```

### `documentos_estudo`
```sql
uuid         TEXT PRIMARY KEY,
user_id      UUID NOT NULL REFERENCES auth.users(id),
materia_uuid TEXT REFERENCES materias(uuid),   -- nullable
assunto_uuid TEXT REFERENCES assuntos(uuid),    -- nullable
nome         TEXT NOT NULL,
arquivo_path TEXT,   -- path no bucket 'documentos'
tipo         TEXT DEFAULT 'outro',  -- 'apostila' | 'prova' | 'gabarito' | 'resumo' | 'exercicios' | 'outro'
updated_at   TIMESTAMPTZ DEFAULT NOW(),
deleted      BOOLEAN DEFAULT FALSE
```

### `sessoes_questoes`
```sql
uuid             TEXT PRIMARY KEY,
user_id          UUID NOT NULL REFERENCES auth.users(id),
materia_uuid     TEXT REFERENCES materias(uuid),      -- nullable: sessão multi-matéria
assunto_uuid     TEXT REFERENCES assuntos(uuid),        -- nullable
documento_uuid   TEXT REFERENCES documentos_estudo(uuid), -- nullable
fonte            TEXT,   -- ex: 'ENEM 2022 - Caderno Azul'
total_questoes   INTEGER NOT NULL,
total_acertos    INTEGER NOT NULL DEFAULT 0,
data_estudo      DATE NOT NULL,
tempo_minutos    INTEGER,
observacoes      TEXT,
updated_at       TIMESTAMPTZ DEFAULT NOW(),
deleted          BOOLEAN DEFAULT FALSE
```

---

## Storage

Buckets e políticas detalhados em `ARCHITECTURE.md` → Supabase Storage e `DECISIONS.md` → DEC-010. Resumo: 3 buckets, todos privados, sempre via signed URL, path `{user_id}/arquivo.ext`.

---

## Gotchas — nomes de coluna que já causaram bugs

| Tabela | Nome usado incorretamente | Nome real | Onde apareceu |
|---|---|---|---|
| `exercicios` | `treino_id` | `treino_uuid` | Rascunho inicial de `treino-plano.html` — status da correção não confirmado |
| `exercicios` | `grupo_muscular` | *(não existe)* | Mesmo arquivo |
| `sessoes_treino` | `treino_id`, `data` | `treino_uuid`, `data_inicio` | `treino-academia.html` — já corrigido na auditoria M1 |
| `series_executadas` | `exercicio_id`, `sessao_id`, `serie_num`, `peso`, `repeticoes` | `exercicio_uuid`, `sessao_uuid`, `serie_numero`, `carga_real`, `reps_real` | `treino-academia.html` — já corrigido |
| `revisao_espacada` | `frente`, `verso`, `intervalo`, `fator` | `pergunta`, `resposta`, `intervalo_dias`, `ef` | `revisao.html` — **corrigido em 2026-07-11** |
| `sm2.js` | `calcularSM2(intervalo, fator, qualidade)` → `{novoIntervalo, novoFator, proximaRevisao}` | `calcularSM2(ef, repeticoes, intervaloDias, qualidade)` → `{ef, repeticoes, intervaloDias, proximaRevisao}` | `revisao.html` — **corrigido em 2026-07-11** |

**Status:** `revisao.html` corrigido em 2026-07-11 (via Cline+DeepSeek) — todas as colunas e a assinatura de `calcularSM2()` foram ajustadas para os nomes reais. `treino-plano.html` verificado na mesma data: já usava `treino_uuid` corretamente e não referenciava `grupo_muscular`, nenhuma alteração necessária. Ver `CHANGELOG.md`.