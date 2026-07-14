(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HelloTasksQrPayload = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const ok = payload => ({ success: true, payload, errors: [] });
  const fail = (field, message) => ({ success: false, payload: null, errors: [{ field, message }] });
  const value = (data, key) => String(data[key] == null ? '' : data[key]).trim();
  const emailOk = input => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  const phoneOk = input => /^[+\d\s()\-]+$/.test(input) && /\d/.test(input);
  const escapeWifi = input => input.replace(/([\\;,:"])/g, '\\$1');
  const escapeVcard = input => input.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([;,])/g, '\\$1');
  const escapeIcal = input => escapeVcard(input);
  const QR_BYTE_CAPACITY = Object.freeze({ L: 2953, M: 2331, Q: 1663, H: 1273 });

  function utf8ByteLength(input) {
    const text = String(input || '');
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text).length;
    return Buffer.byteLength(text, 'utf8');
  }

  function validatePayloadCapacity(payload, level) {
    const normalizedLevel = Object.hasOwn(QR_BYTE_CAPACITY, level) ? level : 'H';
    const bytes = utf8ByteLength(payload);
    return bytes <= QR_BYTE_CAPACITY[normalizedLevel]
      ? { success: true, bytes, capacity: QR_BYTE_CAPACITY[normalizedLevel], errors: [] }
      : { success: false, bytes, capacity: QR_BYTE_CAPACITY[normalizedLevel], errors: [{ field: 'content', message: `Content is too large for ${normalizedLevel} error correction. Shorten it or choose a lower correction level.` }] };
  }

  function sanitizeFilename(input) {
    return String(input || '').trim().toLowerCase().normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '').slice(0, 60);
  }

  function buildFilename(input, extension) {
    const clean = sanitizeFilename(input);
    const ext = String(extension || '').toLowerCase() === 'svg' ? 'svg' : 'png';
    return `hellotasks-qr${clean ? `-${clean}` : ''}.${ext}`;
  }

  function normalizeUrl(input) {
    let raw = String(input || '').trim();
    if (!raw) return null;
    if (!/^[a-z][a-z\d+.-]*:/i.test(raw)) raw = `https://${raw}`;
    try {
      const url = new URL(raw);
      return ['http:', 'https:'].includes(url.protocol) && url.hostname ? url.href : null;
    } catch (_) { return null; }
  }

  function buildUrlPayload(data) {
    const url = normalizeUrl(value(data, 'url'));
    return url ? ok(url) : fail('url', 'Enter a valid website address using HTTP or HTTPS.');
  }
  function buildTextPayload(data) {
    const text = value(data, 'text');
    if (!text) return fail('text', 'Enter text to encode.');
    return text.length <= 1500 ? ok(text) : fail('text', 'Text must be 1,500 characters or fewer.');
  }
  function buildEmailPayload(data) {
    const email = value(data, 'email');
    const subject = value(data, 'subject');
    const message = value(data, 'message');
    if (!emailOk(email)) return fail('email', 'Enter a valid email address.');
    if (subject.length > 150) return fail('subject', 'Subject must be 150 characters or fewer.');
    if (message.length > 2000) return fail('message', 'Message must be 2,000 characters or fewer.');
    const query = new URLSearchParams();
    if (subject) query.set('subject', subject);
    if (message) query.set('body', message);
    return ok(`mailto:${email}${query.toString() ? `?${query}` : ''}`);
  }
  function buildPhonePayload(data) {
    const phone = value(data, 'phone');
    return phoneOk(phone) ? ok(`tel:${phone}`) : fail('phone', 'Enter a valid phone number.');
  }
  function buildSmsPayload(data) {
    const phone = value(data, 'phone');
    const message = value(data, 'message');
    if (!phoneOk(phone)) return fail('phone', 'Enter a valid phone number.');
    if (message.length > 500) return fail('message', 'Message must be 500 characters or fewer.');
    return ok(`sms:${phone}${message ? `?body=${encodeURIComponent(message)}` : ''}`);
  }
  function buildWifiPayload(data) {
    const ssid = value(data, 'ssid');
    const password = String(data.password == null ? '' : data.password);
    const security = data.security || 'WPA';
    if (!['WPA', 'WPA2', 'WEP', 'None'].includes(security)) return fail('security', 'Choose a valid Wi-Fi security type.');
    if (!ssid) return fail('ssid', 'Network name is required.');
    if (ssid.length > 64) return fail('ssid', 'Network name must be 64 characters or fewer.');
    if (password.length > 128) return fail('password', 'Password must be 128 characters or fewer.');
    if (security !== 'None' && !password) return fail('password', 'Password is required for secured networks.');
    const type = security === 'None' ? 'nopass' : (security === 'WPA2' ? 'WPA' : security);
    return ok(`WIFI:T:${type};S:${escapeWifi(ssid)};P:${escapeWifi(password)};H:${data.hidden === true || data.hidden === 'on'};;`);
  }
  function buildVCardPayload(data) {
    const first = value(data, 'firstName'); const last = value(data, 'lastName'); const org = value(data, 'organization');
    const email = value(data, 'email'); const website = value(data, 'website'); const phone = value(data, 'phone');
    if (!first && !org) return fail('firstName', 'Enter a first name or organization.');
    if (email && !emailOk(email)) return fail('email', 'Enter a valid email address.');
    const normalizedWebsite = website ? normalizeUrl(website) : '';
    if (website && !normalizedWebsite) return fail('website', 'Enter a valid website address.');
    if (phone && !phoneOk(phone)) return fail('phone', 'Enter a valid phone number.');
    const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${escapeVcard(last)};${escapeVcard(first)};;;`, `FN:${escapeVcard(`${first} ${last}`.trim() || org)}`];
    [['ORG', org], ['TITLE', value(data, 'position')], ['TEL', phone], ['EMAIL', email], ['URL', normalizedWebsite], ['ADR', value(data, 'address')]].forEach(([key, val]) => { if (val) lines.push(`${key}:${escapeVcard(val)}`); });
    lines.push('END:VCARD'); return ok(lines.join('\r\n'));
  }
  function buildLocationPayload(data) {
    const lat = Number(value(data, 'latitude')); const lng = Number(value(data, 'longitude'));
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) return fail('latitude', 'Enter a latitude between -90 and 90.');
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) return fail('longitude', 'Enter a longitude between -180 and 180.');
    return ok(`geo:${lat},${lng}`);
  }
  function calendarDate(input) {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  }
  function buildCalendarPayload(data) {
    const title = value(data, 'title'); const description = value(data, 'description'); const location = value(data, 'eventLocation');
    const start = calendarDate(data.start); const end = calendarDate(data.end);
    if (!title) return fail('title', 'Event title is required.');
    if (!start) return fail('start', 'Enter a valid start time.');
    if (!end) return fail('end', 'Enter a valid end time.');
    if (new Date(data.end) <= new Date(data.start)) return fail('end', 'End time must be later than start time.');
    if (description.length > 1000) return fail('description', 'Description must be 1,000 characters or fewer.');
    if (location.length > 500) return fail('eventLocation', 'Location must be 500 characters or fewer.');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${escapeIcal(title)}`];
    if (description) lines.push(`DESCRIPTION:${escapeIcal(description)}`); if (location) lines.push(`LOCATION:${escapeIcal(location)}`);
    lines.push('END:VEVENT', 'END:VCALENDAR'); return ok(lines.join('\r\n'));
  }
  const builders = { url: buildUrlPayload, text: buildTextPayload, email: buildEmailPayload, phone: buildPhonePayload, sms: buildSmsPayload, wifi: buildWifiPayload, vcard: buildVCardPayload, location: buildLocationPayload, event: buildCalendarPayload };
  function buildQrPayload(type, data) { return builders[type] ? builders[type]({ ...data }) : fail('type', 'Choose a supported QR type.'); }
  return { buildQrPayload, buildUrlPayload, buildTextPayload, buildEmailPayload, buildPhonePayload, buildSmsPayload, buildWifiPayload, buildVCardPayload, buildLocationPayload, buildCalendarPayload, normalizeUrl, utf8ByteLength, validatePayloadCapacity, sanitizeFilename, buildFilename, QR_BYTE_CAPACITY };
}));
