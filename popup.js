const DEFAULTS = { companies: [], blockMode: false, skipFollowing: true, paused: false };
const $ = (id) => document.getElementById(id);
const norm = (s) => String(s || '').trim().replace(/^@/, '').toLowerCase();

function el(tag, props = {}, ...children) {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...children);
  return n;
}

async function addCompany(value) {
  const c = norm(value);
  if (!c) return;
  const { companies } = await chrome.storage.sync.get(DEFAULTS);
  if (!companies.includes(c)) await chrome.storage.sync.set({ companies: [...companies, c] });
}

async function render() {
  const config = await chrome.storage.sync.get(DEFAULTS);
  const { blocked = {}, seenOrgs = {} } = await chrome.storage.local.get(['blocked', 'seenOrgs']);

  for (const k of ['blockMode', 'skipFollowing', 'paused']) $(k).checked = !!config[k];
  $('blockWarn').hidden = !config.blockMode;

  const blockedList = Object.values(blocked).sort((a, b) => b.at - a.at);
  $('stats').textContent = `${config.companies.length} companies · ${blockedList.length} accounts blocked`;

  $('companies').replaceChildren(
    ...config.companies.map((c) => {
      const rm = el('button', { className: 'ghost', textContent: '✕', title: 'Remove' });
      rm.onclick = () => chrome.storage.sync.set({ companies: config.companies.filter((x) => x !== c) });
      return el('li', {}, el('span', { textContent: c }), rm);
    }),
  );
  if (!config.companies.length) $('companies').append(el('li', { className: 'muted', textContent: 'None yet' }));

  const listed = new Set(config.companies);
  const seen = Object.values(seenOrgs)
    .filter((o) => !listed.has(o.handle) && !listed.has(norm(o.name)))
    .sort((a, b) => b.count - a.count)
    .slice(0, 25);
  $('seen').replaceChildren(
    ...seen.map((o) => {
      const add = el('button', { className: 'ghost', textContent: '+ add' });
      add.onclick = () => addCompany(o.handle || o.name);
      return el('li', {}, el('span', { textContent: `${o.name}${o.handle ? ` (@${o.handle})` : ''} · ${o.count}` }), add);
    }),
  );
  if (!seen.length) $('seen').append(el('li', { className: 'muted', textContent: 'Browse X to collect some' }));

  $('blocked').replaceChildren(
    ...blockedList.slice(0, 30).map((b) =>
      el('li', {},
        el('a', { href: `https://x.com/${b.handle}`, target: '_blank', textContent: `@${b.handle}` }),
        el('span', { className: 'muted', textContent: b.org })),
    ),
  );
  if (!blockedList.length) $('blocked').append(el('li', { className: 'muted', textContent: 'Nobody yet' }));
}

$('add').onsubmit = async (e) => {
  e.preventDefault();
  await addCompany($('company').value);
  $('company').value = '';
};
for (const k of ['blockMode', 'skipFollowing', 'paused']) {
  $(k).onchange = () => chrome.storage.sync.set({ [k]: $(k).checked });
}
chrome.storage.onChanged.addListener(render);
render();
