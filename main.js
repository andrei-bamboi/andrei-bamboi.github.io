// Restores the interactive bits of the original React app with plain JS.
(function () {
  // 1) Typewriter for role + bio
  var targets = Array.prototype.slice.call(document.querySelectorAll('[data-type]'));
  function typeNext(i) {
    if (i >= targets.length) return;
    var el = targets[i], text = el.getAttribute('data-type'), n = 0;
    (function step() {
      el.textContent = text.slice(0, ++n);
      if (n < text.length) setTimeout(step, 35 + Math.random() * 40);
      else setTimeout(function () { typeNext(i + 1); }, 300);
    })();
  }
  setTimeout(function () { typeNext(0); }, 400);

  // 2) Blinking block cursor
  var cursor = document.querySelector('.cursor');
  if (cursor) setInterval(function () {
    cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
  }, 530);

  // 3) Mobile menu toggle
  var btn = document.querySelector('[aria-label="Toggle menu"]');
  var nav = document.querySelector('nav[aria-label="Main navigation"]');
  var header = document.querySelector('header');
  if (btn && nav && header) {
    var menu = document.createElement('div');
    menu.className = 'md:hidden border-t border-border';
    menu.style.cssText = 'display:none;flex-direction:column;padding:8px 16px;background:rgb(13,17,23)';
    Array.prototype.forEach.call(nav.querySelectorAll('a'), function (a) {
      var c = a.cloneNode(true);
      c.style.display = 'block';
      c.addEventListener('click', toggle);
      menu.appendChild(c);
    });
    header.appendChild(menu);
    function toggle() {
      var open = menu.style.display !== 'flex';
      menu.style.display = open ? 'flex' : 'none';
      btn.textContent = open ? '[×]' : '[≡]';
    }
    btn.addEventListener('click', toggle);
  }

  // 4) Smooth scroll for in-page links, offset for the fixed header
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    var y = t.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 0);
    window.scrollTo({ top: a.getAttribute('href') === '#top' ? 0 : y, behavior: 'smooth' });
  });
})();
