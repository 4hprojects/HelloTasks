(function () {
  'use strict';

  const form = document.getElementById('qr-form');
  if (!form) return;

  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const builder = window.HelloTasksQrPayload;
  const preview = $('#qr-preview');
  const summary = $('#qr-error-summary');
  const warning = $('#qr-warning');
  const status = $('#qr-status');
  const payloadOutput = $('#qr-payload');
  const downloadButtons = [$('#download-png'), $('#download-svg')];
  const defaults = Object.freeze({ type: 'url', foregroundColor: '#000000', backgroundColor: '#ffffff', size: 800, margin: 4, errorCorrectionLevel: 'H', dotStyle: 'square', cornerStyle: 'square', logoSize: 20 });
  const state = { ...defaults, payload: '', valid: false, logo: null, logoUrl: null, dirty: false, qr: null };
  let timer;

  function announce(message) { status.textContent = ''; window.setTimeout(() => { status.textContent = message; }, 10); }
  function emptyPreview(message) { preview.replaceChildren(Object.assign(document.createElement('p'), { textContent: message || 'Your QR code preview will appear here.' })); }
  function clearGeneratedState(message) {
    state.valid = false; state.payload = ''; state.qr = null; payloadOutput.textContent = '';
    $('.qr-sensitive').hidden = true; downloadButtons.forEach(button => { button.disabled = true; }); emptyPreview(message);
  }
  function clearErrors() {
    summary.hidden = true; summary.replaceChildren();
    $$('.qr-field-error').forEach(element => element.remove());
    $$('.is-invalid').forEach(element => { element.classList.remove('is-invalid'); element.removeAttribute('aria-invalid'); element.removeAttribute('aria-describedby'); });
  }
  function fieldFor(name) { return $(`.qr-form-panel:not([hidden]) [name="${CSS.escape(name)}"]`) || $(`[name="${CSS.escape(name)}"]`); }
  function showErrors(errors, focusSummary) {
    clearErrors(); summary.hidden = false; summary.append('Please fix the following:');
    const list = document.createElement('ul');
    errors.forEach((error, index) => {
      const item = document.createElement('li'); item.textContent = error.message; list.appendChild(item);
      const input = fieldFor(error.field);
      if (input) {
        const id = `qr-field-error-${index}`; const message = document.createElement('span');
        message.id = id; message.className = 'form-error qr-field-error'; message.textContent = error.message;
        input.insertAdjacentElement('afterend', message); input.classList.add('is-invalid'); input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', id);
      }
    });
    summary.appendChild(list); if (focusSummary) summary.focus(); announce(errors[0].message);
  }
  function activeData() {
    const data = {}; const panel = $(`.qr-form-panel[data-panel="${state.type}"]`);
    panel.querySelectorAll('input, textarea, select').forEach(input => { data[input.name] = input.type === 'checkbox' ? input.checked : input.value; });
    return data;
  }
  function contrast(first, second) {
    const luminance = hex => { const values = hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255).map(value => value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4); return .2126 * values[0] + .7152 * values[1] + .0722 * values[2]; };
    const values = [luminance(first), luminance(second)].sort((a, b) => b - a); return (values[0] + .05) / (values[1] + .05);
  }
  function readDesign() {
    ['foregroundColor', 'backgroundColor', 'dotStyle', 'cornerStyle'].forEach(key => { state[key] = $(`[name="${key}"]`).value; });
    ['size', 'margin', 'logoSize'].forEach(key => { state[key] = Number($(`[name="${key}"]`).value); });
    state.errorCorrectionLevel = $('[name="errorCorrectionLevel"]').value;
  }
  function validateDesign() {
    readDesign(); warning.hidden = true; const errors = [];
    [['foregroundHex', $('[name="foregroundHex"]').value], ['backgroundHex', $('[name="backgroundHex"]').value]].forEach(([field, value]) => { if (!/^#[0-9a-f]{6}$/i.test(value)) errors.push({ field, message: 'Enter a six-digit hexadecimal color such as #000000.' }); });
    if (errors.length) return errors;
    const ratio = contrast(state.foregroundColor, state.backgroundColor);
    if (ratio < 2.5) return [{ field: 'foregroundHex', message: 'Choose foreground and background colors with more contrast.' }];
    const notes = [];
    if (ratio < 4.5) notes.push('The colors may be too similar for reliable scanning.');
    if (state.payload && builder.utf8ByteLength(state.payload) > 1000) notes.push('This QR code is dense. Test it carefully before printing.');
    if (state.logo && state.logoSize > 25) notes.push('Large logos can make QR codes harder to scan.');
    if (notes.length) { warning.textContent = notes.join(' '); warning.hidden = false; }
    return [];
  }
  function qrOptions() {
    const level = state.logo ? 'H' : state.errorCorrectionLevel;
    return {
      width: state.size, height: state.size, type: 'canvas', data: state.payload,
      margin: state.margin * Math.max(2, Math.round(state.size / 100)), image: state.logoUrl || undefined,
      qrOptions: { errorCorrectionLevel: level }, dotsOptions: { color: state.foregroundColor, type: state.dotStyle },
      backgroundOptions: { color: state.backgroundColor }, cornersSquareOptions: { color: state.foregroundColor, type: state.cornerStyle },
      cornersDotOptions: { color: state.foregroundColor, type: state.cornerStyle === 'dot' ? 'dot' : 'square' },
      imageOptions: { crossOrigin: 'anonymous', margin: 4, imageSize: state.logoSize / 100, hideBackgroundDots: true }
    };
  }
  function render(focusErrors) {
    if (!builder || !window.QRCodeStyling) {
      clearGeneratedState('QR generation is temporarily unavailable.');
      showErrors([{ field: 'content', message: 'QR generation is temporarily unavailable. Refresh the page and try again.' }], focusErrors);
      return false;
    }
    const result = builder.buildQrPayload(state.type, activeData()); state.payload = result.payload || '';
    readDesign(); const level = state.logo ? 'H' : state.errorCorrectionLevel;
    const capacity = result.success ? builder.validatePayloadCapacity(state.payload, level) : { success: false, errors: [] };
    const errors = result.errors.concat(capacity.errors || [], result.success ? validateDesign() : []);
    if (errors.length) { clearGeneratedState(); showErrors(errors, focusErrors); return false; }
    clearErrors(); preview.replaceChildren();
    try {
      state.qr = new window.QRCodeStyling(qrOptions()); state.qr.append(preview); state.valid = true;
      payloadOutput.textContent = state.payload; $('.qr-sensitive').hidden = state.type !== 'wifi'; downloadButtons.forEach(button => { button.disabled = false; });
      announce('QR code preview updated.'); return true;
    } catch (_) {
      clearGeneratedState('The QR code could not be generated.');
      showErrors([{ field: 'content', message: 'The QR code could not be generated. Try shorter content or different settings.' }], focusErrors); return false;
    }
  }
  function schedule() { state.dirty = true; window.clearTimeout(timer); timer = window.setTimeout(() => render(false), 400); }
  function selectType(type, moveFocus) {
    state.type = type;
    $$('.qr-type').forEach(button => { const active = button.dataset.type === type; button.classList.toggle('is-active', active); button.setAttribute('aria-checked', String(active)); button.tabIndex = active ? 0 : -1; if (active && moveFocus) button.focus(); });
    $$('.qr-form-panel').forEach(panel => { panel.hidden = panel.dataset.panel !== type; });
    clearGeneratedState(); clearErrors(); warning.hidden = true; announce(`${type} QR type selected.`);
  }
  function syncColor(source) {
    const isHex = source.name.endsWith('Hex'); const base = source.name.startsWith('foreground') ? 'foreground' : 'background';
    const picker = $(`[name="${base}Color"]`); const hex = $(`[name="${base}Hex"]`);
    if (isHex) { const normalized = source.value.startsWith('#') ? source.value : `#${source.value}`; if (/^#[0-9a-f]{6}$/i.test(normalized)) { source.value = normalized.toLowerCase(); picker.value = normalized; } }
    else hex.value = picker.value.toLowerCase();
    schedule();
  }
  function removeLogo(announceRemoval) {
    if (state.logoUrl) URL.revokeObjectURL(state.logoUrl);
    state.logo = null; state.logoUrl = null; $('[name="logo"]').value = ''; $('#logo-preview-image').removeAttribute('src'); $('#logo-preview').hidden = true; $('#remove-logo').hidden = true; $('[name="errorCorrectionLevel"]').disabled = false;
    if (announceRemoval) { announce('Logo removed.'); schedule(); }
  }
  function validateLogo(file) {
    if (!file) return;
    const extensionOk = /\.(png|jpe?g|webp)$/i.test(file.name); const typeOk = ['image/png', 'image/jpeg', 'image/webp'].includes(file.type);
    if (!extensionOk || !typeOk || file.size > 2 * 1024 * 1024) { $('[name="logo"]').value = ''; showErrors([{ field: 'logo', message: 'Choose a PNG, JPEG, or WebP image smaller than 2 MB.' }], true); return; }
    const url = URL.createObjectURL(file); const image = new Image();
    image.onload = () => {
      if (image.width > 2000 || image.height > 2000) { URL.revokeObjectURL(url); $('[name="logo"]').value = ''; showErrors([{ field: 'logo', message: 'Logo dimensions must not exceed 2,000 × 2,000 pixels.' }], true); return; }
      removeLogo(false); state.logo = file; state.logoUrl = url; $('#logo-preview-image').src = url; $('#logo-preview').hidden = false; $('#remove-logo').hidden = false;
      $('[name="errorCorrectionLevel"]').value = 'H'; $('[name="errorCorrectionLevel"]').disabled = true; announce('Logo added. High error correction is enabled.'); schedule();
    };
    image.onerror = () => { URL.revokeObjectURL(url); $('[name="logo"]').value = ''; showErrors([{ field: 'logo', message: 'The selected image could not be read.' }], true); };
    image.src = url;
  }
  function filename(extension) { const data = activeData(); return builder.buildFilename(data.label || data.titleLabel || data.title || data.ssid || '', extension); }
  async function download(extension) {
    if (!render(true)) return;
    try { await state.qr.download({ name: filename(extension).replace(`.${extension}`, ''), extension }); announce(`${extension.toUpperCase()} download started.`); }
    catch (_) { showErrors([{ field: 'download', message: `The ${extension.toUpperCase()} could not be downloaded. Please try again.` }], true); }
  }
  function reset() {
    if (state.dirty && !window.confirm('Clear your QR content and customization?')) return;
    form.reset(); removeLogo(false);
    Object.entries(defaults).forEach(([key, value]) => { const input = $(`[name="${key}"]`); if (input) input.value = value; });
    $('[name="foregroundHex"]').value = defaults.foregroundColor; $('[name="backgroundHex"]').value = defaults.backgroundColor;
    Object.assign(state, defaults, { payload: '', valid: false, logo: null, logoUrl: null, dirty: false, qr: null });
    $('#logo-size-output').textContent = '20%'; warning.hidden = true; selectType('url', false); announce('QR Creator reset to defaults.');
  }

  $$('.qr-type').forEach((button, index, buttons) => {
    button.addEventListener('click', () => { selectType(button.dataset.type, false); state.dirty = true; });
    button.addEventListener('keydown', event => { if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); let next = index; if (event.key === 'Home') next = 0; else if (event.key === 'End') next = buttons.length - 1; else next = (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + buttons.length) % buttons.length; selectType(buttons[next].dataset.type, true); state.dirty = true; });
  });
  form.addEventListener('input', schedule);
  $$('.qr-options input:not([type="file"]):not([type="color"]):not([name$="Hex"]), .qr-options select').forEach(input => input.addEventListener('input', schedule));
  $$('[name="foregroundColor"], [name="backgroundColor"], [name="foregroundHex"], [name="backgroundHex"]').forEach(input => input.addEventListener('input', () => syncColor(input)));
  $('[name="logo"]').addEventListener('change', event => validateLogo(event.target.files[0]));
  $('[name="logoSize"]').addEventListener('input', event => { $('#logo-size-output').textContent = `${event.target.value}%`; });
  $('#remove-logo').addEventListener('click', () => removeLogo(true)); $('#generate-qr').addEventListener('click', () => render(true));
  $('#download-png').addEventListener('click', () => download('png')); $('#download-svg').addEventListener('click', () => download('svg')); $('#reset-qr').addEventListener('click', reset);
  $('#copy-payload').addEventListener('click', async () => { if (!state.valid) { showErrors([{ field: 'copy', message: 'Generate a valid QR code before copying its content.' }], true); return; } try { await navigator.clipboard.writeText(state.payload); announce('Encoded content copied.'); } catch (_) { showErrors([{ field: 'copy', message: 'Content could not be copied. Select and copy it manually.' }], true); } });
  window.addEventListener('beforeunload', () => { if (state.logoUrl) URL.revokeObjectURL(state.logoUrl); });

  if (!builder || !window.QRCodeStyling) render(false);
}());
