/**
 * api.js — Camada HTTP pura para o backend Flask.
 *
 * NÃO é chamado diretamente pelas páginas (treino.html, biblioteca.html etc.).
 * Essas páginas usam db.js, que lê/escreve em IndexedDB e funciona 100%
 * offline, igual no PC e no celular.
 *
 * api.js só é consumido por sync.js, que empurra/recebe dados do Flask
 * quando há rede disponível na mesma rede doméstica.
 *
 * Base URL = window.location.origin. A mesma página serve API e estáticos,
 * então o endereço de onde o JS foi carregado já é o endereço correto do
 * Flask (localhost:5000 no PC, 10.x.x.x:5000 no celular). Nenhuma
 * configuração manual de IP é necessária.
 */

const API_BASE = window.location.origin;

const TIMEOUT_PING    = 2000;   // ms — checagem rápida de conectividade
const TIMEOUT_DEFAULT = 10000;  // ms — CRUD individual
const TIMEOUT_SYNC    = 20000;  // ms — payload de sync pode ser maior

// ── Erros tipados ─────────────────────────────────────────────────────────
// sync.js precisa diferenciar "sem rede" (tenta de novo depois) de
// "rede ok, servidor rejeitou" (loga e decide o que fazer com o registro).

class ApiError extends Error {
  constructor(message, status, path) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.path = path;
  }
}

class ApiTimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ApiTimeoutError';
  }
}

class ApiNetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ApiNetworkError';
  }
}

// ── Núcleo de requisição ──────────────────────────────────────────────────
async function request(path, { method = 'GET', body = null, timeout = TIMEOUT_DEFAULT } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body !== null ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== null ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new ApiTimeoutError(`Timeout (${timeout}ms) em ${method} ${path}`);
    }
    throw new ApiNetworkError(`Sem conexão com ${API_BASE}${path}`);
  }
  clearTimeout(timer);

  if (method === 'HEAD') return res.ok;

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new ApiError(errBody.error || `HTTP ${res.status}`, res.status, path);
  }

  return await res.json();
}

function buildQuery(filters = {}) {
  const entries = Object.entries(filters).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries).toString();
}

// ── Conectividade ─────────────────────────────────────────────────────────
async function apiPing() {
  try {
    return await request('/', { method: 'HEAD', timeout: TIMEOUT_PING });
  } catch {
    return false;
  }
}

// ── CRUD genérico — espelha as 5 rotas do Flask, uma função por verbo ───────
async function apiList(table, filters = {}) {
  return request(`/api/${table}${buildQuery(filters)}`);
}

async function apiGet(table, recordUuid) {
  return request(`/api/${table}/${recordUuid}`);
}

async function apiCreate(table, data) {
  return request(`/api/${table}`, { method: 'POST', body: data });
}

async function apiUpdate(table, recordUuid, data) {
  return request(`/api/${table}/${recordUuid}`, { method: 'PUT', body: data });
}

async function apiDelete(table, recordUuid) {
  return request(`/api/${table}/${recordUuid}`, { method: 'DELETE' });
}

// ── Sync ──────────────────────────────────────────────────────────────────
async function apiSync(payload) {
  return request('/api/sync', { method: 'POST', body: payload, timeout: TIMEOUT_SYNC });
}

// ── Revisão espaçada — rotas especiais, fora do CRUD genérico ───────────────
async function apiRevisoesHoje() {
  return request('/api/revisao_espacada/hoje');
}

async function apiAvaliarRevisao(recordUuid, qualidade) {
  return request(`/api/revisao_espacada/${recordUuid}/avaliar`, {
    method: 'POST',
    body: { qualidade }
  });
}

// ── Dashboard agregado do Flask ──────────────────────────────────────────
// Usado só como visão "ao vivo" quando online (ex: checar se o PC já tem
// dados mais recentes antes de decidir sincronizar). O dashboard real da UI
// (index.html) lê de IndexedDB via db.js — funciona idêntico online/offline.
async function apiDashboard() {
  return request('/api/dashboard');
}

window.api = {
  ping: apiPing,
  list: apiList,
  get: apiGet,
  create: apiCreate,
  update: apiUpdate,
  delete: apiDelete,
  sync: apiSync,
  revisoesHoje: apiRevisoesHoje,
  avaliarRevisao: apiAvaliarRevisao,
  dashboard: apiDashboard,
  ApiError,
  ApiTimeoutError,
  ApiNetworkError
};
