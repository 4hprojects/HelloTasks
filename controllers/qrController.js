function showCreator(req, res) {
  res.render('qr/index', {
    title: 'QR Creator',
    pageClass: 'qr-public-layout',
    pageStyles: ['/qr/css/qr-creator.css'],
    pageScripts: [
      '/qr/vendor/qr-code-styling.js',
      '/qr/js/qr-payload-builder.js',
      '/qr/js/qr-creator.js'
    ]
  });
}

function showHelp(req, res) {
  res.render('qr/help', {
    title: 'QR Creator Help',
    pageClass: 'qr-public-layout',
    pageStyles: ['/qr/css/qr-creator.css']
  });
}

module.exports = { showCreator, showHelp };
