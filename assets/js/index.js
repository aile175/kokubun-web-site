(() => {
  'use strict';
  const header = document.getElementById('siteHeader');
  if (header) {
    let scheduled = false;
    const updateHeader = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
      scheduled = false;
    };
    window.addEventListener('scroll', () => {
      if (!scheduled) {
        scheduled = true;
        window.requestAnimationFrame(updateHeader);
      }
    }, { passive: true });
    updateHeader();
  }
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('mobileNav');
  if (!toggle || !nav) return;
  toggle.hidden = false;
  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'メニューを開く');
    nav.hidden = true;
  };
  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'メニューを開く' : 'メニューを閉じる');
    nav.hidden = isOpen;
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !nav.hidden) {
      closeMenu();
      toggle.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!nav.hidden && !header.contains(event.target)) closeMenu();
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', (event) => {
    if (event.matches) closeMenu();
  });
})();
