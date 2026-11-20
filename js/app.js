// 화면
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const app = $('#app');
  const J = M.josa;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let screen = '';   // 지금 화면 ('home' · 'welcome' · 그 밖은 빈 글)
  const view = html => { screen = ''; app.innerHTML = html; window.scrollTo(0, 0); };
  const on = (sel, fn) => { const el = $(sel); if (el) el.onclick = fn; };
  const gradeName = g => g.replace(/(\d)-(\d)/, '$1학년 $2학기');
  const stars = n => '<span class="stars">' + '★'.repeat(n) + '<span class="off">' + '★'.repeat(3 - n) + '</span></span>';
  let keyHandler = null;
  document.addEventListener('keydown', e => { if (keyHandler) keyHandler(e); });

  // ── 소리 ──
  let ac = null;
  function beep(notes, type, vol) {
    if (!E.state().settings.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      let t = ac.currentTime + 0.01;
      notes.forEach(([f, d]) => {
        const o = ac.createOscillator(), gn = ac.createGain();
        o.type = type || 'square'; o.frequency.value = f;
        gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(vol || 0.07, t + 0.01); gn.gain.linearRampToValueAtTime(0, t + d);
        o.connect(gn).connect(ac.destination); o.start(t); o.stop(t + d + 0.02); t += d * 0.9;
      });
    } catch (e) { /* 소리를 못 내는 기기 */ }
  }
  const sfx = {
    tap: () => beep([[660, 0.04]], 'square', 0.03),
    ok: () => beep([[660, 0.09], [880, 0.09], [1320, 0.16]]),
    no: () => beep([[300, 0.12], [240, 0.18]], 'triangle', 0.1),
    star: () => beep([[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.1], [1319, 0.25]]),
  };

  // ── 도트 강아지 ──
  const DOG = ['..kk........kk..', '.kook......kook.', '.koookkkkkkoook.', '.kooooooooooook.', 'kooooooooooooook', 'koookooooookoook', 'koookooooookoook', 'kooooowwwwoooook',
    'kpoowwwkkwwwoopk', 'kpowwwwkkwwwwopk', '.kowwkwwwwkwwok.', '.koowwkkkkwwook.', '..koowwwwwwook..', '...kkoooooookk..', '.....kkkkkkk....'];
  const DOGC = { k: '#23284d', o: '#f2a03d', w: '#fff4dc', p: '#ff8fa3' };
  function dog(size, cls) {
    let r = '';
    DOG.forEach((row, y) => row.split('').forEach((c, x) => { if (c !== '.') r += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02" fill="' + DOGC[c] + '"/>'; }));
    return '<svg class="dog ' + (cls || '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 16 15" shape-rendering="crispEdges">' + r + '</svg>';
  }

  // ── 답 칸 만들기 ──
  function build(spec, ctx) {
    if (spec.parts) {
      const subs = spec.parts.map(p => build(p, ctx));
      return { html: subs.map(s => '<span class="part">' + s.html + '</span>').join(spec.sep ? '<span class="sep">' + spec.sep.trim() + '</span>' : ''), get: v => subs.map(s => s.get(v)), text: v => subs.map(s => s.text(v)).join(spec.sep || ', ') };
    }
    const box = (i, cls, extra) => '<span class="box ' + (cls || '') + '" data-i="' + i + '" ' + (extra || '') + '></span>';
    const pre = spec.pre ? '<span class="pre">' + spec.pre + '</span>' : '', post = spec.post ? '<span class="post">' + spec.post + '</span>' : '';
    if (spec.n != null) {
      const i = ctx.n++;
      ctx.dec[i] = !spec.frac;
      const inner = spec.frac ? '<span class="fr in"><b>' + box(i) + '</b><b class="fixed">' + spec.frac + '</b></span>' : box(i);
      return { html: pre + inner + post, get: v => v[i], text: v => (spec.frac ? v[i] + '/' + spec.frac : v[i]) };
    }
    const wi = spec.wb ? ctx.n++ : -1, ni = ctx.n++, di = ctx.n++;
    return {
      html: pre + (wi >= 0 ? box(wi, 'w', 'data-ph="자연수"') : '') + '<span class="fr in"><b>' + box(ni) + '</b><b>' + box(di) + '</b></span>' + post,
      get: v => ({ w: wi < 0 ? '' : v[wi], n: v[ni], d: v[di] }),
      text: v => ((wi >= 0 && v[wi] ? v[wi] + ' ' : '') + (v[ni] || v[di] ? v[ni] + '/' + v[di] : '')).trim(),
    };
  }

  function frame(o, inner) {
    view('<div class="sess"><div class="top"><button class="x" id="quit" aria-label="그만하기">✕</button><div class="prog"><i style="width:' + Math.round((o.prog || 0) * 100) + '%"></i></div><span class="lbl">' + (o.label || '') + '</span></div>' + inner + '</div>');
    on('#quit', () => { if (confirm('여기서 멈추고 처음 화면으로 갈까? (푼 문제는 저장돼 있어)')) { keyHandler = null; home(); } });
  }

  // ── 문제 하나 묻기 ──
  // o.mode: 'learn'(힌트 뒤 한 번 더) · 'review'(한 번) · 'diag'(한 번, 맞았는지 알려 주지 않음)
  function ask(p, o) {
    return new Promise(resolve => {
      const sk = M.byId[p.id], ctx = { n: 0, dec: {} }, ans = p.a.c ? null : build(p.a, ctx);
      const vals = Array(ctx.n).fill('');
      window.__app.cur = p; // 자동 시험용
      let cur = 0, tries = 0, nearUsed = false, done = false, pick = null, lastUa = '';
      // 선생님께 질문할 때 함께 넘길 문제 내용
      const tctx = stage => ({ kind: 'problem', stage, id: p.id, skill: sk.name + ' (' + gradeName(sk.grade) + ')',
        problem: { q: M.plain(J(p.q)), pic: V.describe(p.v), answer: M.plain(M.ansHtml(p.a)), sol: p.sol.map(s => M.plain(J(s))), hint: M.plain(J(p.hint)), userAnswer: lastUa } });
      const t0 = performance.now(), maxTries = o.mode === 'learn' ? 2 : 1;
      frame(o,
        '<div class="card q"><div class="tag">' + sk.name + '</div><div class="qtext">' + J(p.q) + '</div>' +
        (p.v ? '<div class="qvis">' + V.draw(p.v) + '</div>' : '') +
        (p.a.c ? '<div class="choices' + (p.a.c.some(c => String(c).length > 3) ? ' txt' : '') + '">' + p.a.c.map((c, i) => '<button class="choice" data-c="' + i + '"></button>').join('') + '</div>' : '<div class="ansrow">' + ans.html + '</div>') +
        '</div><div id="fb"></div><div id="padwrap">' +
        (p.a.c ? '' : '<div class="pad">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map(k => '<button data-k="' + k + '">' + k + '</button>').join('') + '</div>') +
        '<div class="acts"><button class="btn sub" id="dunno">모르겠어요</button>' + (ctx.n > 1 ? '<button class="btn sub" id="nextbox">다음 칸 →</button>' : '') + (p.a.c ? '' : '<button class="btn go ok" id="go">확인</button>') + '</div></div>');
      $$('.choice').forEach((b, i) => { b.textContent = p.a.c[i]; b.onclick = () => { if (done) return; pick = i; $$('.choice').forEach(x => x.classList.toggle('sel', x === b)); submit(); }; });
      const boxes = $$('.box');
      const paint = () => boxes.forEach((b, i) => { b.textContent = vals[i]; b.classList.toggle('on', i === cur && !done); b.classList.toggle('has', vals[i] !== ''); });
      boxes.forEach((b, i) => { b.onclick = () => { cur = i; paint(); }; });
      paint();
      const userText = () => (p.a.c ? (pick == null ? '' : p.a.c[pick]) : ans.text(vals));
      // 알림 판을 띄운다. 숫자판이 아직 있으면 숫자판 끝까지 보이게, 없으면 알림 판이 보이게 내린다
      const fb = html => {
        $('#fb').innerHTML = html;
        const pad = $('#padwrap'), el = pad && pad.style.display !== 'none' ? pad : $('#fb');
        if (html && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      };
      const finish = (ok, dunno) => { keyHandler = null; resolve({ ok, dunno: !!dunno, sec: (performance.now() - t0) / 1000, ua: userText() }); };
      const closing = (html, ok, dunno) => {
        done = true; paint(); $('#padwrap').style.display = 'none';
        fb(html); on('#next', () => finish(ok, dunno)); on('#askt', () => tutor(tctx('solved')));
        keyHandler = e => { if (e.key === 'Enter' && !e.repeat) { e.preventDefault(); finish(ok, dunno); } };
      };
      const solution = (title, dunno) => closing('<div class="fb sol"><h3>' + title + '</h3><ol>' + p.sol.map(s => '<li>' + J(s) + '</li>').join('') + '</ol><div class="ans">정답: ' + M.ansHtml(p.a) + '</div>' + askBtn() + '<button class="btn" id="next">알겠어! ▶</button></div>', false, dunno);

      function key(k) {
        if (done || p.a.c) return;
        if (k === '⌫') { if (vals[cur]) vals[cur] = vals[cur].slice(0, -1); else if (cur > 0) cur--; }
        else if (k === '.') { if (ctx.dec[cur] && vals[cur] && !vals[cur].includes('.')) vals[cur] += '.'; }
        else if (vals[cur].length < 7) vals[cur] = (vals[cur] === '0' ? '' : vals[cur]) + k;
        sfx.tap(); paint();
      }
      function submit() {
        if (done) return;
        const r = M.check(p.a, p.a.c ? pick : ans.get(vals));
        if (r.empty) { $('.ansrow') && $('.ansrow').classList.add('shake'); setTimeout(() => $('.ansrow') && $('.ansrow').classList.remove('shake'), 350); fb('<div class="fb near">' + (r.msg || '빈칸을 채우고 확인을 눌러 줘.') + '</div>'); return; }
        if (o.mode === 'diag') {
          if (!r.ok && r.near && !nearUsed) { nearUsed = true; fb('<div class="fb near">' + r.near + '</div>'); return; }
          return finish(r.ok);
        }
        if (r.ok) {
          sfx.ok();
          const first = tries === 0;
          return closing('<div class="fb good"><h3>' + (first ? ['정답!', '좋았어!', '바로 그거야!', '잘했어!'][Math.floor(Math.random() * 4)] : '맞았어! 다시 해내는 게 진짜 실력이야.') + '</h3><button class="btn ok" id="next">다음 ▶</button></div>', first);
        }
        if (r.near && !nearUsed) { nearUsed = true; fb('<div class="fb near"><b>거의 다 왔어!</b> ' + r.near + '</div>'); return; }
        sfx.no(); tries++; lastUa = userText();
        if (tries < maxTries) {
          for (let i = 0; i < vals.length; i++) vals[i] = '';
          cur = 0; pick = null; $$('.choice').forEach(x => x.classList.remove('sel')); paint();
          fb('<div class="fb warn"><h3>아쉬워! 한 번 더 해 보자.</h3><div class="hint">💡 ' + J(p.hint) + '</div>' + askBtn() + '</div>');
          on('#askt', () => tutor(tctx('hint')));
        } else solution('이렇게 풀어');
      }
      $$('.pad button').forEach(b => { b.onclick = () => key(b.dataset.k); });
      on('#go', submit);
      on('#nextbox', () => { cur = (cur + 1) % vals.length; paint(); });
      on('#dunno', () => { if (done) return; if (o.mode === 'diag') return finish(false, true); tries = maxTries; solution('괜찮아, 같이 보자', true); });
      keyHandler = e => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (/^\d$/.test(e.key)) key(e.key);
        else if (e.key === '.') key('.');
        else if (e.key === 'Backspace') { e.preventDefault(); key('⌫'); }
        else if (e.key === 'Tab' || e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === '/' || e.key === ' ') { if (vals.length > 1) { e.preventDefault(); cur = (cur + 1) % vals.length; paint(); } }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { if (vals.length > 1) { cur = (cur + vals.length - 1) % vals.length; paint(); } }
        else if (e.key === 'Enter') { e.preventDefault(); submit(); }
        else if (p.a.c && (e.key === '<' || e.key === '>' || e.key === '=')) { const i = p.a.c.indexOf(e.key); if (i >= 0) $$('.choice')[i].click(); }
      };
    });
  }

  // ── 멍멍이 선생님께 질문하기 (집 컴퓨터의 Claude Code 가 답한다) ──
  const askBtn = () => '<button class="btn sub askt" id="askt">🙋 선생님께 질문하기</button>';
  // 선생님 답을 화면용으로: 3/4 → 분수 모양, 줄바꿈 살리기
  const fmtTutor = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^\d\/.])(\d{1,4})\/(\d{1,4})(?![\d\/])/g, (m, pre, a, b) => pre + M.F(a, b)).replace(/\n/g, '<br>');
  function tutorWhyNot() {
    const n = E.net;
    if (n.status === 'off') return '멍멍이 선생님은 집 컴퓨터가 켜져 있을 때만 대답할 수 있어. 지금은 집 컴퓨터에 닿지 않아.';
    if (n.status === 'need') return '선생님께 질문하려면 먼저 집 컴퓨터와 연결해야 해. 부모님께 "집 컴퓨터 연결"을 부탁해 줘.';
    if (!n.tutor.enabled) return '지금은 질문하기가 꺼져 있어.';
    if (n.tutor.left <= 0) return '오늘 할 수 있는 질문을 다 썼어. 내일 또 물어봐 줘!';
    return '';
  }
  const ASK_ERR = {
    limit: '오늘 할 수 있는 질문을 다 썼어. 내일 또 물어봐 줘!', busy: '선생님이 다른 질문에 답하는 중이야. 조금 뒤에 다시 물어봐 줘.', off: '지금은 질문하기가 꺼져 있어.',
    auth: '집 컴퓨터와 다시 연결해야 해. 부모님께 부탁해 줘.', timeout: '답이 너무 오래 걸려서 멈췄어. 다시 한번 물어봐 줄래?', net: '집 컴퓨터에 닿지 않아. 조금 뒤에 다시 해 보자.',
  };
  // 질문을 보내고, 답이 만들어지는 대로 조금씩 받아 온다 → { text, error }
  async function askTutor(payload, onText) {
    let r;
    try { r = await E.api('/api/ask', { method: 'POST', body: JSON.stringify(payload), timeout: 15000 }); } catch (e) { return { error: 'net' }; }
    if (!r.ok) { let j = {}; try { j = await r.json(); } catch (e) { /* 내용 없음 */ } return { error: j.error || 'net' }; }
    const id = (await r.json()).id;
    let text = '', n = 0, miss = 0;
    for (;;) {
      await new Promise(z => setTimeout(z, 500));
      let g;
      try { const q = await E.api('/api/ask/' + id + '?from=' + n, { timeout: 10000 }); if (!q.ok) throw new Error('http'); g = await q.json(); miss = 0; }
      catch (e) { if (++miss > 6) return { error: 'net', text }; continue; }
      if (g.text) { text += g.text; n = g.n; onText(text); }
      if (g.left != null) E.net.tutor.left = g.left;
      if (g.done) return { text, error: g.error };
    }
  }
  // ctx: { kind: 'problem' | 'lesson' | 'free', … } — 지금 보던 문제나 설명을 함께 넘긴다
  function tutor(ctx) {
    if ($('.overlay')) return;
    const saved = keyHandler; keyHandler = null;   // 질문 창이 떠 있는 동안 숫자 키가 답 칸에 들어가지 않게
    const hist = [];
    let busy = false;
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = '<div class="chat"><div class="chathead">' + dog(36) + '<b>멍멍이 선생님</b><button class="x" id="tclose" aria-label="닫기">✕</button></div>' +
      '<div class="msgs" id="tmsgs"></div><div class="tchips" id="tchips"></div>' +
      '<div class="chatin"><input type="text" id="tq" maxlength="300" placeholder="궁금한 것을 써 봐" autocomplete="off" enterkeyhint="send"><button class="btn small" id="tsend">보내기</button></div></div>';
    document.body.appendChild(ov);
    const msgs = $('#tmsgs', ov), input = $('#tq', ov);
    const add = (who, html) => { const d = document.createElement('div'); d.className = 'msg ' + who; d.innerHTML = html; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d; };
    const close = () => { ov.remove(); keyHandler = saved; };
    $('#tclose', ov).onclick = close;
    const chips = list => {
      const c = $('#tchips', ov);
      c.innerHTML = list.map(t => '<button class="tchip">' + esc(t) + '</button>').join('');
      $$('.tchip', c).forEach(b => { b.onclick = () => (b.textContent === '이제 알겠어!' ? close() : send(b.textContent)); });
    };
    const why = tutorWhyNot();
    add('tutor', why || (ctx.kind === 'problem' ? '어디가 헷갈려? 아래에서 골라도 되고, 직접 써도 돼.' : ctx.kind === 'lesson' ? '이 설명에서 어디가 어려워? 아래에서 골라도 되고, 직접 써도 돼.' : '공부하다가 궁금한 걸 물어봐. 숙제 문제를 그대로 써 줘도 좋아!'));
    if (why) { $('.chatin', ov).style.display = 'none'; return; }
    chips(ctx.kind === 'problem'
      ? (ctx.stage === 'hint' ? ['어떻게 시작해야 할지 모르겠어', '힌트를 하나 더 줘'] : ['왜 그렇게 되는지 모르겠어', '더 쉽게 설명해 줘'].concat(ctx.problem.userAnswer ? ['내 답은 왜 틀렸어?'] : [], ['비슷한 문제를 하나 더 보여 줘']))
      : ctx.kind === 'lesson' ? ['이 설명이 이해가 안 돼', '예를 하나 더 들어 줘', '왜 이렇게 하는 거야?'] : []);
    async function send(q) {
      q = String(q || '').trim();
      if (!q || busy) return;
      busy = true; input.value = ''; $('#tchips', ov).innerHTML = '';
      add('kid', esc(q));
      const bubble = add('tutor', '<span class="dots3"><i></i><i></i><i></i></span>');
      const r = await askTutor(Object.assign({}, ctx, { question: q, history: hist.slice(-8) }), t => { bubble.innerHTML = fmtTutor(t); msgs.scrollTop = msgs.scrollHeight; });
      busy = false;
      if (r.text) { hist.push({ who: 'kid', text: q }, { who: 'tutor', text: r.text }); E.logAsk(ctx.id, q, r.text); }
      if (!document.body.contains(ov)) return;
      if (!r.text) { bubble.innerHTML = ASK_ERR[r.error] || '지금은 선생님이 대답하기 어려워. 조금 뒤에 다시 물어봐 줘.'; bubble.classList.add('err'); chips([]); return; }
      bubble.innerHTML = fmtTutor(r.text); msgs.scrollTop = msgs.scrollHeight;
      chips(['더 쉽게 설명해 줘', '예를 하나 더 들어 줘', '이제 알겠어!']);
    }
    $('#tsend', ov).onclick = () => send(input.value);
    input.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); send(input.value); } };
    if (!('ontouchstart' in window)) setTimeout(() => input.focus(), 50);
  }

  // ── 집 컴퓨터 연결 (접속 암호) ──
  function linkFlow(back) {
    keyHandler = null;
    view('<div class="top"><button class="x" id="back">←</button><span class="lbl" style="font-size:18px">집 컴퓨터 연결</span></div>' +
      '<div class="card"><h2>접속 암호 넣기</h2><p>집 컴퓨터와 연결하면 <b>공부 기록이 기기끼리 이어지고</b>, 멍멍이 선생님께 <b>질문</b>할 수 있어요.</p>' +
      '<p class="mute">접속 암호는 집 컴퓨터에서 앱을 켠 검은 창에 적혀 있는 숫자 8자리예요. 이 기기에서는 한 번만 넣으면 됩니다.</p>' +
      '<input type="text" id="code" inputmode="numeric" maxlength="12" placeholder="숫자 8자리" autocomplete="off"><p id="lmsg" class="mute">&nbsp;</p><button class="btn" id="go">연결하기</button></div>');
    on('#back', back);
    const msg = t => { $('#lmsg').textContent = t; };
    const OFF = '집 컴퓨터에 닿지 않아요. 집 컴퓨터에서 앱이 켜져 있는지 확인해 주세요.';
    if (E.net.status === 'off') msg(OFF);
    let going = false;
    const go = async () => {
      const code = $('#code').value.replace(/\D/g, '');
      if (code.length < 4 || going) { $('#code').focus(); return; }
      going = true; msg('연결하는 중…');
      const r = await E.login(code);
      if (r === 'ok') { await E.sync(); return E.net.needPick ? pick(home) : home(); }
      going = false;
      if ($('#lmsg')) msg(r === 'bad' ? '암호가 달라요. 다시 확인해 주세요.' : r === 'wait' ? '여러 번 틀려서 잠시 막혔어요. 15분쯤 뒤에 다시 해 주세요.' : OFF);
    };
    on('#go', go);
    $('#code').onkeydown = e => { if (e.key === 'Enter') go(); };
  }

  // ── 처음 ──
  // 집 컴퓨터에서 직접 열었을 때만 보이는 칸: 다른 기기를 연결하는 데 필요한 웹 주소와 접속 암호
  const outsideCard = () => (E.net.code ? '<div class="card"><h2>휴대폰 · 태블릿에서 함께 쓰려면</h2><p>그 기기에서 아래 웹 주소를 열고, <b>"집 컴퓨터 연결하기"</b>에 접속 암호를 한 번만 넣어 주세요.</p><p>웹 주소: <b>' + esc(E.net.site || '(아직 웹에 올리지 않음)') + '</b></p><p>접속 암호: <b style="font-size:22px;letter-spacing:2px">' + esc(String(E.net.code).replace(/(\d{4})(?=\d)/g, '$1 ')) + '</b></p><p class="mute">이 칸은 집 컴퓨터에서 직접 열었을 때만 보여요. 집 컴퓨터가 켜져 있을 때만 연결됩니다.</p></div>' : '');

  // back: 사람 고르기에서 '새로 시작하기'로 왔을 때 돌아갈 곳
  function welcome(back) {
    const linkCard = (E.isWeb || E.net.status === 'need') && E.net.status !== 'on' ? '<div class="card"><h2>가족과 함께 쓰나요?</h2><p class="mute">집 컴퓨터와 연결하면 가족의 기록이 서로 보이고, 다른 기기에서 하던 공부도 이어져요. 접속 암호가 필요해요.</p><button class="btn sub" id="link">집 컴퓨터 연결하기</button></div>' : '';
    view('<div class="hero">' + dog(72) + '<div><h1>차근차근 수학</h1><div class="sub">모르는 곳부터 하나씩, 하루 15분</div></div></div>' +
      '<div class="card"><h2>이름이 뭐야?</h2><p>앞으로 같이 공부할 멍멍이야. 이름을 알려 줘!</p><input type="text" id="name" maxlength="8" placeholder="이름" autocomplete="off"><br><br><button class="btn" id="go">시작하기</button></div>' +
      (back ? '<button class="btn sub" id="back">← 돌아가기</button>' : linkCard + outsideCard()));
    screen = back ? '' : 'welcome';
    const go = () => { const n = $('#name').value.trim(); if (!n) { $('#name').focus(); return; } E.newMember(n); diagIntro(); };
    on('#go', go);
    on('#back', back);
    on('#link', () => linkFlow(home));
    $('#name').onkeydown = e => { if (e.key === 'Enter') go(); };
  }

  // ── 누가 공부할까 (가족이 함께 쓴다) ──
  // 아직 누가 공부하는지 모를 때: 가족이나 이 기기에 남은 기록이 있으면 고르게 하고, 없으면 이름을 묻는다
  let entering = 0;
  async function enter() {
    const my = ++entering, locals = E.localMembers();
    if (E.net.status === 'on') view('<div class="loading">불러오는 중…</div>');
    const fam = await E.family();
    if (my !== entering || E.state().name) return;
    if ((fam && fam.length) || locals.length) who(fam, locals); else welcome();
  }
  const pick = async back => who(await E.family(), E.localMembers(), back);
  // fam: 집 컴퓨터에 있는 가족(없으면 null), locals: 이 기기에 남은 기록, back: 돌아갈 곳(없으면 꼭 골라야 한다)
  function who(fam, locals, back) {
    keyHandler = null;
    const S = E.state(), list = (fam || []).map(m => ({ sum: E.summary(m), home: true }));
    locals.forEach(s => { if (!list.some(m => m.sum.id === s.sid)) list.push({ sum: E.summary(s), home: false }); });
    const linkCard = E.isWeb && E.net.status !== 'on' ? '<div class="card"><p class="mute">집 컴퓨터와 연결하면 가족 모두의 기록이 보여요.</p><button class="btn sub" id="link">집 컴퓨터 연결하기</button></div>' : '';
    view('<div class="hero">' + dog(72) + '<div><h1>누가 공부할까?</h1><div class="sub">자기 이름을 눌러 줘</div></div></div>' +
      '<div class="card">' + list.map(m => '<button class="who' + (S.name && m.sum.id === S.sid ? ' me' : '') + '" data-id="' + esc(m.sum.id) + '" data-home="' + (m.home ? 1 : 0) + '"><b>' + esc(m.sum.name) + '</b><span>Lv.' + m.sum.lv + ' · ★ ' + m.sum.done + (m.home ? '' : ' · 이 기기에만 있는 기록') + '</span></button>').join('') +
      '<p id="wmsg" class="mute"></p><button class="btn sub" id="new">+ 새로 시작하기</button></div>' +
      (back ? '<button class="btn sub" id="back" style="margin-bottom:16px">← 돌아가기</button>' : '') + linkCard + outsideCard());
    screen = back ? '' : 'welcome';
    let busy = false;
    $$('.who').forEach(b => {
      b.onclick = async () => {
        if (busy) return;
        busy = true;
        const ok = await E.switchTo(b.dataset.id);
        if (!ok) { busy = false; if ($('#wmsg')) $('#wmsg').textContent = '기록을 불러오지 못했어. 집 컴퓨터가 켜져 있는지 확인해 줘.'; return; }
        // 이 기기에만 있던 기록을 골랐으면 집 컴퓨터의 가족으로 올린다
        if (b.dataset.home !== '1' && E.net.status === 'on') E.register();
        home();
      };
    });
    on('#new', () => welcome(() => who(fam, locals, back)));
    on('#back', back);
    on('#link', () => linkFlow(home));
  }

  function diagIntro() {
    const name = esc(E.state().name);
    view('<div class="hero">' + dog(72) + '<div><h1>어디서부터 시작할까?</h1><div class="sub">' + name + '에게 딱 맞는 출발점 찾기</div></div></div>' +
      '<div class="card"><h2>이건 시험이 아니야</h2><ul class="plan"><li>점수를 매기지 않아. <b>어디서부터 공부하면 좋을지</b> 찾는 거야.</li><li>모르는 문제는 찍지 말고 <b>"모르겠어요"</b>를 눌러. 그래야 딱 맞는 곳에서 시작할 수 있어.</li><li>맞았는지 틀렸는지는 알려 주지 않고 바로 다음 문제로 넘어가.</li><li>25~50문제쯤이야. 중간에 ✕ 를 눌러 쉬었다가 이어서 해도 돼.</li><li>연습장과 연필을 준비하면 좋아!</li></ul><button class="btn" id="go">준비됐어!</button></div>');
    on('#go', () => { if (!E.state().diag) E.diagStart(); diagLoop(); });
  }

  async function diagLoop() {
    for (;;) {
      const id = E.diagPick();
      if (!id) break;
      const p = E.make(id, 2);
      const r = await ask(p, { mode: 'diag', prog: E.diagProgress(), label: '출발점 찾기 ' + (E.state().diag.count + 1) });
      E.diagAnswer(r.ok, r.dunno);
    }
    E.diagFinish();
    diagResult();
  }

  function diagResult() {
    const S = E.state(), cur = E.current(), c = E.counts();
    sfx.star();
    const rows = M.STRANDS.map(st => {
      const known = st.ids.filter(id => E.sk(id).stars >= 3).length;
      return '<tr><td class="l"><b>' + st.name + '</b></td><td>' + (known === st.ids.length ? '모두 알고 있어!' : known ? known + '개는 벌써 알아' : '처음부터 차근차근') + '</td></tr>';
    }).join('');
    view('<div class="hero">' + dog(72, 'hop') + '<div><h1>수고했어, ' + esc(S.name) + '!</h1><div class="sub">출발점을 찾았어</div></div></div>' +
      '<div class="card"><h2>' + (c.done ? '벌써 ' + c.done + '개 단원을 알고 있어' : '이제부터 하나씩 쌓아 가자') + '</h2><table>' + rows + '</table>' +
      (cur ? '<p>우리는 <b>' + M.byId[cur].name + '</b>부터 시작할 거야. 여기를 단단하게 만들면 그 위의 내용이 훨씬 쉬워져.</p>' : '<p>모든 단원을 알고 있네! 복습으로 실력을 지키자.</p>') +
      '<p class="mute">하루에 한 번, 15분이면 충분해. 매일 조금씩이 가장 빨라.</p><button class="btn" id="go">좋아, 가 보자!</button></div>');
    on('#go', home);
  }

  // ── 홈 ──
  function home() {
    keyHandler = null;
    // 집 컴퓨터와 막 연결됐으면 기록을 맞춰 보고, 바뀌었으면 다시 그린다
    if (E.net.pendingSync && E.net.status === 'on') E.sync().then(changed => { if (changed && (screen === 'home' || screen === 'welcome')) home(); });
    const S = E.state();
    if (!S.name) return enter();
    const net = E.net, cur0 = E.current();
    // 집 컴퓨터에 가족 기록이 있는데 이 기기의 기록은 아직 올라가지 않았을 때
    const pickCard = net.needPick && net.status === 'on' ? '<div class="card"><h2>집 컴퓨터에 가족 기록이 있어</h2><p>지금은 <b>이 기기에만 있는 기록(' + esc(S.name) + ')</b>으로 공부하고 있어. 가족 가운데 누구인지 골라 줘.</p><div class="row"><button class="btn sub" id="pickfam">가족 중에서 고르기</button><button class="btn sub" id="joinfam">이 기록을 가족으로 올리기</button></div></div>' : '';
    const netChip = net.status === 'need' ? '<button class="chip link" id="link">🔑 집 컴퓨터 연결하기</button>'
      : !E.isWeb ? '' : net.status === 'on' ? '<span class="chip">🟢 집 컴퓨터 연결됨</span>' : '<span class="chip">⚪ 집 컴퓨터 꺼짐</span>';
    const lv = E.level(), streak = E.streak(), c = E.counts();
    let body;
    if (!S.diagDone) {
      body = '<div class="card"><h2>출발점 찾기' + (S.diag ? ' 이어 하기' : '') + '</h2><p>어디서부터 공부할지 먼저 찾아보자.</p><button class="btn" id="diag">' + (S.diag ? '이어서 하기' : '시작하기') + '</button></div>';
    } else {
      const steps = E.plan(), revs = steps.filter(s => s.type === 'review'), set = steps.find(s => s.type === 'set');
      const done = E.todayDone();
      const items = (revs.length ? '<li><b>복습</b> ' + revs.map(s => M.byId[s.id].name).join(', ') + ' <span class="mute">(' + revs.length * 2 + '문제)</span></li>' : '') +
        (set ? '<li><b>' + (E.sk(set.id).sets ? '이어서' : '새 공부') + '</b> ' + M.byId[set.id].name + ' ' + stars(E.sk(set.id).stars) + ' <span class="mute">(' + E.SET_N + '문제)</span></li>' : '');
      body = '<div class="card"><h2>' + (done ? '오늘 공부 끝! 대단해 👏' : '오늘의 공부') + '</h2>' +
        (steps.length ? (done ? '<p>더 하고 싶으면 한 세트 더 해도 좋아.</p>' : '') + '<ul class="plan">' + items + '</ul><button class="btn ' + (done ? 'sub' : '') + '" id="start">' + (done ? '한 세트 더 하기' : '시작하기 ▶') + '</button>'
          : '<p>모든 단원을 끝냈고, 오늘은 복습할 것도 없어. 내일 또 만나!</p>') + '</div>';
    }
    view('<div class="hero">' + dog(72) + '<div style="flex:1"><h1>안녕, ' + esc(S.name) + '!</h1><div class="chips"><span class="chip">Lv.' + lv.lv + '</span><span class="chip">🔥 ' + streak + '일 연속</span><span class="chip">★ ' + c.done + ' / ' + c.total + '</span>' + netChip + '<button class="chip link" id="swap">👥 사람 바꾸기</button></div><div class="xpbar"><i style="width:' + Math.round(lv.cur / lv.need * 100) + '%"></i></div></div></div>' +
      pickCard + body + '<button class="btn sub" id="askfree" style="margin-bottom:16px">🙋 멍멍이 선생님께 질문하기</button>' +
      '<button class="btn sub" id="fam" style="margin-bottom:16px">👪 우리 가족 공부 현황</button>' +
      '<div class="row"><button class="btn sub" id="map">단원 지도</button><button class="btn sub" id="parent">부모님 보기</button></div>');
    screen = 'home';
    on('#swap', () => pick(home));
    on('#fam', family);
    on('#pickfam', () => pick(home));
    on('#joinfam', () => { E.register(); home(); });
    on('#diag', () => (S.diag ? diagLoop() : diagIntro()));
    on('#start', () => runPlan(E.plan()));
    on('#map', map);
    on('#parent', parent);
    on('#link', () => linkFlow(home));
    on('#askfree', () => tutor({ kind: 'free', id: cur0 || '', skill: cur0 ? M.byId[cur0].name + ' (' + gradeName(M.byId[cur0].grade) + ')' : '' }));
  }

  // ── 우리 가족 공부 현황 ──
  // 견주는 것은 수학 실력이 아니라 '꾸준히 한 만큼'이다: 이번 주에 모은 경험치와 공부한 날
  async function family() {
    keyHandler = null;
    const top = '<div class="top"><button class="x" id="back">←</button><span class="lbl" style="font-size:18px">우리 가족 공부 현황</span></div>';
    view(top + '<div class="loading">불러오는 중…</div>');
    screen = 'fam';
    on('#back', home);
    const fam = await E.family();
    if (screen !== 'fam') return;
    const S = E.state(), list = (fam || []).map(m => E.summary(m)), mine = E.summary(S), at = list.findIndex(m => m.id === S.sid);
    if (at >= 0) list[at] = mine; else list.push(mine);   // 내 것은 이 기기의 기록이 가장 새것이다
    const tag = m => esc(m.name) + (m.id === S.sid ? ' <span class="metag">나</span>' : '');
    // 이번 주 경험치: 많은 순서로 가로 막대
    const rank = list.slice().sort((a, b) => b.week - a.week), max = Math.max(1, rank[0].week);
    const bars = rank.map(m => '<div class="nm">' + (m.week > 0 && m.week === rank[0].week ? '👑 ' : '') + tag(m) + '</div><div class="bar" title="' + esc(m.name) + ': ' + m.week + ' 경험치"><i style="width:' + (m.week ? Math.max(2, Math.round(m.week / max * 100)) : 0) + '%"></i><b>' + m.week + '</b></div>').join('');
    const md = d => Number(d.slice(5, 7)) + '/' + Number(d.slice(8));
    // 최근 7일: 날마다 푼 문제 수 (많이 푼 날일수록 진하게)
    const shade = n => (n >= 20 ? 3 : n >= 10 ? 2 : n >= 1 ? 1 : 0), WD = ['일', '월', '화', '수', '목', '금', '토'];
    const head = mine.last7.map((x, i) => { const [y, mo, dd] = x.d.split('-').map(Number); return '<th' + (i === 6 ? ' class="now"' : '') + '>' + (i === 6 ? '오늘' : WD[new Date(y, mo - 1, dd).getDay()]) + '<small>' + md(x.d) + '</small></th>'; }).join('');
    const rows = list.map(m => '<tr><td class="l"><b>' + tag(m) + '</b></td>' + m.last7.map(x => '<td class="h' + shade(x.n) + '" title="' + esc(m.name) + ' ' + md(x.d) + ': ' + x.n + '문제">' + (x.n || '') + '</td>').join('') + '</tr>').join('');
    const total = M.ORDER.length;
    const stats = list.map(m => '<tr><td class="l"><b>' + tag(m) + '</b></td><td>Lv.' + m.lv + '</td><td>' + (m.streak ? '🔥 ' + m.streak + '일' : '-') + '</td><td>★ ' + m.done + ' / ' + total + '</td></tr>').join('');
    view(top +
      '<div class="card"><h2>이번 주 경험치</h2><p class="mute">월요일(' + md(E.weekStart()) + ')부터 오늘까지 공부해서 모은 경험치야. 문제를 풀 때마다 쌓여!</p>' +
      (rank[0].week ? '<div class="rank">' + bars + '</div>' : '<p>이번 주에는 아직 아무도 시작하지 않았어. 첫 번째 주인공이 되어 봐!</p>') + '</div>' +
      '<div class="card"><h2>최근 7일</h2><p class="mute">칸의 수는 그날 푼 문제 수야. 많이 푼 날일수록 색이 진해.</p><div class="scroll"><table class="heat"><tr><th></th>' + head + '</tr>' + rows + '</table></div>' +
      '<p class="mute legend"><span class="h1"></span> 1~9문제 <span class="h2"></span> 10~19문제 <span class="h3"></span> 20문제부터</p></div>' +
      '<div class="card"><h2>지금까지</h2><table><tr><th></th><th>레벨</th><th>연속 공부</th><th>끝낸 단원</th></tr>' + stats + '</table>' +
      '<p class="mute">연속 공부는 하루에 5문제부터 공부한 날로 치고, 그런 날이 며칠 이어졌는지 센 거야.</p></div>' +
      (fam ? '' : '<div class="card"><p class="mute">지금은 이 기기의 기록만 보여요. 집 컴퓨터와 연결되면 가족 모두의 기록이 보여요.</p></div>') +
      '<button class="btn sub" id="swap2">👥 사람 바꾸기</button>');
    screen = 'fam';
    on('#back', home);
    on('#swap2', () => pick(family));
  }

  // ── 공부 흐름 ──
  async function runPlan(steps) {
    const out = [], xp0 = E.state().xp;
    const total = steps.reduce((a, s) => a + (s.type === 'review' ? 2 : s.type === 'set' ? E.SET_N : 0), 0);
    let n = 0;
    const o = (label) => ({ prog: n / Math.max(1, total), label });
    for (const st of steps) {
      if (st.type === 'lesson') { await lesson(st.id, true); continue; }
      if (st.type === 'review') {
        const s = E.sk(st.id), lvs = s.est ? [2, 2] : [2, 3];
        let right = 0;
        const avoid = new Set();
        for (const lv of lvs) {
          const p = E.make(st.id, lv, avoid), r = await ask(p, Object.assign(o('복습'), { mode: 'review' }));
          E.record(p, r.ok, r.sec, r.ua); if (r.ok) right++; n++;
        }
        out.push({ type: 'review', id: st.id, res: E.finishReview(st.id, right, 2) });
        continue;
      }
      const lv = E.levelFor(st.id), avoid = new Set();
      let right = 0, extra = 0;
      const queue = []; for (let i = 0; i < E.SET_N; i++) queue.push({ p: E.make(st.id, lv, avoid), extra: false });
      for (let i = 0; i < queue.length; i++) {
        const it = queue[i], r = await ask(it.p, Object.assign(o(it.extra ? '한 번 더' : (Math.min(i, E.SET_N - 1) + 1) + ' / ' + E.SET_N), { mode: 'learn' }));
        E.record(it.p, r.ok, r.sec, r.ua);
        if (!it.extra) { n++; if (r.ok) right++; }
        // 틀린 문제는 비슷한 문제로 끝에 한 번 더 (최대 2개)
        if (!r.ok && extra < 2) { extra++; queue.push({ p: E.make(st.id, lv, avoid), extra: true }); }
      }
      out.push({ type: 'set', id: st.id, right, res: E.finishSet(st.id, right, E.SET_N) });
    }
    summary(out, E.state().xp - xp0);
  }

  function lesson(id, inPlan) {
    return new Promise(resolve => {
      const sk = M.byId[id], ex = E.make(id, 1);
      // 마지막 장은 풀이를 따라가 보는 예제
      const cards = sk.lesson.concat([{
        t: '예제로 따라가 보기',
        h: '<div class="qtext">' + ex.q + '</div>' + (ex.v ? '<div class="qvis">' + V.draw(ex.v) + '</div>' : '') +
          '<ol class="steps">' + ex.sol.filter(s => !/^답:/.test(s)).map(s => '<li>' + s + '</li>').join('') + '</ol><div class="ans">답: ' + M.ansHtml(ex.a) + '</div>',
      }]);
      let i = 0;
      const show = () => {
        const c = cards[i], last = i === cards.length - 1;
        view('<div class="top"><button class="x" id="quit">✕</button><span class="lbl">개념 · ' + sk.name + '</span></div>' +
          '<div class="dots">' + cards.map((x, k) => (k === i ? '●' : '○')).join('') + '</div>' +
          '<div class="card lesson"><h2>' + J(c.t) + '</h2><div class="body">' + J(c.h) + '</div>' + (c.v ? '<div class="qvis">' + V.draw(c.v) + '</div>' : '') + '</div>' +
          '<div class="row">' + (i ? '<button class="btn sub" id="prev">◀ 이전</button>' : '') + '<button class="btn" id="next">' + (last ? (inPlan ? '문제 풀러 가기 ▶' : '다 봤어') : '다음 ▶') + '</button></div>' +
          '<button class="btn sub" id="askt" style="margin-top:12px">🙋 이 설명이 어려우면 질문하기</button>');
        on('#askt', () => tutor({ kind: 'lesson', id, skill: sk.name + ' (' + gradeName(sk.grade) + ')', lesson: { title: M.plain(J(c.t)), text: M.plain(J(c.h)) + (c.v ? '\n(함께 보이는 그림: ' + V.describe(c.v) + ')' : '') } }));
        on('#quit', () => { keyHandler = null; home(); });
        on('#prev', () => { i--; show(); });
        const nx = () => { if (last) { keyHandler = null; E.markSeen(id); resolve(); } else { i++; show(); } };
        on('#next', nx);
        keyHandler = e => { if (e.key === 'Enter' || e.key === 'ArrowRight') nx(); else if (e.key === 'ArrowLeft' && i) { i--; show(); } };
      };
      show();
    });
  }

  function summary(out, xp) {
    const set = out.find(x => x.type === 'set'), revs = out.filter(x => x.type === 'review');
    let h = '';
    if (revs.length) {
      h += '<div class="card"><h2>복습</h2><table>' + revs.map(r => '<tr><td class="l">' + M.byId[r.id].name + '</td><td>' + (r.res.result === 'keep' ? '✔ 잘 기억하고 있어' : r.res.result === 'soon' ? '내일 한 번 더 확인할게' : '다시 연습하기로 했어') + '</td></tr>').join('') + '</table></div>';
    }
    let up = false;
    if (set) {
      const sk = M.byId[set.id], r = set.res; up = r.result === 'up';
      const msg = up ? (r.stars === 3 ? '별 세 개! 이 단원을 끝냈어 🎉' : r.stars - r.before === 2 ? '완벽해! 한 번에 별 두 개! 다음엔 가장 어려운 문제에 도전이야.' : '별 하나 획득! 다음엔 조금 더 어려운 문제가 나와.') :
        r.result === 'again' ? '아직 어려운 게 당연해. 다음엔 개념을 다시 보고 천천히 해 보자.' : '거의 다 왔어! 6문제 중 5문제를 한 번에 맞히면 별 하나, 모두 맞히면 별 두 개야.';
      h += '<div class="card center"><h2>' + sk.name + '</h2><div style="font-size:40px">' + stars(r.stars) + '</div><p><b>' + E.SET_N + '문제 중 ' + set.right + '문제</b>를 한 번에 맞혔어.</p><p>' + msg + '</p></div>';
    }
    if (up) sfx.star(); else sfx.ok();
    const next = E.plan().find(s => s.type === 'set');
    view('<div class="hero">' + dog(72, 'hop') + '<div><h1>오늘도 해냈어!</h1><div class="sub">+' + xp + ' 경험치 · 🔥 ' + E.streak() + '일 연속</div></div></div>' + h +
      (next ? '<button class="btn sub" id="more" style="margin-bottom:12px">한 세트 더 하기 (' + M.byId[next.id].name + ')</button>' : '') + '<button class="btn" id="home">처음 화면으로</button>');
    on('#home', home);
    on('#more', () => runPlan(E.plan(next.id)));
  }

  // ── 단원 지도 ──
  function map() {
    keyHandler = null;
    const cur = E.current();
    view('<div class="top"><button class="x" id="back">←</button><span class="lbl" style="font-size:18px">단원 지도</span></div>' +
      '<div class="card dark">★ 세 개를 모으면 단원 완료! 노란 테두리가 지금 배우는 곳이야.</div>' +
      M.STRANDS.map(st => '<div class="strand"><h3>' + st.name + '</h3><div class="tiles">' + st.ids.map(id => {
        const sk = M.byId[id], s = E.sk(id), lock = !E.unlocked(id) && s.stars < 3;
        return '<button class="tile ' + (lock ? 'lock ' : '') + (id === cur ? 'cur' : '') + '" data-id="' + id + '"><span class="g">' + gradeName(sk.grade) + '</span><b>' + sk.name + '</b>' + (lock ? '<span class="st">🔒 잠김</span>' : stars(s.stars)) + (s.est ? '<br><span class="st">확인 예정</span>' : '') + '</button>';
      }).join('') + '</div></div>').join(''));
    on('#back', home);
    $$('.tile').forEach(b => { b.onclick = () => skillPage(b.dataset.id); });
  }

  function skillPage(id) {
    const sk = M.byId[id], s = E.sk(id), a = E.acc(id), lock = !E.unlocked(id) && s.stars < 3;
    const need = sk.pre.filter(p => E.sk(p).stars < 2).map(p => M.byId[p].name);
    view('<div class="top"><button class="x" id="back">←</button><span class="lbl" style="font-size:18px">' + sk.name + '</span></div>' +
      '<div class="card"><div class="tag">' + gradeName(sk.grade) + '</div><h2>' + sk.name + '</h2><p>' + sk.sub + '</p><div style="font-size:30px">' + stars(s.stars) + '</div>' +
      (s.est ? '<p class="mute">출발점 찾기에서 아는 것으로 봤어. 곧 확인 문제가 나올 거야.</p>' : '') +
      (a ? '<p class="mute">지금까지 ' + a.n + '문제, 한 번에 맞힌 비율 ' + Math.round(a.rate * 100) + '%</p>' : '') +
      (lock ? '<p>🔒 먼저 <b>' + need.join(', ') + '</b> 단원에서 별 두 개를 모으면 열려.</p>' : '') +
      '<div class="row"><button class="btn sub" id="les">개념 보기</button><button class="btn" id="prac">' + (lock ? '그래도 해 보기' : '연습하기') + '</button></div></div>');
    on('#back', map);
    on('#les', () => lesson(id, false).then(() => skillPage(id)));
    on('#prac', () => runPlan(E.plan(id)));
  }

  // ── 부모님 화면 ──
  function parent() {
    keyHandler = null;
    const S = E.state(), c = E.counts(), cur = E.current(), t = E.today();
    let n7 = 0, ok7 = 0, sec7 = 0, days7 = 0;
    const dayRows = [];
    for (let i = 0; i < 14; i++) {
      const d = E.addDays(t, -i), r = S.days[d];
      if (i < 7 && r) { n7 += r.n; ok7 += r.ok; sec7 += r.sec; if (r.n >= 5) days7++; }
      if (r) dayRows.push('<tr><td>' + d.slice(5).replace('-', '/') + '</td><td>' + r.n + '</td><td>' + (r.n ? Math.round(r.ok / r.n * 100) + '%' : '-') + '</td><td>' + Math.max(1, Math.round(r.sec / 60)) + '분</td></tr>');
    }
    const status = id => { const s = E.sk(id); return s.stars >= 3 ? (s.est ? 'est' : 'done') : (s.stars > 0 || s.sets > 0) ? 'going' : 'none'; };
    const mark = { done: '★', est: '○', going: '▶', none: '·' };
    const strands = M.STRANDS.map(st => '<tr><td class="l" style="width:26%"><b>' + st.name + '</b></td><td class="l">' + st.ids.map(id => '<span class="sk ' + status(id) + '">' + mark[status(id)] + ' ' + M.byId[id].name + '</span>').join('') + '</td></tr>').join('');
    const weak = M.ORDER.map(id => ({ id, a: E.acc(id) })).filter(x => x.a && x.a.n >= 6 && x.a.rate < 0.7).sort((x, y) => x.a.rate - y.a.rate).slice(0, 5);
    const wrong = S.wrong.slice(0, 15).map(w => '<div class="wrongitem"><span class="tag">' + M.byId[w.id].name + '</span> <span class="mute">' + new Date(w.t).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }) + '</span><div>' + J(w.q) + '</div>' + (w.v ? '<div class="qvis">' + V.draw(w.v) + '</div>' : '') + '<div>아이의 답: <b>' + (w.ua ? esc(w.ua) : '모르겠어요') + '</b> &nbsp;→&nbsp; 정답: ' + w.ca + '</div></div>').join('');
    const net = E.net;
    const netText = net.status === 'on' ? (E.isWeb ? '집 컴퓨터와 연결됨. 공부 기록이 집 컴퓨터에도 저장되어 다른 기기와 이어집니다.' : '이 컴퓨터의 study-app/data 폴더 (다른 기기에서 열어도 이어집니다)')
      : net.status === 'need' ? '집 컴퓨터가 켜져 있지만 이 기기에는 아직 접속 암호를 넣지 않았어요. 지금은 이 기기에만 저장됩니다.'
        : '집 컴퓨터에 닿지 않아 지금은 이 기기에만 저장 중입니다. 다시 닿으면 자동으로 이어집니다.';
    const asks = (S.asks || []).slice(0, 12).map(a => '<div class="wrongitem"><span class="mute">' + new Date(a.t).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }) + (a.id && M.byId[a.id] ? ' · ' + M.byId[a.id].name : '') + '</span><div><b>질문</b> ' + esc(a.q) + '</div><div class="tans"><b>답</b> ' + fmtTutor(a.a) + '</div></div>').join('');
    const failedLow = S.diagDone ?M.ORDER.filter(id => String(E.sk(id).diag || '').startsWith('fail')) : [];
    const lowest = failedLow.length ? M.byId[failedLow[0]] : null;

    view('<div class="top"><button class="x" id="back">←</button><span class="lbl" style="font-size:18px">부모님 보기</span></div>' +
      '<div class="card"><h2>' + esc(S.name) + '의 공부 요약</h2><div class="kv"><div><b>' + c.done + ' / ' + c.total + '</b><span>끝낸 단원</span></div><div><b>' + days7 + '일</b><span>최근 7일 공부한 날</span></div><div><b>' + (n7 ? Math.round(ok7 / n7 * 100) + '%' : '-') + '</b><span>최근 7일 정답률</span></div></div>' +
      '<p>' + (S.diagDone ? (cur ? '지금 배우는 곳: <b>' + gradeName(M.byId[cur].grade) + ' · ' + M.byId[cur].name + '</b>' : '모든 단원을 끝냈어요.') : '아직 출발점 찾기(진단)를 끝내지 않았어요.') + '</p>' +
      (lowest ? '<p class="mute">진단에서 처음 막힌 곳은 <b>' + gradeName(lowest.grade) + ' ' + lowest.name + '</b>이에요. 6학년 내용이 어려운 것은 대개 이 아래 학년의 빈틈 때문이라, 앱은 여기서부터 차례로 채워 올라갑니다.</p>' : '') +
      '<p class="mute">최근 7일: ' + n7 + '문제, 약 ' + Math.round(sec7 / 60) + '분</p></div>' +

      '<div class="card"><h2>단원별 상태</h2><p class="mute"><span class="sk done">★ 끝냄</span><span class="sk est">○ 진단에서 아는 것으로 봄 (확인 예정)</span><span class="sk going">▶ 배우는 중</span><span class="sk none">· 아직</span></p><table>' + strands + '</table></div>' +

      '<div class="card"><h2>날짜별 기록</h2>' + (dayRows.length ? '<table><tr><th>날짜</th><th>문제 수</th><th>한 번에 맞힘</th><th>시간</th></tr>' + dayRows.join('') + '</table>' : '<p class="mute">아직 기록이 없어요.</p>') + '</div>' +

      '<div class="card"><h2>어려워하는 단원</h2>' + (weak.length ? '<table><tr><th>단원</th><th>푼 문제</th><th>한 번에 맞힘</th></tr>' + weak.map(x => '<tr><td class="l">' + M.byId[x.id].name + '</td><td>' + x.a.n + '</td><td>' + Math.round(x.a.rate * 100) + '%</td></tr>').join('') + '</table><p class="mute">이 단원은 옆에서 "개념 보기"를 함께 읽어 주시면 도움이 됩니다.</p>' : '<p class="mute">아직 눈에 띄게 어려워하는 단원이 없어요. (6문제 이상 푼 단원 중 정답률 70% 미만)</p>') + '</div>' +

      '<div class="card"><h2>최근 틀린 문제</h2>' + (wrong || '<p class="mute">아직 없어요.</p>') + '</div>' +

      '<div class="card"><h2>이렇게 도와주세요</h2><ul class="plan tips"><li><b>매일 15분</b>이 주 1회 2시간보다 훨씬 효과적입니다. 같은 시간에 하도록 정해 주세요.</li><li>점수보다 <b>"어제 못 하던 걸 오늘 했다"</b>를 칭찬해 주세요. 15점은 머리가 나빠서가 아니라 앞 학년의 빈틈이 쌓인 결과입니다.</li><li>틀린 문제는 답을 알려 주기보다 <b>"어떻게 생각했어?"</b>라고 물어봐 주세요. 어디서 헷갈렸는지가 드러납니다.</li><li>아래 학년 내용부터 시작해도 아이가 창피해하지 않도록, <b>"기초 공사 중"</b>이라고 말해 주세요.</li><li>연습장에 직접 써서 풀도록 해 주세요. 암산으로만 하면 실수가 줄지 않습니다.</li></ul></div>' +

      '<div class="card"><h2>선생님께 한 질문</h2><p class="mute">아이가 "질문하기"를 누르면 집 컴퓨터의 Claude Code가 답합니다. 집 컴퓨터가 켜져 있을 때만 되고, 주고받은 내용은 여기에 남습니다.' + (net.status === 'on' ? ' 오늘 남은 질문 횟수: ' + net.tutor.left + '번' : '') + '</p>' + (asks || '<p class="mute">아직 없어요.</p>') + '</div>' +

      (net.code ? '<div class="card"><h2>집 밖에서 쓰기</h2><p>웹 주소: <b>' + esc(net.site || '(아직 웹에 올리지 않음)') + '</b></p><p>접속 암호: <b style="font-size:22px;letter-spacing:2px">' + esc(String(net.code).replace(/(\d{4})(?=\d)/g, '$1 ')) + '</b></p><p class="mute">아이 기기에서 웹 주소를 열고 "집 컴퓨터 연결"에 이 암호를 한 번만 넣으면, 기록이 이어지고 질문하기를 쓸 수 있어요. 이 칸은 집 컴퓨터에서 직접 열었을 때만 보입니다. 이 컴퓨터가 켜져 있고 앱(start.bat)이 실행 중일 때만 연결됩니다.</p></div>' : '') +

      '<div class="card"><h2>설정</h2><p class="mute">저장 위치: ' + netText + '</p>' +
      (net.status === 'need' ? '<button class="btn sub" id="link" style="margin-bottom:12px">집 컴퓨터 연결하기 (접속 암호)</button>' : net.status === 'off' ? '<button class="btn sub" id="retry" style="margin-bottom:12px">집 컴퓨터에 다시 연결해 보기</button>' : '') +
      '<div class="row"><button class="btn sub" id="snd">소리: ' + (S.settings.sound ? '켜짐' : '꺼짐') + '</button><button class="btn sub" id="rename">이름 바꾸기</button></div><br><div class="row"><button class="btn sub" id="rediag">진단 다시 하기</button><button class="btn sub" id="reset">이 사람의 기록 지우기</button></div></div>');
    on('#back', home);
    on('#link', () => linkFlow(parent));
    on('#retry', () => { $('#retry').textContent = '연결하는 중…'; E.connect(true).then(() => (E.net.status === 'on' ? E.sync() : null)).then(parent); });
    on('#snd', () => { S.settings.sound = !S.settings.sound; E.save(); parent(); });
    on('#rename', () => { const n = prompt('이름', S.name); if (n && n.trim()) { S.name = n.trim().slice(0, 8); E.save(); parent(); } });
    on('#rediag', () => { if (confirm('진단을 다시 하면 단원별 별과 복습 일정이 진단 결과로 새로 정해집니다. 날짜별 기록은 남습니다. 다시 할까요?')) { S.diag = null; S.diagDone = false; E.save(); diagIntro(); } });
    on('#reset', () => { if (confirm(S.name + '의 공부 기록을 모두 지웁니다. 다른 가족의 기록은 그대로 남아요. 정말 지울까요?')) E.removeMember().then(home); });
  }

  window.__app = { home, ask, runPlan, parent, map, tutor, linkFlow, pick, family };
  E.onNet = () => { if (screen === 'home' || screen === 'welcome') home(); };   // 연결 상태가 바뀌면 첫 화면을 다시 그린다
  E.load().then(home);
})();
