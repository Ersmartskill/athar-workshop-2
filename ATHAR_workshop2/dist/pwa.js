 'use strict';
(() => {
 const $ = selector => document.querySelector(selector);
 const status = text => document.querySelectorAll('[data-pwa-status]').forEach(node => { node.textContent = text; });
 const installButtons = [...document.querySelectorAll('[data-install]')];
 const dialog = $('#install-dialog');
 let installEvent, registration;
 const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
 function installed() { installButtons.forEach(button => { button.textContent = 'أثَر مثبت على جهازك ✓'; button.disabled = true; }); }
 if (standalone()) installed();
 window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installEvent = event; installButtons.forEach(button => { button.textContent = 'تثبيت أثَر ↓'; }); });
 window.addEventListener('appinstalled', () => { installEvent = null; installed(); if (dialog?.open) dialog.close(); });
 installButtons.forEach(button => button.addEventListener('click', async () => {
  if (installEvent) {
   const event = installEvent; installEvent = null;
   try { await event.prompt(); const choice = await event.userChoice; if (choice.outcome === 'accepted') installed(); } catch { if (dialog && !dialog.open) dialog.showModal(); }
  } else if (dialog && !dialog.open) dialog.showModal();
 }));
 $('[data-install-close]')?.addEventListener('click', () => dialog.close());
 dialog?.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
 $('[data-retry]')?.addEventListener('click', () => location.reload());
 // The existing app owns its own menu; supplementary pages use this one.
 if (!document.querySelector('script[src="./app.js"]')) {
  const menu = $('.menu-toggle'), nav = $('#navigation');
  function closeMenu() { nav?.classList.remove('open'); menu?.setAttribute('aria-expanded', 'false'); menu?.setAttribute('aria-label', 'فتح قائمة التنقل'); }
  menu?.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'إغلاق قائمة التنقل' : 'فتح قائمة التنقل'); });
  nav?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
 }
 let offlineReady = false;
 function connectionStatus() { status(offlineReady ? (navigator.onLine ? 'جاهز للعمل دون اتصال ✓' : 'أنت دون اتصال — النسخة المحلية جاهزة') : (navigator.onLine ? 'جارٍ تجهيز النسخة للعمل دون اتصال…' : 'أنت دون اتصال — لم يكتمل تجهيز النسخة المحلية')); }
 window.addEventListener('online', connectionStatus);
 window.addEventListener('offline', connectionStatus);
 if (!('serviceWorker' in navigator) || !window.isSecureContext || location.protocol === 'file:') {
  status('دعم العمل دون اتصال يتطلب متصفحًا داعمًا ورابط HTTPS أو localhost.'); return;
 }
 function offerUpdate() { if (registration.waiting && navigator.serviceWorker.controller) document.querySelectorAll('[data-update]').forEach(button => { button.hidden = false; }); }
 document.querySelectorAll('[data-update]').forEach(button => button.addEventListener('click', () => { registration?.waiting?.postMessage({type:'SKIP_WAITING'}); }));
 let refreshing = false;
 navigator.serviceWorker.addEventListener('controllerchange', () => { if (offlineReady && !refreshing) { refreshing = true; location.reload(); } });
 window.addEventListener('load', async () => {
  try {
   registration = await navigator.serviceWorker.register('./sw.js', {scope:'./', updateViaCache:'none'});
   offerUpdate();
   registration.addEventListener('updatefound', () => { const worker = registration.installing; worker?.addEventListener('statechange', () => { if (worker.state === 'installed') offerUpdate(); }); });
   await navigator.serviceWorker.ready; offlineReady = true; connectionStatus();
  } catch { status('تعذّر تجهيز العمل دون اتصال؛ يمكنك متابعة التصفح مع الإنترنت.'); }
 });
})();
