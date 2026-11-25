/* QuadStick Profile Studio — site behaviour. No libraries, no network calls.
   Every movement here is optional: with motion off (or prefers-reduced-motion)
   nothing moves with the scroll and every word is already in place. */
(() => {
  'use strict';
  const root = document.documentElement;
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const calm = () => root.classList.contains('calm');

  /* ---------- motion switch ---------- */
  const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
  function syncMotionControls() {
    const on = !calm();
    $$('[data-motion-toggle]').forEach((b) => {
      if (b.getAttribute('role') === 'switch') b.setAttribute('aria-checked', String(on));
      const label = b.querySelector('[data-motion-label]');
      if (label) label.textContent = on ? 'Turn motion off' : 'Turn motion on';
    });
  }
  function setCalm(value, remember) {
    root.classList.toggle('calm', value);
    if (remember) { try { localStorage.setItem('qs-motion', value ? 'off' : 'on'); } catch (e) { /* private mode */ } }
    syncMotionControls();
    revealAllIfCalm();
    resetTransforms();
    tick();
  }
  $$('[data-motion-toggle]').forEach((b) => b.addEventListener('click', () => setCalm(!calm(), true)));
  reduceQuery.addEventListener?.('change', (e) => {
    let saved = null; try { saved = localStorage.getItem('qs-motion'); } catch (err) { /* ignore */ }
    if (!saved) setCalm(e.matches, false);
  });

  /* ---------- hero: turn the raw rows into the spreadsheet they came from ---------- */
  const pre = document.querySelector('[data-sheet] pre');
  if (pre) {
    const t = document.createElement('table');
    t.className = 'xsheet';
    const head = '<thead><tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th></tr></thead>';
    const body = pre.textContent.split('\n').slice(0, 44).map((line, i) => {
      const c = line.split(',').slice(0, 4);
      while (c.length < 4) c.push('');
      const cls = (v) => (/^mp_|_sip|_puff|^lip$/.test(v) ? ' class="k"' : /_mode$/.test(v) ? ' class="o"' : '');
      return `<tr><th>${i + 1}</th>${c.map((v) => `<td${cls(v)}>${v.replace(/[<&]/g, '')}</td>`).join('')}</tr>`;
    }).join('');
    t.innerHTML = head + '<tbody>' + body + '</tbody>';
    pre.replaceWith(t);
  }

  /* ---------- split headings into words for the line reveal ---------- */
  $$('[data-split]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.textContent = '';
    words.forEach((w, i) => {
      const outer = document.createElement('span');
      outer.className = 'w'; outer.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.className = 'w__i'; inner.style.setProperty('--i', i); inner.textContent = w;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  /* ---------- reveal on entering the view ---------- */
  const revealEls = $$('[data-reveal], [data-split]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  revealEls.forEach((el) => io.observe(el));
  function revealAllIfCalm() { if (calm()) revealEls.forEach((el) => el.classList.add('in')); }
  revealAllIfCalm();
  // Anything already on screen at load shows straight away (the hero).
  requestAnimationFrame(() => revealEls.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) el.classList.add('in');
  }));

  /* ---------- header edge ---------- */
  const header = document.querySelector('.top');

  /* ---------- scroll-linked layers ---------- */
  const hero = document.querySelector('[data-hero]');
  const callouts = $$('[data-callouts] .co');
  const depthEls = $$('[data-depth]');
  const slabs = $$('[data-stack] .slab');

  function resetTransforms() {
    if (!calm()) return;
    hero.style.setProperty('--p', 0);
    callouts.forEach((c) => c.classList.add('on'));
    depthEls.forEach((el) => { el.style.translate = ''; });
    slabs.forEach((s) => s.style.removeProperty('--s'));
  }

  let ticking = false;
  function tick() {
    ticking = false;
    const vh = innerHeight;
    header.classList.toggle('is-scrolled', scrollY > 8);
    if (calm()) return;

    // Hero: 0 at the top, 1 when the pinned stage is about to leave.
    const hr = hero.getBoundingClientRect();
    const run = hero.offsetHeight - vh;
    const p = run > 0 ? clamp(-hr.top / run, 0, 1) : 0;
    hero.style.setProperty('--p', p.toFixed(4));
    callouts.forEach((c) => c.classList.toggle('on', p >= parseFloat(c.dataset.at)));

    // Depth: each layer drifts at its own rate around the middle of the screen.
    depthEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const off = (r.top + r.height / 2 - vh / 2);
      el.style.translate = `0 ${(off * parseFloat(el.dataset.depth)).toFixed(1)}px`;
    });

    // Stacked problem cards: a card settles back as the next one slides over it.
    slabs.forEach((s, i) => {
      const next = slabs[i + 1];
      if (!next) return;
      const nr = next.getBoundingClientRect();
      const sr = s.getBoundingClientRect();
      const t = clamp(1 - (nr.top - sr.top) / Math.max(sr.height, 1), 0, 1);
      s.style.setProperty('--s', (1 - t * 0.05).toFixed(4));
    });
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  /* ---------- "the device is the way in": swap the pinned picture with the step ---------- */
  const frames = $$('[data-frame]');
  const steps = $$('[data-step]');
  const stepIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const n = e.target.dataset.step;
      steps.forEach((s) => s.classList.toggle('is-on', s === e.target));
      frames.forEach((f) => f.classList.toggle('is-on', f.dataset.frame === n));
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach((s) => stepIO.observe(s));

  /* ---------- PlayStation / Xbox ---------- */
  const consoleBtn = document.querySelector('[data-console-toggle]');
  const pairs = document.querySelector('.pairs');
  consoleBtn.addEventListener('click', () => {
    const toXbox = pairs.dataset.console === 'ps';
    pairs.dataset.console = toXbox ? 'xb' : 'ps';
    consoleBtn.setAttribute('aria-pressed', String(toXbox));
    document.querySelector('[data-console-label]').textContent = toXbox ? 'Show PlayStation names' : 'Show Xbox names';
    document.querySelector('[data-console-caption]').textContent =
      toXbox ? 'Buttons with their Xbox names' : 'Buttons with their PlayStation names';
    $$('.flip', pairs).forEach((el) => {
      const row = el.closest('tr');
      el.style.setProperty('--r', Array.prototype.indexOf.call(row.parentNode.children, row));
      const text = toXbox ? el.dataset.xb : el.dataset.ps;
      if (calm()) { el.textContent = text; return; }
      el.classList.remove('is-flipping'); void el.offsetWidth; el.classList.add('is-flipping');
      const delay = parseInt(getComputedStyle(el).getPropertyValue('--r'), 10) * 45 + 230;
      setTimeout(() => { el.textContent = text; }, delay);
      el.addEventListener('animationend', () => el.classList.remove('is-flipping'), { once: true });
    });
  });

  /* ---------- the pretend tester ---------- */
  // The Fortnite starter profile, first mode (fixtures/ddfortnite.csv).
  const MAP = {
    left: { sip: 'Cross', sip_soft: 'Circle', puff: 'L1' },
    centre: { sip: 'L2', sip_soft: 'PS button', puff: 'R2' },
    right: { sip: 'Triangle', puff: 'R1' },
    side: { sip: 'Next mode', puff: 'Previous mode' },
    lip: { lip: 'Square' },
  };
  const TUBE_NAME = { left: 'left tube', centre: 'centre tube', right: 'right tube', side: 'side tube' };
  const ACT_NAME = { sip: 'Sip', sip_soft: 'Soft sip', puff: 'Puff', puff_soft: 'Soft puff' };
  const play = document.querySelector('[data-play]');
  let tube = 'left';
  const hots = Object.fromEntries($$('[data-hot]', play).map((h) => [h.dataset.hot, h]));
  const what = play.querySelector('[data-now-what]');
  const does = play.querySelector('[data-now-does]');
  const markTarget = () => Object.entries(hots).forEach(([k, h]) => h.classList.toggle('is-target', k === tube));
  markTarget();

  $$('[data-tube]', play).forEach((b) => b.addEventListener('click', () => {
    tube = b.dataset.tube;
    $$('[data-tube]', play).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    markTarget();
  }));

  let clearTimer;
  $$('[data-act]', play).forEach((b) => b.addEventListener('click', () => {
    const act = b.dataset.act;
    const where = act === 'lip' ? 'lip' : tube;
    const h = hots[where];
    const kind = act.startsWith('sip') ? 'sip' : act.startsWith('puff') ? 'puff' : 'lip';
    const color = kind === 'sip' ? 'var(--sip-glow)' : kind === 'puff' ? 'var(--puff-glow)' : '#f4f4f1';

    Object.values(hots).forEach((x) => x.classList.remove('fx', 'fx-sip', 'fx-puff', 'soft'));
    void h.offsetWidth;
    h.style.setProperty('--c', color);
    h.classList.add('fx', kind === 'lip' ? 'fx-puff' : `fx-${kind}`);
    if (act.endsWith('soft')) h.classList.add('soft');
    clearTimeout(clearTimer);
    clearTimer = setTimeout(() => h.classList.remove('fx', 'fx-sip', 'fx-puff', 'soft'), 1600);

    const out = (MAP[where] || {})[act];
    what.textContent = act === 'lip' ? 'Lip button pressed' : `${ACT_NAME[act]}, ${TUBE_NAME[where]}`;
    what.className = 'now__what' + (kind === 'lip' ? '' : ` is-${kind}`);
    does.textContent = out
      ? `In the Fortnite starter profile’s first mode, that’s ${out}.`
      : 'Nothing is set for that in the Fortnite starter profile’s first mode.';
  }));

  /* ---------- start ---------- */
  syncMotionControls();
  resetTransforms();
  tick();
})();
