(function () {
  'use strict';
  const builder = window.HelloTasksQrPayload;
  const form = document.getElementById('qr-form');
  if (!form || !builder || !window.QRCodeStyling) return;

  const defaults = { type: 'url', foregroundColor: '#000000', backgroundColor: '#ffffff', size: 800, margin: 4, errorCorrectionLevel: 'H', dotStyle: 'square', cornerStyle: 'square', logoSize: 20 };
  const state = { ...defaults, payload: '', valid: false, logo: null, logoUrl: null, dirty: false, qr: null };
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const preview = $('#qr-preview'); const summary = $('#qr-error-summary'); const warning = $('#qr-warning');
  const downloadButtons = [$('#download-png'), $('#download-svg')];
  let timer;

  function activeData() {
    const panel = $(`.qr-form-panel[data-panel="${state.type}"]`); const data = {};
    panel.querySelectorAll('input, textarea, select').forEach(input => { data[input.name] = input.type === 'checkbox' ? input.checked : input.value; });
    return data;
  }
  function clearErrors() { summary.hidden = true; summary.innerHTML = ''; $$('.qr-field-error').forEach(el => el.remove()); $$('.is-invalid').forEach(el => { el.classList.remove('is-invalid'); el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }); }
  function showErrors(errors) {
    clearErrors(); summary.hidden = false; const ul = document.createElement('ul');
    errors.forEach((error, index) => { const li = document.createElement('li'); li.textContent = error.message; ul.appendChild(li); const input = $(`.qr-form-panel:not([hidden]) [name="${CSS.escape(error.field)}"]`) || $(`[name="${CSS.escape(error.field)}"]`); if (input) { const id = `qr-field-error-${index}`; const message = document.createElement('span'); message.id = id; message.className = 'form-error qr-field-error'; message.textContent = error.message; input.insertAdjacentElement('afterend', message); input.classList.add('is-invalid'); input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', id); } });
    summary.append('Please fix the following: ', ul); summary.focus();
  }
  function contrast(hex1, hex2) {
    const lum = hex => { const rgb = hex.match(/[a-f\d]{2}/gi).map(v => parseInt(v, 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]; };
    const values = [lum(hex1), lum(hex2)].sort((a, b) => b - a); return (values[0] + .05) / (values[1] + .05);
  }
  function readDesign() { ['foregroundColor','backgroundColor','dotStyle','cornerStyle'].forEach(key => { state[key] = $(`[name="${key}"]`).value; }); ['size','margin','logoSize'].forEach(key => { state[key] = Number($(`[name="${key}"]`).value); }); state.errorCorrectionLevel = $('[name="errorCorrectionLevel"]').value; }
  function reliabilityErrors() { readDesign(); warning.hidden = true; if (contrast(state.foregroundColor, state.backgroundColor) < 2.5) return [{ field: 'foregroundColor', message: 'Choose colors with more contrast for reliable scanning.' }]; const notes = []; if (contrast(state.foregroundColor, state.backgroundColor) < 4.5) notes.push('The colors may be too similar for reliable scanning.'); if (state.payload.length > 1000) notes.push('This QR code is dense. Test it carefully before printing.'); if (state.logo && state.logoSize > 25) notes.push('Large logos can make QR codes harder to scan.'); if (notes.length) { warning.textContent = notes.join(' '); warning.hidden = false; } return []; }
  function qrOptions() { const actualEcc = state.logo ? 'H' : state.errorCorrectionLevel; return { width: state.size, height: state.size, type: 'canvas', data: state.payload, margin: state.margin * Math.max(2, Math.round(state.size / 100)), image: state.logoUrl || undefined, qrOptions: { errorCorrectionLevel: actualEcc }, dotsOptions: { color: state.foregroundColor, type: state.dotStyle }, backgroundOptions: { color: state.backgroundColor }, cornersSquareOptions: { color: state.foregroundColor, type: state.cornerStyle }, cornersDotOptions: { color: state.foregroundColor, type: state.cornerStyle === 'dot' ? 'dot' : 'square' }, imageOptions: { crossOrigin: 'anonymous', margin: 4, imageSize: state.logoSize / 100, hideBackgroundDots: true } }; }
  function render(focusErrors) {
    const result = builder.buildQrPayload(state.type, activeData()); state.payload = result.payload || '';
    const designErrors = result.success ? reliabilityErrors() : [];
    if (!result.success || designErrors.length) { state.valid = false; downloadButtons.forEach(b => b.disabled = true); if (focusErrors) showErrors(result.errors.concat(designErrors)); return false; }
    clearErrors(); preview.innerHTML = ''; try { state.qr = new QRCodeStyling(qrOptions()); state.qr.append(preview); state.valid = true; $('#qr-payload').textContent = state.payload; $('.qr-sensitive').hidden = state.type !== 'wifi'; downloadButtons.forEach(b => b.disabled = false); $('#qr-status').textContent = 'QR code preview updated.'; return true; } catch (_) { state.valid = false; showErrors([{ field: 'content', message: 'The QR code could not be generated. Try shorter content.' }]); return false; }
  }
  function schedule() { state.dirty = true; clearTimeout(timer); timer = setTimeout(() => render(false), 400); }
  function selectType(type) { state.type = type; $$('.qr-type').forEach(button => { const active = button.dataset.type === type; button.classList.toggle('is-active', active); button.setAttribute('aria-checked', String(active)); }); $$('.qr-form-panel').forEach(panel => { panel.hidden = panel.dataset.panel !== type; }); preview.innerHTML = '<p>Your QR code preview will appear here.</p>'; state.valid = false; downloadButtons.forEach(b => b.disabled = true); clearErrors(); }
  async function validateLogo(file) {
    if (!file) return; if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) return showErrors([{ field: 'logo', message: 'Choose a PNG, JPEG, or WebP image smaller than 2 MB.' }]);
    const url = URL.createObjectURL(file); const image = new Image(); image.onload = () => { if (image.width > 2000 || image.height > 2000) { URL.revokeObjectURL(url); return showErrors([{ field: 'logo', message: 'Logo dimensions must not exceed 2,000 × 2,000 pixels.' }]); } if (state.logoUrl) URL.revokeObjectURL(state.logoUrl); state.logo = file; state.logoUrl = url; $('[name="errorCorrectionLevel"]').value = 'H'; $('#remove-logo').hidden = false; schedule(); }; image.onerror = () => { URL.revokeObjectURL(url); showErrors([{ field: 'logo', message: 'The selected image could not be read.' }]); }; image.src = url;
  }
  function filename(extension) { const data = activeData(); const source = data.label || data.titleLabel || data.title || data.ssid || ''; const clean = String(source).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60); return `hellotasks-qr${clean ? `-${clean}` : ''}.${extension}`; }
  async function download(extension) { if (!render(true)) return; try { await state.qr.download({ name: filename(extension).replace(`.${extension}`, ''), extension }); } catch (_) { showErrors([{ field: 'download', message: `The ${extension.toUpperCase()} could not be downloaded. Please try again.` }]); } }
  function reset() { if (state.dirty && !window.confirm('Clear your QR content and customization?')) return; form.reset(); $$('.qr-options input, .qr-options select').forEach(input => { if (defaults[input.name] !== undefined) input.value = defaults[input.name]; }); if (state.logoUrl) URL.revokeObjectURL(state.logoUrl); Object.assign(state, defaults, { payload: '', valid: false, logo: null, logoUrl: null, dirty: false, qr: null }); $('#remove-logo').hidden = true; $('#logo-size-output').textContent = '20%'; $('#qr-payload').textContent = ''; warning.hidden = true; selectType('url'); }

  $$('.qr-type').forEach(button => button.addEventListener('click', () => { selectType(button.dataset.type); state.dirty = true; }));
  form.addEventListener('input', schedule); $$('.qr-options input, .qr-options select').forEach(input => input.addEventListener('input', schedule));
  $('[name="logo"]').addEventListener('change', event => validateLogo(event.target.files[0])); $('[name="logoSize"]').addEventListener('input', event => { $('#logo-size-output').textContent = `${event.target.value}%`; });
  $('#remove-logo').addEventListener('click', () => { if (state.logoUrl) URL.revokeObjectURL(state.logoUrl); state.logo = null; state.logoUrl = null; $('[name="logo"]').value = ''; $('#remove-logo').hidden = true; schedule(); });
  $('#generate-qr').addEventListener('click', () => render(true)); $('#download-png').addEventListener('click', () => download('png')); $('#download-svg').addEventListener('click', () => download('svg')); $('#reset-qr').addEventListener('click', reset);
  $('#copy-payload').addEventListener('click', async () => { if (!state.valid) return; try { await navigator.clipboard.writeText(state.payload); $('#qr-status').textContent = 'Encoded content copied.'; } catch (_) { showErrors([{ field: 'copy', message: 'Content could not be copied. Select and copy it manually.' }]); } });
  window.addEventListener('beforeunload', () => { if (state.logoUrl) URL.revokeObjectURL(state.logoUrl); });
}());
