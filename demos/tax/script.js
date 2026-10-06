/* 数と言 税理士事務所 — 制作デモ（v2）
   各機能は、対象の要素があるページでだけ動きます。JavaScriptがなくても本文・料金・注釈はすべて読めます。 */
(() => {
  'use strict';
  window.KT_READY = true;

  const root = document.documentElement;
  root.classList.add('js');
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduce = () => RM.matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const pad = n => String(n).padStart(2, '0');
  const yen = n => `¥${Math.round(n).toLocaleString('ja-JP')}`;
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateLabel = d => `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
  const session = {
    get(k) { try { return window.sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { window.sessionStorage.setItem(k, v); } catch { /* storage unavailable: keep in memory only */ } }
  };

  /* One rAF-throttled scroll/resize loop shared by every module. */
  const onFrame = [];
  let ticking = false;
  const tick = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; onFrame.forEach(fn => fn()); });
  };
  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', tick);

  /* ---------- Header ---------- */
  function initHeader() {
    const hd = $('[data-header]');
    if (!hd) return;
    const page = location.pathname.split('/').pop() || 'index.html';
    $$('.gnav a:not(.gnav-cta)', hd).forEach(a => { if (a.getAttribute('href') === page) a.setAttribute('aria-current', 'page'); });
    onFrame.push(() => hd.classList.toggle('is-scrolled', window.scrollY > 8));
  }

  /* ---------- Headings revealed line by line (split at <br>) ---------- */
  function initLines() {
    $$('.rv-line').forEach(el => {
      const lines = [[]];
      Array.from(el.childNodes).forEach(n => { if (n.nodeName === 'BR') lines.push([]); else lines[lines.length - 1].push(n); });
      el.textContent = '';
      lines.forEach((nodes, i) => {
        const line = document.createElement('span');
        line.className = 'l';
        const inner = document.createElement('span');
        inner.style.setProperty('--li', i);
        nodes.forEach(n => inner.append(n));
        line.append(inner);
        el.append(line);
      });
    });
  }

  /* ---------- Numbers ---------- */
  function countTo(el, to, dur = 1200, fmt = yen) {
    if (reduce()) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function countUp(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    const raw = el.dataset.count;
    const dec = (raw.split('.')[1] || '').length;
    countTo(el, parseFloat(raw), 1400, v => (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('ja-JP')));
  }
  /* Rolling digits for prices. Screen readers get the plain number from .sr-only. */
  function odometer(el, value, instant = false) {
    const str = Math.round(value).toLocaleString('ja-JP');
    let sr = $('.sr-only', el);
    let od = $('.od', el);
    if (!od) {
      el.textContent = '';
      sr = document.createElement('span');
      sr.className = 'sr-only';
      od = document.createElement('span');
      od.className = 'od';
      od.setAttribute('aria-hidden', 'true');
      el.append(sr, od);
    }
    sr.textContent = str;
    const chars = Array.from(str);
    const sig = chars.map(c => (/\d/.test(c) ? 'd' : c)).join('');
    if (od.dataset.sig !== sig) {
      od.textContent = '';
      chars.forEach((c, i) => {
        if (/\d/.test(c)) {
          const d = document.createElement('span');
          d.className = 'od-d';
          const s = document.createElement('span');
          s.className = 'od-s';
          s.style.setProperty('--k', i);
          for (let n = 0; n < 10; n++) { const x = document.createElement('span'); x.textContent = n; s.append(x); }
          d.append(s);
          od.append(d);
        } else {
          const x = document.createElement('span');
          x.className = 'od-c';
          x.textContent = c;
          od.append(x);
        }
      });
      od.dataset.sig = sig;
      instant = true;
    }
    const strips = $$('.od-s', od);
    let k = 0;
    chars.forEach(c => {
      if (!/\d/.test(c)) return;
      const s = strips[k++];
      if (instant || reduce()) s.style.transition = 'none';
      s.style.transform = `translateY(${-Number(c)}em)`;
      if (instant || reduce()) { void s.offsetWidth; s.style.transition = ''; }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    const counters = $$('[data-count]');
    if (!reduce()) counters.forEach(c => { const dec = (c.dataset.count.split('.')[1] || '').length; c.textContent = dec ? (0).toFixed(dec) : '0'; });
    const targets = $$('.rv, .rv-line, .photo, [data-draw], .rail');
    const show = el => { el.classList.add('is-in'); $$('[data-count]', el).forEach(countUp); };
    if (!('IntersectionObserver' in window) || reduce()) { targets.forEach(show); counters.forEach(countUp); return; }
    const watch = new Map();
    targets.forEach(t => {
      const w = t.matches('.photo') ? t.parentElement : t; /* a clipped element reports no intersection */
      if (!watch.has(w)) watch.set(w, []);
      watch.get(w).push(t);
    });
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      (watch.get(e.target) || []).forEach(show);
      io.unobserve(e.target);
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    watch.forEach((_, w) => io.observe(w));
  }

  /* ---------- Hero board: transactions arrive → AI sorts → one sentence ---------- */
  function initBoard() {
    const board = $('[data-board]');
    if (!board) return;
    const stage = $('[data-stage]', board);
    const scatter = $('[data-scatter]', board);
    const lists = $$('[data-col]', board);
    const chips = $$('.chip', board);
    const homes = new Map(chips.map(c => [c, c.parentElement]));
    const steps = $$('.board-steps li', board);
    const totals = $$('[data-total]', board);
    let running = false;

    const setStep = n => steps.forEach((s, i) => s.classList.toggle('is-on', i < n));
    const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
    const finish = () => {
      board.classList.remove('is-pending');
      board.classList.add('is-sorted', 'is-verdict', 'is-done');
      totals.forEach(t => { t.textContent = yen(+t.dataset.total); });
      setStep(3);
    };

    async function run() {
      if (running) return;
      running = true;
      board.classList.remove('is-sorted', 'is-verdict', 'is-done');
      setStep(1);
      lists.forEach(l => { l.style.minHeight = ''; l.style.minHeight = `${l.offsetHeight}px`; });
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const cw = lists[0].clientWidth;
      totals.forEach(t => { t.textContent = '¥0'; });
      let seed = 11;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      chips.forEach(c => {
        const h = c.offsetHeight;
        scatter.append(c);
        c.style.width = `${cw}px`;
        c.style.left = `${rnd() * Math.max(0, W - cw)}px`;
        c.style.top = `${rnd() * Math.max(0, H * 0.78 - h)}px`;
        c.style.rotate = `${(rnd() - 0.5) * 14}deg`;
      });
      board.classList.remove('is-pending');
      chips.forEach((c, i) => c.animate(
        [{ opacity: 0, transform: 'translateY(-28px) scale(.96)' }, { opacity: 1, transform: 'none' }],
        { duration: 520, delay: i * 60, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }
      ));
      await wait(chips.length * 60 + 750);

      setStep(2);
      const first = new Map(chips.map(c => [c, { ...center(c), r: parseFloat(c.style.rotate) || 0 }]));
      chips.forEach(c => { c.style.cssText = ''; homes.get(c).append(c); });
      chips.forEach((c, i) => {
        const a = first.get(c);
        const b = center(c);
        c.animate(
          [{ transform: `translate(${a.x - b.x}px, ${a.y - b.y}px) rotate(${a.r}deg)` }, { transform: 'none' }],
          { duration: 780, delay: i * 45, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'backwards' }
        );
      });
      await wait(chips.length * 45 + 650);

      board.classList.add('is-sorted');
      totals.forEach(t => countTo(t, +t.dataset.total, 900));
      await wait(1050);
      setStep(3);
      board.classList.add('is-verdict');
      await wait(900);
      board.classList.add('is-done');
      lists.forEach(l => { l.style.minHeight = ''; });
      running = false;
    }

    if (reduce() || !('IntersectionObserver' in window)) { finish(); return; }
    board.classList.add('is-pending');
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      window.setTimeout(run, 350);
    }, { threshold: 0.35 });
    io.observe(board);
    $('[data-replay]', board).addEventListener('click', run);
  }

  /* ---------- Shift: one pass of data through the three roles ---------- */
  function initFlow() {
    const flow = $('[data-flow]');
    if (!flow) return;
    const run = () => { flow.classList.remove('is-run'); void flow.offsetWidth; flow.classList.add('is-run'); };
    if (!reduce() && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.45 });
      io.observe(flow);
    }
    const btn = $('[data-flow-replay]');
    if (btn) btn.addEventListener('click', run);
  }

  /* ---------- Agenda rail: distance from today, filters, calendar files ---------- */
  function foldLine(line) {
    const enc = new TextEncoder();
    const out = [];
    let cur = '';
    let bytes = 0;
    for (const ch of line) {
      const b = enc.encode(ch).length;
      if (bytes + b > 73) { out.push(cur); cur = ` ${ch}`; bytes = 1 + b; } else { cur += ch; bytes += b; }
    }
    out.push(cur);
    return out.join('\r\n');
  }
  function downloadICS(date, title, desc) {
    const next = new Date(+date.slice(0, 4), +date.slice(4, 6) - 1, +date.slice(6, 8) + 1);
    const end = `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`;
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const esc = s => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KAZU TO KOTO//FICTIONAL DEMO//JA', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT', `UID:${date}-${Math.random().toString(36).slice(2)}@kazutokoto.invalid`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${date}`, `DTEND;VALUE=DATE:${end}`, `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(desc)}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(title)}`, 'TRIGGER:-P7D', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ].map(foldLine);
    const url = URL.createObjectURL(new Blob([`${lines.join('\r\n')}\r\n`], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `kazutokoto-${date}.ics`;
    document.body.append(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function initAgenda() {
    const box = $('[data-agenda]');
    if (!box) return;
    const rail = $('[data-rail]', box);
    const stops = $$('.stop[data-date]', box);
    const todayStop = $('.stop-today', box);
    const status = $('[data-agenda-status]', box);
    const prev = $('[data-rail-prev]', box);
    const next = $('[data-rail-next]', box);
    const prog = $('[data-rail-progress]', box);
    const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
    $$('[data-today]', box).forEach(el => { el.textContent = dateLabel(today); });

    stops.forEach((s, i) => {
      s.style.setProperty('--i', i + 1);
      const days = Math.round((parse(s.dataset.date) - today) / 864e5);
      const left = $('[data-left]', s);
      if (days < 0) { left.textContent = '過ぎました'; s.classList.add('is-past'); }
      else if (s.dataset.precision === 'month') left.textContent = days < 31 ? '今月' : `あと約${Math.round(days / 30.4)}か月`;
      else left.textContent = days === 0 ? '今日' : days === 1 ? 'あした' : `あと${days.toLocaleString('ja-JP')}日`;
      left.classList.toggle('is-soon', days >= 0 && days <= 30);
    });
    const firstFuture = stops.find(s => !s.classList.contains('is-past'));
    if (todayStop && firstFuture) firstFuture.before(todayStop);

    const speed = () => (reduce() ? 'auto' : 'smooth');
    const stepWidth = () => { const s = stops.find(x => !x.hidden); return s ? s.getBoundingClientRect().width : 300; };
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      if (prog) prog.style.setProperty('--p', Math.min(1, (rail.scrollLeft + rail.clientWidth) / rail.scrollWidth).toFixed(3));
      if (prev) prev.disabled = rail.scrollLeft < 4;
      if (next) next.disabled = rail.scrollLeft > max - 4;
    };
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    if (prev) prev.addEventListener('click', () => rail.scrollBy({ left: -stepWidth(), behavior: speed() }));
    if (next) next.addEventListener('click', () => rail.scrollBy({ left: stepWidth(), behavior: speed() }));

    /* Drag to scroll with a mouse (touch and trackpads scroll natively). */
    let drag = null;
    rail.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('button, a')) return;
      drag = { x: e.clientX, left: rail.scrollLeft, moved: false };
    });
    window.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4) { drag.moved = true; rail.classList.add('is-dragging'); }
      rail.scrollLeft = drag.left - dx;
    });
    window.addEventListener('pointerup', () => { drag = null; rail.classList.remove('is-dragging'); });

    $$('[data-filter]', box).forEach(btn => btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      $$('[data-filter]', box).forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      let n = 0;
      stops.forEach(s => {
        const on = f === 'all' || s.dataset.tags.split(' ').includes(f);
        s.hidden = !on;
        if (on) n += 1;
      });
      status.textContent = `${n}件の予定`;
      rail.scrollTo({ left: 0, behavior: speed() });
      window.setTimeout(update, 50);
    }));

    $$('.ics', box).forEach(btn => btn.addEventListener('click', () => {
      downloadICS(btn.dataset.icsDate, btn.dataset.icsTitle, btn.dataset.icsDesc);
      btn.classList.add('is-done');
      btn.textContent = 'ファイルを保存しました';
    }));
    update();
  }

  /* ---------- Plans: individual / company switch with rolling prices ---------- */
  function initPrice() {
    $$('[data-price]').forEach(sec => {
      const btns = $$('[data-entity]', sec);
      const odos = $$('[data-odo]', sec);
      const texts = $$('[data-sole][data-corp]:not([data-odo])', sec);
      const current = (btns.find(b => b.getAttribute('aria-pressed') === 'true') || btns[0]).dataset.entity;
      odos.forEach(o => odometer(o, +o.dataset[current], true));
      btns.forEach(b => b.addEventListener('click', () => {
        const ent = b.dataset.entity;
        btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        odos.forEach(o => odometer(o, +o.dataset[ent]));
        texts.forEach(t => { t.textContent = t.dataset[ent]; });
      }));
    });
  }

  /* ---------- Fee estimate (services page) ---------- */
  const PLAN = {
    sole: { year: [0, 132000], quarter: [16500, 66000], month: [27500, 66000] },
    corp: { year: [0, 330000], quarter: [33000, 165000], month: [55000, 165000] }
  };
  const FEE = { yearendBase: 22000, yearendPer: 1650, setup: 33000 };
  function initCalc() {
    const box = $('[data-calc]');
    if (!box) return;
    const val = name => { const el = $(`input[name="${name}"]:checked`, box); return el ? el.value : ''; };
    const staffIn = $('input[name="c-staff"]', box);
    const staffOut = $('[data-staff-out]', box);
    const setupIn = $('input[name="c-setup"]', box);
    const firstEl = $('[data-calc-first]', box);
    const nextEl = $('[data-calc-next]', box);
    const linesEl = $('[data-calc-lines]', box);
    const bar = $('[data-calc-bar]', box);
    let initial = true;
    const render = () => {
      const [monthly, closing] = PLAN[val('c-entity')][val('c-freq')];
      const staff = +staffIn.value;
      staffOut.textContent = staff ? `${staff}人` : 'なし';
      const rows = [
        { key: 'retainer', label: monthly ? `顧問料（月 ${yen(monthly)} × 12）` : '顧問料（年1回プランはなし）', amount: monthly * 12 },
        { key: 'closing', label: '決算・申告', amount: closing },
        { key: 'yearend', label: staff ? `年末調整（${staff}人）` : '年末調整（給与の支払いなし）', amount: staff ? FEE.yearendBase + FEE.yearendPer * staff : 0 },
        { key: 'setup', label: '会計ソフトの初期設定（初年度のみ）', amount: setupIn.checked ? FEE.setup : 0 }
      ];
      const first = rows.reduce((s, r) => s + r.amount, 0);
      const next = first - rows[3].amount;
      odometer(firstEl, first, initial);
      odometer(nextEl, next, initial);
      linesEl.textContent = '';
      rows.forEach(r => {
        const li = document.createElement('li');
        li.className = `calc-line is-${r.key}${r.amount ? '' : ' is-zero'}`;
        const a = document.createElement('span');
        a.textContent = r.label;
        const b = document.createElement('b');
        b.textContent = yen(r.amount);
        li.append(a, b);
        linesEl.append(li);
      });
      rows.forEach(r => { const seg = $(`[data-seg="${r.key}"]`, bar); if (seg) seg.style.flexGrow = String(first ? r.amount / first : 0); });
      initial = false;
    };
    box.addEventListener('input', render);
    box.addEventListener('change', render);
    render();
  }

  /* ---------- Services page: section index that follows the reader ---------- */
  function initJump() {
    const nav = $('[data-jump]');
    if (!nav) return;
    const inner = $('.jump-in', nav);
    const ind = $('.jump-ind', nav);
    const links = $$('a[href^="#"]', nav);
    const targets = links.map(a => document.getElementById(a.hash.slice(1)));
    let cur = null;
    const place = a => {
      ind.style.width = `${a.offsetWidth}px`;
      ind.style.transform = `translateX(${a.offsetLeft}px)`;
      if (inner.scrollWidth > inner.clientWidth) inner.scrollTo({ left: a.offsetLeft - 24, behavior: reduce() ? 'auto' : 'smooth' });
    };
    const update = () => {
      const line = nav.getBoundingClientRect().bottom + 40;
      let act = null;
      targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top <= line) act = links[i]; });
      if (act === cur) return;
      links.forEach(a => a.removeAttribute('aria-current'));
      if (act) { act.setAttribute('aria-current', 'true'); place(act); }
      nav.classList.toggle('has-active', Boolean(act));
      cur = act;
    };
    onFrame.push(update);
    window.addEventListener('resize', () => { if (cur) place(cur); });
    update();
  }

  /* ---------- Consult page: three questions → a memo to send ---------- */
  const SITU = {
    sole: '個人事業・フリーランスの税金',
    corp: '会社の経営・数字',
    legacy: '相続・贈与',
    succession: '事業承継',
    audit: '税務調査の連絡があった',
    other: 'まだ分からない・まず話を聞きたい'
  };
  const ENTITY = { sole: '個人事業', corp: '会社', none: '事業はしていない' };
  function initWizard() {
    const box = $('[data-wizard]');
    if (!box) return;
    const form = $('[data-wz-form]', box);
    const steps = $$('.wz-step', box);
    const labels = $$('[data-wz-label]', box);
    const bar = $('[data-wz-bar]', box);
    const result = $('[data-wz-result]', box);
    const memo = $('[data-memo]', box);
    const free = $('[data-w-free]', box);
    const copyBtn = $('[data-copy]', box);
    const copyStatus = $('[data-copy-status]', box);
    let idx = 0;

    const param = new URLSearchParams(location.search).get('s');
    if (param && Object.prototype.hasOwnProperty.call(SITU, param)) {
      const input = $(`input[name="w-situ"][value="${param}"]`, form);
      if (input) input.checked = true;
      if (param === 'legacy') $('input[name="w-entity"][value="none"]', form).checked = true;
    }

    const show = (n, moveFocus = true) => {
      idx = n;
      steps.forEach((s, i) => { s.classList.toggle('is-active', i === n); s.hidden = i !== n; });
      labels.forEach((l, i) => { l.classList.toggle('is-on', i <= n); l.classList.toggle('is-done', i < n); });
      bar.style.setProperty('--p', ((n + 1) / (steps.length + 1)).toFixed(3));
      const focusTarget = $('legend', steps[n]);
      if (moveFocus && focusTarget) { focusTarget.setAttribute('tabindex', '-1'); focusTarget.focus({ preventScroll: true }); }
    };
    const compose = () => {
      const situ = $$('input[name="w-situ"]:checked', form).map(i => SITU[i.value]);
      const ent = $('input[name="w-entity"]:checked', form);
      const way = $('input[name="w-way"]:checked', form);
      const lines = [
        `【相談したいこと】${situ.length ? situ.join('／') : 'まだ決めていません'}`,
        `【事業の形】${ent ? ENTITY[ent.value] : '未回答'}`,
        `【面談の方法】${way ? way.value : 'どちらでも'}`,
        `【いちばん気になっていること】${free.value.trim() || '面談でお話しします'}`
      ];
      memo.textContent = lines.join('\n');
    };
    $$('[data-next]', box).forEach(b => b.addEventListener('click', () => show(Math.min(idx + 1, steps.length - 1))));
    $$('[data-prev]', box).forEach(b => b.addEventListener('click', () => show(Math.max(idx - 1, 0))));
    $$('[data-example]', box).forEach(b => b.addEventListener('click', () => {
      free.value = b.dataset.example;
      free.focus();
    }));
    $('[data-finish]', box).addEventListener('click', () => {
      compose();
      form.hidden = true;
      result.hidden = false;
      labels.forEach(l => l.classList.add('is-on', 'is-done'));
      bar.style.setProperty('--p', '1');
      box.classList.add('is-result');
      const h = $('h3', result);
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    });
    $('[data-restart]', box).addEventListener('click', () => {
      form.hidden = false;
      result.hidden = true;
      box.classList.remove('is-result');
      copyStatus.textContent = '';
      show(0);
    });
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(memo.textContent);
        copyStatus.textContent = '相談メモをコピーしました。フォームやメール、LINEに貼り付けて使えます。';
      } catch {
        const range = document.createRange();
        range.selectNodeContents(memo);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        copyStatus.textContent = '相談メモを選択しました。端末のコピー操作を使ってください。';
      }
    });
    steps.forEach((s, i) => { s.hidden = i !== 0; });
    show(0, false);
  }

  /* ---------- Consult page: what to prepare (tabs + stamps) ---------- */
  function initPrep() {
    const box = $('[data-prep]');
    if (!box) return;
    const tabs = $$('[role="tab"]', box);
    const panels = $$('[role="tabpanel"]', box);
    const select = tab => {
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(p => { p.hidden = p.id !== tab.getAttribute('aria-controls'); });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => {
        const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        const n = tabs[(i + dir + tabs.length) % tabs.length];
        n.focus();
        select(n);
      });
    });
    const param = new URLSearchParams(location.search).get('s');
    const start = tabs.find(t => t.dataset.key === param) || tabs[0];
    select(start);
    panels.forEach(p => {
      const boxes = $$('input[type="checkbox"]', p);
      const out = $('[data-prep-count]', p);
      const update = () => {
        const n = boxes.filter(b => b.checked).length;
        const need = boxes.filter(b => !b.closest('li').hasAttribute('data-optional') && !b.checked).length;
        out.textContent = n === 0 ? `${boxes.length}項目。手元にあるものに印をつけてください。` : need === 0 ? `必要なものはそろいました（${n}/${boxes.length}）。` : `${n}/${boxes.length}。あと${need}つ、あると話が早いものがあります。`;
      };
      boxes.forEach(b => b.addEventListener('change', update));
      update();
    });
  }

  /* ---------- Consult page: glossary filter ---------- */
  function initGlossary() {
    const box = $('[data-glossary]');
    if (!box) return;
    const input = $('[data-gl-filter]', box);
    const items = $$('.gl-item', box);
    const count = $('[data-gl-count]', box);
    const empty = $('[data-gl-empty]', box);
    const norm = s => s.normalize('NFKC').toLowerCase().replace(/[ァ-ン]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
    const index = items.map(li => norm(li.textContent + (li.dataset.kana || '')));
    const update = () => {
      const q = norm(input.value.trim());
      let n = 0;
      items.forEach((li, i) => { const on = !q || index[i].includes(q); li.hidden = !on; if (on) n += 1; });
      count.textContent = q ? `${items.length}語のうち${n}語` : `${items.length}語`;
      empty.hidden = n !== 0;
    };
    input.addEventListener('input', update);
    update();
  }

  /* ---------- Design-rationale layer ---------- */
  const DN = {
    hero: ['プレインランゲージ（ISO 24495-1）', '最初の2行で「誰の・何の事務所か」を言い切る', '見出しは事務所の立場（入力はAI、判断は税理士）を、そのまま一文にしました。説明文とボタンは、読み手の次の行動（予約・料金）に絞っています。'],
    board: ['二重符号化・具体例の効果', '「数字を言葉にする」を、見て分かる形に', '12件の明細がAIに分類され、最後に1つの文と「次にすること」になるまでを4秒で見せます。抽象的な説明より、具体例のほうが理解と記憶に残ります。5秒以内で止まり、もう一度見ることもできます。'],
    sits: ['情報アーキテクチャ（再認は再生より易しい）', 'サービス名ではなく、状況で選ぶ', '「法人成り」などの業務名ではなく、相談者自身の状況と言葉で入口を分けています。料金の目安も同じ場所に置き、ページを行き来する回数を減らします。'],
    shift: ['サービスデザイン（サービス・ブループリント）', '裏側の分担を、表に出す', '事務所の中で行う作業を「ソフト・AI／あなた／税理士」に分けて公開し、依頼の前に役割の期待をそろえます。灰は自動、青緑は人の判断という色の意味を、サイト全体で統一しています。'],
    agenda: ['行動経済学（現在バイアス・実行意図）', '期限を「今日からの距離」で示す', '遠い期限は後回しにされがちです。「あと◯日」で距離を示し、1週間前のお知らせつきのカレンダーファイルで「いつやるか」を先に決められるようにしました。'],
    price: ['行動経済学（価格の透明性・比較のしやすさ）', '月額ではなく「年間の合計」で比べる', '月額だけを大きく見せると、決算料などの追加で後から高く感じます。年間の合計を主役にし、内訳を下に書きました。「迷ったら、これ」には理由を添え、選ぶ根拠を示しています。'],
    msg: ['信頼の形成', '専門用語への姿勢を、代表の言葉で', '「専門用語を使わない」ではなく「訳す」という方針を示し、サイト全体の注釈ルールの理由にしています。'],
    jump: ['ウェイファインディング', '現在地を、常に示す', 'ページ上部の目次が、読んでいる場所に合わせて動きます。長いページでも、いまどこを読んでいるかと、残りが分かります。'],
    plans: ['選択アーキテクチャ', '3つに絞り、違いは1つ（頻度）だけ', 'プランの違いを「数字を確かめる頻度」だけにし、比較の軸を1つにしました。選択肢の違いが多いほど、選ぶ負担が増えるためです。'],
    calc: ['行動経済学（曖昧さの解消）', '自分の条件で、合計がすぐ分かる', '料金が分からないことは、問い合わせをためらう大きな理由です。条件を変えると、初年度と2年目以降の合計、内訳の比率がその場で変わります。'],
    svc: ['一貫性とチャンク化', 'どのサービスも、同じ順番で書く', 'すべてのサービスを「こんなとき→すること→期限→料金」の順に固定しています。2つ目からは、構成を覚え直さずに読めます。詳しい説明は開閉式にしました。'],
    months: ['時間の可視化', '3・4・10か月を1本の線に', '相続の期限は種類が多く、別々に書くと前後関係が分かりません。1本の線と文章の両方で示し、税理士が担当しない期限も同じ場所に置きました。'],
    flow3: ['期待のマネジメント', '「依頼を決める時点」を明記する', '相談と依頼の境目が曖昧だと、相談そのものをためらいます。見積りを見た後に決められることを、手順の中で強調しています。'],
    wizard: ['摩擦の削減', '最初の連絡文を、3つの質問でつくる', '問い合わせで一番難しいのは「何を書くか」です。選ぶだけで相談メモができ、事務所側も必要な情報を最初に受け取れます。選んだ内容は送信・保存しません。'],
    prep: ['心理的ハードルの低減', '「なくても大丈夫」を明示する', '準備が足りないと感じると、相談は先延ばしにされます。必須でない資料を明示し、そろったものに印がつく達成感で準備を前に進めます。'],
    glossary: ['情報アーキテクチャ（複数の探し方）', '本文の注釈と、用語集の両方で', '本文では用語のすぐ後に説明を添え、ここでは全用語を一覧・検索できます。カタカナとひらがなの違いは区別せずに探せます。'],
    faq: ['プログレッシブ・ディスクロージャー', '詳しい答えは、開いたときに', '質問だけを並べて全体を見渡せるようにし、答えは必要な人が開いて読む形にしています。']
  };
  function initDesignNotes() {
    const btn = $('[data-dn-toggle]');
    if (!btn) return;
    let built = false;
    const build = () => {
      let k = 0;
      const seen = new Set();
      $$('[data-design]').forEach(el => {
        const d = DN[el.dataset.design];
        if (!d || seen.has(el.dataset.design)) return;
        seen.add(el.dataset.design);
        k += 1;
        const det = document.createElement('details');
        det.className = 'dn';
        det.style.setProperty('--k', k);
        const sum = document.createElement('summary');
        const no = document.createElement('span');
        no.className = 'dn-no';
        no.textContent = `根拠 ${pad(k)}`;
        sum.append(no, document.createTextNode(d[1]));
        const body = document.createElement('div');
        body.className = 'dn-body';
        const th = document.createElement('span');
        th.className = 'dn-theory';
        th.textContent = d[0];
        body.append(th, document.createTextNode(d[2]));
        det.append(sum, body);
        el.append(det);
      });
      built = true;
    };
    const toast = () => {
      if (session.get('kt2-dn-toast')) return;
      session.set('kt2-dn-toast', '1');
      const t = document.createElement('p');
      t.className = 'dn-toast';
      t.setAttribute('role', 'status');
      t.textContent = '各パーツの右上に、國分Web製作所が設計に使った考え方を表示しました。示している理論は設計の根拠で、このデモで効果を測定したものではありません。';
      document.body.append(t);
      window.setTimeout(() => t.remove(), 7000);
    };
    const set = (on, announce) => {
      if (on && !built) build();
      root.classList.toggle('show-dn', on);
      btn.setAttribute('aria-pressed', String(on));
      btn.textContent = on ? '設計の根拠を隠す' : '設計の根拠を表示';
      session.set('kt2-dn', on ? '1' : '0');
      if (on && announce) toast();
    };
    btn.addEventListener('click', () => set(!root.classList.contains('show-dn'), true));
    if (session.get('kt2-dn') === '1') set(true, false);
  }

  const start = () => {
    initHeader();
    initLines();
    initBoard();
    initReveal();
    initFlow();
    initAgenda();
    initPrice();
    initCalc();
    initJump();
    initWizard();
    initPrep();
    initGlossary();
    initDesignNotes();
    tick();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
