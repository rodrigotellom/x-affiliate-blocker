// Isolated-world content script: owns settings/storage, decides who to hide/block,
// and asks inject.js (page world) to perform the actual block requests.
const OUT = 'xab:page';
const IN = 'xab:content';
const DEFAULTS = { companies: [], blockMode: false, skipFollowing: true, paused: false };
const BLOCK_DELAY_MS = [3000, 6000]; // random delay between block requests
const RATE_LIMIT_PAUSE_MS = 15 * 60 * 1000;

let config = { ...DEFAULTS };
let blocked = {}; // userId -> { handle, org, at }
let seenOrgs = {}; // orgKey -> { name, handle, count }
const seenUsers = new Map(); // userId -> user (this page session)
const hiddenHandles = new Set();
const queue = [];
const queued = new Set();
let pumping = false;
let pauseUntil = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').trim().replace(/^@/, '').toLowerCase();
const orgKey = (u) => u.orgHandle || norm(u.orgName);

const ready = Promise.all([
  chrome.storage.sync.get(DEFAULTS).then((c) => (config = c)),
  chrome.storage.local.get({ blocked: {}, seenOrgs: {} }).then((l) => {
    blocked = l.blocked;
    seenOrgs = l.seenOrgs;
  }),
]);

// --- hiding (pure CSS, so it survives X re-rendering the timeline) ---
const style = document.createElement('style');
style.id = 'xab-style';
(document.head || document.documentElement).appendChild(style);

function updateStyle() {
  const handles = [...hiddenHandles].filter((h) => /^[a-z0-9_]{1,15}$/.test(h));
  if (!handles.length) return void (style.textContent = '');
  const sel = handles.flatMap((h) => [
    `[data-testid="cellInnerDiv"]:has([data-testid="User-Name"] a[href="/${h}" i])`,
    `[data-testid="cellInnerDiv"]:has([data-testid="UserAvatar-Container-${h}" i])`,
  ]);
  style.textContent = `${sel.join(',\n')} { display: none !important; }`;
}

// --- matching ---
function matches(u) {
  const handle = u.orgHandle;
  const name = norm(u.orgName);
  return config.companies.some((c) => {
    const n = norm(c);
    return n && (n === handle || n === name);
  });
}

function evaluate(u) {
  if (config.paused || !matches(u)) return;
  if (config.skipFollowing && u.following) return;
  if (u.handle) hiddenHandles.add(u.handle.toLowerCase());
  if (config.blockMode && !u.blocking && !blocked[u.id] && !queued.has(u.id)) {
    queued.add(u.id);
    queue.push(u);
    pump();
  }
}

function reevaluateAll() {
  hiddenHandles.clear();
  for (const u of seenUsers.values()) evaluate(u);
  updateStyle();
}

// --- block queue ---
let reqSeq = 0;
const pending = new Map();

function requestBlock(userId) {
  const reqId = ++reqSeq;
  return new Promise((resolve) => {
    pending.set(reqId, resolve);
    window.postMessage({ source: IN, type: 'block', userId, reqId }, location.origin);
    setTimeout(() => {
      if (pending.delete(reqId)) resolve({ ok: false, status: 0, error: 'timeout' });
    }, 30000);
  });
}

async function pump() {
  if (pumping) return;
  pumping = true;
  try {
    while (queue.length && config.blockMode && !config.paused) {
      const wait = pauseUntil - Date.now();
      if (wait > 0) await sleep(wait);
      const u = queue.shift();
      if (blocked[u.id]) continue; // another tab got it
      const r = await requestBlock(u.id);
      if (r.ok) {
        blocked[u.id] = { handle: u.handle, org: u.orgName || u.orgHandle, at: Date.now() };
        await chrome.storage.local.set({ blocked });
        console.info(`[X Affiliate Blocker] blocked @${u.handle} (${u.orgName})`);
      } else if (r.status === 429) {
        queue.unshift(u);
        pauseUntil = Date.now() + RATE_LIMIT_PAUSE_MS;
        console.warn('[X Affiliate Blocker] rate limited; pausing blocks for 15 min');
      } else {
        console.warn(`[X Affiliate Blocker] failed to block @${u.handle}`, r);
      }
      const [min, max] = BLOCK_DELAY_MS;
      await sleep(min + Math.random() * (max - min));
    }
  } finally {
    pumping = false;
  }
}

// --- seen orgs (shown in the popup so you can add them with one click) ---
let saveTimer = null;
function saveSeenOrgsSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => chrome.storage.local.set({ seenOrgs }), 3000);
}

// --- wiring ---
window.addEventListener('message', async (e) => {
  if (e.source !== window || e.data?.source !== OUT) return;
  const { type, payload } = e.data;
  if (type === 'blockResult') {
    const resolve = pending.get(payload.reqId);
    if (resolve) {
      pending.delete(payload.reqId);
      resolve(payload);
    }
    return;
  }
  if (type !== 'users') return;
  await ready;
  for (const u of payload) {
    if (!seenUsers.has(u.id)) {
      const key = orgKey(u);
      if (key) {
        const o = (seenOrgs[key] ||= { name: u.orgName, handle: u.orgHandle, count: 0 });
        o.count++;
        saveSeenOrgsSoon();
      }
    }
    seenUsers.set(u.id, u);
    evaluate(u);
  }
  updateStyle();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    for (const k in changes) config[k] = changes[k].newValue ?? DEFAULTS[k];
    reevaluateAll();
  } else if (area === 'local' && changes.blocked) {
    blocked = changes.blocked.newValue || {};
  }
});
