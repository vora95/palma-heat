// Palma Heat — a small static file server for local play (Node 22, stdlib only).
//
// Run `node serve.ts` and open http://localhost:8080 to play the game from
// game/ without any build step. It only ever serves files from inside
// game/: anything that tries to climb out of that folder gets a 403, and
// anything that is not a file gets a 404. This is a development convenience,
// not a server for the public internet.
//
// Options:  node serve.ts --port 8081   (default port is 8080)

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// The game folder, resolved once at startup so no request can move it.
const gameRoot = resolve(fileURLToPath(new URL('./game', import.meta.url)));

// Port from --port, clamped to the valid range, 8080 when absent or invalid.
function pickPort(argv) {
  const at = argv.indexOf('--port');
  if (at === -1) return 8080;
  const wanted = Number(argv[at + 1]);
  return Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;
}
const port = pickPort(process.argv.slice(2));

// Content types the browser needs for a game: pages, scripts, styles and
// the usual asset formats. Unknown extensions fall back to octet-stream.
const CONTENT_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.woff2', 'font/woff2'],
  ['.wav', 'audio/wav'],
  ['.mp3', 'audio/mpeg'],
  ['.ogg', 'audio/ogg'],
  ['.txt', 'text/plain; charset=utf-8'],
]);

function contentTypeFor(file) {
  return CONTENT_TYPES.get(extname(file).toLowerCase()) ?? 'application/octet-stream';
}

function serveFile(file, response) {
  let size;
  try {
    const info = statSync(file);
    if (!info.isFile()) throw new Error('not a file');
    size = info.size;
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('not found');
    return;
  }
  response.writeHead(200, {
    'content-type': contentTypeFor(file),
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(response);
}

const server = createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  // Resolve inside gameRoot and refuse anything that escapes it.
  const file = resolve(join(gameRoot, normalize(pathname)));
  if (file !== gameRoot && !file.startsWith(gameRoot + sep)) {
    response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('forbidden');
    return;
  }
  serveFile(file, response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`palma-heat: game/ is on http://localhost:${port}`);
});
