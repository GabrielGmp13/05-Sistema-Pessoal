/**
 * db.js — Camada de dados real. Todas as páginas leem e escrevem aqui,
 * nunca direto no Flask. Implementado sobre IndexedDB — funciona 100%
 * offline, código idêntico no PC e no celular.
 *
 * Cada registro carrega um campo extra `synced` (0/1), client-only: marca
 * o que ainda falta empurrar pro Flask. Esse campo nunca existe como coluna
 * no SQLite — o backend filtra qualquer chave desconhecida e ignora.
 *
 * Schema espelha as 20 tabelas do app.py. Se uma tabela nova for criada no
 * backend no futuro, replicar o nome em TABLES abaixo E subir DB_VERSION em
 * 1 — sem isso, onupgradeneeded não roda de novo e a tabela nova não existe
 * localmente, mesmo que o Flask já a conheça.
 */

const DB_NAME    = 'sistema_pessoal';
const DB_VERSION = 1;
const META_STORE = '_meta';

const TABLES = [
  'treinos', 'exercicios', 'sessoes_treino', 'series_executadas',
  'shape', 'cardio', 'biblioteca', 'enem_banco_provas',
  'enem_simulados', 'enem_erros', 'enem_conteudos', 'enem_redacoes',
  'olimpiadas', 'olimpiada_fases', 'olimpiada_provas', 'olimpiada_resultados',
  'escola_materias', 'escola_atividades', 'escola_conteudos', 'revisao_espacada'
];

let dbInstance = null;

function openDb() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const database = event.target.result;
      for (const table of TABLES) {
        if (!database.objectStoreNames.contains(table)) {
          database.createObjectStore(table, { keyPath: 'uuid' });
        }
      }
      if (!database.objectStoreNames.contains(META_STORE)) {
        database.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };

    req.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };
    req.onerror = (event) => reject(event.target.error);
  });
}

function nowIso()  { return new Date().toISOString(); }
function genUuid() { return crypto.randomUUID(); }

function assertTable(table) {
  if (!TABLES.includes(table)) {
    throw new Error(`Tabela desconhecida: ${table}`);
  }
}

// ── Leitura ───────────────────────────────────────────────────────────────
async function dbList(table, filters = {}) {
  assertTable(table);
  const database = await openDb();

  return new Promise((resolve, reject) => {
    const tx  = database.transaction(table, 'readonly');
    const req = tx.objectStore(table).getAll();

    req.onsuccess = () => {
      let results = req.result.filter(r => r.deleted === 0);
      for (const [key, val] of Object.entries(filters)) {
        results = results.filter(r => String(r[key]) === String(val));
      }
      results.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

async function dbGet(table, recordUuid) {
  assertTable(table);
  const database = await openDb();

  return new Promise((resolve, reject) => {
    const tx  = database.transaction(table, 'readonly');
    const req = tx.objectStore(table).get(recordUuid);

    req.onsuccess = () => {
      const r = req.result;
      resolve(r && r.deleted === 0 ? r : null);
    };
    req.onerror = () => reject(req.error);
  });
}

// ── Escrita ───────────────────────────────────────────────────────────────
async function dbCreate(table, data) {
  assertTable(table);
  const database = await openDb();

  const record = {
    ...data,
    uuid:       data.uuid || genUuid(),
    updated_at: nowIso(),
    deleted:    0,
    synced:     0
  };

  return new Promise((resolve, reject) => {
    const tx = database.transaction(table, 'readwrite');
    tx.objectStore(table).add(record);
    tx.oncomplete = () => resolve(record);
    tx.onerror    = () => reject(tx.error);
  });
}

async function dbUpdate(table, recordUuid, data) {
  assertTable(table);
  const database = await openDb();

  return new Promise((resolve, reject) => {
    const tx     = database.transaction(table, 'readwrite');
    const store  = tx.objectStore(table);
    const getReq = store.get(recordUuid);

    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (!existing) {
        reject(new Error(`Registro não encontrado: ${table}/${recordUuid}`));
        return;
      }
      const updated = {
        ...existing, ...data,
        uuid: recordUuid, updated_at: nowIso(), synced: 0
      };
      store.put(updated);
      tx.oncomplete = () => resolve(updated);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

async function dbDelete(table, recordUuid) {
  return dbUpdate(table, recordUuid, { deleted: 1 });
}

// ── Suporte a sync ────────────────────────────────────────────────────────
async function dbGetUnsynced(table) {
  assertTable(table);
  const database = await openDb();

  return new Promise((resolve, reject) => {
    const tx  = database.transaction(table, 'readonly');
    const req = tx.objectStore(table).getAll();

    req.onsuccess = () => resolve(req.result.filter(r => r.synced === 0));
    req.onerror   = () => reject(req.error);
  });
}

async function dbMarkSynced(table, uuids) {
  assertTable(table);
  if (uuids.length === 0) return;
  const database = await openDb();

  return new Promise((resolve, reject) => {
    const tx    = database.transaction(table, 'readwrite');
    const store = tx.objectStore(table);

    for (const id of uuids) {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        if (getReq.result) {
          getReq.result.synced = 1;
          store.put(getReq.result);
        }
      };
    }
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

// Aplica um registro vindo do Flask. Last-write-wins: só sobrescreve o local
// se o remoto for igual-ou-mais-novo. Se o local tiver edição não
// sincronizada mais nova, mantém o local — ele será empurrado na próxima sync.
async function dbApplyRemote(table, record) {
  assertTable(table);
  const database = await openDb();

  return new Promise((resolve, reject) => {
    const tx     = database.transaction(table, 'readwrite');
    const store  = tx.objectStore(table);
    const getReq = store.get(record.uuid);

    getReq.onsuccess = () => {
      const local = getReq.result;
      if (!local || record.updated_at >= local.updated_at) {
        store.put({ ...record, synced: 1 });
      }
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete  = () => resolve();
    tx.onerror     = () => reject(tx.error);
  });
}

// ── Metadados de sync (last_sync timestamp etc.) ────────────────────────────
async function dbGetMeta(key) {
  const database = await openDb();

  return new Promise((resolve, reject) => {
    const tx  = database.transaction(META_STORE, 'readonly');
    const req = tx.objectStore(META_STORE).get(key);

    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror   = () => reject(req.error);
  });
}

async function dbSetMeta(key, value) {
  const database = await openDb();

  return new Promise((resolve, reject) => {
    const tx = database.transaction(META_STORE, 'readwrite');
    tx.objectStore(META_STORE).put({ key, value });
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

window.db = {
  list:        dbList,
  get:         dbGet,
  create:      dbCreate,
  update:      dbUpdate,
  delete:      dbDelete,
  getUnsynced: dbGetUnsynced,
  markSynced:  dbMarkSynced,
  applyRemote: dbApplyRemote,
  getMeta:     dbGetMeta,
  setMeta:     dbSetMeta,
  TABLES
};