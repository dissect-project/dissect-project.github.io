// Loaded synchronously in <head> so the stored theme applies before first paint.
// Also wires up the theme toggle and closes the mobile menu on navigation.
(function () {
  var KEY = 'dissect-theme';
  var root = document.documentElement;
  var stored = null;
  try {
    stored = localStorage.getItem(KEY);
  } catch (e) {}
  if (stored === 'light' || stored === 'dark') root.setAttribute('data-theme', stored);

  function current() {
    var t = root.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function sync() {
    var isDark = current() === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(isDark));
      btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    sync();
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = current() === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try {
          localStorage.setItem(KEY, next);
        } catch (e) {}
        sync();
      });
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', sync);

    // Close the mobile menu after choosing a link.
    document.querySelectorAll('.nav-narrow a').forEach(function (a) {
      a.addEventListener('click', function () {
        var d = a.closest('details');
        if (d) d.removeAttribute('open');
      });
    });
  });
})();
