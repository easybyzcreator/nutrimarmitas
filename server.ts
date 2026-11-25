import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  handleConfig,
  handleCreatePayment,
  handlePaymentStatus,
  handleWebhook
} from './api/_lib/asaas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/asaas/config', (req, res) => handleConfig(req, res));
  app.post('/api/asaas/create-payment', (req, res) => handleCreatePayment(req, res));
  app.get('/api/asaas/payment-status/:paymentId', (req, res) => handlePaymentStatus(req, res));
  app.post('/api/asaas/webhook', (req, res) => handleWebhook(req, res));

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
