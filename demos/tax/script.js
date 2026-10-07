/* 数と言 税理士事務所 — local-only demo interactions.
   Article text and base prices are available without JavaScript. */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const pad = n => String(n).padStart(2, '0');
  const number = n => Math.round(n).toLocaleString('ja-JP');
  const yen = n => `¥${number(n)}`;
  document.documentElement.classList.add('js');

  function initHeader() {
    const page = location.pathname.split('/').pop() || 'index.html';
    $$('.gnav a:not(.gnav-cta)').forEach(a => {
      if (a.getAttribute('href') === page) a.setAttribute('aria-current', 'page');
    });
  }

  // Fold calendar lines at UTF-8 byte boundaries (RFC 5545).
  function foldLine(line) {
    const enc = new TextEncoder();
    const out = [];
    let cur = '', bytes = 0;
    for (const ch of line) {
      const b = enc.encode(ch).length;
      if (bytes + b > 73) { out.push(cur); cur = ` ${ch}`; bytes = 1 + b; }
      else { cur += ch; bytes += b; }
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const stops = $$('.stop[data-date]', box);
    stops.forEach(stop => {
      const [y, m, d] = stop.dataset.date.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const days = Math.round((date - today) / 864e5);
      let label = days < 0 ? '開始・期限を過ぎた予定' : days === 0 ? '今日' : `あと${number(days)}日`;
      if (stop.dataset.precision === 'month') {
        const months = (y - today.getFullYear()) * 12 + m - 1 - today.getMonth();
        label = months < 0 ? '過去の予定' : months === 0 ? '今月' : `あと${months}か月`;
      }
      $('[data-left]', stop).textContent = label;
    });
    $$('[data-filter]', box).forEach(btn => btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      $$('[data-filter]', box).forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      stops.forEach(s => { s.hidden = filter !== 'all' && !s.dataset.tags.split(' ').includes(filter); });
      $('[data-agenda-status]', box).textContent = `${stops.filter(s => !s.hidden).length}件の予定`;
    }));
    $$('[data-ics-date]', box).forEach(btn => btn.addEventListener('click', () => {
      downloadICS(btn.dataset.icsDate, btn.dataset.icsTitle, btn.dataset.icsDesc);
    }));
  }

  function initPrice() {
    $$('[data-price]').forEach(sec => {
      const buttons = $$('[data-entity]', sec);
      const status = document.createElement('p');
      status.className = 'sr-only';
      status.setAttribute('role', 'status');
      sec.append(status);
      buttons.forEach(button => button.addEventListener('click', () => {
        const entity = button.dataset.entity;
        buttons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        $$('[data-sole][data-corp]', sec).forEach(el => {
          el.textContent = el.hasAttribute('data-amount') ? number(+el.dataset[entity]) : el.dataset[entity];
        });
        const prices = $$('[data-amount]', sec).map(el => `${el.textContent}円`).join('、');
        status.textContent = `${entity === 'corp' ? '会社' : '個人事業'}の年額です。年1回、3か月ごと、毎月の順に、${prices}。`;
      }));
    });
  }
  const PLAN = {
    sole: { year: [0, 132000], quarter: [16500, 66000], month: [27500, 66000] },
    corp: { year: [0, 330000], quarter: [33000, 165000], month: [55000, 165000] }
  };
  function initCalc() {
    const box = $('[data-calc]');
    if (!box) return;
    const value = name => $(`input[name="${name}"]:checked`, box).value;
    const render = () => {
      const [monthly, closing] = PLAN[value('c-entity')][value('c-freq')];
      const staff = +$('input[name="c-staff"]', box).value;
      const setup = $('input[name="c-setup"]', box).checked;
      $('[data-staff-out]', box).textContent = staff ? `${staff}人` : 'なし';
      const rows = [
        { label: monthly ? `顧問料（月 ${yen(monthly)} × 12）` : '顧問料（年1回プランはなし）', amount: monthly * 12 },
        { label: '決算・申告', amount: closing },
        { label: staff ? `年末調整（${staff}人）` : '年末調整（給与の支払いなし）', amount: staff ? 22000 + 1650 * staff : 0 },
        { label: '会計ソフトの初期設定（初年度のみ）', amount: setup ? 33000 : 0 }
      ];
      const first = rows.reduce((sum, row) => sum + row.amount, 0);
      $('[data-calc-first]', box).textContent = number(first);
      $('[data-calc-next]', box).textContent = number(first - rows[3].amount);
      const list = $('[data-calc-lines]', box);
      list.replaceChildren(...rows.map(row => {
        const li = document.createElement('li');
        li.className = `calc-line${row.amount ? '' : ' is-zero'}`;
        const label = document.createElement('span'); label.textContent = row.label;
        const cost = document.createElement('b'); cost.textContent = yen(row.amount);
        li.append(label, cost);
        return li;
      }));
    };
    box.addEventListener('input', render);
    render();
  }
  function initJump() {
    const nav = $('[data-jump]');
    if (!nav) return;
    const links = $$('a[href^="#"]', nav);
    const targets = links.map(a => document.getElementById(a.hash.slice(1)));
    let pending = false;
    const update = () => {
      pending = false;
      const line = nav.getBoundingClientRect().bottom + 45;
      let active = null;
      targets.forEach((target, i) => { if (target && target.getBoundingClientRect().top <= line) active = links[i]; });
      links.forEach(a => { if (a === active) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    };
    const queue = () => { if (!pending) { pending = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    update();
  }

  const SITU = { sole: '個人事業・フリーランスの税金', corp: '会社の経営・数字', legacy: '相続・贈与', succession: '事業承継', audit: '税務調査の連絡があった', other: 'まだ分からない・まず話を聞きたい' };
  const ENTITY = { sole: '個人事業', corp: '会社', none: '事業はしていない' };
  function initWizard() {
    const box = $('[data-wizard]');
    if (!box) return;
    const form = $('[data-wz-form]', box);
    const steps = $$('.wz-step', box);
    const labels = $$('[data-wz-label]', box);
    const result = $('[data-wz-result]', box);
    const memo = $('[data-memo]', box);
    const free = $('[data-w-free]', box);
    const status = $('[data-copy-status]', box);
    let index = 0;
    const param = new URLSearchParams(location.search).get('s');
    if (Object.prototype.hasOwnProperty.call(SITU, param)) {
      $(`input[name="w-situ"][value="${param}"]`, form).checked = true;
      const entity = param === 'legacy' ? 'none' : ['corp', 'succession'].includes(param) ? 'corp' : 'sole';
      $(`input[name="w-entity"][value="${entity}"]`, form).checked = true;
    }
    const focus = el => {
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
      const top = el.getBoundingClientRect().top;
      const headerBottom = $('[data-header]').getBoundingClientRect().bottom;
      if (top < headerBottom + 16 || top > innerHeight - 80) {
        el.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    };
    const show = (n, moveFocus = true) => {
      index = n;
      steps.forEach((step, i) => { step.hidden = i !== n; });
      labels.forEach((label, i) => {
        label.classList.toggle('is-on', i <= n);
        if (i === n) label.setAttribute('aria-current', 'step'); else label.removeAttribute('aria-current');
      });
      if (moveFocus) {
        const legend = $('legend', steps[n]);
        focus(legend);
      }
    };
    $$('[data-next]', box).forEach(b => b.addEventListener('click', () => show(Math.min(index + 1, steps.length - 1))));
    $$('[data-prev]', box).forEach(b => b.addEventListener('click', () => show(Math.max(index - 1, 0))));
    $$('[data-example]', box).forEach(b => b.addEventListener('click', () => { free.value = b.dataset.example; free.focus(); }));
    $('[data-finish]', box).addEventListener('click', () => {
      const situations = $$('input[name="w-situ"]:checked', form).map(i => SITU[i.value]);
      const entity = $('input[name="w-entity"]:checked', form).value;
      const way = $('input[name="w-way"]:checked', form).value;
      memo.textContent = [
        `【相談したいこと】${situations.length ? situations.join('／') : 'まだ決めていません'}`,
        `【事業の形】${ENTITY[entity]}`,
        `【面談の方法】${way}`,
        `【いちばん気になっていること】${free.value.trim() || '面談でお話しします'}`
      ].join('\n');
      form.hidden = true; result.hidden = false;
      labels.forEach(l => { l.classList.add('is-on'); l.removeAttribute('aria-current'); });
      focus($('h3', result));
    });
    $('[data-restart]', box).addEventListener('click', () => {
      form.hidden = false; result.hidden = true; status.textContent = ''; show(0);
    });
    $('[data-copy]', box).addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(memo.textContent);
        status.textContent = '相談メモをコピーしました。入力内容は送信されていません。';
      } catch {
        const range = document.createRange(); range.selectNodeContents(memo);
        const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
        status.textContent = '相談メモを選択しました。端末のコピー操作を使ってください。';
      }
    });
    show(0, false);
  }
  function initPrep() {
    const box = $('[data-prep]');
    if (!box) return;
    const tabs = $$('[role="tab"]', box);
    const panels = $$('[role="tabpanel"]', box);
    const select = tab => {
      tabs.forEach(t => { t.setAttribute('aria-selected', String(t === tab)); t.tabIndex = t === tab ? 0 : -1; });
      panels.forEach(p => { p.hidden = p.id !== tab.getAttribute('aria-controls'); });
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', e => {
        const next = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i + tabs.length - 1) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
        if (next < 0) return;
        e.preventDefault(); tabs[next].focus(); select(tabs[next]);
      });
    });
    const param = new URLSearchParams(location.search).get('s');
    select(tabs.find(t => t.dataset.key === param) || tabs[0]);
    panels.forEach(panel => {
      const boxes = $$('input[type="checkbox"]', panel);
      const render = () => {
        const checked = boxes.filter(b => b.checked).length;
        $('[data-prep-count]', panel).textContent = `${boxes.length}項目のうち${checked}項目にチェックがついています。そろっていなくても相談できます。`;
      };
      boxes.forEach(b => b.addEventListener('change', render)); render();
    });
  }
  function initGlossary() {
    const box = $('[data-glossary]');
    if (!box) return;
    const input = $('[data-gl-filter]', box);
    const items = $$('.gl-item', box);
    const norm = s => s.normalize('NFKC').toLowerCase().replace(/[ァ-ン]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
    const index = items.map(li => norm(li.textContent + (li.dataset.kana || '')));
    const render = () => {
      const query = norm(input.value.trim());
      items.forEach((item, i) => { item.hidden = !!query && !index[i].includes(query); });
      const count = items.filter(item => !item.hidden).length;
      $('[data-gl-count]', box).textContent = query ? `${items.length}語のうち${count}語` : `${count}語`;
      $('[data-gl-empty]', box).hidden = count !== 0;
    };
    input.addEventListener('input', render); render();
  }
  [initHeader, initAgenda, initPrice, initCalc, initJump, initWizard, initPrep, initGlossary].forEach(init => init());
})();
