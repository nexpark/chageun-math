// 단원: 자연수 계산 · 약수와 배수
(function (g) {
  'use strict';
  const M = g.M || require('./mathlib.js');
  const { E, N, P, C } = M;
  const S = M.skill;
  const PLACE = ['일', '십', '백', '천', '만'];
  const col = (op, a, b, r) => (g.V ? g.V.col(op, a, b, r) : '');

  function addSteps(a, b) {
    const s = [col('+', a, b, a + b)];
    let c = 0, i = 0, x = a, y = b;
    while (x > 0 || y > 0) {
      const t = (x % 10) + (y % 10) + c;
      s.push(PLACE[i] + '의 자리: ' + (x % 10) + ' + ' + (y % 10) + (c ? ' + 1(올린 수)' : '') + ' = ' + t + (t >= 10 ? ' → ' + (t % 10) + '만 쓰고 윗자리로 1 올림' : ''));
      c = t >= 10 ? 1 : 0; x = Math.floor(x / 10); y = Math.floor(y / 10); i++;
    }
    if (c) s.push('마지막에 올린 1은 ' + PLACE[i] + '의 자리에 써.');
    return s;
  }
  function subSteps(a, b) {
    const s = [col('−', a, b, a - b)];
    const xs = String(a).split('').reverse().map(Number), ys = String(b).split('').reverse().map(Number);
    let br = 0;
    for (let i = 0; i < xs.length; i++) {
      const q = ys[i] || 0, p = xs[i] - br;
      if (i >= ys.length && !br) break;
      const lend = br ? ' − 1(빌려준 수)' : '';
      if (p < q) { s.push(PLACE[i] + '의 자리: ' + xs[i] + lend + ' 에서 ' + q + ' 을(를) 뺄 수 없어 → 윗자리에서 10을 빌려 와: 10 + ' + xs[i] + lend + ' − ' + q + ' = ' + (p + 10 - q)); br = 1; }
      else { s.push(PLACE[i] + '의 자리: ' + xs[i] + lend + ' − ' + q + ' = ' + (p - q)); br = 0; }
    }
    return s;
  }
  // 앞자리부터 차례로 나누기
  function divSteps(a, b) {
    const s = ['앞자리부터 차례로 나눠 보자.'];
    let rem = 0, started = false;
    const ds = String(a).split('').map(Number);
    ds.forEach((dg, i) => {
      const cur = rem * 10 + dg, q = Math.floor(cur / b);
      if (started || q > 0 || i === ds.length - 1) {
        started = true;
        s.push(cur + ' ÷ ' + b + ' → 몫 ' + q + ' (' + b + ' × ' + q + ' = ' + b * q + '), 남는 수 ' + (cur - b * q));
      }
      rem = cur % b;
    });
    const q = Math.floor(a / b), r = a % b;
    s.push('검산: ' + b + ' × ' + q + (r ? ' + ' + r : '') + ' = ' + a);
    return s;
  }
  M.steps = { addSteps, subSteps, divSteps };

  S({
    id: 'add3', name: '덧셈', sub: '받아올림이 있는 덧셈', strand: 'nat', grade: '3-1', pre: [],
    lesson: [
      { t: '같은 자리끼리 더해', h: '덧셈은 <b>일의 자리부터</b> 같은 자리끼리 더해. 세로로 줄을 맞춰 쓰면 헷갈리지 않아.', v: ['col', '+', 257, 168, 425] },
      { t: '10이 넘으면 올려 줘', h: '한 자리에서 더한 값이 <b>10이거나 10보다 크면</b> 10은 윗자리로 <b>1 올려</b> 주고 남은 수만 써.<br><br>7 + 8 = 15 → 일의 자리에 5, 십의 자리로 1 올림!' },
      { t: '조심!', h: '올린 1을 <b>깜빡하고 안 더하는</b> 실수가 가장 많아. 올린 수는 윗자리 위에 작게 꼭 적어 두자.' },
    ],
    gen(lv, R) {
      let a, b;
      if (lv === 1) { a = R.int(13, 78); b = R.int(12, 89); }
      else if (lv === 2) { a = R.int(125, 689); b = R.int(114, 299); }
      else { a = R.int(1250, 7890); b = R.int(356, 2999); }
      const word = lv > 1 && R.chance(0.3);
      return {
        q: word ? '도서관에 동화책이 ' + a + '권, 과학책이 ' + b + '권 있어. 책은 모두 몇 권일까?' : E(a + ' + ' + b),
        a: N(a + b, word ? { post: '권' } : null),
        hint: '일의 자리부터 같은 자리끼리 더해. 10이 넘으면 윗자리로 1 올림!',
        sol: addSteps(a, b),
      };
    },
  });

  S({
    id: 'sub3', name: '뺄셈', sub: '받아내림이 있는 뺄셈', strand: 'nat', grade: '3-1', pre: [],
    lesson: [
      { t: '같은 자리끼리 빼', h: '뺄셈도 <b>일의 자리부터</b> 같은 자리끼리 빼.', v: ['col', '−', 432, 178, 254] },
      { t: '못 빼면 빌려 와', h: '위의 수가 더 작아서 뺄 수 없으면, <b>윗자리에서 10을 빌려 와</b>.<br><br>2 − 8 은 못 빼 → 십의 자리에서 10을 빌려 12 − 8 = 4.<br>빌려준 십의 자리는 <b>1 작아져</b>.' },
      { t: '조심!', h: '빌려준 자리에서 <b>1을 빼는 것</b>을 잊지 마. 그리고 무조건 "큰 수 − 작은 수"로 빼면 안 돼. 반드시 <b>위 − 아래</b>야.' },
    ],
    gen(lv, R) {
      let a, b;
      if (lv === 1) { a = R.int(41, 99); b = R.int(13, a - 12); }
      else if (lv === 2) { a = R.int(312, 950); b = R.int(125, a - 100); }
      else if (R.chance(0.4)) { a = R.pick([1000, 2000, 3000, 5000]); b = R.int(123, 897); }
      else { a = R.int(2010, 8050); b = R.int(356, 1988); }
      const word = lv > 1 && R.chance(0.3);
      return {
        q: word ? '색종이 ' + a + '장 가운데 ' + b + '장을 썼어. 남은 색종이는 몇 장일까?' : E(a + ' − ' + b),
        a: N(a - b, word ? { post: '장' } : null),
        hint: '일의 자리부터 빼. 위의 수가 작으면 윗자리에서 10을 빌려 와!',
        sol: subSteps(a, b),
      };
    },
  });

  S({
    id: 'times', name: '곱셈구구', sub: '구구단', strand: 'nat', grade: '2-2', pre: [],
    lesson: [
      { t: '곱셈은 묶어 세기', h: '<b>4 × 6</b> 은 "4개씩 6묶음" 또는 "6을 4번 더한 것"이야.<br>6 + 6 + 6 + 6 = 24', v: ['array', 4, 6] },
      { t: '순서를 바꿔도 같아', h: '4 × 6 = 6 × 4 = 24.<br>그래서 구구단은 절반만 확실히 알아도 나머지를 알 수 있어.' },
      { t: '기억이 안 날 때', h: '7 × 8 이 헷갈리면 아는 것에서 출발해.<br>7 × 7 = 49 → 7을 한 번 더: 49 + 7 = <b>56</b><br>구구단은 모든 계산의 뿌리야. 빠르게 나올 때까지 연습하자!' },
    ],
    gen(lv, R) {
      const a = lv === 1 ? R.pick([2, 3, 4, 5]) : R.int(lv === 2 ? 3 : 6, 9), b = R.int(2, 9);
      const sol = [a + ' × ' + b + ' 은(는) ' + a + '을(를) ' + b + '번 더한 것', a + ' × ' + (b - 1) + ' = ' + a * (b - 1) + ' 에서 ' + a + '을(를) 한 번 더 더하면 ' + a * b];
      if (lv === 3 && R.chance(0.6)) {
        return { q: E('□ × ' + b + ' = ' + a * b), a: N(a), hint: b + '단에서 ' + a * b + ' 이(가) 나오는 곳을 찾아봐.', sol: [b + '단을 외워 봐: ' + b + ' × ' + a + ' = ' + a * b, '그러니까 □ = ' + a] };
      }
      return { q: E(a + ' × ' + b), a: N(a * b), hint: a + '단을 차례로 외워 봐. ' + a + ' × ' + (b - 1) + ' = ' + a * (b - 1) + ' 다음이야.', sol };
    },
  });

  S({
    id: 'mul21', name: '곱셈 (1)', sub: '(두 자리 수) × (한 자리 수)', strand: 'nat', grade: '3-1', pre: ['times'],
    lesson: [
      { t: '쪼개서 곱해', h: '<b>47 × 6</b> 은 47을 40과 7로 쪼개서 곱한 뒤 더하면 돼.<br><br>40 × 6 = 240<br>7 × 6 = 42<br>240 + 42 = <b>282</b>' },
      { t: '세로셈으로는', h: '일의 자리부터 곱해. 7 × 6 = 42 → 2를 쓰고 <b>4를 올려</b>.<br>십의 자리: 4 × 6 = 24, 올린 4를 더해 28 → <b>282</b>', v: ['col', '×', 47, 6, 282] },
      { t: '조심!', h: '올린 수는 <b>곱한 다음에 더하는</b> 거야. 올린 수를 먼저 더하고 곱하면 틀려!' },
    ],
    gen(lv, R) {
      let a, b;
      if (lv === 1) { a = R.int(11, 24); b = R.int(2, 4); }
      else if (lv === 2) { a = R.int(23, 98); b = R.int(3, 9); }
      else { a = R.int(112, 896); b = R.int(3, 9); }
      const parts = String(a).split('').map((d, i, arr) => +d * Math.pow(10, arr.length - 1 - i)).filter(x => x);
      return {
        q: E(a + ' × ' + b), a: N(a * b),
        hint: a + ' 을(를) ' + parts.join(' + ') + ' (으)로 쪼개서 하나씩 곱한 뒤 더해 봐.',
        sol: parts.map(p => p + ' × ' + b + ' = ' + p * b).concat([parts.map(p => p * b).join(' + ') + ' = ' + a * b]),
      };
    },
  });

  S({
    id: 'mul22', name: '곱셈 (2)', sub: '(두 · 세 자리 수) × (두 자리 수)', strand: 'nat', grade: '3-2', pre: ['mul21'],
    lesson: [
      { t: '몇십을 곱할 땐', h: '<b>24 × 30</b> 은 24 × 3 을 먼저 구하고 <b>0을 하나</b> 붙여.<br>24 × 3 = 72 → 24 × 30 = <b>720</b>' },
      { t: '두 자리 수를 곱할 땐', h: '<b>24 × 36</b> 은 36을 30과 6으로 쪼개.<br><br>24 × 6 = 144<br>24 × 30 = 720<br>144 + 720 = <b>864</b>', v: ['col', '×', 24, 36, 864] },
      { t: '조심!', h: '십의 자리 수를 곱한 결과는 <b>한 칸 왼쪽</b>에서부터 써야 해 (끝에 0이 붙은 수니까). 자리를 맞추지 않으면 답이 훨씬 작게 나와.' },
    ],
    gen(lv, R) {
      let a, b;
      if (lv === 1) { a = R.chance(0.4) ? R.int(2, 9) * 10 : R.int(12, 48); b = R.int(2, 6) * 10; }
      else if (lv === 2) { a = R.int(12, 68); do b = R.int(12, 49); while (b % 10 === 0); }
      else { a = R.int(112, 489); do b = R.int(12, 58); while (b % 10 === 0); }
      const t = Math.floor(b / 10) * 10, o = b % 10;
      const sol = o ? [a + ' × ' + o + ' = ' + a * o, a + ' × ' + t + ' = ' + a * t + '  (' + a + ' × ' + t / 10 + ' 에 0을 붙여)', a * o + ' + ' + a * t + ' = ' + a * b]
        : [a + ' × ' + t / 10 + ' = ' + a * t / 10, '0을 하나 붙이면 ' + a * b];
      return { q: E(a + ' × ' + b), a: N(a * b), hint: b + ' 을(를) ' + (o ? t + ' 과(와) ' + o + ' (으)로 쪼개서 따로 곱한 뒤 더해.' : t / 10 + ' × 10 으로 생각해. 먼저 ' + t / 10 + ' 을(를) 곱하고 0을 붙여.'), sol };
    },
  });

  S({
    id: 'div1', name: '나눗셈의 뜻', sub: '구구단으로 나누기', strand: 'nat', grade: '3-1', pre: ['times'],
    lesson: [
      { t: '나눗셈은 똑같이 나누기', h: '<b>12 ÷ 3</b> 은 "12개를 3명이 똑같이 나누면 한 명이 몇 개?"야.<br>한 묶음에 4개씩 → 12 ÷ 3 = <b>4</b>', v: ['dots', 12, 3, 0] },
      { t: '곱셈을 거꾸로', h: '나눗셈은 <b>곱셈의 반대</b>야.<br>3 × □ = 12 가 되는 □ 를 찾으면 돼.<br>3 × 4 = 12 이니까 12 ÷ 3 = 4' },
      { t: '이렇게 풀어', h: '<b>56 ÷ 7</b> → 7단을 외워: 7 × 8 = 56 → 답은 <b>8</b><br>구구단이 빠르면 나눗셈도 빨라져.' },
    ],
    gen(lv, R) {
      const b = lv === 1 ? R.int(2, 5) : R.int(lv === 2 ? 3 : 6, 9), q = R.int(2, 9), a = b * q;
      if (lv === 3 && R.chance(0.6)) {
        return R.chance(0.5)
          ? { q: E('□ ÷ ' + b + ' = ' + q), a: N(a), hint: '거꾸로 생각해. □ 는 ' + b + ' 이(가) ' + q + '묶음 있는 수야.', sol: ['□ ÷ ' + b + ' = ' + q + ' 이면 □ = ' + b + ' × ' + q, b + ' × ' + q + ' = ' + a] }
          : { q: E(a + ' ÷ □ = ' + q), a: N(b), hint: '□ × ' + q + ' = ' + a + ' 이(가) 되는 수를 찾아.', sol: [a + ' ÷ □ = ' + q + ' 이면 □ × ' + q + ' = ' + a, q + '단에서 ' + q + ' × ' + b + ' = ' + a + ' → □ = ' + b] };
      }
      return { q: E(a + ' ÷ ' + b), a: N(q), hint: b + ' × □ = ' + a + ' 이(가) 되는 수를 ' + b + '단에서 찾아봐.', sol: [b + '단을 외워 봐: ' + b + ' × ' + q + ' = ' + a, '그러니까 ' + a + ' ÷ ' + b + ' = ' + q] };
    },
  });

  S({
    id: 'divrem', name: '나머지가 있는 나눗셈', sub: '(두 · 세 자리 수) ÷ (한 자리 수)', strand: 'nat', grade: '3-2', pre: ['div1', 'sub3'],
    lesson: [
      { t: '남는 수가 나머지', h: '<b>17 ÷ 5</b>: 17개를 5개씩 묶으면 3묶음이 되고 2개가 남아.<br>몫은 <b>3</b>, 나머지는 <b>2</b>.<br>17 ÷ 5 = 3 … 2', v: ['dots', 15, 3, 3, 2] },
      { t: '나머지는 항상 더 작아', h: '나머지는 <b>나누는 수보다 작아야</b> 해. 나머지가 나누는 수보다 크거나 같으면 한 묶음을 더 만들 수 있으니까.' },
      { t: '큰 수는 앞자리부터', h: '<b>84 ÷ 3</b><br>십의 자리 8 ÷ 3 → 몫 2, 남는 수 2<br>남은 2와 일의 자리 4를 합쳐 24 ÷ 3 = 8<br>답: <b>28</b>' },
      { t: '검산하기', h: '(나누는 수) × (몫) + (나머지) = (처음 수)<br>5 × 3 + 2 = 17 ✔ 맞는지 꼭 확인해 봐.' },
    ],
    gen(lv, R) {
      let a, b, q, r;
      if (lv === 1) { b = R.int(2, 9); q = R.int(2, 9); r = R.int(1, b - 1); }
      else if (lv === 2) { b = R.int(2, 8); q = R.int(11, Math.floor(99 / b)); r = R.chance(0.6) ? R.int(1, b - 1) : 0; if (b * q + r > 99) r = 0; }
      else { b = R.int(3, 9); q = R.int(23, Math.floor(999 / b) - 1); r = R.chance(0.7) ? R.int(1, b - 1) : 0; }
      a = b * q + r;
      return {
        q: E(a + ' ÷ ' + b),
        a: P([N(q, { pre: '몫' }), N(r, { pre: '나머지' })]),
        hint: lv === 1 ? b + '단에서 ' + a + ' 을(를) 넘지 않는 가장 큰 수를 찾아. 남는 수가 나머지야. (나머지가 없으면 0)' : '앞자리부터 차례로 나눠. 남는 수는 다음 자리 수와 합쳐서 또 나눠. (나머지가 없으면 0)',
        sol: lv === 1 ? [b + ' × ' + q + ' = ' + b * q + ' (' + a + ' 을(를) 넘지 않는 가장 큰 수)', a + ' − ' + b * q + ' = ' + r + ' → 나머지', '몫 ' + q + ', 나머지 ' + r] : divSteps(a, b).concat(['몫 ' + q + ', 나머지 ' + r]),
      };
    },
  });

  S({
    id: 'div2', name: '두 자리 수로 나누기', sub: '(세 자리 수) ÷ (두 자리 수)', strand: 'nat', grade: '4-1', pre: ['divrem', 'mul22'],
    lesson: [
      { t: '몇십으로 나눌 땐', h: '<b>240 ÷ 30</b> 은 0을 하나씩 떼고 24 ÷ 3 으로 생각해도 돼. 답은 <b>8</b>.' },
      { t: '어림해서 몫 찾기', h: '<b>87 ÷ 21</b>: 21을 약 20으로 생각하면 87 안에 4번쯤 들어가.<br>21 × 4 = 84 → 87 − 84 = 3<br>몫 <b>4</b>, 나머지 <b>3</b>' },
      { t: '몫이 너무 크거나 작으면', h: '곱한 값이 처음 수보다 <b>크면</b> 몫을 1 줄이고,<br>나머지가 나누는 수보다 <b>크거나 같으면</b> 몫을 1 늘려.' },
      { t: '세 자리 수는 앞에서부터', h: '<b>552 ÷ 24</b><br>55 ÷ 24 → 몫 2 (24 × 2 = 48), 남는 수 7<br>72 ÷ 24 → 몫 3 (24 × 3 = 72), 남는 수 0<br>답: <b>23</b>' },
    ],
    gen(lv, R) {
      let a, b, q, r;
      if (lv === 1) {
        b = R.int(2, 9) * 10; q = R.int(2, 9); a = b * q;
        return { q: E(a + ' ÷ ' + b), a: N(q), hint: '0을 하나씩 떼고 ' + a / 10 + ' ÷ ' + b / 10 + ' (으)로 생각해 봐.', sol: [a + ' ÷ ' + b + ' 은(는) ' + a / 10 + ' ÷ ' + b / 10 + ' 과(와) 같아', a / 10 + ' ÷ ' + b / 10 + ' = ' + q] };
      }
      if (lv === 2) { do { b = R.int(12, 38); q = R.int(2, 7); r = R.int(1, b - 1); a = b * q + r; } while (a > 99); }
      else { do { b = R.int(12, 48); q = R.int(4, 38); r = R.chance(0.7) ? R.int(1, b - 1) : 0; a = b * q + r; } while (a < 150 || a > 999); }
      return {
        q: E(a + ' ÷ ' + b),
        a: P([N(q, { pre: '몫' }), N(r, { pre: '나머지' })]),
        hint: b + ' 을(를) 약 ' + Math.round(b / 10) * 10 + ' (으)로 어림해서 몇 번 들어가는지 생각해 봐. (나머지가 없으면 0)',
        sol: divSteps(a, b).concat(['몫 ' + q + ', 나머지 ' + r]),
      };
    },
  });

  S({
    id: 'order', name: '혼합 계산', sub: '계산 순서', strand: 'nat', grade: '5-1', pre: ['mul21', 'divrem'],
    lesson: [
      { t: '계산에는 순서가 있어', h: '<b>① 괄호 안</b>을 가장 먼저<br><b>② 곱셈 · 나눗셈</b>을 그다음에<br><b>③ 덧셈 · 뺄셈</b>을 마지막에<br><br>같은 단계끼리는 <b>왼쪽부터</b> 차례로 해.' },
      { t: '예를 들어', h: '<b>20 − 3 × 4</b><br>곱셈 먼저: 3 × 4 = 12<br>그다음 뺄셈: 20 − 12 = <b>8</b><br><br>(앞에서부터 20 − 3 = 17, 17 × 4 = 68 로 하면 틀려!)' },
      { t: '괄호가 있으면', h: '<b>(20 − 3) × 4</b><br>괄호 먼저: 20 − 3 = 17<br>그다음: 17 × 4 = <b>68</b><br><br>괄호 하나로 답이 완전히 달라져.' },
      { t: '조심!', h: '<b>15 − 4 + 6</b> 처럼 덧셈과 뺄셈만 있으면 <b>왼쪽부터</b>야.<br>15 − 4 = 11, 11 + 6 = 17 ✔<br>(4 + 6 을 먼저 해서 15 − 10 = 5 로 하면 틀려)' },
    ],
    gen(lv, R) {
      let q, ans, sol;
      const a = R.int(2, 9), b = R.int(2, 9), c = R.int(2, 9), d = R.int(2, 6);
      if (lv === 1) {
        const k = R.int(0, 3);
        if (k === 0) { const x = R.int(5, 40); q = x + ' + ' + a + ' × ' + b; ans = x + a * b; sol = ['곱셈 먼저: ' + a + ' × ' + b + ' = ' + a * b, x + ' + ' + a * b + ' = ' + ans]; }
        else if (k === 1) { const x = a * b + R.int(3, 30); q = x + ' − ' + a + ' × ' + b; ans = x - a * b; sol = ['곱셈 먼저: ' + a + ' × ' + b + ' = ' + a * b, x + ' − ' + a * b + ' = ' + ans]; }
        else if (k === 2) { const x = R.int(5, 40); q = x + ' + ' + a * b + ' ÷ ' + a; ans = x + b; sol = ['나눗셈 먼저: ' + a * b + ' ÷ ' + a + ' = ' + b, x + ' + ' + b + ' = ' + ans]; }
        else { const x = R.int(20, 50), y = R.int(3, 15), z = R.int(3, 15); q = x + ' − ' + y + ' + ' + z; ans = x - y + z; sol = ['덧셈과 뺄셈만 있으면 왼쪽부터: ' + x + ' − ' + y + ' = ' + (x - y), (x - y) + ' + ' + z + ' = ' + ans]; }
      } else if (lv === 2) {
        const k = R.int(0, 3);
        if (k === 0) { q = '(' + a + ' + ' + b + ') × ' + c; ans = (a + b) * c; sol = ['괄호 먼저: ' + a + ' + ' + b + ' = ' + (a + b), (a + b) + ' × ' + c + ' = ' + ans]; }
        else if (k === 1) { const x = b + R.int(2, 9); q = a + ' × (' + x + ' − ' + b + ')'; ans = a * (x - b); sol = ['괄호 먼저: ' + x + ' − ' + b + ' = ' + (x - b), a + ' × ' + (x - b) + ' = ' + ans]; }
        else if (k === 2) { const x = a + b + R.int(4, 30); q = x + ' − (' + a + ' + ' + b + ')'; ans = x - a - b; sol = ['괄호 먼저: ' + a + ' + ' + b + ' = ' + (a + b), x + ' − ' + (a + b) + ' = ' + ans]; }
        else { const s = c * d, x = R.int(1, s - 1); q = '(' + x + ' + ' + (s - x) + ') ÷ ' + c; ans = d; sol = ['괄호 먼저: ' + x + ' + ' + (s - x) + ' = ' + s, s + ' ÷ ' + c + ' = ' + ans]; }
      } else {
        const k = R.int(0, 2);
        if (k === 0) { const x = R.int(10, 40), y = b + R.int(2, 8); q = x + ' + (' + y + ' − ' + b + ') × ' + c; ans = x + (y - b) * c; sol = ['① 괄호: ' + y + ' − ' + b + ' = ' + (y - b), '② 곱셈: ' + (y - b) + ' × ' + c + ' = ' + (y - b) * c, '③ 덧셈: ' + x + ' + ' + (y - b) * c + ' = ' + ans]; }
        else if (k === 1) { const x = a * b + 6, e = R.int(2, 9); q = x + ' − ' + c * d + ' ÷ ' + c + ' + ' + a + ' × ' + e; ans = x - d + a * e; sol = ['① 나눗셈: ' + c * d + ' ÷ ' + c + ' = ' + d, '② 곱셈: ' + a + ' × ' + e + ' = ' + a * e, '③ 왼쪽부터: ' + x + ' − ' + d + ' = ' + (x - d) + ', ' + (x - d) + ' + ' + a * e + ' = ' + ans]; }
        else { const y = R.int(3, 20); q = '(' + a + ' + ' + b + ') × ' + c + ' − ' + y; ans = (a + b) * c - y; if (ans < 0) return this.gen(lv, R); sol = ['① 괄호: ' + a + ' + ' + b + ' = ' + (a + b), '② 곱셈: ' + (a + b) + ' × ' + c + ' = ' + (a + b) * c, '③ 뺄셈: ' + (a + b) * c + ' − ' + y + ' = ' + ans]; }
      }
      return { q: E(q), a: N(ans), hint: '순서: ① 괄호 → ② 곱셈 · 나눗셈 → ③ 덧셈 · 뺄셈 (같은 단계는 왼쪽부터)', sol };
    },
  });

  // ───── 약수와 배수 ─────
  S({
    id: 'factors', name: '약수와 배수', sub: '약수 · 배수 찾기', strand: 'fac', grade: '5-1', pre: ['times', 'div1'],
    lesson: [
      { t: '약수 = 나누어떨어지게 하는 수', h: '6을 <b>나머지 없이</b> 나눌 수 있는 수는 1, 2, 3, 6 이야.<br>이 수들이 <b>6의 약수</b>야.<br><br>6 ÷ 4 = 1 … 2 → 4는 6의 약수가 아니야.' },
      { t: '약수는 짝으로 찾아', h: '곱해서 12가 되는 짝을 찾으면 빠뜨리지 않아.<br>1 × 12, 2 × 6, 3 × 4<br>→ 12의 약수: <b>1, 2, 3, 4, 6, 12</b> (6개)' },
      { t: '배수 = 몇 배 한 수', h: '3을 1배, 2배, 3배 … 한 수 3, 6, 9, 12 … 가 <b>3의 배수</b>야.<br>배수는 끝없이 많아.' },
      { t: '둘은 짝꿍', h: '12 = 3 × 4 이면<br>3과 4는 12의 <b>약수</b>, 12는 3과 4의 <b>배수</b>야.<br>1은 모든 수의 약수이고, 어떤 수든 자기 자신이 약수이자 배수야.' },
    ],
    gen(lv, R) {
      if (lv === 1) {
        if (R.chance(0.5)) {
          const n = R.pick([8, 10, 12, 15, 16, 18, 20, 24]), ds = M.divisors(n).filter(x => x > 1 && x < n);
          const good = R.pick(ds), bad = R.shuffle([3, 4, 5, 6, 7, 8, 9, 11, 14].filter(x => n % x !== 0)).slice(0, 3);
          const ch = R.shuffle([good].concat(bad));
          return { q: '다음 중 <b>' + n + '의 약수</b>는 어느 것일까?', a: C(ch.map(String), ch.indexOf(good)), hint: n + ' 을(를) 나머지 없이 나눌 수 있는 수를 찾아.', sol: [n + ' ÷ ' + good + ' = ' + n / good + ' → 나누어떨어져', '그래서 ' + good + ' 이(가) ' + n + '의 약수야'] };
        }
        const n = R.int(3, 9), good = n * R.int(3, 9), bad = [];
        while (bad.length < 3) { const x = R.int(10, 80); if (x % n !== 0 && !bad.includes(x)) bad.push(x); }
        const ch = R.shuffle([good].concat(bad));
        return { q: '다음 중 <b>' + n + '의 배수</b>는 어느 것일까?', a: C(ch.map(String), ch.indexOf(good)), hint: n + '단에 나오는 수, 또는 ' + n + ' (으)로 나누어떨어지는 수를 찾아.', sol: [good + ' = ' + n + ' × ' + good / n, '그래서 ' + good + ' 이(가) ' + n + '의 배수야'] };
      }
      if (lv === 2 || R.chance(0.5)) {
        const n = R.pick(lv === 2 ? [6, 8, 9, 10, 12, 14, 15, 16, 18, 20] : [24, 28, 30, 32, 36, 40, 42, 45, 48]), ds = M.divisors(n);
        const pairs = ds.filter(x => x * x <= n).map(x => x + ' × ' + n / x);
        return { q: '<b>' + n + '의 약수</b>는 모두 몇 개일까?', a: N(ds.length, { post: '개' }), hint: '곱해서 ' + n + ' 이(가) 되는 두 수의 짝을 1부터 차례로 찾아봐.', sol: ['곱해서 ' + n + ' 이(가) 되는 짝: ' + pairs.join(', '), n + '의 약수: ' + ds.join(', '), '모두 ' + ds.length + '개'] };
      }
      const n = R.int(6, 9), big = Math.floor(99 / n) * n;
      if (R.chance(0.5)) return { q: '두 자리 수 가운데 <b>가장 큰 ' + n + '의 배수</b>는?', a: N(big), hint: '99에 가까운 수 중에서 ' + n + ' (으)로 나누어떨어지는 수를 찾아. 99 ÷ ' + n + ' 을(를) 해 봐.', sol: ['99 ÷ ' + n + ' = ' + Math.floor(99 / n) + ' … ' + (99 % n), n + ' × ' + Math.floor(99 / n) + ' = ' + big] };
      const k = R.int(7, 12);
      return { q: '<b>' + n + '의 배수</b>를 작은 것부터 쓸 때 ' + k + '번째 수는?', a: N(n * k), hint: n + '의 배수는 ' + n + ' × 1, ' + n + ' × 2, … 순서야.', sol: [k + '번째 배수 = ' + n + ' × ' + k, '= ' + n * k] };
    },
  });

  function ladder(a, b) {
    const fs = [], lines = [];
    let x = a, y = b;
    // 수를 같은 너비로 맞춰 줄이 가지런하게 (고정폭 글씨)
    const wa = String(a).length, wb = String(b).length;
    const row = (p, u, v) => (p ? p + ' ) ' : '    ') + String(u).padStart(wa) + '  ' + String(v).padStart(wb);
    for (let p = 2; p <= Math.min(x, y);) {
      if (x % p === 0 && y % p === 0) { lines.push(row(p, x, y)); fs.push(p); x /= p; y /= p; } else p++;
    }
    lines.push(row(0, x, y));
    return { fs, x, y, html: '<div class="ladder">' + lines.join('\n') + '</div>' };
  }
  function pairFor(R, gLo, gHi, mLo, mHi) {
    let gg, m, n;
    do { gg = R.int(gLo, gHi); m = R.int(mLo, mHi); n = R.int(mLo, mHi); } while (m === n || M.gcd(m, n) !== 1);
    return m < n ? [gg * m, gg * n, gg] : [gg * n, gg * m, gg];
  }

  S({
    id: 'gcd', name: '최대공약수', sub: '공약수와 최대공약수', strand: 'fac', grade: '5-1', pre: ['factors'],
    lesson: [
      { t: '공약수 = 둘 다의 약수', h: '12의 약수: 1, 2, 3, 4, 6, 12<br>18의 약수: 1, 2, 3, 6, 9, 18<br><br>둘 다에 들어 있는 <b>1, 2, 3, 6</b> 이 공약수야.<br>그 가운데 가장 큰 <b>6</b> 이 <b>최대공약수</b>.' },
      { t: '빨리 구하는 방법', h: '두 수를 <b>함께 나눌 수 있는 수</b>로 계속 나눠.<br>더 못 나누면, <b>왼쪽에 쓴 수를 모두 곱해</b>.<br>' + ladder(12, 18).html + '<br>2 × 3 = <b>6</b>' },
      { t: '어디에 쓸까?', h: '분수를 <b>약분</b>할 때 써. 분자와 분모를 최대공약수로 나누면 한 번에 가장 간단한 분수가 돼.<br>또 "똑같이 나누어 주는 가장 많은 사람 수" 같은 문제에도 써.' },
    ],
    gen(lv, R) {
      const [a, b, gg] = lv === 1 ? pairFor(R, 2, 6, 1, 5) : lv === 2 ? pairFor(R, 4, 12, 2, 7) : pairFor(R, 6, 18, 2, 9);
      const L = ladder(a, b);
      const sol = ['두 수를 함께 나눌 수 있는 수로 계속 나눠.' + L.html, L.fs.length > 1 ? '더 나눌 수 없으면 왼쪽 수를 모두 곱해: ' + L.fs.join(' × ') + ' = ' + gg : '더 나눌 수 없어. 왼쪽 수가 ' + gg + ' 하나뿐이니까 최대공약수는 ' + gg];
      if (lv === 3 && R.chance(0.4)) return { q: '사탕 ' + a + '개와 초콜릿 ' + b + '개를 <b>최대한 많은</b> 친구에게 남김없이 똑같이 나누어 주려고 해. 친구는 몇 명일까?', a: N(gg, { post: '명' }), hint: '두 수를 모두 나누어떨어지게 하는 가장 큰 수 = 최대공약수를 구해.', sol };
      return { q: '<b>' + a + '</b> 과(와) <b>' + b + '</b> 의 최대공약수는?', a: N(gg), hint: '두 수를 함께 나눌 수 있는 수(2, 3, 5 …)로 계속 나눠 보고, 나눈 수들을 곱해.', sol };
    },
  });

  S({
    id: 'lcm', name: '최소공배수', sub: '공배수와 최소공배수', strand: 'fac', grade: '5-1', pre: ['gcd'],
    lesson: [
      { t: '공배수 = 둘 다의 배수', h: '4의 배수: 4, 8, <b>12</b>, 16, 20, <b>24</b> …<br>6의 배수: 6, <b>12</b>, 18, <b>24</b> …<br><br>둘 다에 나오는 12, 24 … 가 공배수야.<br>그 가운데 가장 작은 <b>12</b> 가 <b>최소공배수</b>.' },
      { t: '빨리 구하는 방법', h: '최대공약수처럼 함께 나눈 다음,<br><b>왼쪽 수와 맨 아래 남은 수까지 모두</b> 곱해.<br>' + ladder(4, 6).html + '<br>2 × 2 × 3 = <b>12</b>' },
      { t: '어디에 쓸까?', h: '분모가 다른 분수를 더하거나 뺄 때 <b>통분</b>하는 데 써. 분모들의 최소공배수가 가장 편한 공통분모야.' },
    ],
    gen(lv, R) {
      const [a, b, gg] = lv === 1 ? pairFor(R, 1, 4, 2, 5) : lv === 2 ? pairFor(R, 2, 6, 2, 7) : pairFor(R, 3, 9, 2, 8);
      const L = ladder(a, b), ans = M.lcm(a, b);
      const sol = L.fs.length
        ? ['두 수를 함께 나눌 수 있는 수로 계속 나눠.' + L.html, '왼쪽 수와 아래 남은 수를 모두 곱해: ' + L.fs.concat([L.x, L.y]).join(' × ') + ' = ' + ans]
        : [a + ' 과(와) ' + b + ' 을(를) 함께 나눌 수 있는 수는 1뿐이야', '이럴 땐 두 수를 그냥 곱하면 돼: ' + a + ' × ' + b + ' = ' + ans];
      if (lv === 3 && R.chance(0.4)) return { q: '어떤 버스는 ' + a + '분마다, 다른 버스는 ' + b + '분마다 출발해. 지금 두 버스가 동시에 출발했다면, 다음에 동시에 출발하는 것은 몇 분 뒤일까?', a: N(ans, { post: '분 뒤' }), hint: '두 수의 공통인 배수 가운데 가장 작은 수 = 최소공배수를 구해.', sol };
      return { q: '<b>' + a + '</b> 과(와) <b>' + b + '</b> 의 최소공배수는?', a: N(ans), hint: '큰 수 ' + b + ' 의 배수(' + b + ', ' + b * 2 + ', ' + b * 3 + ' …)를 차례로 보면서 ' + a + ' 의 배수이기도 한 첫 수를 찾아.', sol };
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
