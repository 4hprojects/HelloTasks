function showCreator(req, res) {
  res.render('qr/index', {
    title: 'QR Creator',
    pageClass: 'qr-public-layout',
    pwaEnabled: true,
    pageStyles: ['/qr/css/qr-creator.css'],
    pageScripts: [
      '/qr/vendor/qr-code-styling.js',
      '/qr/js/qr-payload-builder.js',
      '/qr/js/qr-creator.js',
      '/qr/js/qr-pwa.js'
    ]
  });
}

function showHelp(req, res) {
  res.render('qr/help', {
    title: 'QR Creator Help',
    pageClass: 'qr-public-layout',
    pwaEnabled: true,
    pageStyles: ['/qr/css/qr-creator.css'],
    pageScripts: ['/qr/js/qr-pwa.js']
  });
}

module.exports = { showCreator, showHelp };
