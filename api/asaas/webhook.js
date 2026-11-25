import { handleWebhook } from '../_lib/asaas.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return handleWebhook(req, res);
}
