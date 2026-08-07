import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Serves the built React SPA alongside the API routes.
 * Static assets first, then index.html for client-side routes.
 */
export function serveClient(app) {
  const clientDir = path.resolve(__dirname, 'dist/client');

  app.use(express.static(clientDir, { maxAge: '1h' }));

  // SPA fallback: any non-API route that isn't a static file gets index.html
  app.get(/^(?!\/api\/).+$/, (_req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
  });
}
