/* Winziger statischer Server – nur zum lokalen Testen.
   Für das Spiel selbst wird er nicht benötigt.
   Start:  node tools/serve.js [port]                       */
var http = require('http');
var fs   = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');
var PORT = parseInt(process.argv[2], 10) || 8123;

var TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.md':   'text/markdown; charset=utf-8'
};

http.createServer(function (req, res) {
  var url = decodeURIComponent(req.url.split('?')[0]);

  // Entwicklungshilfe: Screenshot des Canvas entgegennehmen
  if (req.method === 'POST' && url === '/snap') {
    var body = '';
    req.on('data', function (c) { body += c; });
    req.on('end', function () {
      var b64 = body.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFile(path.join(ROOT, 'tools', 'snapshot.png'), Buffer.from(b64, 'base64'), function (err) {
        res.writeHead(err ? 500 : 200, { 'Content-Type': 'text/plain' });
        res.end(err ? String(err) : 'ok');
      });
    });
    return;
  }

  if (url === '/') url = '/index.html';

  var file = path.join(ROOT, url);
  if (file.indexOf(ROOT) !== 0) { res.writeHead(403); return res.end('Forbidden'); }

  fs.readFile(file, function (err, data) {
    if (err) { res.writeHead(404); return res.end('Not found: ' + url); }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
}).listen(PORT, function () {
  console.log('Tower Defense 2026 laeuft auf http://localhost:' + PORT + '/');
});
