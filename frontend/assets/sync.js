/**
 * sync.js — Orquestra sincronização bidirecional entre IndexedDB (local) e
 * Flask (PC). Não fala direto com IndexedDB nem com a rede — usa db.js para
 * dados locais e api.js para HTTP. Essa é a única peça que conhece os dois
 * lados ao mesmo tempo.
 *
 * Disparo único: botão manual injetado na navbar. Sync automático/periódico
 * foi descartado por decisão já registrada (consumo de bateria no celular).
 *
 * Eventos disparados em `document`, para qualquer página reagir sem precisar
 * importar nada deste arquivo além da tag <script>:
 *   syncstart    — sync começou
 *   syncsuccess  — detail: { stats, syncTimestamp }
 *   syncerror    — detail: { error }
 *   syncoffline  — ping falhou, sync nem chegou a começar
 */

(function () {
  const SYNC_BUTTON_ID = 'syncTriggerBtn';
  let syncing = false;

  // ── Núcleo do protocolo ────────────────────────────────────────────────
  function stripClientFields(record) {
    // `synced` é client-only (controla o que falta empurrar). Nunca existiu
    // como coluna no SQLite — app.py já ignora chaves desconhecidas, mas
    // não depender disso silenciosamente é mais seguro.
    const { synced, ...rest } = record;
    return rest;
  }

  async function buildOutgoingPayload() {
    const payload = {};
    const uuidsByTable = {};

    await Promise.all(window.db.TABLES.map(async (table) => {
      const unsynced = await window.db.getUnsynced(table);
      if (unsynced.length > 0) {
        payload[table] = unsynced.map(stripClientFields);
        uuidsByTable[table] = unsynced.map(r => r.uuid);
      }
    }));

    return { payload, uuidsByTable };
  }

  async function applyIncoming(records) {
    for (const [table, items] of Object.entries(records)) {
      if (!window.db.TABLES.includes(table)) continue; // schema local desatualizado — ignora em vez de quebrar
      for (const record of items) {
        await window.db.applyRemote(table, record);
      }
    }
  }

  async function markOutgoingSynced(uuidsByTable) {
    // Roda DEPOIS de applyIncoming. Se o registro enviado perdeu o conflito
    // de last-write-wins, applyIncoming já sobrescreveu com a versão do
    // servidor e marcou synced=1 — esta chamada vira no-op para ele. Se
    // ganhou, fecha o ciclo marcando synced=1 sobre o conteúdo local correto.
    await Promise.all(
      Object.entries(uuidsByTable).map(([table, uuids]) => window.db.markSynced(table, uuids))
    );
  }

  async function runSync() {
    if (syncing) return { skipped: true, reason: 'already-running' };
    syncing = true;
    document.dispatchEvent(new CustomEvent('syncstart'));

    try {
      const online = await window.api.ping();
      if (!online) {
        document.dispatchEvent(new CustomEvent('syncoffline'));
        return { skipped: true, reason: 'offline' };
      }

      const lastSync = await window.db.getMeta('last_sync');
      const { payload, uuidsByTable } = await buildOutgoingPayload();

      const response = await window.api.sync({ last_sync: lastSync, records: payload });

      await applyIncoming(response.records || {});
      await markOutgoingSynced(uuidsByTable);
      await window.db.setMeta('last_sync', response.sync_timestamp);

      document.dispatchEvent(new CustomEvent('syncsuccess', {
        detail: { stats: response.stats, syncTimestamp: response.sync_timestamp }
      }));
      return { success: true, stats: response.stats };

    } catch (err) {
      document.dispatchEvent(new CustomEvent('syncerror', { detail: { error: err } }));
      return { success: false, error: err };

    } finally {
      syncing = false;
    }
  }

  // ── UI: injeta indicador + botão na navbar, se ela existir nesta página ──
  // Sem framework e sem includes de HTML, repetir o botão em 7 arquivos
  // seria 7 pontos de manutenção. Injetar via JS centraliza num só lugar.
  function injectSyncUI() {
    const nav = document.querySelector('.nav');
    if (!nav || document.getElementById(SYNC_BUTTON_ID)) return;

    const btn = document.createElement('button');
    btn.id = SYNC_BUTTON_ID;
    btn.className = 'sync-bar';
    btn.type = 'button';
    btn.innerHTML = '<span class="sync-dot"></span><span class="sync-label">Sincronizar</span>';
    btn.addEventListener('click', () => runSync());
    nav.appendChild(btn);

    const dot   = btn.querySelector('.sync-dot');
    const label = btn.querySelector('.sync-label');

    document.addEventListener('syncstart', () => {
      dot.className = 'sync-dot syncing';
      label.textContent = 'Sincronizando...';
    });

    document.addEventListener('syncsuccess', () => {
      dot.className = 'sync-dot online';
      label.textContent = 'Sincronizado agora';
      setTimeout(() => { label.textContent = 'Sincronizar'; }, 4000);
    });

    document.addEventListener('syncerror', () => {
      dot.className = 'sync-dot error';
      label.textContent = 'Falha — toque para tentar de novo';
    });

    document.addEventListener('syncoffline', () => {
      dot.className = 'sync-dot';
      label.textContent = 'Offline';
      setTimeout(() => { label.textContent = 'Sincronizar'; }, 4000);
    });

    // Checagem inicial de status — só ping (sem payload), não conta como sync.
    window.api.ping().then(online => {
      dot.className = online ? 'sync-dot online' : 'sync-dot';
    });
  }

  document.addEventListener('DOMContentLoaded', injectSyncUI);

  window.sync = { run: runSync };
})();