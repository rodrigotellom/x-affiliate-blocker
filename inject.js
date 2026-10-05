// Runs in the page's own JS context (MAIN world) so it can observe X's API traffic
// and make authenticated API calls with the user's session.
(() => {
  if (window.__xabInstalled) return;
  window.__xabInstalled = true;

  const OUT = 'xab:page';
  const IN = 'xab:content';
  // Public bearer token embedded in X's web client. Only used until we capture the live one.
  const FALLBACK_BEARER =
    'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
  let bearer = null;

  const send = (type, payload) => window.postMessage({ source: OUT, type, payload }, location.origin);

  function orgHandleFromUrl(url) {
    if (!url) return '';
    try {
      return (new URL(url).pathname.split('/').filter(Boolean)[0] || '').toLowerCase();
    } catch {
      return '';
    }
  }

  // Walk any GraphQL response and pull out every User that carries an affiliation label.
  function extractUsers(root) {
    const found = new Map();
    const stack = [root];
    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== 'object') continue;
      if (Array.isArray(node)) {
        for (const v of node) if (v && typeof v === 'object') stack.push(v);
        continue;
      }
      if (node.__typename === 'User' && node.rest_id) {
        const label = node.affiliates_highlighted_label?.label;
        if (label) {
          const legacy = node.legacy || {};
          const rel = node.relationship_perspectives || {};
          found.set(node.rest_id, {
            id: node.rest_id,
            handle: node.core?.screen_name ?? legacy.screen_name ?? '',
            name: node.core?.name ?? legacy.name ?? '',
            orgName: label.description || '',
            orgHandle: orgHandleFromUrl(label.url?.url),
            labelType: label.userLabelType || '',
            following: !!(legacy.following ?? rel.following),
            blocking: !!(legacy.blocking ?? rel.blocking),
          });
        }
      }
      for (const k in node) {
        const v = node[k];
        if (v && typeof v === 'object') stack.push(v);
      }
    }
    return [...found.values()];
  }

  function handlePayload(json) {
    const users = extractUsers(json);
    if (users.length) send('users', users);
  }

  const isGraphql = (url) => typeof url === 'string' && url.includes('/i/api/graphql/');

  // --- fetch hook ---
  const origFetch = window.fetch;
  window.fetch = async function (input, init) {
    try {
      const h = init?.headers ?? (input instanceof Request ? input.headers : null);
      const auth = h && (h instanceof Headers ? h.get('authorization') : h.authorization || h.Authorization);
      if (auth && auth.startsWith('Bearer ')) bearer = auth;
    } catch {}
    const res = await origFetch.apply(this, arguments);
    try {
      const url = String(input?.url ?? input);
      if (isGraphql(url)) res.clone().json().then(handlePayload, () => {});
    } catch {}
    return res;
  };

  // --- XHR hook ---
  const XHR = XMLHttpRequest.prototype;
  const origOpen = XHR.open;
  const origSetHeader = XHR.setRequestHeader;
  const origSend = XHR.send;
  XHR.open = function (method, url) {
    this.__xabUrl = String(url);
    return origOpen.apply(this, arguments);
  };
  XHR.setRequestHeader = function (k, v) {
    if (String(k).toLowerCase() === 'authorization' && String(v).startsWith('Bearer ')) bearer = v;
    return origSetHeader.apply(this, arguments);
  };
  XHR.send = function () {
    if (isGraphql(this.__xabUrl)) {
      this.addEventListener('load', () => {
        try {
          const t = this.responseType;
          const json = t === 'json' ? this.response : t === '' || t === 'text' ? JSON.parse(this.responseText) : null;
          if (json) handlePayload(json);
        } catch {}
      });
    }
    return origSend.apply(this, arguments);
  };

  // --- blocking ---
  const csrfToken = () => document.cookie.match(/(?:^|;\s*)ct0=([^;]+)/)?.[1] ?? '';

  async function block(userId) {
    const res = await origFetch('/i/api/1.1/blocks/create.json', {
      method: 'POST',
      credentials: 'include',
      headers: {
        authorization: bearer || FALLBACK_BEARER,
        'x-csrf-token': csrfToken(),
        'x-twitter-auth-type': 'OAuth2Session',
        'x-twitter-active-user': 'yes',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ user_id: userId }).toString(),
    });
    return { ok: res.ok, status: res.status };
  }

  window.addEventListener('message', async (e) => {
    if (e.source !== window || e.data?.source !== IN) return;
    if (e.data.type === 'block') {
      let result;
      try {
        result = await block(e.data.userId);
      } catch (err) {
        result = { ok: false, status: 0, error: String(err) };
      }
      send('blockResult', { reqId: e.data.reqId, userId: e.data.userId, ...result });
    }
  });
})();
