// Menu, lead form (WhatsApp + Netlify Forms), open-now status, due-date calendar, tax calculator, scroll reveal.
(() => {
  const WA = '919971992189';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = t => 1 - (1 - t) ** 3;
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  // Animate an element's number from its last value to `to`, formatted by `fmt`
  const tween = (el, to, fmt, ms = 500) => {
    const from = el._v ?? to;
    el._v = to;
    cancelAnimationFrame(el._raf);
    if (still || from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = now => {
      const t = Math.min((now - t0) / ms, 1);
      el.textContent = fmt(from + (to - from) * ease(t));
      if (t < 1) el._raf = requestAnimationFrame(step);
    };
    el._raf = requestAnimationFrame(step);
  };

  // Mobile menu
  const menuBtn = $('.menu-btn'), nav = $('#nav');
  if (menuBtn && nav) {
    const setOpen = open => {
      nav.toggleAttribute('data-open', open);
      document.body.toggleAttribute('data-menu', open);
      menuBtn.setAttribute('aria-expanded', open);
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      $('use', menuBtn).setAttribute('href', `img/icons.svg#${open ? 'close' : 'menu'}`);
    };
    menuBtn.addEventListener('click', () => setOpen(!nav.hasAttribute('data-open')));
    nav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  }

  // Services dropdown (click / keyboard; hover handled in CSS)
  $$('.dd').forEach(dd => {
    const btn = $('button', dd);
    const setOpen = open => { dd.toggleAttribute('data-open', open); btn.setAttribute('aria-expanded', open); };
    btn.addEventListener('click', () => setOpen(!dd.hasAttribute('data-open')));
    dd.addEventListener('focusout', e => { if (!dd.contains(e.relatedTarget)) setOpen(false); });
    document.addEventListener('click', e => { if (!dd.contains(e.target)) setOpen(false); });
  });

  // Lead form: store in Netlify Forms when hosted there, then hand off to WhatsApp
  $$('form[data-lead]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const d = new FormData(form);
      if (d.get('company')) return;
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(d).toString() }).catch(() => {});
      const note = (d.get('message') || '').trim();
      const msg = `Hi CA Harish Sharma, I'd like a call back.\nName: ${d.get('name')}\nMobile: ${d.get('phone')}\nNeed: ${d.get('need')}${note ? `\nDetails: ${note}` : ''}`;
      window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
      $('.form-status', form).textContent = `Thanks, ${d.get('name').split(' ')[0]}. WhatsApp has opened with your details: tap Send and we will call you back. Or call 99719 92189.`;
      form.reset();
    });
  });

  // Open-now status, in Indian time (office hours 9 am – 9 pm, all days)
  const ist = new Date(Date.now() + (new Date().getTimezoneOffset() + 330) * 60000);
  const openNow = ist.getHours() >= 9 && ist.getHours() < 21;
  $$('[data-open-status]').forEach(el => { el.textContent = openNow ? 'Open now' : 'Closed now'; el.classList.add(openNow ? 'is-open' : 'is-closed'); });
  $$('[data-open-status-long]').forEach(el => { el.textContent = openNow ? 'Open now, until 9 pm today.' : 'Closed now. Opens at 9 am.'; });

  // Due dates. Standard statutory dates; GST QRMP dates are for Uttar Pradesh / Delhi.
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const prevName = m => MON[(m + 11) % 12];
  // Quarter that ended before month m (0-based), e.g. July -> "Apr–Jun"
  const qName = m => { const e = (m + 11) % 12; return `${MON[(e + 10) % 12]}–${MON[e]}`; };
  const fyOf = (y, m) => (m >= 3 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`);
  function eventsFor(y, m) {
    const ev = [], add = (d, cat, t) => ev.push({ date: new Date(y, m, d), cat, t });
    const qEnd = [0, 3, 6, 9].includes(m), qMid = !qEnd;
    if (m !== 3) add(7, 'tds', `TDS / TCS deposit for ${prevName(m)}`);
    else add(30, 'tds', 'TDS / TCS deposit for March');
    add(11, 'gst', `GSTR-1 for ${prevName(m)} (monthly filers)`);
    add(20, 'gst', `GSTR-3B for ${prevName(m)} (monthly filers)`);
    if (qMid) {
      add(13, 'gst', `IFF for ${prevName(m)} (QRMP, optional)`);
      add(25, 'gst', `PMT-06 tax payment for ${prevName(m)} (QRMP)`);
    } else {
      add(13, 'gst', `GSTR-1 for ${qName(m)} quarter (QRMP)`);
      add(18, 'gst', `CMP-08 for ${qName(m)} quarter (composition)`);
      add(24, 'gst', `GSTR-3B for ${qName(m)} quarter (QRMP)`);
      if (m !== 3) add(15, 'tds', `TCS return (27EQ) for ${qName(m)} quarter`);
    }
    if (m === 4) add(15, 'tds', 'TCS return (27EQ) for Jan–Mar quarter');
    const tdsReturn = { 6: 31, 9: 31, 0: 31, 4: 31 };
    if (m in tdsReturn) add(tdsReturn[m], 'tds', `TDS returns (24Q, 26Q, 27Q) for ${qName(m === 4 ? 3 : m)} quarter`);
    const f16a = { 7: 'Apr–Jun', 10: 'Jul–Sep', 1: 'Oct–Dec', 5: 'Jan–Mar' };
    if (m in f16a) add(15, 'tds', `Form 16A for ${f16a[m]} quarter`);
    if (m === 5) add(15, 'tds', 'Form 16 to employees');
    const adv = { 5: '1st (15%)', 8: '2nd (45%)', 11: '3rd (75%)', 2: 'Final (100%)' };
    if (m in adv) add(15, 'it', `Advance tax: ${adv[m]} instalment`);
    if (m === 6) add(31, 'it', `ITR filing, non-audit individuals (FY ${fyOf(y - 1, 3)})`);
    if (m === 8) { add(30, 'it', 'Tax audit report'); add(30, 'roc', 'DIR-3 KYC for directors'); }
    if (m === 9) { add(31, 'it', 'ITR filing for audit cases'); add(30, 'roc', 'LLP Form 8 (statement of accounts)'); add(29, 'roc', 'AOC-4 financial statements (AGM on 30 Sep)'); }
    if (m === 10) add(29, 'roc', 'MGT-7 annual return (AGM on 30 Sep)');
    if (m === 11) { add(31, 'it', 'Belated / revised ITR (standard last date)'); add(31, 'gst', 'GSTR-9 / 9C annual return'); }
    if (m === 3) add(30, 'gst', 'GSTR-4 annual return (composition)');
    if (m === 4) add(30, 'roc', 'LLP Form 11 annual return');
    return ev;
  }
  const CAT = { gst: 'GST', tds: 'TDS / TCS', it: 'Income tax', roc: 'Company / LLP' };
  const today = new Date(ist.getFullYear(), ist.getMonth(), ist.getDate());
  function upcoming(days) {
    const end = new Date(today); end.setDate(end.getDate() + days);
    const out = [];
    for (let i = 0; i < Math.ceil(days / 28) + 1; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      out.push(...eventsFor(d.getFullYear(), d.getMonth()));
    }
    return out.filter(e => e.date >= today && e.date <= end).sort((a, b) => a.date - b.date);
  }
  const rel = d => { const n = Math.round((d - today) / 864e5); return n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`; };
  $$('[data-due]').forEach(list => {
    const n = +list.dataset.due, days = +(list.dataset.days || 60);
    const evs = upcoming(days).slice(0, n);
    if (!evs.length) return;
    list.innerHTML = evs.map((e, i) => `<li style="--i:${i}" data-cat="${e.cat}"${(e.date - today) / 864e5 <= 3 ? ' class="soon"' : ''}><span class="d"><b>${e.date.getDate()}</b>${MON[e.date.getMonth()]}</span><span class="t">${e.t}<small>${DAY[e.date.getDay()]} · ${CAT[e.cat]} · ${rel(e.date)}</small></span></li>`).join('');
  });
  // Calendar filter chips
  $$('[data-cal]').forEach(cal => {
    const chips = $$('[data-f]', cal);
    chips.forEach(c => c.addEventListener('click', () => {
      chips.forEach(x => x.setAttribute('aria-pressed', x === c));
      $$('li', cal).forEach(li => { li.hidden = c.dataset.f !== 'all' && li.dataset.cat !== c.dataset.f; });
    }));
  });

  // Income tax calculator, Tax Year 2026-27 (rates unchanged from FY 2025-26)
  const NEW = [[4e5, 0], [8e5, 0.05], [12e5, 0.1], [16e5, 0.15], [20e5, 0.2], [24e5, 0.25], [Infinity, 0.3]];
  const OLD = ex => [[ex, 0], [5e5, 0.05], [10e5, 0.2], [Infinity, 0.3]];
  const slabTax = (ti, slabs) => {
    let tax = 0, lo = 0;
    for (const [hi, r] of slabs) { if (ti > lo) tax += (Math.min(ti, hi) - lo) * Math.max(r, 0); lo = Math.max(lo, hi); }
    return tax;
  };
  // Tax before cess, with rebate and surcharge (both with marginal relief)
  function taxFor(ti, regime, age) {
    const slabs = regime === 'new' ? NEW : OLD([2.5e5, 3e5, 5e5][age]);
    const base = t => {
      let tax = slabTax(t, slabs);
      if (regime === 'new') tax = t <= 12e5 ? 0 : Math.min(tax, t - 12e5);
      else if (t <= 5e5) tax = 0;
      return tax;
    };
    const tiers = [[5e6, 0.1], [1e7, 0.15], [2e7, 0.25], ...(regime === 'old' ? [[5e7, 0.37]] : [])];
    let tax = base(ti), prev = 0;
    for (const [T, s] of tiers) {
      if (ti <= T) break;
      tax = Math.min(base(ti) * (1 + s), base(T) * (1 + prev) + (ti - T));
      prev = s;
    }
    return tax;
  }
  $$('[data-tax]').forEach(box => {
    const inp = k => $(`[data-in="${k}"]`, box), out = k => $(`[data-out="${k}"]`, box);
    const num = k => +(inp(k).value || '').replace(/\D/g, '') || 0;
    const pct = (t, inc) => inc ? `${((t / inc) * 100).toFixed(1)}%` : '0%';
    const calc = () => {
      const inc = num('inc'), sal = inp('type').value === 'sal', age = +inp('age').value;
      const newTI = Math.max(0, inc - (sal ? 75000 : 0));
      const ded = (sal ? 50000 : 0) + Math.min(num('d80c'), 150000) + num('d80d') + num('hra') + Math.min(num('home'), 200000) + num('oth');
      const oldTI = Math.max(0, inc - ded);
      const nt = Math.round(taxFor(newTI, 'new', age) * 1.04), ot = Math.round(taxFor(oldTI, 'old', age) * 1.04);
      tween(out('newTax'), nt, inr); tween(out('oldTax'), ot, inr);
      out('newTI').textContent = inr(newTI); out('oldTI').textContent = inr(oldTI);
      out('newRate').textContent = pct(nt, inc); out('oldRate').textContent = pct(ot, inc);
      const max = Math.max(nt, ot, 1);
      out('newBar').style.width = `${(nt / max) * 100}%`; out('oldBar').style.width = `${(ot / max) * 100}%`;
      out('newBox').classList.toggle('win', nt < ot); out('oldBox').classList.toggle('win', ot < nt);
      out('verdict').innerHTML = nt === ot ? 'Both regimes cost the same here.'
        : `The <strong>${nt < ot ? 'new' : 'old'} regime</strong> saves you <strong>${inr(Math.abs(nt - ot))}</strong> a year.`;
    };
    box.addEventListener('input', calc);
    $$('input', box).forEach(el => el.addEventListener('blur', () => {
      const v = +(el.value.replace(/\D/g, '')) || 0; el.value = v.toLocaleString('en-IN');
    }));
    calc();
  });

  // Reveal on scroll (opacity/translate only)
  const items = $$('[data-reveal], .steps');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    items.forEach(el => io.observe(el));
  } else items.forEach(el => el.classList.add('in'));

  // Service ticker: duplicate the list once so the loop is seamless
  $$('[data-marquee]').forEach(track => {
    if (still) return;
    const copy = [...track.children].map(li => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); return c; });
    track.append(...copy);
    track.setAttribute('data-ready', '');
  });

  // Header shadow once the page scrolls
  const head = $('.site-head');
  if (head) {
    const onScroll = () => head.toggleAttribute('data-scrolled', scrollY > 8);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Subtle pointer parallax on the hero art (desktop, motion allowed)
  const art = $('.hero-art');
  if (art && !still && matchMedia('(hover: hover)').matches) {
    art.addEventListener('pointermove', e => {
      const r = art.getBoundingClientRect();
      art.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      art.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    art.addEventListener('pointerleave', () => { art.style.setProperty('--px', 0); art.style.setProperty('--py', 0); });
  }

  // Rolling-digit counters: each digit spins up to its value when scrolled into view
  const odos = $$('[data-odo]');
  if (!still && 'IntersectionObserver' in window) {
    odos.forEach(el => {
      const digits = el.dataset.odo.split('');
      el.setAttribute('aria-label', el.dataset.odo);
      el.innerHTML = digits.map((d, i) => `<span class="odo-d" aria-hidden="true" style="--dd:${i * 0.12}s"><span>${'0123456789'.split('').map(n => `<span>${n}</span>`).join('')}</span></span>`).join('');
      el._digits = digits;
    });
    const oo = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      oo.unobserve(en.target);
      $$('.odo-d > span', en.target).forEach((col, i) => { col.style.transform = `translateY(-${en.target._digits[i]}em)`; });
    }), { threshold: 0.5 });
    odos.forEach(el => oo.observe(el));
  }

  // Rotating word in the call-to-action band
  $$('[data-rot]').forEach(el => {
    const words = el.dataset.rot.split('|');
    if (still || words.length < 2) return;
    el.setAttribute('aria-live', 'off');
    el.innerHTML = `<span>${words[0]}</span>`;
    let i = 0, timer;
    const fit = span => { el.style.width = `${span.offsetWidth}px`; };
    fit(el.firstChild);
    const tick = () => {
      const cur = el.lastChild, nxt = document.createElement('span');
      i = (i + 1) % words.length;
      nxt.textContent = words[i];
      nxt.className = 'next';
      el.append(nxt);
      fit(nxt);
      requestAnimationFrame(() => requestAnimationFrame(() => { cur.classList.add('out'); nxt.className = ''; }));
      setTimeout(() => cur.remove(), 650);
    };
    new IntersectionObserver(([en]) => {
      clearInterval(timer);
      if (en.isIntersecting) timer = setInterval(tick, 2400);
    }).observe(el);
  });

  // Cursor spotlight on cards
  if (!still && matchMedia('(hover: hover)').matches) {
    $$('.svc, .why').forEach(card => card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    }));
  }

  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
