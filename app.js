// ============================================================
// HṛdayaFlow promotional site — interaction
// Pure vanilla JS, no dependencies.
// ============================================================

(function () {
  'use strict';

  // --------------------------------------------------
  // User preferences (graph paper)
  //   localStorage に永続化し、:root の CSS変数を更新して
  //   サイト全体に反映する。
  // --------------------------------------------------
  const PREFS_KEY = 'hrf-prefs/v1';
  const DEFAULTS  = { grid: true, gridSize: 32 };
  const SIZE_MIN  = 8;
  const SIZE_MAX  = 80;

  const root = document.documentElement;

  const clampSize = (n) => Math.min(SIZE_MAX, Math.max(SIZE_MIN, Number(n) || DEFAULTS.gridSize));

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return { ...DEFAULTS };
      const parsed = JSON.parse(raw);
      return {
        grid:     typeof parsed.grid === 'boolean' ? parsed.grid : DEFAULTS.grid,
        gridSize: clampSize(parsed.gridSize),
      };
    } catch (_) {
      return { ...DEFAULTS };
    }
  }

  function savePrefs(prefs) {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (_) { /* private mode etc. */ }
  }

  function applyPrefs(prefs) {
    root.style.setProperty('--grid-display', prefs.grid ? 'block' : 'none');
    root.style.setProperty('--grid-size',    prefs.gridSize + 'px');
  }

  const prefs = loadPrefs();
  applyPrefs(prefs);   // 初回適用 — DOM 準備前でも :root に当たる

  // --------------------------------------------------
  // Settings panel UI wiring
  // --------------------------------------------------
  function initSettingsPanel() {
    const toggleBtn = document.getElementById('gridSettingsToggle');
    const panel     = document.getElementById('gridSettingsPanel');
    const gridChk   = document.getElementById('gridToggle');
    const sizeRng   = document.getElementById('gridSize');
    const sizeOut   = document.getElementById('gridSizeOut');
    const presets   = document.querySelectorAll('.grid-setting-row .preset-btn');

    if (!toggleBtn || !panel || !gridChk || !sizeRng || !sizeOut) return;

    // 初期値を UI に流し込む
    gridChk.checked = prefs.grid;
    sizeRng.value   = prefs.gridSize;
    sizeOut.value   = prefs.gridSize + 'px';
    syncPresets(prefs.gridSize);

    // パネル開閉
    function setOpen(open) {
      toggleBtn.setAttribute('aria-expanded', String(open));
      if (open) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    }
    toggleBtn.addEventListener('click', () => {
      const open = toggleBtn.getAttribute('aria-expanded') !== 'true';
      setOpen(open);
    });
    document.addEventListener('click', (e) => {
      if (toggleBtn.getAttribute('aria-expanded') !== 'true') return;
      const target = e.target;
      if (target instanceof Node && (panel.contains(target) || toggleBtn.contains(target))) return;
      setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggleBtn.getAttribute('aria-expanded') === 'true') setOpen(false);
    });

    // トグル
    gridChk.addEventListener('change', () => {
      prefs.grid = gridChk.checked;
      applyPrefs(prefs);
      savePrefs(prefs);
    });

    // スライダー (input は drag 中もリアルタイム発火)
    sizeRng.addEventListener('input', () => {
      const v = clampSize(sizeRng.value);
      prefs.gridSize = v;
      sizeOut.value = v + 'px';
      syncPresets(v);
      applyPrefs(prefs);
    });
    sizeRng.addEventListener('change', () => {
      savePrefs(prefs);
    });

    // プリセットボタン
    presets.forEach((btn) => {
      btn.addEventListener('click', () => {
        const v = clampSize(btn.getAttribute('data-size'));
        prefs.gridSize = v;
        sizeRng.value  = v;
        sizeOut.value  = v + 'px';
        syncPresets(v);
        applyPrefs(prefs);
        savePrefs(prefs);
      });
    });

    function syncPresets(currentSize) {
      presets.forEach((btn) => {
        const v = Number(btn.getAttribute('data-size'));
        if (v === currentSize) {
          btn.setAttribute('data-active', 'true');
        } else {
          btn.removeAttribute('data-active');
        }
      });
    }
  }

  // DOMContentLoaded 後にUIを初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettingsPanel);
  } else {
    initSettingsPanel();
  }

  // --------------------------------------------------
  // Header shrink on scroll
  // --------------------------------------------------
  const header = document.getElementById('siteHeader');
  const onScroll = () => {
    if (!header) return;
    const y = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle('scrolled', y > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --------------------------------------------------
  // Reveal-on-scroll via IntersectionObserver
  // --------------------------------------------------
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length > 0) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -80px 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    // Fallback: show everything immediately for old browsers
    reveals.forEach((el) => el.classList.add('in-view'));
  }

  // --------------------------------------------------
  // Smooth anchor scrolling (native smooth is enabled via CSS,
  // but we intercept to add offset for fixed header)
  // --------------------------------------------------
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const headerHeight = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight + 1;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
