(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const still = location.search.includes('still');

  // ---------- blur-in reveals ----------
  const reveals = $$('[data-blur]');
  if (reduce || still || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const sibs = el.parentElement ? [...el.parentElement.children].filter((n) => n.hasAttribute('data-blur')) : [];
        el.style.setProperty('--d', Math.max(0, sibs.indexOf(el)) * 0.08 + 's');
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    // the first screen reads top to bottom on load
    $$('.hero [data-blur], .side [data-blur]').forEach((el, i) => { el.style.setProperty('--d', 0.1 + i * 0.12 + 's'); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in'))); });
    reveals.filter((el) => !el.closest('.hero') && !el.closest('.side')).forEach((el) => io.observe(el));
  }

  // ---------- hero cell grid ----------
  const grid = $('#grid');
  const COLS = 16, ROWS = 9, SIZE = 70;
  const cells = [];
  for (let i = 0; i < COLS * ROWS; i++) { const c = document.createElement('div'); c.className = 'cell'; grid.appendChild(c); cells.push(c); }
  const tints = ['#e7c3d5', '#dba5c0', '#efd5e1', '#cf8cae'];
  let t = 0;

  function light(cell, color, hold = 0, fade = 1300) {
    cell.style.transition = 'none';
    cell.style.background = color;
    void cell.offsetWidth;
    setTimeout(() => { cell.style.transition = `background ${fade}ms cubic-bezier(0,0,.2,1)`; cell.style.background = ''; }, hold);
  }

  if (!reduce && !still) {
    // one wave on load
    cells.forEach((c, i) => {
      const x = i % COLS, y = Math.floor(i / COLS);
      setTimeout(() => light(c, tints[(x + y) % 3 === 0 ? 1 : 2], 40, 900), 350 + (x + y * 1.4) * 55);
    });
    const hero = $('#top');
    let last = -1;
    const hit = (e) => {
      const r = grid.getBoundingClientRect();
      const x = Math.floor((e.clientX - r.left) / SIZE), y = Math.floor((e.clientY - r.top) / SIZE);
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
      const i = y * COLS + x;
      if (i === last) return;
      last = i;
      light(cells[i], tints[t++ % tints.length]);
    };
    hero.addEventListener('pointermove', hit);
    hero.addEventListener('pointerdown', hit);
    hero.addEventListener('pointerleave', () => { last = -1; });
  }

  // ---------- sidebar: collapse, burger ----------
  const side = $('#side');
  const col = $('#collapse');
  try { if (localStorage.getItem('side') === '1' && window.innerWidth > 760) { side.classList.add('is-collapsed'); col.setAttribute('aria-pressed', 'true'); } } catch (e) {}
  col.addEventListener('click', () => {
    const on = side.classList.toggle('is-collapsed');
    col.setAttribute('aria-pressed', String(on));
    col.setAttribute('aria-label', on ? 'Expand sidebar' : 'Collapse sidebar');
    try { localStorage.setItem('side', on ? '1' : '0'); } catch (e) {}
  });
  const burger = $('#burger');
  burger.addEventListener('click', () => {
    const open = side.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('.item[href^="#"]').forEach((a) => a.addEventListener('click', () => { side.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }));
  $$('[data-go="top"]').forEach((b) => b.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })));

  // ---------- menu follows the page ----------
  const items = $$('.menu .item[href^="#"]');
  const secs = items.map((a) => $(a.getAttribute('href')));
  const setOn = () => {
    const y = window.scrollY + window.innerHeight * 0.35;
    let idx = 0;
    secs.forEach((s, i) => { if (s && s.offsetTop <= y) idx = i; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) idx = secs.length - 1;
    items.forEach((a, i) => a.classList.toggle('on', i === idx));
  };
  window.addEventListener('scroll', setOn, { passive: true });
  setOn();

  // ---------- screenshot lightbox ----------
  const lb = $('#lb');
  if (lb && lb.showModal) {
    const big = $('img', lb);
    $$('[data-zoom]').forEach((b) => b.addEventListener('click', () => {
      const im = $('img', b);
      big.src = im.currentSrc || im.src;
      big.alt = im.alt;
      lb.showModal();
    }));
    lb.addEventListener('click', () => lb.close());
  }

  // ---------- number keys ----------
  const byKey = new Map($$('.item[data-key]').map((a) => [a.dataset.key, a]));
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || (lb && lb.open)) return;
    const tg = e.target;
    if (tg && (/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName) || tg.isContentEditable)) return;
    const a = byKey.get(e.key);
    if (!a) return;
    e.preventDefault();
    a.classList.add('press');
    setTimeout(() => a.classList.remove('press'), 260);
    if (a.getAttribute('href').startsWith('#')) {
      const target = $(a.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    } else {
      window.open(a.href, '_blank', 'noopener');
    }
  });
})();
