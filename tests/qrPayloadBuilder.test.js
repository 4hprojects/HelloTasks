const test = require('node:test');
const assert = require('node:assert/strict');
const qr = require('../public/qr/js/qr-payload-builder');

test('normalizes domains and rejects unsafe URL schemes', () => {
  assert.equal(qr.buildUrlPayload({ url: 'example.com' }).payload, 'https://example.com/');
  assert.equal(qr.buildUrlPayload({ url: 'javascript:alert(1)' }).success, false);
  assert.equal(qr.buildUrlPayload({ url: 'data:text/plain,hello' }).success, false);
});

test('builds text, email, phone, and SMS payloads', () => {
  assert.equal(qr.buildTextPayload({ text: ' Hello ' }).payload, 'Hello');
  assert.equal(qr.buildTextPayload({ text: 'x'.repeat(1501) }).success, false);
  assert.equal(qr.buildEmailPayload({ email: 'a@example.com', subject: 'Hello world', message: 'A&B' }).payload, 'mailto:a@example.com?subject=Hello+world&body=A%26B');
  assert.equal(qr.buildPhonePayload({ phone: '+63 (2) 123-4567' }).payload, 'tel:+63 (2) 123-4567');
  assert.equal(qr.buildSmsPayload({ phone: '+63912', message: 'Hello & bye' }).payload, 'sms:+63912?body=Hello%20%26%20bye');
});

test('builds and escapes Wi-Fi payloads without exposing values in errors', () => {
  assert.equal(qr.buildWifiPayload({ ssid: 'Office;5G', password: 'a:b\\c', security: 'WPA2', hidden: true }).payload, 'WIFI:T:WPA;S:Office\\;5G;P:a\\:b\\\\c;H:true;;');
  assert.equal(qr.buildWifiPayload({ ssid: 'Office', security: 'WPA' }).errors[0].message, 'Password is required for secured networks.');
  assert.equal(qr.buildWifiPayload({ ssid: 'Office', security: 'invalid' }).success, false);
});

test('builds vCard and validates optional fields', () => {
  const result = qr.buildVCardPayload({ firstName: 'Ana', lastName: 'Dela, Cruz', organization: '', email: 'ana@example.com', website: 'example.com' });
  assert.equal(result.success, true); assert.match(result.payload, /N:Dela\\, Cruz;Ana/); assert.match(result.payload, /URL:https:\/\/example.com\//);
  assert.equal(qr.buildVCardPayload({ organization: '', email: '' }).success, false);
});

test('validates geographic coordinates', () => {
  assert.equal(qr.buildLocationPayload({ latitude: '16.4164', longitude: '120.5931' }).payload, 'geo:16.4164,120.5931');
  assert.equal(qr.buildLocationPayload({ latitude: '91', longitude: '0' }).success, false);
  assert.equal(qr.buildLocationPayload({ latitude: '0', longitude: '-181' }).success, false);
});

test('builds UTC calendar payload and requires chronological dates', () => {
  const result = qr.buildCalendarPayload({ title: 'Planning', start: '2026-07-14T09:00:00+08:00', end: '2026-07-14T10:00:00+08:00', description: 'A, B', eventLocation: 'Office' });
  assert.match(result.payload, /DTSTART:20260714T010000Z/); assert.match(result.payload, /DESCRIPTION:A\\, B/);
  assert.equal(qr.buildCalendarPayload({ title: 'Bad', start: '2026-07-14T10:00', end: '2026-07-14T09:00' }).success, false);
});

test('dispatcher rejects unsupported QR types', () => assert.equal(qr.buildQrPayload('unknown', {}).success, false));
