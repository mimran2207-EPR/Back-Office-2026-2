const { useEffect: a11yE, useRef: a11yR, useState: a11yS, useCallback: a11yC } = React;

function useEscapeKey(active, onEscape) {
  a11yE(() => {
    if (!active) return;
    const h = (e) => { if (e.key === 'Escape') { e.preventDefault(); onEscape(); } };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [active, onEscape]);
}

const FOCUSABLE_SELECTOR = [
  'a[href]:not([disabled])',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
].join(',');

function useFocusTrap(active) {
  const containerRef = a11yR(null);
  const previousFocusRef = a11yR(null);

  a11yE(() => {
    if (!active) return;
    previousFocusRef.current = document.activeElement;
    const root = containerRef.current;
    if (!root) return;

    const focusables = () => Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR))
      .filter(el => el.offsetParent !== null);

    setTimeout(() => {
      const f = focusables();
      const first = f[0] || root;
      first.focus?.();
    }, 30);

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      const f = focusables();
      if (f.length === 0) { e.preventDefault(); return; }
      const first = f[0];
      const last = f[f.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener('keydown', handleTab);
    return () => {
      document.removeEventListener('keydown', handleTab);
      previousFocusRef.current?.focus?.();
    };
  }, [active]);

  return containerRef;
}

function useRelativeTime(date) {
  const [, setTick] = a11yS(0);
  a11yE(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);
  if (!date) return '';
  const target = typeof date === 'string' ? new Date(date) : date;
  const diffMs = target.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  const diffHr = Math.round(diffMs / 3600000);
  const diffDay = Math.round(diffMs / 86400000);
  try {
    const rtf = new Intl.RelativeTimeFormat('he', { numeric: 'auto' });
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
    if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour');
    return rtf.format(diffDay, 'day');
  } catch (e) {
    return target.toLocaleDateString('he-IL');
  }
}

function useTick(intervalMs = 60000) {
  const [tick, setTick] = a11yS(0);
  a11yE(() => {
    const id = setInterval(() => setTick(t => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}

function useTheme() {
  const [theme, setThemeRaw] = a11yS(() => {
    try {
      const stored = localStorage.getItem('epr-theme');
      if (stored) return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (_) { return 'light'; }
  });
  const setTheme = a11yC((t) => {
    setThemeRaw(t);
    try { localStorage.setItem('epr-theme', t); } catch (_) {}
  }, []);
  a11yE(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  return [theme, setTheme];
}

Object.assign(window, { useEscapeKey, useFocusTrap, useRelativeTime, useTick, useTheme });
