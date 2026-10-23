/* Shared floating-menu popover. Contract: define window.openDrawer() (called when #menuBtn is tapped).
   Pages keep the #menuBtn button + drag script; this file owns the menu UI. */
(function () {
  var LINKS = [['/', 'Home'], ['/ebooks.html', 'Ebooks & Poems'], ['/shayari.html', 'Shayari'], ['/subliminals.html', 'Subliminals'], ['/contact.html', 'Help Desk'], ['/account.html', 'My Account']];
  var ADMIN = 'gajanandhoble5@gmail.com'; // UI only; Firestore rules enforce real access
  var el;
  function norm(p) { p = p.toLowerCase().replace(/\/index(\.html)?$/, '/').replace(/\.html$/, ''); return p === '' ? '/' : p; }
  function build() {
    if (el) return;
    var st = document.createElement('style');
    st.textContent =
      '#gfyDrawer{position:fixed;top:84px;left:20px;width:240px;background:rgba(8,12,28,0.97);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:20px;display:flex;flex-direction:column;gap:4px;opacity:0;transform:translateY(-14px) scale(.97);pointer-events:none;transition:.25s cubic-bezier(0.1,0.7,0.1,1);z-index:1900;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);box-shadow:0 20px 60px rgba(0,0,0,0.5);font-family:inherit}' +
      '#gfyDrawer.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}' +
      '#gfyDrawer .menu-logo{font-size:1rem;font-weight:700;background:linear-gradient(90deg,#fff,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;padding:0 10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:8px}' +
      '#gfyDrawer a{color:rgba(255,255,255,0.55);text-decoration:none;font-size:0.92rem;padding:10px 12px;border-radius:12px;display:flex;align-items:center;gap:10px;transition:0.2s}' +
      '#gfyDrawer a:hover{color:#fff;background:rgba(255,255,255,0.05)}' +
      '#gfyDrawer a.active{color:#22d3ee;background:rgba(34,211,238,0.08)}';
    document.head.appendChild(st);
    el = document.createElement('nav'); el.id = 'gfyDrawer'; el.setAttribute('aria-label', 'Main navigation');
    var logo = document.createElement('div'); logo.className = 'menu-logo'; logo.textContent = 'Good for You'; el.appendChild(logo);
    var here = norm(location.pathname);
    LINKS.forEach(function (l) {
      var a = document.createElement('a'); a.href = l[0]; a.textContent = l[1];
      if (norm(l[0]) === here) { a.className = 'active'; a.setAttribute('aria-current', 'page'); }
      el.appendChild(a);
    });
    document.body.appendChild(el);
    document.addEventListener('click', function (e) {
      var b = document.getElementById('menuBtn');
      if (el.classList.contains('open') && !el.contains(e.target) && !(b && b.contains(e.target))) close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }
  function adminLink() {
    if (!window.gfyAuth) { try { import('/firebase-auth.js').then(function () { if (window.gfyAuth) adminLink(); }).catch(function () {}); } catch (e) {} return; }
    var a = gfyAuth.auth; if (!a) return;
    Promise.resolve(a.authStateReady ? a.authStateReady() : 0).then(function () {
      var u = a.currentUser, ok = u && !u.isAnonymous && u.emailVerified && (u.email || '').toLowerCase() === ADMIN;
      var ex = el.querySelector('.admin-link');
      if (ok && !ex) {
        var l = document.createElement('a'); l.href = '/admin.html'; l.textContent = 'Admin Panel';
        l.className = 'admin-link' + (norm(location.pathname) === '/admin' ? ' active' : ''); el.appendChild(l);
      } else if (!ok && ex) ex.remove();
    }).catch(function () {});
  }
  function sync(open) { var b = document.getElementById('menuBtn'); if (b) b.setAttribute('aria-expanded', String(open)); }
  function close() { if (!el) return; el.classList.remove('open'); sync(false); }
  window.openDrawer = function () {
    build();
    var b = document.getElementById('menuBtn');
    if (b) { el.style.left = b.offsetLeft + 'px'; el.style.top = (b.offsetTop + 60) + 'px'; }
    sync(el.classList.toggle('open'));
    adminLink();
  };
})();
