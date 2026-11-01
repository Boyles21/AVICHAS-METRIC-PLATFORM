/**
 * Long-running server entry (local development and any host that runs a Node process).
 * Netlify does not use this file: netlify/functions/api.ts calls createApp() directly.
 */
import express from 'express';
import path from 'path';
import { createApp, executeMaintenance } from './server';

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;
  const app = await createApp();

  setInterval(() => {
    executeMaintenance().catch((err) => {
      console.error('[MAINTENANCE INTERVAL ERROR]', err.message);
    });
  }, 10 * 60 * 1000);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Avichas Metrics Platform running on http://0.0.0.0:${PORT} (Trust Proxy: 1)`);
  });
}

startServer();
