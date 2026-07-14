(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/qr-sw.js').catch(() => {
      const status = document.getElementById('qr-status');
      if (status) status.textContent = 'Offline mode is unavailable. QR creation still works while connected.';
    });
  });
}());
