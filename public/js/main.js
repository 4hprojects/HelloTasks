document.addEventListener('DOMContentLoaded', () => {
  // Sidebar toggle for mobile
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('is-open');
    });

    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('is-open') &&
          !sidebar.contains(e.target) &&
          !toggle.contains(e.target)) {
        sidebar.classList.remove('is-open');
      }
    });
  }

  // File input — update label, enable button, and show upload progress
  const fileInput = document.getElementById('fileInput');
  const fileLabel = document.querySelector('.file-input-label');
  const uploadBtn = document.getElementById('uploadBtn');
  const uploadForm = document.querySelector('.upload-form');

  if (fileInput && fileLabel && uploadBtn) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        fileLabel.textContent = fileInput.files[0].name;
        uploadBtn.disabled = false;
      } else {
        fileLabel.textContent = 'Choose file';
        uploadBtn.disabled = true;
      }
    });
  }

  if (uploadForm) {
    // Inject progress bar markup
    const progressWrap = document.createElement('div');
    progressWrap.className = 'upload-progress';
    progressWrap.setAttribute('aria-hidden', 'true');
    progressWrap.innerHTML = '<div class="upload-progress-bar"></div>';
    uploadForm.appendChild(progressWrap);

    uploadForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const bar = progressWrap.querySelector('.upload-progress-bar');
      bar.style.width = '0%';
      progressWrap.classList.add('is-active');
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Uploading...';

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (ev) => {
        if (ev.lengthComputable) {
          const pct = Math.round((ev.loaded / ev.total) * 100);
          // Cap at 90% — remaining 10% reserved for server-side processing
          bar.style.width = Math.min(pct * 0.9, 90) + '%';
          if (pct >= 100) uploadBtn.textContent = 'Processing...';
        }
      });

      xhr.addEventListener('load', () => {
        bar.style.width = '100%';
        setTimeout(() => { window.location.href = xhr.responseURL; }, 250);
      });

      xhr.addEventListener('error', () => {
        progressWrap.classList.remove('is-active');
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload';
        window.location.reload();
      });

      xhr.open('POST', uploadForm.action);
      xhr.send(new FormData(uploadForm));
    });
  }

  // Auto-dismiss flash messages after 5 seconds
  document.querySelectorAll('.alert').forEach((alert) => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.3s ease';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 300);
    }, 5000);
  });

  // Password visibility toggles
  document.querySelectorAll('.password-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      btn.querySelector('.icon-eye').style.display = show ? 'none' : '';
      btn.querySelector('.icon-eye-off').style.display = show ? '' : 'none';
    });
  });

  // Auth forms: confirm password client-side validation
  document.querySelectorAll('.auth-form').forEach((form) => {
    const cpwInput = form.querySelector('#confirmPassword');
    const cpwErr = form.querySelector('.confirm-password-error');

    if (cpwInput && cpwErr) {
      cpwInput.addEventListener('input', () => { cpwErr.style.display = 'none'; });
    }

    form.addEventListener('submit', (e) => {
      const pw = form.querySelector('#password');
      if (pw && cpwInput && pw.value !== cpwInput.value) {
        e.preventDefault();
        if (cpwErr) cpwErr.style.display = '';
        cpwInput.focus();
      }
    });
  });

  // Loading state for any form with a data-loading-text submit button
  document.addEventListener('submit', (e) => {
    if (e.defaultPrevented) return;
    const btn = e.target.querySelector('button[type="submit"][data-loading-text]');
    if (!btn) return;
    btn.textContent = btn.dataset.loadingText;
    btn.disabled = true;
  });

  // Confirmation modal — runs in capture phase so it fires before the loading spinner
  const confirmModal = document.getElementById('confirmModal');
  if (confirmModal) {
    const confirmMsg = document.getElementById('confirmModalMsg');
    const confirmOk = document.getElementById('confirmModalOk');
    const confirmCancel = document.getElementById('confirmModalCancel');
    let pendingForm = null;

    function openModal(form, message) {
      pendingForm = form;
      confirmMsg.textContent = message;
      confirmModal.classList.add('is-open');
    }
    function closeModal() {
      confirmModal.classList.remove('is-open');
      pendingForm = null;
    }

    // Intercept form submits with data-confirm (capture phase = before loading spinner)
    document.addEventListener('submit', (e) => {
      if (!e.target.dataset.confirm) return;
      e.preventDefault();
      openModal(e.target, e.target.dataset.confirm);
    }, true);

    // Intercept buttons with data-confirm (e.g. remove member button)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-confirm]');
      if (!btn) return;
      const form = btn.closest('form');
      if (!form) return;
      e.preventDefault();
      openModal(form, btn.dataset.confirm);
    });

    confirmOk.addEventListener('click', () => {
      closeModal();
      if (pendingForm) pendingForm.submit();
    });
    confirmCancel.addEventListener('click', closeModal);
    confirmModal.addEventListener('click', (e) => { if (e.target === confirmModal) closeModal(); });
  }
});
