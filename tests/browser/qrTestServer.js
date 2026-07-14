const express = require('express');
const layouts = require('express-ejs-layouts');
const path = require('path');

const app = express();
const root = path.join(__dirname, '..', '..');
app.set('view engine', 'ejs'); app.set('views', path.join(root, 'views')); app.use(layouts); app.set('layout', 'layouts/main');
app.use(express.static(path.join(root, 'public')));
app.use((req, res, next) => { res.locals.user = null; res.locals.flash = {}; res.locals.currentPath = req.path; next(); });
app.get('/qr-missing-library', (req, res) => res.render('qr/index', { title: 'QR Creator', pageClass: 'qr-public-layout', pageStyles: ['/qr/css/qr-creator.css'], pageScripts: ['/qr/js/qr-payload-builder.js', '/qr/js/qr-creator.js'] }));
app.use('/qr', require('../../routes/qrRoutes'));
app.listen(4173, '127.0.0.1');
