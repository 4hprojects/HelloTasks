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

  // File input — update label and enable upload button
  const fileInput = document.getElementById('fileInput');
  const fileLabel = document.querySelector('.file-input-label');
  const uploadBtn = document.getElementById('uploadBtn');
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

  // Auth forms: confirm password validation + loading states
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
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      if (!btn || !btn.dataset.loadingText) return;
      btn.textContent = btn.dataset.loadingText;
      btn.disabled = true;
    });
  });
});
