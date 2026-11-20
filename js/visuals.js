// 그림: 분수 막대 · 원 · 점 묶음 · 수직선 · 세로셈 · 도형 · 대응표 · 수의 범위
(function (g) {
  'use strict';
  const V = {};
  const INK = '#23284d', FILL = '#3fa7ff', SOFT = '#dcecff', PAPER = '#ffffff', ACC = '#19b394';
  const svg = (w, h, body) => '<svg class="vis" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">' + body + '</svg>';
  const txt = (x, y, s, o) => '<text x="' + x + '" y="' + y + '" font-size="' + ((o && o.size) || 15) + '" font-weight="700" text-anchor="' + ((o && o.anchor) || 'middle') + '" fill="' + ((o && o.fill) || INK) + '">' + s + '</text>';

  // 분수 막대: d 칸 가운데 n 칸 색칠 (1보다 크면 막대 여러 개)
  V.bar = function (n, d) {
    const bars = Math.max(1, Math.ceil(n / d)), W = 280, H = 34, gap = 10;
    let b = '';
    for (let k = 0; k < bars; k++) {
      const y = 4 + k * (H + gap), cw = W / d;
      for (let i = 0; i < d; i++) {
        b += '<rect x="' + (10 + i * cw) + '" y="' + y + '" width="' + cw + '" height="' + H + '" fill="' + (k * d + i < n ? FILL : PAPER) + '" stroke="' + INK + '" stroke-width="2"/>';
      }
    }
    return svg(300, 8 + bars * (H + gap) - gap, b);
  };

  // 두 분수 막대를 위아래로 견주기
  V.bars2 = function (n1, d1, n2, d2) {
    const W = 280, H = 30;
    let b = '';
    [[n1, d1, 4], [n2, d2, 46]].forEach(([n, d, y]) => {
      const cw = W / d;
      for (let i = 0; i < d; i++) b += '<rect x="' + (10 + i * cw) + '" y="' + y + '" width="' + cw + '" height="' + H + '" fill="' + (i < n ? FILL : PAPER) + '" stroke="' + INK + '" stroke-width="2"/>';
    });
    return svg(300, 82, b);
  };

  // 원 분수
  V.pie = function (n, d) {
    const cx = 70, cy = 70, r = 60;
    let b = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="2"/>';
    for (let i = 0; i < d; i++) {
      const a0 = -Math.PI / 2 + i * 2 * Math.PI / d, a1 = a0 + 2 * Math.PI / d;
      const p = a => (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1);
      b += '<path d="M' + cx + ' ' + cy + ' L' + p(a0) + ' A' + r + ' ' + r + ' 0 0 1 ' + p(a1) + ' Z" fill="' + (i < n ? FILL : PAPER) + '" stroke="' + INK + '" stroke-width="2"/>';
    }
    return svg(140, 140, b);
  };

  // 점 total 개를 groups 묶음으로, 앞의 shade 묶음은 색칠
  // rest: 묶음에 못 들어가고 남은 점 수 (나머지)
  V.dots = function (total, groups, shade, rest) {
    const per = total / groups, cols = Math.min(per, per > 6 ? Math.ceil(per / 2) : per), rows = Math.ceil(per / cols);
    const cells = groups + (rest ? 1 : 0);
    const gw = cols * 18 + 10, gh = rows * 18 + 10, perRow = Math.max(1, Math.min(cells, Math.floor(290 / (gw + 6))));
    let b = '';
    if (rest) {
      const gx = 5 + (groups % perRow) * (gw + 6), gy = 4 + Math.floor(groups / perRow) * (gh + 6);
      for (let i = 0; i < rest; i++) b += '<circle cx="' + (gx + 14 + (i % cols) * 18) + '" cy="' + (gy + 14 + Math.floor(i / cols) * 18) + '" r="6" fill="#ffd23f" stroke="' + INK + '" stroke-width="2"/>';
    }
    for (let k = 0; k < groups; k++) {
      const gx = 5 + (k % perRow) * (gw + 6), gy = 4 + Math.floor(k / perRow) * (gh + 6);
      b += '<rect x="' + gx + '" y="' + gy + '" width="' + gw + '" height="' + gh + '" rx="4" fill="' + (k < shade ? SOFT : PAPER) + '" stroke="' + INK + '" stroke-width="2"/>';
      for (let i = 0; i < per; i++) {
        b += '<circle cx="' + (gx + 14 + (i % cols) * 18) + '" cy="' + (gy + 14 + Math.floor(i / cols) * 18) + '" r="6" fill="' + (k < shade ? FILL : '#b8bfd6') + '"/>';
      }
    }
    const rowsG = Math.ceil(cells / perRow);
    return svg(Math.min(300, 10 + perRow * (gw + 6)), 8 + rowsG * (gh + 6), b);
  };

  // 곱셈 점 배열 r 줄 × c 개
  V.array = function (r, c) {
    let b = '';
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) b += '<circle cx="' + (14 + x * 24) + '" cy="' + (14 + y * 24) + '" r="8" fill="' + FILL + '" stroke="' + INK + '" stroke-width="1.5"/>';
    return svg(4 + c * 24, 4 + r * 24, b);
  };

  // 수직선: lo~hi 를 n 칸으로, marks = [[값, 글자]]
  V.line = function (lo, hi, n, marks) {
    const x0 = 20, x1 = 280, y = 34, X = v => x0 + (v - lo) / (hi - lo) * (x1 - x0);
    let b = '<line x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y + '" stroke="' + INK + '" stroke-width="2.5"/>';
    for (let i = 0; i <= n; i++) {
      const x = x0 + i * (x1 - x0) / n, big = i === 0 || i === n;
      b += '<line x1="' + x + '" y1="' + (y - (big ? 9 : 6)) + '" x2="' + x + '" y2="' + (y + (big ? 9 : 6)) + '" stroke="' + INK + '" stroke-width="2"/>';
    }
    b += txt(x0, y + 26, lo) + txt(x1, y + 26, hi);
    (marks || []).forEach(([v, s]) => {
      b += '<circle cx="' + X(v) + '" cy="' + y + '" r="6" fill="' + FILL + '" stroke="' + INK + '" stroke-width="2"/>' + txt(X(v), y - 14, s, { fill: '#1565c0' });
    });
    return svg(300, 66, b);
  };

  // 세로셈
  V.col = function (op, a, b, res) {
    return '<div class="colcalc"><div>' + a + '</div><div><i>' + op + '</i>' + b + '</div><div class="ln">' + (res == null ? '&nbsp;' : res) + '</div></div>';
  };

  // 도형
  const fit = (w, h, maxW, maxH) => { const k = Math.min(maxW / w, maxH / h); return [Math.max(40, w * k), Math.max(34, h * k)]; };
  V.rect = function (w, h, lw, lh) {
    const [W, H] = fit(w, h, 190, 110), x = 60, y = 12;
    return svg(300, H + 46, '<rect x="' + x + '" y="' + y + '" width="' + W + '" height="' + H + '" fill="' + SOFT + '" stroke="' + INK + '" stroke-width="2.5"/>' +
      txt(x + W / 2, y + H + 22, lw) + txt(x - 8, y + H / 2 + 5, lh, { anchor: 'end' }));
  };
  // ㄱ자 도형: 큰 W×H 에서 오른쪽 위 w×h 를 뺀 모양. 글자: 아래, 왼쪽, 위, 오른쪽 아래
  V.lshape = function (W, H, w, h, labels) {
    const k = Math.min(190 / W, 120 / H), x = 60, y = 26, PW = W * k, PH = H * k, pw = w * k, ph = h * k;
    const pts = [[x, y], [x + PW - pw, y], [x + PW - pw, y + ph], [x + PW, y + ph], [x + PW, y + PH], [x, y + PH]].map(p => p.join(',')).join(' ');
    return svg(300, PH + 60, '<polygon points="' + pts + '" fill="' + SOFT + '" stroke="' + INK + '" stroke-width="2.5"/>' +
      txt(x + PW / 2, y + PH + 22, labels[0]) + txt(x - 8, y + PH / 2 + 5, labels[1], { anchor: 'end' }) +
      txt(x + (PW - pw) / 2, y - 8, labels[2]) + txt(x + PW + 6, y + ph + (PH - ph) / 2 + 5, labels[3], { anchor: 'start' }));
  };
  const dash = (x1, y1, x2, y2) => '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + ACC + '" stroke-width="2.5" stroke-dasharray="5 4"/>';
  V.para = function (b, h, lb, lh) {
    const [W, H] = fit(b, h, 160, 100), x = 50, y = 12, sk = 34;
    const pts = [[x + sk, y], [x + sk + W, y], [x + W, y + H], [x, y + H]].map(p => p.join(',')).join(' ');
    return svg(300, H + 46, '<polygon points="' + pts + '" fill="' + SOFT + '" stroke="' + INK + '" stroke-width="2.5"/>' + dash(x + sk, y, x + sk, y + H) +
      txt(x + W / 2, y + H + 22, lb) + txt(x + sk + 8, y + H / 2 + 5, lh, { anchor: 'start', fill: '#0c7f68' }));
  };
  V.tri = function (b, h, lb, lh) {
    const [W, H] = fit(b, h, 180, 100), x = 50, y = 12, ax = x + W * 0.62;
    const pts = [[ax, y], [x + W, y + H], [x, y + H]].map(p => p.join(',')).join(' ');
    return svg(300, H + 46, '<polygon points="' + pts + '" fill="' + SOFT + '" stroke="' + INK + '" stroke-width="2.5"/>' + dash(ax, y, ax, y + H) +
      txt(x + W / 2, y + H + 22, lb) + txt(ax - 7, y + H * 0.72, lh, { anchor: 'end', fill: '#0c7f68', size: 13 }));
  };
  V.trap = function (a, b, h, la, lb, lh) {
    const k = Math.min(180 / b, 100 / h), W = b * k, T = a * k, H = Math.max(50, h * k), x = 50, y = 24, off = (W - T) * 0.3;
    const pts = [[x + off, y], [x + off + T, y], [x + W, y + H], [x, y + H]].map(p => p.join(',')).join(' ');
    return svg(300, H + 58, '<polygon points="' + pts + '" fill="' + SOFT + '" stroke="' + INK + '" stroke-width="2.5"/>' + dash(x + off, y, x + off, y + H) +
      txt(x + off + T / 2, y - 7, la) + txt(x + W / 2, y + H + 22, lb) + txt(x + off + 8, y + H / 2 + 5, lh, { anchor: 'start', fill: '#0c7f68' }));
  };
  // 원: kind 'r' 반지름 · 'd' 지름
  V.circ = function (kind, label) {
    const cx = 150, cy = 66, r = 56;
    let b = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + SOFT + '" stroke="' + INK + '" stroke-width="2.5"/><circle cx="' + cx + '" cy="' + cy + '" r="3.5" fill="' + INK + '"/>';
    if (kind === 'r') b += dash(cx, cy, cx + r, cy) + txt(cx + r / 2, cy - 8, label, { fill: '#0c7f68' });
    else b += dash(cx - r, cy, cx + r, cy) + txt(cx, cy - 8, label, { fill: '#0c7f68' });
    return svg(300, 132, b);
  };
  // 직육면체
  V.box = function (la, lb, lc) {
    const x = 70, y = 40, W = 130, H = 70, dx = 40, dy = 26;
    const P = (a, b) => a + ',' + b;
    return svg(300, 150,
      '<polygon points="' + [P(x, y), P(x + dx, y - dy), P(x + dx + W, y - dy), P(x + W, y)].join(' ') + '" fill="#eef5ff" stroke="' + INK + '" stroke-width="2.5"/>' +
      '<polygon points="' + [P(x + W, y), P(x + dx + W, y - dy), P(x + dx + W, y - dy + H), P(x + W, y + H)].join(' ') + '" fill="#c5dcf7" stroke="' + INK + '" stroke-width="2.5"/>' +
      '<rect x="' + x + '" y="' + y + '" width="' + W + '" height="' + H + '" fill="' + SOFT + '" stroke="' + INK + '" stroke-width="2.5"/>' +
      txt(x + W / 2, y + H + 22, la) + txt(x + W + dx / 2 + 14, y + H - dy / 2 + 14, lb, { anchor: 'start', size: 13 }) + txt(x - 8, y + H / 2 + 5, lc, { anchor: 'end' }));
  };

  // 대응표: 위 줄(la)과 아래 줄(lb)의 짝. 값이 '?' 인 칸은 노랗게
  V.table = function (la, lb, xs, ys) {
    const tw = s => String(s).split('').reduce((a, c) => a + (c.charCodeAt(0) > 0x2E80 ? 13 : 7.5), 0);
    const lw = Math.max(70, Math.min(124, 14 + Math.max(tw(la), tw(lb)))), H = 36, cw = (296 - lw) / xs.length;
    let b = '';
    [[la, xs], [lb, ys]].forEach(([label, vals], r) => {
      const y = 2 + r * H;
      b += '<rect x="2" y="' + y + '" width="' + lw + '" height="' + H + '" fill="' + SOFT + '" stroke="' + INK + '" stroke-width="2"/>' + txt(2 + lw / 2, y + H / 2 + 5, label, { size: 13 });
      vals.forEach((v, i) => {
        const x = 2 + lw + i * cw, q = v === '?';
        b += '<rect x="' + x + '" y="' + y + '" width="' + cw + '" height="' + H + '" fill="' + (q ? '#ffd23f' : PAPER) + '" stroke="' + INK + '" stroke-width="2"/>' + txt(x + cw / 2, y + H / 2 + 5, v, { size: String(v).length > 3 ? 12 : 15 });
      });
    });
    return svg(300, 2 * H + 4, b);
  };

  // 수의 범위: lo~hi 수직선(한 칸에 1)에 a 부터 b 까지 표시. a 나 b 가 null 이면 그쪽으로 끝없이 뻗는다
  // ia · ib: 끝의 수가 들어가는가 (들어가면 색칠한 점 ●, 아니면 빈 점 ○)
  V.range = function (lo, hi, a, b, ia, ib) {
    const x0 = 26, x1 = 274, y = 46, up = y - 20, X = v => x0 + (v - lo) / (hi - lo) * (x1 - x0), wide = String(hi).length > 2;
    let s = '<line x1="' + (x0 - 14) + '" y1="' + y + '" x2="' + (x1 + 14) + '" y2="' + y + '" stroke="' + INK + '" stroke-width="2.5"/>';
    for (let v = lo; v <= hi; v++) {
      const end = v === a || v === b;
      s += '<line x1="' + X(v) + '" y1="' + (y - 6) + '" x2="' + X(v) + '" y2="' + (y + 6) + '" stroke="' + INK + '" stroke-width="2"/>' +
        txt(X(v), y + 24, v, end ? { size: wide ? 13 : 15 } : { size: wide ? 10 : 12, fill: '#6a6f94' });
    }
    const xa = a == null ? x0 - 14 : X(a), xb = b == null ? x1 + 14 : X(b);
    const pts = (a == null ? [] : [[xa, y]]).concat([[xa, up], [xb, up]], b == null ? [] : [[xb, y]]).map(p => p.join(',')).join(' ');
    s += '<polyline points="' + pts + '" fill="none" stroke="' + FILL + '" stroke-width="5" stroke-linejoin="round"/>';
    if (a == null) s += '<polygon points="' + [[xa - 9, up], [xa + 1, up - 7], [xa + 1, up + 7]].map(p => p.join(',')).join(' ') + '" fill="' + FILL + '"/>';
    if (b == null) s += '<polygon points="' + [[xb + 9, up], [xb - 1, up - 7], [xb - 1, up + 7]].map(p => p.join(',')).join(' ') + '" fill="' + FILL + '"/>';
    const dot = (x, inc) => '<circle cx="' + x + '" cy="' + y + '" r="6.5" fill="' + (inc ? FILL : PAPER) + '" stroke="' + INK + '" stroke-width="2.5"/>';
    if (a != null) s += dot(xa, ia);
    if (b != null) s += dot(xb, ib);
    return svg(300, 78, s);
  };

  // 그림을 말로 (선생님께 질문할 때 그림 내용을 넘기는 데 쓴다)
  V.describe = function (v) {
    if (!v) return '';
    const a = v.slice(1);
    switch (v[0]) {
      case 'bar': case 'pie': return '전체를 똑같이 ' + a[1] + '칸으로 나눈 ' + (v[0] === 'pie' ? '원' : '막대') + ' 그림에서 ' + a[0] + '칸이 색칠되어 있음' + (a[0] > a[1] ? ' (막대가 여러 개)' : '');
      case 'bars2': return '위 막대는 ' + a[1] + '칸 중 ' + a[0] + '칸, 아래 막대는 ' + a[3] + '칸 중 ' + a[2] + '칸이 색칠되어 있음';
      case 'dots': return '점 ' + a[0] + '개를 ' + a[1] + '묶음으로 똑같이 나눈 그림' + (a[2] ? ' (' + a[2] + '묶음 색칠)' : '') + (a[3] ? ', 묶음 밖에 남은 점 ' + a[3] + '개' : '');
      case 'array': return '점이 ' + a[0] + '줄, 한 줄에 ' + a[1] + '개씩 놓인 그림';
      case 'line': return a[0] + '부터 ' + a[1] + '까지를 ' + a[2] + '칸으로 나눈 수직선' + ((a[3] || []).length ? ', 점이 찍힌 자리: ' + a[3].map(m => m[0]).join(', ') : '');
      case 'rect': return '직사각형 그림 (가로 ' + a[2] + ', 세로 ' + a[3] + ')';
      case 'lshape': return 'ㄱ자 모양 도형: 가로 ' + a[0] + ', 세로 ' + a[1] + ' 인 직사각형의 오른쪽 위에서 가로 ' + a[2] + ', 세로 ' + a[3] + ' 인 직사각형을 잘라 낸 모양. 그림에 적힌 길이는 아래 ' + a[4][0] + ', 왼쪽 ' + a[4][1] + ', 위 ' + a[4][2] + ', 오른쪽 ' + a[4][3];
      case 'para': return '평행사변형 그림 (밑변 ' + a[2] + ', 높이 ' + a[3] + ')';
      case 'tri': return '삼각형 그림 (밑변 ' + a[2] + ', 높이 ' + a[3] + ')';
      case 'trap': return '사다리꼴 그림 (윗변 ' + a[3] + ', 아랫변 ' + a[4] + ', 높이 ' + a[5] + ')';
      case 'circ': return '원 그림 (' + (a[0] === 'r' ? '반지름 ' : '지름 ') + a[1] + ')';
      case 'box': return '직육면체 그림 (가로 ' + a[0] + ', 세로 ' + a[1] + ', 높이 ' + a[2] + ')';
      case 'table': return '두 줄짜리 표. 윗줄 ' + a[0] + ': ' + a[2].join(', ') + ' / 아랫줄 ' + a[1] + ': ' + a[3].join(', ') + ' (위아래 칸이 서로 짝)';
      case 'range': return a[0] + '부터 ' + a[1] + '까지 눈금이 있는 수직선에 "' + [a[2] == null ? '' : a[2] + (a[4] ? ' 이상' : ' 초과'), a[3] == null ? '' : a[3] + (a[5] ? ' 이하' : ' 미만')].filter(Boolean).join(' ') + '"인 범위가 굵은 선으로 표시됨 (색칠한 점은 그 수가 들어감, 빈 점은 들어가지 않음)';
      default: return '';
    }
  };

  V.draw = v => (v ? V[v[0]].apply(null, v.slice(1)) : '');
  g.V = V;
  if (typeof module !== 'undefined') module.exports = V;
})(typeof window !== 'undefined' ? window : globalThis);
