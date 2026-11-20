// 단원: 분수
(function (g) {
  'use strict';
  const M = g.M || require('./mathlib.js');
  const { E, N, FR, P, C, F, MX, gcd, lcm } = M;
  const S = M.skill;
  const SIGN = ['>', '=', '<'];
  const cmp = (x, y) => (x > y ? 0 : x === y ? 1 : 2);
  // 진분수 하나 (기약일 필요 없음)
  const proper = (R, dLo, dHi) => { const d = R.int(dLo, dHi); return [R.int(1, d - 1), d]; };
  const coprimeProper = (R, dLo, dHi) => { let n, d; do { d = R.int(dLo, dHi); n = R.int(1, d - 1); } while (gcd(n, d) !== 1); return [n, d]; };

  S({
    id: 'fracmean', name: '분수의 뜻', sub: '전체와 부분', strand: 'frac', grade: '3-1', pre: ['div1'],
    lesson: [
      { t: '똑같이 나눈 것 중의 몇', h: '전체를 <b>똑같이 4로</b> 나눈 것 중의 <b>3</b>을 ' + F(3, 4) + ' 이라고 써.<br>아래 수(<b>분모</b>)는 "몇 조각으로 나눴나",<br>위 수(<b>분자</b>)는 "그중 몇 조각인가"야.', v: ['bar', 3, 4] },
      { t: '분모가 클수록 조각은 작아', h: '피자를 4조각 낸 것보다 8조각 낸 한 조각이 더 작지?<br>' + F(1, 8) + ' 은(는) ' + F(1, 4) + ' 보다 작아.', v: ['bars2', 1, 4, 1, 8] },
      { t: '수의 분수만큼', h: '<b>12의 ' + F(3, 4) + '</b> 은?<br>① 12를 4묶음으로 똑같이 나눠: 12 ÷ 4 = 3<br>② 그중 3묶음: 3 × 3 = <b>9</b><br><br>분모로 나누고, 분자를 곱해!', v: ['dots', 12, 4, 3] },
    ],
    gen(lv, R) {
      if (lv === 1) {
        const [n, d] = proper(R, 3, 10);
        return { q: '색칠한 부분은 전체의 얼마일까? 분수로 써 봐.', v: [R.chance(0.3) && d <= 8 ? 'pie' : 'bar', n, d], a: FR(n, d), hint: '전체가 몇 칸인지 세어 아래(분모)에, 색칠한 칸 수를 위(분자)에 써.', sol: ['전체는 똑같이 ' + d + '칸 → 분모는 ' + d, '색칠한 칸은 ' + n + '칸 → 분자는 ' + n, '답: ' + F(n, d)] };
      }
      const d = R.int(2, lv === 2 ? 6 : 9), k = R.int(2, lv === 2 ? 6 : 9), n = lv === 2 ? 1 : R.int(2, d - 1 || 1), tot = d * k;
      if (lv === 3 && d === 2) return this.gen(lv, R);
      return {
        q: '<b>' + tot + '</b> 의 ' + F(n, d) + ' 만큼은 얼마일까?', v: tot <= 36 ? ['dots', tot, d, n] : null, a: N(k * n),
        hint: '먼저 ' + tot + ' 을(를) ' + d + '묶음으로 똑같이 나눠. 그중 ' + n + '묶음이 답이야.',
        sol: [tot + ' ÷ ' + d + ' = ' + k + ' (한 묶음)', n > 1 ? k + ' × ' + n + ' = ' + k * n + ' (' + n + '묶음)' : '한 묶음이니까 ' + k],
      };
    },
  });

  S({
    id: 'fraccmp1', name: '분수의 크기 비교 (1)', sub: '분모가 같은 분수 · 단위분수', strand: 'frac', grade: '3-1', pre: ['fracmean'],
    lesson: [
      { t: '분모가 같으면 분자를 봐', h: '조각 크기가 같으니까 <b>조각 수(분자)가 많은 쪽</b>이 커.<br>' + F(3, 5) + ' &gt; ' + F(2, 5), v: ['bars2', 3, 5, 2, 5] },
      { t: '분자가 1이면 분모를 봐', h: '분자가 1인 분수(단위분수)는 <b>분모가 작을수록</b> 커. 덜 나눈 조각이 더 크니까!<br>' + F(1, 3) + ' &gt; ' + F(1, 5), v: ['bars2', 1, 3, 1, 5] },
      { t: '분자와 분모가 같으면 1', h: F(5, 5) + ' 은(는) 전체를 다 가진 거니까 <b>1</b> 이야.<br>분자가 분모보다 크면 1보다 큰 수야.' },
    ],
    gen(lv, R) {
      let L, Rt, lv_, rv, sol;
      if (lv === 1) {
        const d = R.int(4, 12); let a = R.int(1, d - 1), b; do b = R.int(1, d - 1); while (b === a);
        L = F(a, d); Rt = F(b, d); lv_ = a; rv = b; sol = ['분모가 ' + d + ' (으)로 같으니까 분자끼리 비교해', a + (a > b ? ' > ' : ' < ') + b + ' 이니까 ' + L + (a > b ? ' > ' : ' < ') + Rt];
      } else if (lv === 2) {
        let a = R.int(2, 12), b; do b = R.int(2, 12); while (b === a);
        L = F(1, a); Rt = F(1, b); lv_ = b; rv = a; sol = ['분자가 둘 다 1이야. 분모가 작을수록 한 조각이 커', a + (a < b ? ' < ' : ' > ') + b + ' 이니까 ' + L + (a < b ? ' > ' : ' < ') + Rt];
      } else {
        const d = R.int(3, 9), w = R.int(1, 3), n = R.int(1, d - 1), imp = w * d + n + R.int(-2, 2);
        if (R.chance(0.25)) { L = F(d, d); Rt = '1'; lv_ = 1; rv = 1; sol = ['분자와 분모가 같으면 전체를 다 가진 것', F(d, d) + ' = 1']; }
        else { L = F(imp, d); Rt = MX(w, n, d); lv_ = imp; rv = w * d + n; sol = [Rt + ' 을(를) 가분수로 바꾸면 ' + F(w * d + n, d) + ' (' + w + ' × ' + d + ' + ' + n + ' = ' + (w * d + n) + ')', '분자끼리 비교: ' + imp + ' ' + SIGN[cmp(imp, w * d + n)] + ' ' + (w * d + n)]; }
      }
      return { q: '○ 안에 알맞은 기호를 골라 봐.' + E(L + ' ○ ' + Rt), a: C(SIGN, cmp(lv_, rv)), hint: lv === 2 ? '분자가 1일 때는 분모가 작은 쪽이 더 큰 조각이야.' : lv === 1 ? '분모가 같으면 분자가 큰 쪽이 더 커.' : '둘을 같은 모양(가분수)으로 바꿔서 분자를 비교해 봐.', sol };
    },
  });

  S({
    id: 'fracconv', name: '대분수와 가분수', sub: '서로 바꾸기', strand: 'frac', grade: '3-2', pre: ['fraccmp1', 'divrem'],
    lesson: [
      { t: '세 가지 분수', h: '<b>진분수</b>: 분자가 분모보다 작아 (' + F(3, 4) + ') → 1보다 작음<br><b>가분수</b>: 분자가 분모와 같거나 커 (' + F(7, 4) + ')<br><b>대분수</b>: 자연수와 진분수 (' + MX(1, 3, 4) + ')' },
      { t: '대분수 → 가분수', h: MX(1, 3, 4) + ' 은(는) 1(= ' + F(4, 4) + ')과 ' + F(3, 4) + ' 을(를) 합친 것.<br>(자연수 × 분모) + 분자 → 1 × 4 + 3 = 7<br>' + MX(1, 3, 4) + ' = ' + F(7, 4), v: ['bar', 7, 4] },
      { t: '가분수 → 대분수', h: '분자를 분모로 <b>나눠</b>.<br>' + F(17, 5) + ' → 17 ÷ 5 = 3 … 2<br>몫 3이 자연수, 나머지 2가 분자 → ' + MX(3, 2, 5) },
      { t: '조심!', h: '바꿀 때 <b>분모는 그대로</b>야. 분모까지 바꾸면 안 돼.' },
    ],
    gen(lv, R) {
      const d = R.int(lv === 3 ? 5 : 2, lv === 3 ? 12 : 7), w = R.int(1, lv === 3 ? 9 : 4), n = R.int(1, d - 1), imp = w * d + n;
      const toImp = lv === 1 || (lv === 3 && R.chance(0.5));
      if (toImp) return { q: '대분수를 <b>가분수</b>로 바꿔 봐.' + E(MX(w, n, d)), a: FR(imp, d, { form: 'improper' }), hint: '(자연수 × 분모) + 분자 를 분자에 써. 분모는 그대로!', sol: [w + ' × ' + d + ' = ' + w * d, w * d + ' + ' + n + ' = ' + imp + ' → 분자', '답: ' + F(imp, d)] };
      return { q: '가분수를 <b>대분수</b>로 바꿔 봐.' + E(F(imp, d)), a: FR(imp, d, { form: 'mixed', wb: 1 }), hint: '분자를 분모로 나눠. 몫이 자연수, 나머지가 분자야.', sol: [imp + ' ÷ ' + d + ' = ' + w + ' … ' + n, '몫 ' + w + ' → 자연수, 나머지 ' + n + ' → 분자', '답: ' + MX(w, n, d)] };
    },
  });

  S({
    id: 'fracadd1', name: '분수의 덧셈과 뺄셈 (1)', sub: '분모가 같은 분수', strand: 'frac', grade: '4-2', pre: ['fracconv'],
    lesson: [
      { t: '분모는 그대로, 분자끼리', h: '조각 크기(분모)가 같으니까 <b>조각 수(분자)만</b> 더하거나 빼.<br>' + F(2, 7) + ' + ' + F(3, 7) + ' = ' + F(5, 7), v: ['bar', 5, 7] },
      { t: '조심! 분모는 더하지 않아', h: F(2, 7) + ' + ' + F(3, 7) + ' = ' + F(5, 14) + ' ✕<br>분모끼리 더하면 안 돼. 7조각짜리 피자가 14조각짜리로 바뀌지 않으니까!' },
      { t: '1을 넘으면 대분수로', h: F(4, 5) + ' + ' + F(3, 5) + ' = ' + F(7, 5) + ' = ' + MX(1, 2, 5) },
      { t: '뺄 수 없으면 1을 빌려', h: MX(3, 1, 5) + ' − ' + MX(1, 3, 5) + '<br>' + F(1, 5) + ' 에서 ' + F(3, 5) + ' 을(를) 못 빼니까 자연수 3에서 <b>1을 ' + F(5, 5) + ' 로</b> 바꿔.<br>' + MX(2, 6, 5) + ' − ' + MX(1, 3, 5) + ' = ' + MX(1, 3, 5) },
    ],
    gen(lv, R) {
      const d = R.int(lv === 1 ? 4 : 5, 12);
      let q, tot, sol;
      if (lv === 1) {
        if (R.chance(0.5)) { const a = R.int(1, d - 2), b = R.int(1, d - 1 - a); q = F(a, d) + ' + ' + F(b, d); tot = a + b; sol = ['분모는 그대로 ' + d, '분자끼리 더해: ' + a + ' + ' + b + ' = ' + tot]; }
        else { const a = R.int(2, d - 1), b = R.int(1, a - 1); q = F(a, d) + ' − ' + F(b, d); tot = a - b; sol = ['분모는 그대로 ' + d, '분자끼리 빼: ' + a + ' − ' + b + ' = ' + tot]; }
      } else if (lv === 2) {
        if (R.chance(0.5)) { const a = R.int(2, d - 1), b = R.int(d - a + 1, d - 1); q = F(a, d) + ' + ' + F(b, d); tot = a + b; sol = ['분자끼리 더해: ' + a + ' + ' + b + ' = ' + tot + ' → ' + F(tot, d), '가분수니까 대분수로: ' + tot + ' ÷ ' + d + ' = 1 … ' + (tot - d)]; }
        else { const w1 = R.int(1, 4), w2 = R.int(1, 4), a = R.int(1, d - 2), b = R.int(1, d - 1 - a); q = MX(w1, a, d) + ' + ' + MX(w2, b, d); tot = (w1 + w2) * d + a + b; sol = ['자연수끼리: ' + w1 + ' + ' + w2 + ' = ' + (w1 + w2), '분수끼리: ' + F(a, d) + ' + ' + F(b, d) + ' = ' + F(a + b, d)]; }
      } else if (R.chance(0.4)) {
        const w = R.int(2, 6), a = R.int(1, d - 1); q = w + ' − ' + F(a, d); tot = w * d - a; sol = [w + ' 에서 1을 빌려 ' + F(d, d) + ' (으)로 바꿔: ' + MX(w - 1, d, d), F(d, d) + ' − ' + F(a, d) + ' = ' + F(d - a, d)];
      } else {
        const w1 = R.int(2, 6), w2 = R.int(1, w1 - 1), b = R.int(2, d - 1), a = R.int(1, b - 1);
        q = MX(w1, a, d) + ' − ' + MX(w2, b, d); tot = w1 * d + a - w2 * d - b;
        sol = [F(a, d) + ' 에서 ' + F(b, d) + ' 을(를) 뺄 수 없어 → 자연수에서 1을 빌려: ' + MX(w1, a, d) + ' = ' + MX(w1 - 1, a + d, d), '자연수끼리: ' + (w1 - 1) + ' − ' + w2 + ' = ' + (w1 - 1 - w2), '분수끼리: ' + F(a + d, d) + ' − ' + F(b, d) + ' = ' + F(a + d - b, d)];
      }
      sol.push('답: ' + M.raw(tot, d));
      return { q: E(q), a: FR(tot, d, { wb: 1 }), hint: lv === 3 ? '분수끼리 뺄 수 없으면 자연수에서 1을 빌려 분수로 바꿔. (1 = ' + F(d, d) + ')' : '분모는 그대로 두고 분자끼리만 계산해. 자연수가 없으면 자연수 칸은 비워 둬.', sol };
    },
  });

  S({
    id: 'equiv', name: '약분', sub: '크기가 같은 분수 · 기약분수', strand: 'frac', grade: '5-1', pre: ['fracconv', 'factors'],
    lesson: [
      { t: '모양은 달라도 크기는 같아', h: F(1, 2) + ' 과(와) ' + F(2, 4) + ' 은(는) 크기가 같아.', v: ['bars2', 1, 2, 2, 4] },
      { t: '같은 수를 곱하거나 나눠', h: '분자와 분모에 <b>같은 수를 곱하거나</b>, <b>같은 수로 나누면</b> 크기가 같은 분수가 돼.<br>' + F(2, 3) + ' = ' + F('2×4', '3×4') + ' = ' + F(8, 12) },
      { t: '약분 = 간단하게 만들기', h: '분자와 분모를 <b>공약수로 나누는 것</b>이 약분이야.<br>' + F(12, 18) + ' → 둘 다 6으로 나눠 → ' + F(2, 3) + '<br>더 나눌 수 없는 분수를 <b>기약분수</b>라고 해.' },
      { t: '한 번에 하려면', h: '분자와 분모의 <b>최대공약수</b>로 나누면 한 번에 기약분수가 돼.<br>잘 모르겠으면 2, 3, 5 로 나눠지는 동안 계속 나눠도 괜찮아.' },
    ],
    gen(lv, R) {
      if (lv === 1) {
        const [n, d] = coprimeProper(R, 2, 7), k = R.int(2, 6), top = R.chance(0.5);
        return top
          ? { q: '□ 에 알맞은 수는?' + E(F(n, d) + ' = ' + F('□', d * k)), a: N(n * k), hint: '분모가 ' + d + ' 에서 ' + d * k + ' (으)로 몇 배가 됐는지 봐. 분자에도 같은 수를 곱해.', sol: ['분모: ' + d + ' × ' + k + ' = ' + d * k, '분자에도 ' + k + ' 을(를) 곱해: ' + n + ' × ' + k + ' = ' + n * k] }
          : { q: '□ 에 알맞은 수는?' + E(F(n * k, d * k) + ' = ' + F(n, '□')), a: N(d), hint: '분자가 ' + n * k + ' 에서 ' + n + ' (으)로 몇으로 나눠졌는지 봐. 분모도 같은 수로 나눠.', sol: ['분자: ' + n * k + ' ÷ ' + k + ' = ' + n, '분모도 ' + k + ' (으)로 나눠: ' + d * k + ' ÷ ' + k + ' = ' + d] };
      }
      const [n, d] = coprimeProper(R, lv === 2 ? 2 : 3, lv === 2 ? 7 : 9), k = lv === 2 ? R.int(2, 6) : R.pick([4, 6, 8, 9, 12]);
      return { q: '<b>기약분수</b>로 나타내 봐.' + E(F(n * k, d * k)), a: FR(n, d, { form: 'simplest' }), hint: '분자와 분모를 함께 나눌 수 있는 수(2, 3, 5 …)로 더 못 나눌 때까지 나눠.', sol: [n * k + ' 과(와) ' + d * k + ' 의 최대공약수는 ' + k, '분자: ' + n * k + ' ÷ ' + k + ' = ' + n + ', 분모: ' + d * k + ' ÷ ' + k + ' = ' + d, '답: ' + F(n, d)] };
    },
  });

  S({
    id: 'common', name: '통분', sub: '분모가 다른 분수의 크기 비교', strand: 'frac', grade: '5-1', pre: ['equiv', 'lcm'],
    lesson: [
      { t: '분모가 다르면 바로 비교할 수 없어', h: F(2, 3) + ' 과(와) ' + F(3, 4) + ' 은(는) 조각 크기가 달라서 분자만 봐선 몰라.<br>그래서 <b>분모를 같게</b> 만들어. 이걸 <b>통분</b>이라고 해.', v: ['bars2', 2, 3, 3, 4] },
      { t: '통분하는 방법', h: '두 분모 3과 4의 <b>최소공배수 12</b>를 공통분모로 해.<br>' + F(2, 3) + ' = ' + F('2×4', '3×4') + ' = ' + F(8, 12) + '<br>' + F(3, 4) + ' = ' + F('3×3', '4×3') + ' = ' + F(9, 12) },
      { t: '이제 비교할 수 있어', h: F(8, 12) + ' &lt; ' + F(9, 12) + ' 이니까 ' + F(2, 3) + ' &lt; ' + F(3, 4), v: ['bars2', 8, 12, 9, 12] },
      { t: '조심!', h: '분모에 곱한 수를 <b>분자에도 똑같이</b> 곱해야 해. 분모만 바꾸면 다른 분수가 돼 버려.' },
    ],
    gen(lv, R) {
      let n1, d1, n2, d2;
      do { [n1, d1] = coprimeProper(R, 2, lv === 3 ? 12 : 8); [n2, d2] = coprimeProper(R, 2, lv === 3 ? 12 : 8); } while (d1 === d2 || n1 * d2 === n2 * d1 || lcm(d1, d2) > (lv === 3 ? 72 : 40) || (lv === 1 && (lcm(d1, d2) === d1 || lcm(d1, d2) === d2)));
      const L = lcm(d1, d2), a = n1 * L / d1, b = n2 * L / d2;
      const sol = ['공통분모: ' + d1 + ' 과(와) ' + d2 + ' 의 최소공배수 ' + L, F(n1, d1) + ' = ' + F(n1 + '×' + L / d1, d1 + '×' + L / d1) + ' = ' + F(a, L), F(n2, d2) + ' = ' + F(n2 + '×' + L / d2, d2 + '×' + L / d2) + ' = ' + F(b, L)];
      if (lv === 1) return { q: '두 분수를 분모가 <b>' + L + '</b> 인 분수로 통분해 봐.' + E(F(n1, d1) + ' , ' + F(n2, d2)), a: P([N(a, { pre: F(n1, d1) + ' = ', frac: L }), N(b, { pre: F(n2, d2) + ' = ', frac: L })]), hint: '분모가 ' + L + ' 이(가) 되려면 몇을 곱해야 하는지 찾고, 분자에도 같은 수를 곱해.', sol };
      return { q: '○ 안에 알맞은 기호를 골라 봐.' + E(F(n1, d1) + ' ○ ' + F(n2, d2)), a: C(SIGN, cmp(a, b)), hint: '분모를 ' + L + ' (으)로 같게 만든 다음 분자를 비교해.', sol: sol.concat([a + ' ' + SIGN[cmp(a, b)] + ' ' + b + ' 이니까 ' + F(n1, d1) + ' ' + SIGN[cmp(a, b)] + ' ' + F(n2, d2)]) };
    },
  });

  S({
    id: 'fracadd2', name: '분수의 덧셈과 뺄셈 (2)', sub: '분모가 다른 분수', strand: 'frac', grade: '5-1', pre: ['common', 'fracadd1'],
    lesson: [
      { t: '먼저 통분!', h: '분모가 다르면 바로 더할 수 없어. <b>통분해서 분모를 같게</b> 만든 다음 분자끼리 계산해.' },
      { t: '예를 들어', h: F(1, 2) + ' + ' + F(1, 3) + '<br>공통분모 6 → ' + F(3, 6) + ' + ' + F(2, 6) + ' = ' + F(5, 6), v: ['bar', 5, 6] },
      { t: '마지막엔 약분', h: F(1, 6) + ' + ' + F(1, 3) + ' = ' + F(1, 6) + ' + ' + F(2, 6) + ' = ' + F(3, 6) + ' = ' + F(1, 2) + '<br>답은 <b>기약분수</b>로, 1보다 크면 <b>대분수</b>로 써.' },
      { t: '조심!', h: F(1, 2) + ' + ' + F(1, 3) + ' = ' + F(2, 5) + ' ✕<br>분자끼리, 분모끼리 그냥 더하면 절대 안 돼. 반쪽에 뭔가를 더했는데 반(' + F(1, 2) + ')보다 작아질 수는 없잖아?' },
    ],
    gen(lv, R) {
      let n1, d1, n2, d2, w1 = 0, w2 = 0;
      if (lv === 1) { d1 = R.int(2, 6); d2 = d1 * R.int(2, 3); n1 = R.int(1, d1 - 1); n2 = R.int(1, d2 - 1); }
      else { do { [n1, d1] = coprimeProper(R, 2, 9); [n2, d2] = coprimeProper(R, 2, 9); } while (d1 === d2 || lcm(d1, d2) > 45); }
      if (lv === 3) { w1 = R.int(2, 5); w2 = R.int(1, w1 - 1); }
      // 뺄셈인데 앞이 더 작으면 두 분수의 자리를 바꾼다
      if (lv < 3 && n1 * d2 < n2 * d1) [n1, d1, n2, d2] = [n2, d2, n1, d1];
      return this.finish(R.chance(0.5), n1, d1, n2, d2, w1, w2);
    },
    finish(plus, n1, d1, n2, d2, w1, w2) {
      const L = lcm(d1, d2), a = n1 * L / d1, b = n2 * L / d2;
      const x = w1 * L + a, y = w2 * L + b;
      if (!plus && x <= y) plus = true;
      const tot = plus ? x + y : x - y;
      const A = w1 ? MX(w1, n1, d1) : F(n1, d1), B = w2 ? MX(w2, n2, d2) : F(n2, d2);
      const A2 = w1 ? MX(w1, a, L) : F(a, L), B2 = w2 ? MX(w2, b, L) : F(b, L);
      const sol = ['공통분모: ' + d1 + ' 과(와) ' + d2 + ' 의 최소공배수 ' + L, '통분: ' + A2 + (plus ? ' + ' : ' − ') + B2];
      if (w1) sol.push('가분수로 바꿔서 계산하면: ' + F(x, L) + (plus ? ' + ' : ' − ') + F(y, L) + ' = ' + F(tot, L));
      else sol.push('분자끼리: ' + a + (plus ? ' + ' : ' − ') + b + ' = ' + tot + ' → ' + F(tot, L));
      sol.push('약분하고 대분수로 정리하면: ' + M.show(tot, L));
      return { q: E(A + (plus ? ' + ' : ' − ') + B), a: FR(tot, L, { form: 'simplest', wb: 1 }), hint: '먼저 분모를 ' + L + ' (으)로 통분해. 답은 약분해서 써. 자연수가 없으면 자연수 칸은 비워 둬.', sol };
    },
  });

  S({
    id: 'fracmul', name: '분수의 곱셈', sub: '분수 × 자연수 · 분수 × 분수', strand: 'frac', grade: '5-2', pre: ['equiv', 'fracconv'],
    lesson: [
      { t: '분수 × 자연수', h: F(2, 5) + ' × 3 은 ' + F(2, 5) + ' 을(를) 3번 더한 것.<br><b>분자에만</b> 곱해: ' + F('2×3', 5) + ' = ' + F(6, 5) + ' = ' + MX(1, 1, 5), v: ['bar', 6, 5] },
      { t: '분수 × 분수', h: '<b>분자끼리, 분모끼리</b> 곱해.<br>' + F(2, 3) + ' × ' + F(4, 5) + ' = ' + F('2×4', '3×5') + ' = ' + F(8, 15) },
      { t: '약분은 곱하기 전에', h: '곱하기 전에 위아래로 약분하면 수가 작아져서 편해.<br>' + F(3, 4) + ' × ' + F(2, 9) + ' → 3과 9를 3으로, 2와 4를 2로 나눠 → ' + F(1, 2) + ' × ' + F(1, 3) + ' = ' + F(1, 6) },
      { t: '대분수는 가분수로', h: '대분수가 있으면 <b>먼저 가분수로</b> 바꾼 다음 곱해.<br>' + MX(1, 1, 2) + ' × ' + F(2, 5) + ' = ' + F(3, 2) + ' × ' + F(2, 5) + ' = ' + F(3, 5) + '<br><br>1보다 작은 분수를 곱하면 원래 수보다 <b>작아져</b>.' },
    ],
    gen(lv, R) {
      if (lv === 1) {
        const [n, d] = coprimeProper(R, 2, 9), k = R.int(2, 9), first = R.chance(0.5);
        return { q: E(first ? F(n, d) + ' × ' + k : k + ' × ' + F(n, d)), a: FR(n * k, d, { form: 'simplest', wb: 1 }), hint: '자연수는 분자에만 곱해. 분모는 그대로! 답은 약분하고, 1보다 크면 대분수로 써.', sol: ['분자에 곱해: ' + F(n + '×' + k, d) + ' = ' + F(n * k, d), '정리하면: ' + M.show(n * k, d)] };
      }
      let n1, d1, n2, d2, A, B;
      if (lv === 2) { [n1, d1] = coprimeProper(R, 2, 9); [n2, d2] = coprimeProper(R, 2, 9); A = F(n1, d1); B = F(n2, d2); }
      else {
        const [a, b] = coprimeProper(R, 2, 6), w = R.int(1, 3); n1 = w * b + a; d1 = b; A = MX(w, a, b);
        if (R.chance(0.5)) { const [c, e] = coprimeProper(R, 2, 6), w2 = R.int(1, 2); n2 = w2 * e + c; d2 = e; B = MX(w2, c, e); }
        else { [n2, d2] = coprimeProper(R, 2, 9); B = F(n2, d2); }
      }
      const sol = [];
      if (lv === 3) sol.push('대분수를 가분수로: ' + F(n1, d1) + ' × ' + F(n2, d2));
      sol.push('분자끼리, 분모끼리: ' + F(n1 + '×' + n2, d1 + '×' + d2) + ' = ' + F(n1 * n2, d1 * d2));
      sol.push('약분해서 정리하면: ' + M.show(n1 * n2, d1 * d2));
      return { q: E(A + ' × ' + B), a: FR(n1 * n2, d1 * d2, { form: 'simplest', wb: 1 }), hint: (lv === 3 ? '대분수는 먼저 가분수로 바꿔. ' : '') + '분자끼리, 분모끼리 곱하고 약분해.', sol };
    },
  });

  S({
    id: 'fracdiv', name: '분수의 나눗셈', sub: '분수 ÷ 자연수 · 분수 ÷ 분수', strand: 'frac', grade: '6-1', pre: ['fracmul'],
    lesson: [
      { t: '자연수 ÷ 자연수 = 분수', h: '3 ÷ 4 = ' + F(3, 4) + '<br>나누어지는 수가 <b>분자</b>, 나누는 수가 <b>분모</b>로 가.<br>피자 3판을 4명이 나누면 한 명이 ' + F(3, 4) + ' 판!' },
      { t: '분수 ÷ 자연수', h: '÷ 2 는 "반으로 나누기" = × ' + F(1, 2) + ' 과(와) 같아.<br>' + F(3, 4) + ' ÷ 2 = ' + F(3, 4) + ' × ' + F(1, 2) + ' = ' + F(3, 8) },
      { t: '분수 ÷ 분수', h: '<b>나누는 분수를 뒤집어서 곱해.</b><br>' + F(3, 4) + ' ÷ ' + F(2, 5) + ' = ' + F(3, 4) + ' × ' + F(5, 2) + ' = ' + F(15, 8) + ' = ' + MX(1, 7, 8) },
      { t: '왜 뒤집을까?', h: F(6, 7) + ' ÷ ' + F(2, 7) + ' 은(는) "' + F(6, 7) + ' 안에 ' + F(2, 7) + ' 이(가) 몇 번 들어가나?"야.<br>6조각 안에 2조각은 3번 → <b>3</b><br>뒤집어 곱해도 ' + F(6, 7) + ' × ' + F(7, 2) + ' = 3 으로 같아.<br><br>뒤집는 것은 <b>나누는 수(뒤의 수)만</b>이야!' },
    ],
    gen(lv, R) {
      if (lv === 1) {
        if (R.chance(0.4)) { let a, b; do { a = R.int(1, 9); b = R.int(2, 9); } while (a % b === 0); return { q: E(a + ' ÷ ' + b), a: FR(a, b, { form: 'simplest', wb: 1 }), hint: '나누어지는 수를 분자에, 나누는 수를 분모에 써. 약분도 잊지 마.', sol: [a + ' ÷ ' + b + ' = ' + F(a, b), '정리하면: ' + M.show(a, b)] }; }
        const [n, d] = coprimeProper(R, 2, 9), k = R.int(2, 6);
        return { q: E(F(n, d) + ' ÷ ' + k), a: FR(n, d * k, { form: 'simplest', wb: 1 }), hint: '÷ ' + k + ' 은(는) × ' + F(1, k) + ' 과(와) 같아.', sol: [F(n, d) + ' ÷ ' + k + ' = ' + F(n, d) + ' × ' + F(1, k), '= ' + F(n, d * k), '정리하면: ' + M.show(n, d * k)] };
      }
      let n1, d1, n2, d2, A, B;
      if (lv === 2) {
        if (R.chance(0.35)) { d1 = d2 = R.int(4, 11); n2 = R.int(1, 3); n1 = Math.min(d1 - 1, n2 * R.int(2, 4)); if (n1 <= n2) n1 = d1 - 1; }
        else { [n1, d1] = coprimeProper(R, 2, 9); [n2, d2] = coprimeProper(R, 2, 9); }
        A = F(n1, d1); B = F(n2, d2);
      } else if (R.chance(0.4)) { n1 = R.int(2, 8); d1 = 1; [n2, d2] = coprimeProper(R, 2, 9); A = String(n1); B = F(n2, d2); }
      else { const [a, b] = coprimeProper(R, 2, 6), w = R.int(1, 3); n1 = w * b + a; d1 = b; A = MX(w, a, b);[n2, d2] = coprimeProper(R, 2, 9); B = F(n2, d2); }
      const sol = [];
      if (lv === 3 && d1 !== 1) sol.push('대분수를 가분수로: ' + F(n1, d1) + ' ÷ ' + F(n2, d2));
      sol.push('나누는 분수를 뒤집어 곱해: ' + (d1 === 1 ? n1 : F(n1, d1)) + ' × ' + F(d2, n2));
      sol.push('= ' + F(n1 * d2, d1 * n2));
      sol.push('정리하면: ' + M.show(n1 * d2, d1 * n2));
      return { q: E(A + ' ÷ ' + B), a: FR(n1 * d2, d1 * n2, { form: 'simplest', wb: 1 }), hint: '뒤의 분수(나누는 수)를 뒤집어서 곱셈으로 바꿔. 답이 자연수면 자연수 칸에만 써.', sol };
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
