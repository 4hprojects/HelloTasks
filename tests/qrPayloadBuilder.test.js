const test = require('node:test');
const assert = require('node:assert/strict');
const qr = require('../public/qr/js/qr-payload-builder');

test('normalizes domains and rejects unsafe URL schemes', () => {
  assert.equal(qr.buildUrlPayload({ url: 'example.com' }).payload, 'https://example.com/');
  assert.equal(qr.buildUrlPayload({ url: 'javascript:alert(1)' }).success, false);
  assert.equal(qr.buildUrlPayload({ url: 'data:text/plain,hello' }).success, false);
  assert.equal(qr.buildUrlPayload({ url: 'file:///etc/passwd' }).success, false);
  assert.equal(qr.buildUrlPayload({ url: 'vbscript:msgbox(1)' }).success, false);
});

test('builds text, email, phone, and SMS payloads', () => {
  assert.equal(qr.buildTextPayload({ text: ' Hello ' }).payload, 'Hello');
  assert.equal(qr.buildTextPayload({ text: 'x'.repeat(1501) }).success, false);
  assert.equal(qr.buildEmailPayload({ email: 'a@example.com', subject: 'Hello world', message: 'A&B' }).payload, 'mailto:a@example.com?subject=Hello+world&body=A%26B');
  assert.equal(qr.buildPhonePayload({ phone: '+63 (2) 123-4567' }).payload, 'tel:+63 (2) 123-4567');
  assert.equal(qr.buildSmsPayload({ phone: '+63912', message: 'Hello & bye' }).payload, 'sms:+63912?body=Hello%20%26%20bye');
  assert.equal(qr.buildEmailPayload({ email: 'a@example.com', subject: 'x'.repeat(151) }).success, false);
  assert.equal(qr.buildEmailPayload({ email: 'a@example.com', message: 'x'.repeat(2001) }).success, false);
  assert.equal(qr.buildSmsPayload({ phone: '+63912', message: 'x'.repeat(501) }).success, false);
});

test('builds and escapes Wi-Fi payloads without exposing values in errors', () => {
  assert.equal(qr.buildWifiPayload({ ssid: 'Office;5G', password: 'a:b\\c', security: 'WPA2', hidden: true }).payload, 'WIFI:T:WPA;S:Office\\;5G;P:a\\:b\\\\c;H:true;;');
  assert.equal(qr.buildWifiPayload({ ssid: 'Office', security: 'WPA' }).errors[0].message, 'Password is required for secured networks.');
  assert.equal(qr.buildWifiPayload({ ssid: 'Office', security: 'invalid' }).success, false);
  assert.equal(qr.buildWifiPayload({ ssid: 'x'.repeat(65), password: 'secret', security: 'WPA' }).success, false);
  assert.equal(qr.buildWifiPayload({ ssid: 'Office', password: 'x'.repeat(129), security: 'WPA' }).success, false);
  assert.doesNotMatch(qr.buildWifiPayload({ ssid: 'Private', password: '', security: 'WPA' }).errors[0].message, /Private/);
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
  assert.equal(qr.buildCalendarPayload({ title: 'Long', start: '2026-07-14T09:00', end: '2026-07-14T10:00', description: 'x'.repeat(1001) }).success, false);
  assert.equal(qr.buildCalendarPayload({ title: 'Long', start: '2026-07-14T09:00', end: '2026-07-14T10:00', eventLocation: 'x'.repeat(501) }).success, false);
});

test('dispatcher rejects unsupported QR types', () => assert.equal(qr.buildQrPayload('unknown', {}).success, false));

test('calculates UTF-8 QR capacity at every correction level', () => {
  assert.equal(qr.utf8ByteLength('é'), 2);
  for (const [level, capacity] of Object.entries(qr.QR_BYTE_CAPACITY)) {
    assert.equal(qr.validatePayloadCapacity('x'.repeat(capacity), level).success, true);
    const failure = qr.validatePayloadCapacity('x'.repeat(capacity + 1), level);
    assert.equal(failure.success, false); assert.equal(failure.errors[0].field, 'content');
  }
});

test('sanitizes safe deterministic download filenames', () => {
  assert.equal(qr.sanitizeFilename('  Café Project / Board!  '), 'cafe-project-board');
  assert.equal(qr.buildFilename('', 'png'), 'hellotasks-qr.png');
  assert.equal(qr.buildFilename('My QR', 'svg'), 'hellotasks-qr-my-qr.svg');
  assert.equal(qr.buildFilename('../unsafe', 'exe'), 'hellotasks-qr-unsafe.png');
  assert.equal(qr.sanitizeFilename('x'.repeat(80)).length, 60);
});
