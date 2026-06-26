import sys
import sqlite3
import uuid
import os
import socket

# Forca UTF-8 no stdout/stderr. Sem isso, terminal Windows (cp1252) quebra
# em qualquer print() com caracteres fora do ASCII basico.
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
from datetime import datetime, timezone, timedelta, date
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# ── Config ────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH  = os.path.join(BASE_DIR, 'database.db')
FRONTEND = os.path.normpath(os.path.join(BASE_DIR, '..', 'frontend'))

app = Flask(__name__, static_folder=FRONTEND, static_url_path='')
CORS(app)

ALL_TABLES = {
    'treinos', 'exercicios', 'sessoes_treino', 'series_executadas',
    'shape', 'cardio', 'biblioteca', 'enem_banco_provas',
    'enem_simulados', 'enem_erros', 'enem_conteudos', 'enem_redacoes',
    'olimpiadas', 'olimpiada_fases', 'olimpiada_provas', 'olimpiada_resultados',
    'escola_materias', 'escola_atividades', 'escola_conteudos', 'revisao_espacada'
}

# ── DB helpers ────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    conn.execute('PRAGMA journal_mode = WAL')
    return conn

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        return s.getsockname()[0]
    except Exception:
        return '127.0.0.1'
    finally:
        s.close()

# ── Schema ────────────────────────────────────────────────────────────────────
SCHEMA = """
CREATE TABLE IF NOT EXISTS treinos (
    uuid        TEXT PRIMARY KEY,
    nome        TEXT NOT NULL,
    descricao   TEXT,
    updated_at  TEXT NOT NULL,
    deleted     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS exercicios (
    uuid               TEXT PRIMARY KEY,
    treino_uuid        TEXT REFERENCES treinos(uuid),
    nome               TEXT NOT NULL,
    series_alvo        INTEGER,
    reps_alvo          TEXT,
    carga_alvo         REAL,
    descanso_segundos  INTEGER NOT NULL DEFAULT 60,
    ordem              INTEGER NOT NULL DEFAULT 0,
    updated_at         TEXT NOT NULL,
    deleted            INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessoes_treino (
    uuid         TEXT PRIMARY KEY,
    treino_uuid  TEXT REFERENCES treinos(uuid),
    data_inicio  TEXT NOT NULL,
    data_fim     TEXT,
    observacoes  TEXT,
    updated_at   TEXT NOT NULL,
    deleted      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS series_executadas (
    uuid            TEXT PRIMARY KEY,
    sessao_uuid     TEXT REFERENCES sessoes_treino(uuid),
    exercicio_uuid  TEXT REFERENCES exercicios(uuid),
    serie_numero    INTEGER NOT NULL,
    carga_real      REAL,
    reps_real       INTEGER,
    concluida       INTEGER NOT NULL DEFAULT 0,
    data_hora       TEXT,
    updated_at      TEXT NOT NULL,
    deleted         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shape (
    uuid        TEXT PRIMARY KEY,
    data        TEXT NOT NULL,
    peso        REAL,
    foto_path   TEXT,
    observacoes TEXT,
    updated_at  TEXT NOT NULL,
    deleted     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cardio (
    uuid             TEXT PRIMARY KEY,
    data             TEXT NOT NULL,
    tipo             TEXT,
    duracao_minutos  INTEGER,
    distancia_km     REAL,
    observacoes      TEXT,
    updated_at       TEXT NOT NULL,
    deleted          INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS biblioteca (
    uuid             TEXT PRIMARY KEY,
    tipo             TEXT NOT NULL,
    titulo           TEXT NOT NULL,
    autor_diretor    TEXT,
    capa_url         TEXT,
    nota             REAL,
    status           TEXT NOT NULL DEFAULT 'Quero consumir',
    data_inicio      TEXT,
    data_fim         TEXT,
    eixos_tematicos  TEXT,
    review           TEXT,
    api_id           TEXT,
    updated_at       TEXT NOT NULL,
    deleted          INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS enem_banco_provas (
    uuid        TEXT PRIMARY KEY,
    ano         INTEGER NOT NULL,
    pdf_path    TEXT,
    observacoes TEXT,
    updated_at  TEXT NOT NULL,
    deleted     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS enem_simulados (
    uuid                TEXT PRIMARY KEY,
    data                TEXT NOT NULL,
    tempo_minutos       INTEGER,
    acertos_linguagens  INTEGER,
    acertos_humanas     INTEGER,
    acertos_natureza    INTEGER,
    acertos_matematica  INTEGER,
    total_questoes      INTEGER NOT NULL DEFAULT 180,
    observacoes         TEXT,
    updated_at          TEXT NOT NULL,
    deleted             INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS enem_erros (
    uuid            TEXT PRIMARY KEY,
    simulado_uuid   TEXT REFERENCES enem_simulados(uuid),
    area            TEXT NOT NULL,
    topico          TEXT,
    ano_prova       INTEGER,
    classificacao   TEXT CHECK(classificacao IN ('A','B','C')),
    questao_numero  INTEGER,
    observacoes     TEXT,
    updated_at      TEXT NOT NULL,
    deleted         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS enem_conteudos (
    uuid       TEXT PRIMARY KEY,
    area       TEXT NOT NULL,
    topico     TEXT NOT NULL,
    subtopico  TEXT,
    status     TEXT NOT NULL DEFAULT 'Não visto',
    updated_at TEXT NOT NULL,
    deleted    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS enem_redacoes (
    uuid                   TEXT PRIMARY KEY,
    data                   TEXT NOT NULL,
    tema                   TEXT,
    texto_completo         TEXT,
    c1                     INTEGER NOT NULL DEFAULT 0,
    c2                     INTEGER NOT NULL DEFAULT 0,
    c3                     INTEGER NOT NULL DEFAULT 0,
    c4                     INTEGER NOT NULL DEFAULT 0,
    c5                     INTEGER NOT NULL DEFAULT 0,
    feedback_c1            TEXT,
    feedback_c2            TEXT,
    feedback_c3            TEXT,
    feedback_c4            TEXT,
    feedback_c5            TEXT,
    tempo_escrita_minutos  INTEGER,
    pdf_path               TEXT,
    updated_at             TEXT NOT NULL,
    deleted                INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS olimpiadas (
    uuid        TEXT PRIMARY KEY,
    nome        TEXT NOT NULL,
    area        TEXT,
    nivel       TEXT,
    descricao   TEXT,
    updated_at  TEXT NOT NULL,
    deleted     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS olimpiada_fases (
    uuid            TEXT PRIMARY KEY,
    olimpiada_uuid  TEXT REFERENCES olimpiadas(uuid),
    nome            TEXT NOT NULL,
    data            TEXT,
    local           TEXT,
    updated_at      TEXT NOT NULL,
    deleted         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS olimpiada_provas (
    uuid            TEXT PRIMARY KEY,
    olimpiada_uuid  TEXT REFERENCES olimpiadas(uuid),
    fase_uuid       TEXT REFERENCES olimpiada_fases(uuid),
    ano             INTEGER,
    pdf_path        TEXT,
    observacoes     TEXT,
    updated_at      TEXT NOT NULL,
    deleted         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS olimpiada_resultados (
    uuid          TEXT PRIMARY KEY,
    fase_uuid     TEXT REFERENCES olimpiada_fases(uuid),
    pontuacao     REAL,
    classificacao TEXT,
    aprovado      INTEGER NOT NULL DEFAULT 0,
    observacoes   TEXT,
    updated_at    TEXT NOT NULL,
    deleted       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS escola_materias (
    uuid          TEXT PRIMARY KEY,
    nome          TEXT NOT NULL,
    professor     TEXT,
    carga_horaria INTEGER,
    updated_at    TEXT NOT NULL,
    deleted       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS escola_atividades (
    uuid         TEXT PRIMARY KEY,
    materia_uuid TEXT REFERENCES escola_materias(uuid),
    titulo       TEXT NOT NULL,
    tipo         TEXT,
    data_entrega TEXT,
    status       TEXT NOT NULL DEFAULT 'Pendente',
    nota         REAL,
    peso         REAL NOT NULL DEFAULT 1.0,
    observacoes  TEXT,
    updated_at   TEXT NOT NULL,
    deleted      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS escola_conteudos (
    uuid         TEXT PRIMARY KEY,
    materia_uuid TEXT REFERENCES escola_materias(uuid),
    topico       TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'Não visto',
    updated_at   TEXT NOT NULL,
    deleted      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS revisao_espacada (
    uuid             TEXT PRIMARY KEY,
    modulo           TEXT NOT NULL,
    conteudo_uuid    TEXT NOT NULL,
    intervalo        INTEGER NOT NULL DEFAULT 1,
    facilidade       REAL    NOT NULL DEFAULT 2.5,
    repeticoes       INTEGER NOT NULL DEFAULT 0,
    proxima_revisao  TEXT    NOT NULL,
    ultima_revisao   TEXT,
    updated_at       TEXT    NOT NULL,
    deleted          INTEGER NOT NULL DEFAULT 0
);
"""

def init_db():
    conn = get_db()
    conn.executescript(SCHEMA)
    conn.commit()
    conn.close()

# ── Column cache (avoids repeated PRAGMA calls per request) ───────────────────
_col_cache: dict = {}

def get_columns(conn, table: str) -> set:
    if table not in _col_cache:
        rows = conn.execute(f'PRAGMA table_info({table})').fetchall()
        _col_cache[table] = {r[1] for r in rows}
    return _col_cache[table]

# ── Static serving ────────────────────────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory(FRONTEND, 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(FRONTEND, filename)

# ── Generic CRUD ──────────────────────────────────────────────────────────────
@app.route('/api/<table>', methods=['GET'])
def list_records(table):
    if table not in ALL_TABLES:
        return jsonify({'error': 'Not found'}), 404

    conn   = get_db()
    valid  = get_columns(conn, table)
    query  = f'SELECT * FROM {table} WHERE deleted = 0'
    params = []

    for key, val in request.args.items():
        if key in valid:
            query += f' AND {key} = ?'
            params.append(val)

    query += ' ORDER BY updated_at DESC'
    rows   = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route('/api/<table>', methods=['POST'])
def create_record(table):
    if table not in ALL_TABLES:
        return jsonify({'error': 'Not found'}), 404

    data  = request.get_json(silent=True) or {}
    conn  = get_db()
    valid = get_columns(conn, table)
    data  = {k: v for k, v in data.items() if k in valid}

    data.setdefault('uuid',       str(uuid.uuid4()))
    data.setdefault('updated_at', now_iso())
    data.setdefault('deleted',    0)

    cols = ', '.join(data.keys())
    ph   = ', '.join('?' * len(data))

    try:
        conn.execute(f'INSERT INTO {table} ({cols}) VALUES ({ph})', list(data.values()))
        conn.commit()
        row = conn.execute(f'SELECT * FROM {table} WHERE uuid = ?', (data['uuid'],)).fetchone()
        conn.close()
        return jsonify(dict(row)), 201
    except sqlite3.IntegrityError as e:
        conn.close()
        return jsonify({'error': str(e)}), 409


@app.route('/api/<table>/<record_uuid>', methods=['GET'])
def get_record(table, record_uuid):
    if table not in ALL_TABLES:
        return jsonify({'error': 'Not found'}), 404

    conn = get_db()
    row  = conn.execute(
        f'SELECT * FROM {table} WHERE uuid = ? AND deleted = 0', (record_uuid,)
    ).fetchone()
    conn.close()

    if row is None:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(dict(row))


@app.route('/api/<table>/<record_uuid>', methods=['PUT'])
def update_record(table, record_uuid):
    if table not in ALL_TABLES:
        return jsonify({'error': 'Not found'}), 404

    data  = request.get_json(silent=True) or {}
    conn  = get_db()
    valid = get_columns(conn, table)
    data  = {k: v for k, v in data.items() if k in valid and k != 'uuid'}
    data['updated_at'] = now_iso()

    set_clause = ', '.join(f'{k} = ?' for k in data.keys())
    result     = conn.execute(
        f'UPDATE {table} SET {set_clause} WHERE uuid = ? AND deleted = 0',
        list(data.values()) + [record_uuid]
    )
    conn.commit()

    if result.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Not found'}), 404

    row = conn.execute(f'SELECT * FROM {table} WHERE uuid = ?', (record_uuid,)).fetchone()
    conn.close()
    return jsonify(dict(row))


@app.route('/api/<table>/<record_uuid>', methods=['DELETE'])
def delete_record(table, record_uuid):
    if table not in ALL_TABLES:
        return jsonify({'error': 'Not found'}), 404

    conn   = get_db()
    result = conn.execute(
        f'UPDATE {table} SET deleted = 1, updated_at = ? WHERE uuid = ? AND deleted = 0',
        (now_iso(), record_uuid)
    )
    conn.commit()
    conn.close()

    if result.rowcount == 0:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({'deleted': True})


# ── Bidirectional Sync ────────────────────────────────────────────────────────
@app.route('/api/sync', methods=['POST'])
def sync():
    """
    Bidirectional sync. Last-write-wins by updated_at (ISO string comparison).

    Request body:
      {
        "last_sync": "<ISO timestamp>",   // null = first sync (sends full DB)
        "records":  { "<table>": [{...}] }
      }

    Response:
      {
        "sync_timestamp": "<ISO>",
        "records": { "<table>": [{...}] },  // records updated on PC since last_sync
        "stats":   { "upserted": n, "skipped": n, "outgoing": n }
      }

    Conflict rule: record with the later updated_at wins. Losing side receives
    the winner in the outgoing payload of the same response.
    """
    body      = request.get_json(silent=True) or {}
    last_sync = body.get('last_sync')
    incoming  = body.get('records', {})

    conn           = get_db()
    sync_timestamp = now_iso()
    upserted = skipped = outgoing_count = 0

    # ── Phase 1: phone → PC ──────────────────────────────────────────────────
    for table, records in incoming.items():
        if table not in ALL_TABLES:
            continue
        valid = get_columns(conn, table)

        for rec in records:
            if 'uuid' not in rec or 'updated_at' not in rec:
                continue

            rec      = {k: v for k, v in rec.items() if k in valid}
            existing = conn.execute(
                f'SELECT updated_at FROM {table} WHERE uuid = ?', (rec['uuid'],)
            ).fetchone()

            if existing is None:
                cols = ', '.join(rec.keys())
                ph   = ', '.join('?' * len(rec))
                try:
                    conn.execute(
                        f'INSERT INTO {table} ({cols}) VALUES ({ph})', list(rec.values())
                    )
                    upserted += 1
                except sqlite3.IntegrityError:
                    skipped += 1

            elif rec['updated_at'] > existing['updated_at']:
                # Phone record is newer: overwrite PC
                updates    = {k: v for k, v in rec.items() if k != 'uuid'}
                set_clause = ', '.join(f'{k} = ?' for k in updates.keys())
                conn.execute(
                    f'UPDATE {table} SET {set_clause} WHERE uuid = ?',
                    list(updates.values()) + [rec['uuid']]
                )
                upserted += 1

            else:
                # PC record is newer: phone gets it in Phase 2
                skipped += 1

    conn.commit()

    # ── Phase 2: PC → phone ──────────────────────────────────────────────────
    outgoing: dict = {}
    for table in ALL_TABLES:
        if last_sync:
            rows = conn.execute(
                f'SELECT * FROM {table} WHERE updated_at > ?', (last_sync,)
            ).fetchall()
        else:
            # First sync: full export
            rows = conn.execute(f'SELECT * FROM {table}').fetchall()

        if rows:
            outgoing[table]  = [dict(r) for r in rows]
            outgoing_count  += len(rows)

    conn.close()

    return jsonify({
        'sync_timestamp': sync_timestamp,
        'records':        outgoing,
        'stats': {
            'upserted': upserted,
            'skipped':  skipped,
            'outgoing': outgoing_count
        }
    })


# ── SM-2 (Spaced Repetition) ──────────────────────────────────────────────────
def _sm2_next(repeticoes: int, facilidade: float, intervalo: int, qualidade: int) -> tuple:
    """
    SM-2 adapted to a 4-point scale.

    qualidade → SM-2 internal q:
      0 = Errei    → q=0  (failure, reset)
      1 = Difícil  → q=3  (success, EF drops)
      2 = Normal   → q=4  (success, EF stable)
      3 = Fácil    → q=5  (success, EF grows)

    Threshold: q < 3 = failure (reset to day 1, EF -= 0.2).
    EF formula: EF' = EF + 0.1 - (5-q)(0.08 + (5-q)*0.02)
    EF floor: 1.3

    Returns (novo_intervalo, nova_facilidade, novas_repeticoes)
    """
    q_map = {0: 0, 1: 3, 2: 4, 3: 5}
    q     = q_map.get(qualidade, 0)

    if q < 3:
        # Failure: reset streak, penalise EF
        return 1, round(max(1.3, facilidade - 0.2), 2), 0

    # Success: compute next interval
    if   repeticoes == 0: novo_intervalo = 1
    elif repeticoes == 1: novo_intervalo = 6
    else:                 novo_intervalo = max(1, round(intervalo * facilidade))

    nova_ef = facilidade + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    nova_ef = round(max(1.3, nova_ef), 2)

    return novo_intervalo, nova_ef, repeticoes + 1


@app.route('/api/revisao_espacada/<record_uuid>/avaliar', methods=['POST'])
def avaliar_revisao(record_uuid):
    """
    Evaluate a spaced repetition card and schedule the next review.
    Body: { "qualidade": 0|1|2|3 }
    """
    body      = request.get_json(silent=True) or {}
    qualidade = body.get('qualidade')

    if qualidade not in (0, 1, 2, 3):
        return jsonify({'error': 'qualidade must be 0, 1, 2 or 3'}), 400

    conn = get_db()
    row  = conn.execute(
        'SELECT * FROM revisao_espacada WHERE uuid = ? AND deleted = 0', (record_uuid,)
    ).fetchone()

    if row is None:
        conn.close()
        return jsonify({'error': 'Not found'}), 404

    row = dict(row)
    novo_intervalo, nova_ef, novas_reps = _sm2_next(
        row['repeticoes'], row['facilidade'], row['intervalo'], qualidade
    )

    agora   = now_iso()
    proxima = (datetime.now(timezone.utc) + timedelta(days=novo_intervalo)).date().isoformat()

    conn.execute(
        '''UPDATE revisao_espacada
           SET intervalo = ?, facilidade = ?, repeticoes = ?,
               proxima_revisao = ?, ultima_revisao = ?, updated_at = ?
           WHERE uuid = ?''',
        (novo_intervalo, nova_ef, novas_reps, proxima, agora, agora, record_uuid)
    )
    conn.commit()

    row = conn.execute('SELECT * FROM revisao_espacada WHERE uuid = ?', (record_uuid,)).fetchone()
    conn.close()
    return jsonify(dict(row))


@app.route('/api/revisao_espacada/hoje', methods=['GET'])
def revisoes_hoje():
    """All cards due today or overdue, across every module."""
    hoje = date.today().isoformat()
    conn = get_db()
    rows = conn.execute(
        '''SELECT * FROM revisao_espacada
           WHERE proxima_revisao <= ? AND deleted = 0
           ORDER BY proxima_revisao ASC''',
        (hoje,)
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


# ── Dashboard ─────────────────────────────────────────────────────────────────
@app.route('/api/dashboard', methods=['GET'])
def dashboard():
    """Aggregated summary for index.html — single round-trip."""
    hoje = date.today().isoformat()
    conn = get_db()

    proximo_treino = conn.execute(
        'SELECT nome FROM treinos WHERE deleted = 0 ORDER BY updated_at DESC LIMIT 1'
    ).fetchone()

    livros_andamento = conn.execute(
        "SELECT COUNT(*) AS c FROM biblioteca WHERE status = 'Consumindo' AND deleted = 0"
    ).fetchone()['c']

    revisoes_pendentes = conn.execute(
        'SELECT COUNT(*) AS c FROM revisao_espacada WHERE proxima_revisao <= ? AND deleted = 0',
        (hoje,)
    ).fetchone()['c']

    proxima_fase = conn.execute(
        '''SELECT f.nome AS fase, f.data, o.nome AS olimpiada
           FROM olimpiada_fases f
           JOIN olimpiadas o ON o.uuid = f.olimpiada_uuid
           WHERE f.data >= ? AND f.deleted = 0 AND o.deleted = 0
           ORDER BY f.data ASC LIMIT 1''',
        (hoje,)
    ).fetchone()

    atividade_semanal = conn.execute(
        '''SELECT date(data_inicio) AS dia, COUNT(*) AS sessoes
           FROM sessoes_treino
           WHERE date(data_inicio) >= date('now', '-6 days') AND deleted = 0
           GROUP BY dia
           ORDER BY dia ASC'''
    ).fetchall()

    conn.close()
    return jsonify({
        'proximo_treino':     dict(proximo_treino) if proximo_treino else None,
        'livros_andamento':   livros_andamento,
        'revisoes_pendentes': revisoes_pendentes,
        'proxima_fase':       dict(proxima_fase) if proxima_fase else None,
        'atividade_semanal':  [dict(r) for r in atividade_semanal]
    })


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    ip = get_local_ip()

    print()
    print('=' * 54)
    print('  Sistema Pessoal — Backend iniciado')
    print(f'  PC      ->  http://localhost:5000')
    print(f'  Celular ->  http://{ip}:5000')
    print('  Ctrl+C para encerrar')
    print('=' * 54)
    print()

    app.run(host='0.0.0.0', port=5000, debug=False)