// 공부 기록 · 진단 · 오늘 할 일 정하기
(function (g) {
  'use strict';
  const M = g.M || require('./mathlib.js');
  const E = {};
  const IV = [1, 3, 7, 14, 30];        // 복습 간격(일)
  const SET_N = 6;                     // 한 세트 문제 수
  const KEY = 'study-app.state';
  let S = null;                        // 지금 기록
  let now = () => new Date();          // 시험에서 날짜를 바꿀 수 있게

  const fmt = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  E.today = () => fmt(now());
  E.addDays = (s, n) => { const [y, m, d] = s.split('-').map(Number); return fmt(new Date(y, m - 1, d + n)); };
  E.setClock = f => { now = f; };
  E.SET_N = SET_N;

  E.fresh = () => ({ v: 1, sid: '', name: '', created: E.today(), updatedAt: 0, diag: null, diagDone: false, skills: {}, xp: 0, days: {}, wrong: [], asks: [], settings: { sound: true } });
  E.state = () => S;
  // sid: 이 기록의 이름표 (기기끼리 같은 기록인지 알아보는 데 쓴다)
  E.setState = s => { S = Object.assign(E.fresh(), s || {}); if (!S.sid) S.sid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); return S; };
  E.sk = id => S.skills[id] || (S.skills[id] = { stars: 0, est: false, seen: false, due: null, iv: 0, hist: [], sets: 0 });

  // ── 집 컴퓨터(서버)와 연결 ──
  // 집 컴퓨터가 직접 보여 주는 화면이면 같은 주소로, 웹(깃허브)에 올린 화면이면 집 컴퓨터가 알려 둔 공개 주소를 찾아간다.
  // status: 'on' 연결됨 · 'need' 닿지만 접속 암호가 필요 · 'off' 닿지 않음
  const CFG = (typeof window !== 'undefined' && window.STUDY_CONFIG) || {};
  const WEB = typeof location !== 'undefined' && !!CFG.site && location.origin === CFG.site;
  const ls = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* 저장 공간 없음 */ } },
  };
  const N = { base: WEB ? null : '', status: 'off', token: ls.get(KEY + '.token'), tutor: { enabled: false, left: 0 }, synced: false, pendingSync: false };
  E.net = N; E.isWeb = WEB;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function fetchT(url, opts, ms) {
    const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
    return fetch(url, Object.assign({}, opts, { signal: c.signal })).finally(() => clearTimeout(t));
  }
  E.api = function (p, o) {
    if (N.base == null) return Promise.reject(new Error('offline'));
    o = o || {};
    const headers = {};
    if (N.token) headers.Authorization = 'Bearer ' + N.token;
    if (o.body != null) headers['Content-Type'] = 'application/json';
    return fetchT(N.base + p, { method: o.method || 'GET', headers, body: o.body }, o.timeout || 8000)
      .then(r => { if (r.status === 401) N.status = 'need'; return r; });
  };
  async function ping(base) {
    try {
      const r = await fetchT(base + '/api/ping', { headers: N.token ? { Authorization: 'Bearer ' + N.token } : {} }, 5000);
      if (!r.ok) return false;
      const j = await r.json();
      if (!j || j.app !== 'study-app') return false;
      const was = N.status;
      N.base = base; N.status = j.auth === 'need' ? 'need' : 'on'; N.tutor = j.tutor || N.tutor;
      N.code = j.code || ''; N.site = j.site || '';   // 집 컴퓨터에서 직접 열었을 때만 온다
      // 새로 연결되면, 기록을 맞춰 보기 전에는 서버에 덮어쓰지 않는다
      if (N.status === 'on' && was !== 'on') { N.synced = false; N.pendingSync = true; }
      return true;
    } catch (e) { return false; }
  }
  // 집 컴퓨터가 적어 둔 공개 주소 읽기
  async function discover() {
    try {
      const r = await fetchT(CFG.endpointUrl || ('https://api.github.com/gists/' + CFG.gist), {}, 6000);
      if (!r.ok) return null;
      const j = await r.json();
      const o = j.files ? JSON.parse(j.files['endpoint.json'].content) : j;
      return o && /^https?:\/\//.test(o.url) ? o.url : null;
    } catch (e) { return null; }
  }
  let lastDiscover = 0;
  E.connect = async function (force) {
    if (!WEB) { if (!(await ping(''))) N.status = 'off'; return N.status; }
    const cached = ls.get(KEY + '.backend');
    if (cached && await ping(cached)) return N.status;
    // 주소 찾기는 5분에 한 번만 (직접 누른 경우는 바로)
    let url = null;
    if ((CFG.gist || CFG.endpointUrl) && (force || Date.now() - lastDiscover > 300000)) { lastDiscover = Date.now(); url = await discover(); }
    if (url && await ping(url)) { ls.set(KEY + '.backend', url); return N.status; }
    N.base = null; N.status = 'off';
    return N.status;
  };
  // 접속 암호 넣기 → 'ok' · 'bad'(암호 틀림) · 'wait'(너무 많이 틀림) · 'off'(닿지 않음)
  E.login = async function (code) {
    if (N.base == null && (await E.connect(true)) === 'off') return 'off';
    try {
      const r = await fetchT(N.base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) }, 8000);
      if (r.status === 429) return 'wait';
      if (!r.ok) return 'bad';
      N.token = (await r.json()).token; ls.set(KEY + '.token', N.token);
      return (await ping(N.base)) && N.status === 'on' ? 'ok' : 'off';
    } catch (e) { return 'off'; }
  };
  let watching = null;
  E.watch = function () {
    if (watching || typeof setInterval === 'undefined' || typeof fetch === 'undefined') return;
    watching = setInterval(async () => { const was = N.status; await E.connect(); if (was !== N.status && E.onNet) E.onNet(); }, 45000);
  };

  // ── 저장 ──
  let timer = null;
  // 이 기기의 기록(local)과 집 컴퓨터의 기록(remote) 가운데 어느 것을 쓸까
  function choose(local, remote) {
    if (!remote || !remote.v) return local;
    if (!local) return remote;
    // 서로 다른 기록이면 집 컴퓨터 것을 따르고, 이 기기 것은 따로 보관해 둔다
    if (local.sid && remote.sid && local.sid !== remote.sid) {
      if (local.name) ls.set(KEY + '.backup-' + Date.now(), JSON.stringify(local));
      return remote;
    }
    if (!local.name) return remote;
    if (!remote.name) return local;
    return (local.updatedAt || 0) > (remote.updatedAt || 0) ? local : remote;
  }
  E.save = function () {
    S.updatedAt = Date.now();
    ls.set(KEY, JSON.stringify(S));
    clearTimeout(timer);
    timer = setTimeout(E.push, 400);
  };
  E.push = function () {
    if (typeof fetch === 'undefined' || N.status !== 'on' || !N.synced) return Promise.resolve(false);
    return E.api('/api/state', { method: 'PUT', body: JSON.stringify(S) }).then(r => r.ok).catch(() => false);
  };
  // 집 컴퓨터의 기록 읽기: 기록 · null(아직 없음) · undefined(읽지 못함)
  E.pull = async function () {
    try { const r = await E.api('/api/state'); if (!r.ok) return undefined; const j = await r.json(); return j && j.v ? j : null; }
    catch (e) { return undefined; }
  };
  // 연결된 뒤 기록 맞추기 → 화면에 보이는 기록이 바뀌었으면 true
  E.sync = async function () {
    if (N.status !== 'on') return false;
    N.pendingSync = false;
    const remote = await E.pull();
    if (remote === undefined || N.status !== 'on') { N.pendingSync = true; return false; }
    N.synced = true;
    const pick = choose(S, remote);
    if (remote && pick === remote) { E.setState(remote); ls.set(KEY, JSON.stringify(S)); return true; }
    if (S.name) E.push();
    return false;
  };
  E.load = async function () {
    let local = null;
    try { local = JSON.parse(ls.get(KEY) || 'null'); } catch (e) { /* 깨진 기록 */ }
    E.setState(local);
    if (typeof fetch !== 'undefined') {
      // 연결을 잠깐만 기다리고, 늦으면 이 기기의 기록으로 먼저 시작한다 (나중에 닿으면 화면에 알린다)
      const c = E.connect(true);
      let late = false;
      await Promise.race([c, sleep(WEB ? 4500 : 3000).then(() => { late = true; })]);
      if (N.status === 'on') await E.sync();
      if (late) c.then(() => { if (E.onNet) E.onNet(); });
      E.watch();
    }
    return S;
  };
  // 선생님께 한 질문 남기기 (부모님 보기에서 볼 수 있게)
  E.logAsk = function (id, q, a) {
    S.asks.unshift({ t: Date.now(), id: id || '', q: String(q).slice(0, 300), a: String(a).slice(0, 1500) });
    if (S.asks.length > 40) S.asks.pop();
    E.save();
  };

  // ── 진단 ──
  const failed = (d, id) => String(d.res[id] || '').startsWith('fail');
  const prefail = (d, id) => M.byId[id].pre.some(p => failed(d, p));
  E.diagStart = function () { S.diag = { si: 0, init: false, lo: -1, hi: 0, first: true, idx: null, r: 0, w: 0, res: {}, count: 0 }; S.diagDone = false; E.save(); };
  // 다음에 물어볼 단원 id (없으면 null = 끝)
  E.diagPick = function () {
    const d = S.diag;
    while (d.si < M.STRANDS.length) {
      const st = M.STRANDS[d.si], L = st.ids;
      if (!d.init) { d.lo = -1; d.hi = L.length; d.first = true; d.init = true; d.idx = null; }
      if (d.idx != null) return L[d.idx];
      if (st.mode === 'lin') {
        const i = L.findIndex(id => !(id in d.res));
        if (i < 0) { d.si++; d.init = false; continue; }
        if (prefail(d, L[i])) { d.res[L[i]] = 'fail*'; continue; }
        d.idx = i;
      } else {
        if (d.hi - d.lo <= 1) {
          L.forEach((id, i) => { if (!(id in d.res)) d.res[id] = i <= d.lo ? 'pass*' : 'fail*'; });
          d.si++; d.init = false; continue;
        }
        let i = d.first ? st.start : Math.floor((d.lo + d.hi) / 2);
        d.first = false;
        if (i <= d.lo || i >= d.hi) i = Math.floor((d.lo + d.hi) / 2);
        if (prefail(d, L[i])) { d.res[L[i]] = 'fail*'; d.hi = i; continue; }
        d.idx = i;
      }
      d.r = 0; d.w = 0;
      return L[d.idx];
    }
    return null;
  };
  E.diagAnswer = function (ok, dunno) {
    const d = S.diag, st = M.STRANDS[d.si], id = st.ids[d.idx];
    d.count++;
    if (ok) d.r++; else d.w++;
    let verdict = null;
    if (dunno || d.w >= 2) verdict = 'fail'; else if (d.r >= 2) verdict = 'pass';
    if (verdict) {
      d.res[id] = verdict;
      if (st.mode === 'bin') { if (verdict === 'pass') d.lo = d.idx; else d.hi = d.idx; }
      d.idx = null;
    }
    E.save();
  };
  // 진행 정도 0~1 (어림)
  E.diagProgress = function () {
    const d = S.diag; if (!d) return 0;
    const total = M.skills.length, known = Object.keys(d.res).length;
    return Math.min(0.97, (d.si / M.STRANDS.length) * 0.5 + (known / total) * 0.5);
  };
  E.diagFinish = function () {
    const d = S.diag, t = E.today();
    let k = 0;
    M.ORDER.forEach(id => {
      const s = E.sk(id), r = d.res[id] || 'fail*';
      if (r.startsWith('pass')) {
        // 안다고 본 단원: 며칠에 걸쳐 확인 문제를 낸다 (직접 확인한 것은 더 늦게)
        s.stars = 3; s.est = true; s.seen = true; s.iv = 0;
        s.due = E.addDays(t, (r === 'pass' ? 4 : 1) + Math.floor(k / 2)); k++;
      } else { s.stars = 0; s.est = false; s.due = null; }
      s.diag = r;
    });
    S.diagDone = true;
    S.diagDate = t;
    E.save();
  };

  // ── 오늘 할 일 ──
  E.unlocked = id => M.byId[id].pre.every(p => E.sk(p).stars >= 2);
  E.current = () => M.ORDER.find(id => E.sk(id).stars < 3 && E.unlocked(id)) || null;
  E.dueReviews = function (max) {
    const t = E.today();
    return M.ORDER.filter(id => { const s = E.sk(id); return s.stars >= 3 && s.due && s.due <= t; })
      .sort((a, b) => (E.sk(a).due < E.sk(b).due ? -1 : 1)).slice(0, max || 3);
  };
  // [{type:'review', id} …, {type:'lesson', id}, {type:'set', id}]
  E.plan = function (onlyId) {
    const steps = [];
    if (!onlyId) E.dueReviews(3).forEach(id => steps.push({ type: 'review', id }));
    const cur = onlyId || E.current();
    if (cur) {
      if (!E.sk(cur).seen) steps.push({ type: 'lesson', id: cur });
      steps.push({ type: 'set', id: cur });
    }
    return steps;
  };
  E.levelFor = id => Math.min(3, E.sk(id).stars + 1);

  // 문제 하나 만들기 (avoid: 이미 낸 문제 글)
  E.make = function (id, lv, avoid) {
    const sk = M.byId[id];
    let p;
    for (let i = 0; i < 12; i++) {
      p = sk.gen(lv, M.rng((Math.random() * 4294967296) >>> 0));
      const key = p.q + JSON.stringify(p.v || '');
      if (!avoid || !avoid.has(key)) { if (avoid) avoid.add(key); break; }
    }
    p.id = id; p.lv = lv;
    return p;
  };

  // ── 기록 ──
  const day = () => S.days[E.today()] || (S.days[E.today()] = { n: 0, ok: 0, sec: 0, sets: 0 });
  // ok: 처음에 바로 맞혔는가
  E.record = function (p, ok, sec, userText) {
    const s = E.sk(p.id), d = day();
    s.hist.push([Date.now(), ok ? 1 : 0, p.lv, Math.round(sec)]);
    if (s.hist.length > 40) s.hist.shift();
    d.n++; if (ok) d.ok++; d.sec += Math.min(300, Math.round(sec));
    S.xp += ok ? 10 : 3;
    if (!ok) {
      S.wrong.unshift({ t: Date.now(), id: p.id, q: p.q, v: p.v || null, ua: userText || '', ca: M.ansHtml(p.a) });
      if (S.wrong.length > 40) S.wrong.pop();
    }
    E.save();
  };
  // 세트 끝: right = 처음에 바로 맞힌 수
  E.finishSet = function (id, right, total) {
    const s = E.sk(id), before = s.stars;
    s.sets++; s.est = false; day().sets++;
    let result = 'stay';
    if (right >= total - 1) {
      // 한 문제까지 틀려도 별 하나, 모두 맞히면 별 둘 (이미 아는 단원은 빨리 지나간다)
      s.stars = Math.min(3, s.stars + (right === total ? 2 : 1)); result = 'up'; S.xp += 30;
      if (s.stars === 3) { s.iv = 0; s.due = E.addDays(E.today(), IV[0]); }
    } else if (right <= total / 3) {
      result = 'again'; s.seen = false;
      // 어림으로 '안다'고 본 선수 단원을 바로 확인한다
      M.byId[id].pre.forEach(p => { const ps = E.sk(p); if (ps.est) ps.due = E.today(); });
    }
    E.save();
    return { result, before, stars: s.stars };
  };
  E.finishReview = function (id, right, total) {
    const s = E.sk(id);
    let result;
    if (right === total) { result = 'keep'; s.est = false; s.iv = Math.min(IV.length - 1, s.iv + 1); s.due = E.addDays(E.today(), IV[s.iv]); S.xp += 10; }
    else if (!s.est && right > 0) { result = 'soon'; s.iv = 0; s.due = E.addDays(E.today(), 1); } // 하나만 틀렸으면 내일 한 번 더 확인
    else { result = 'drop'; s.stars = s.est ? (right === 0 ? 0 : 1) : 2; s.est = false; s.due = null; s.iv = 0; if (s.stars < 2) s.seen = false; }
    E.save();
    return { result, stars: s.stars };
  };
  E.markSeen = id => { E.sk(id).seen = true; E.save(); };

  // ── 요약 ──
  E.streak = function () {
    let n = 0, d = E.today();
    if (!(S.days[d] && S.days[d].n >= 5)) d = E.addDays(d, -1);
    while (S.days[d] && S.days[d].n >= 5) { n++; d = E.addDays(d, -1); }
    return n;
  };
  E.level = () => ({ lv: Math.floor(S.xp / 300) + 1, cur: S.xp % 300, need: 300 });
  E.todayDone = () => { const d = S.days[E.today()]; return !!(d && d.sets >= 1); };
  E.acc = function (id) {
    const h = E.sk(id).hist; if (!h.length) return null;
    return { n: h.length, rate: h.filter(x => x[1]).length / h.length };
  };
  E.counts = function () {
    let done = 0, going = 0;
    M.ORDER.forEach(id => { const s = E.sk(id); if (s.stars >= 3) done++; else if (s.stars > 0 || s.sets > 0) going++; });
    return { done, going, total: M.ORDER.length };
  };
  // 배움이 시작되는 자리 (학년-학기)
  E.startGrade = function () {
    const cur = E.current();
    return cur ? M.byId[cur].grade : null;
  };

  g.E = E;
  if (typeof module !== 'undefined') module.exports = E;
})(typeof window !== 'undefined' ? window : globalThis);
