const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const layouts = require('express-ejs-layouts');
const path = require('path');
const request = require('supertest');

function app(user = null) {
  const instance = express(); instance.set('view engine', 'ejs'); instance.set('views', path.join(__dirname, '..', 'views')); instance.use(layouts); instance.set('layout', 'layouts/main');
  instance.use((req, res, next) => { res.locals.user = user; res.locals.flash = {}; res.locals.currentPath = req.path; res.locals.unreadCount = 0; next(); }); instance.use('/qr', require('../routes/qrRoutes')); return instance;
}

test('GET /qr is public and includes local feature assets', async () => {
  const response = await request(app()).get('/qr').expect(200);
  assert.match(response.text, /Create a QR code/); assert.match(response.text, /\/qr\/css\/qr-creator.css/); assert.match(response.text, /\/qr\/js\/qr-creator.js/); assert.doesNotMatch(response.headers.location || '', /login/);
  assert.match(response.text, /name="foregroundHex"/); assert.match(response.text, /name="backgroundHex"/); assert.match(response.text, /id="logo-preview-image"/); assert.match(response.text, /role="radiogroup"/);
  assert.match(response.text, /rel="manifest" href="\/qr\/manifest.webmanifest"/); assert.match(response.text, /\/qr\/js\/qr-pwa.js/); assert.match(response.text, /name="theme-color"/);
});

test('authenticated layout exposes an active QR Creator navigation entry', async () => {
  const user = { fullName: 'QR Tester', globalRole: 'member' };
  const response = await request(app(user)).get('/qr').expect(200);
  assert.match(response.text, /class="nav-link active"[^>]*href="\/qr"|href="\/qr" class="nav-link active"/);
  assert.match(response.text, />\s*QR Creator\s*<\/a>/);
});

test('GET /qr/help is public and explains privacy and static content', async () => {
  const response = await request(app()).get('/qr/help').expect(200);
  assert.match(response.text, /Make QR codes that scan reliably/); assert.match(response.text, /fully client-side/); assert.match(response.text, /cannot be changed after printing/);
});
