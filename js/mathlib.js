// 수학 도구: 난수, 분수, 소수 표기, 답 맞춰 보기
(function (g) {
  'use strict';
  const M = { skills: [], byId: {} };

  M.rng = function (seed) {
    let s = (seed >>> 0) || 1;
    const f = () => {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
      f,
      int: (a, b) => a + Math.floor(f() * (b - a + 1)),
      pick: a => a[Math.floor(f() * a.length)],
      chance: p => f() < p,
      shuffle(a) {
        a = a.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
      },
    };
  };

  M.gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  M.lcm = (a, b) => a / M.gcd(a, b) * b;
  M.simp = (n, d) => { const k = M.gcd(n, d) || 1; return [n / k, d / k]; };
  M.divisors = n => { const r = []; for (let i = 1; i <= n; i++) if (n % i === 0) r.push(i); return r; };

  // 화면에 쓰는 모양
  M.F = (n, d) => '<span class="fr"><b>' + n + '</b><b>' + d + '</b></span>';
  M.MX = (w, n, d) => '<span class="mx">' + w + M.F(n, d) + '</span>';
  // 있는 그대로 (가분수면 대분수로, 약분은 하지 않음)
  M.raw = (n, d) => (n % d === 0 ? String(n / d) : n > d ? M.MX(Math.floor(n / d), n % d, d) : M.F(n, d));
  // 기약분수 · 대분수로
  M.show = (n, d) => { [n, d] = M.simp(n, d); return M.raw(n, d); };
  // 정수 i 를 소수 p 자리 수로: D(37, 2) = "0.37"
  M.D = (i, p) => {
    const s = String(Math.abs(i)).padStart(p + 1, '0');
    const a = s.slice(0, s.length - p), b = s.slice(s.length - p).replace(/0+$/, '');
    return (i < 0 ? '-' : '') + a + (b ? '.' + b : '');
  };
  M.E = s => '<div class="expr">' + s + '</div>';
  // "47 을(를)" → "47을" : 수 뒤의 조사를 읽는 소리에 맞게 고른다
  // 분수는 분자를 마지막에 읽으므로("사분의 삼을") 분자의 끝 숫자로 고른다
  const PART = '(을\\(를\\)|이\\(가\\)|은\\(는\\)|과\\(와\\)|\\(으\\)로)';
  const pickJosa = (dg, p) => {
    const bat = '013678'.includes(dg), rieul = '178'.includes(dg);
    return { '을(를)': bat ? '을' : '를', '이(가)': bat ? '이' : '가', '은(는)': bat ? '은' : '는', '과(와)': bat ? '과' : '와', '(으)로': bat && !rieul ? '으로' : '로' }[p];
  };
  const RE_FRAC = new RegExp('(<span class="fr"><b>[^<]*?(\\d)<\\/b><b>[^<]*<\\/b><\\/span>(?:<\\/span>)?)\\s*' + PART, 'g');
  const RE_NUM = new RegExp('(\\d)((?:<\\/b>|\\s)*)' + PART, 'g');
  M.josa = s => String(s)
    .replace(RE_FRAC, (m, frac, dg, p) => frac + pickJosa(dg, p))
    .replace(RE_NUM, (m, dg, mid, p) => dg + mid.replace(/\s+/g, '') + pickJosa(dg, p));

  // 화면용 글(HTML)을 보통 글로: 분수는 3/4, 대분수는 "1과 3/4" (선생님께 질문할 때 문제 내용을 넘기는 데 쓴다)
  M.plain = s => String(s == null ? '' : s)
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<div class="colcalc">[\s\S]*?<\/div><\/div>/g, ' ')
    .replace(/<span class="mx">(\d+)<span class="fr"><b>([^<]*)<\/b><b>([^<]*)<\/b><\/span><\/span>/g, (m, w, n, d) => w + pickJosa(w.slice(-1), '과(와)') + ' ' + n + '/' + d)
    .replace(/<span class="fr"><b>([^<]*)<\/b><b>([^<]*)<\/b><\/span>/g, '$1/$2')
    .replace(/<br\s*\/?>/g, '\n').replace(/<\/(div|li|p)>/g, '\n').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ').replace(/ ?\n\s*/g, '\n').trim();

  // 답의 모양
  M.N =(v, o) => Object.assign({ n: String(v) }, o);                 // 수 하나
  M.FR = (n, d, o) => Object.assign({ f: [n, d], form: 'any' }, o);    // 분수 (form: any · simplest · mixed · improper)
  M.P = (parts, o) => Object.assign({ parts }, o);                     // 여러 칸
  M.C = (c, i, o) => Object.assign({ c, i }, o);                       // 고르기

  // 답 맞춰 보기 → { ok } · { ok:false, near:'거의 맞음 안내' } · { ok:false, empty:true }
  M.check = function (spec, inp) {
    if (spec.c) return inp == null ? { ok: false, empty: true } : { ok: inp === spec.i };
    if (spec.parts) {
      const rs = spec.parts.map((p, k) => M.check(p, inp[k]));
      if (rs.some(r => r.empty)) return { ok: false, empty: true };
      if (rs.every(r => r.ok)) return { ok: true };
      const bad = rs.filter(r => !r.ok);
      return bad.every(r => r.near) ? { ok: false, near: bad[0].near } : { ok: false };
    }
    if (spec.n != null) {
      const s = String(inp == null ? '' : inp).trim();
      if (s === '') return { ok: false, empty: true };
      if (!/^\d+(\.\d+)?$/.test(s)) return { ok: false };
      return { ok: Math.abs(parseFloat(s) - Number(spec.n)) < 1e-9 };
    }
    // 분수
    const [an, ad] = spec.f;
    const ws = String(inp.w || '').trim(), ns = String(inp.n || '').trim(), ds = String(inp.d || '').trim();
    let w = ws === '' ? 0 : +ws, n, d;
    if (ns === '' && ds === '') { if (ws === '') return { ok: false, empty: true }; n = 0; d = 1; }
    else if (ns === '' || ds === '') return { ok: false, empty: true };
    else if (+ds === 0) return { ok: false, empty: true, msg: '분모는 0이 될 수 없어.' };
    else { n = +ns; d = +ds; }
    if ((w * d + n) * ad !== an * d) return { ok: false };
    const whole = an % ad === 0;
    if (spec.form === 'improper') {
      if (w !== 0 || ns === '') return { ok: false, near: '값은 맞았어! 가분수(분자가 더 큰 분수)로 써 줘.' };
    } else if (spec.form === 'mixed') {
      if (!whole && (w < 1 || n >= d)) return { ok: false, near: '값은 맞았어! 대분수(자연수와 진분수)로 써 줘.' };
    } else if (spec.form === 'simplest') {
      if (n > 0 && M.gcd(n, d) > 1) return { ok: false, near: '값은 맞았어! 약분을 끝까지 해서 다시 써 줘.' };
      if (w > 0 && n >= d) return { ok: false, near: '값은 맞았어! 대분수는 분수 부분이 진분수여야 해.' };
    }
    return { ok: true };
  };

  // 정답을 화면에 보여 줄 모양
  M.ansHtml = function (spec) {
    if (spec.c) return String(spec.c[spec.i]).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (spec.parts) return spec.parts.map(p => M.ansHtml(p)).join(spec.sep || ', ');
    if (spec.n != null) return (spec.pre ? spec.pre + ' ' : '') + (spec.frac ? M.F(spec.n, spec.frac) : '<b>' + spec.n + '</b>') + (spec.post ? ' ' + spec.post : '');
    const [n, d] = spec.f;
    let s;
    if (spec.form === 'improper') s = M.F(n, d);
    else if (spec.form === 'simplest') s = M.show(n, d);
    else s = M.raw(n, d);
    return (spec.pre ? spec.pre + ' ' : '') + s + (spec.post ? ' ' + spec.post : '');
  };

  // 시험용: 정답을 입력 모양으로
  M.perfect = function (spec) {
    if (spec.c) return spec.i;
    if (spec.parts) return spec.parts.map(M.perfect);
    if (spec.n != null) return spec.n;
    let [n, d] = spec.f;
    if (spec.form === 'simplest') [n, d] = M.simp(n, d);
    if (n % d === 0) return { w: String(n / d), n: '', d: '' };
    if (spec.form === 'improper' || n < d) return { w: '', n: String(n), d: String(d) };
    return { w: String(Math.floor(n / d)), n: String(n % d), d: String(d) };
  };

  M.skill = def => { M.skills.push(def); M.byId[def.id] = def; };

  // 갈래 (진단 순서이기도 하다)
  M.STRANDS = [
    { id: 'nat', name: '자연수 계산', mode: 'bin', start: 3, ids: ['add3', 'sub3', 'times', 'mul21', 'div1', 'mul22', 'divrem', 'div2', 'order'] },
    { id: 'fac', name: '약수와 배수', mode: 'bin', start: 0, ids: ['factors', 'gcd', 'lcm'] },
    { id: 'frac', name: '분수', mode: 'bin', start: 2, ids: ['fracmean', 'fraccmp1', 'fracconv', 'fracadd1', 'equiv', 'common', 'fracadd2', 'fracmul', 'fracdiv'] },
    { id: 'dec', name: '소수', mode: 'bin', start: 1, ids: ['decmean', 'decadd', 'fracdec', 'decmul', 'decdiv'] },
    { id: 'ratio', name: '비와 비율', mode: 'bin', start: 0, ids: ['ratio', 'percent', 'prop'] },
    { id: 'shape', name: '각과 도형', mode: 'lin', start: 0, ids: ['angle', 'tri', 'quad'] },
    { id: 'geo', name: '넓이 · 부피 · 평균', mode: 'lin', start: 0, ids: ['rect', 'triarea', 'avg', 'volume', 'circle'] },
    { id: 'pat', name: '규칙과 어림', mode: 'lin', start: 0, ids: ['corr', 'range', 'round'] },
  ];
  // 배우는 순서 (교과서 차례를 따른다: 각도는 4-1, 삼각형 · 사각형은 4-2, 규칙과 대응은 5-1 약수와 배수 다음, 수의 범위와 어림하기는 5-2 첫 단원)
  M.ORDER = ['add3', 'sub3', 'times', 'mul21', 'div1', 'fracmean', 'fraccmp1', 'mul22', 'divrem', 'decmean', 'fracconv',
    'div2', 'angle', 'fracadd1', 'decadd', 'tri', 'quad', 'order', 'factors', 'gcd', 'lcm', 'corr', 'equiv', 'common', 'fracdec', 'fracadd2', 'rect',
    'triarea', 'range', 'round', 'fracmul', 'decmul', 'avg', 'fracdiv', 'decdiv', 'ratio', 'percent', 'volume', 'prop', 'circle'];

  g.M = M;
  if (typeof module !== 'undefined') module.exports = M;
})(typeof window !== 'undefined' ? window : globalThis);
