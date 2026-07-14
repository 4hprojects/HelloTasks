const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const layouts = require('express-ejs-layouts');
const path = require('path');
const request = require('supertest');

function app() {
  const instance = express(); instance.set('view engine', 'ejs'); instance.set('views', path.join(__dirname, '..', 'views')); instance.use(layouts); instance.set('layout', 'layouts/main');
  instance.use((req, res, next) => { res.locals.user = null; res.locals.flash = {}; next(); }); instance.use('/qr', require('../routes/qrRoutes')); return instance;
}

test('GET /qr is public and includes local feature assets', async () => {
  const response = await request(app()).get('/qr').expect(200);
  assert.match(response.text, /Create a QR code/); assert.match(response.text, /\/qr\/css\/qr-creator.css/); assert.match(response.text, /\/qr\/js\/qr-creator.js/); assert.doesNotMatch(response.headers.location || '', /login/);
});

test('GET /qr/help is public and explains privacy and static content', async () => {
  const response = await request(app()).get('/qr/help').expect(200);
  assert.match(response.text, /Make QR codes that scan reliably/); assert.match(response.text, /fully client-side/); assert.match(response.text, /cannot be changed after printing/);
});
