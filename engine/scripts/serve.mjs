// A minimal static file server, for capturing a folder of HTML (capture.serve).
//   node scripts/serve.mjs <dir> [port]
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

/** Serve `dir` on 127.0.0.1:`port` (0 picks a free port). Resolves to { port, stop }. */
export const startStatic = (dir, port = 0) =>
  new Promise((ok, fail) => {
    const root = resolve(dir);
    const server = createServer((req, res) => {
      const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
      let file = join(root, path);
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
      if (!(file === root || file.startsWith(root + sep)) || !existsSync(file)) {
        res.writeHead(404).end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
      createReadStream(file).pipe(res);
    });
    server.on('error', fail);
    server.listen(port, '127.0.0.1', () => ok({ port: server.address().port, stop: () => server.close() }));
  });

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const s = await startStatic(process.argv[2] ?? '.', Number(process.argv[3] ?? 0));
  console.log(`serving ${process.argv[2] ?? '.'} on http://127.0.0.1:${s.port}`);
}
