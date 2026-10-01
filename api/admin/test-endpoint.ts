import type { IncomingMessage, ServerResponse } from 'http';

interface VercelReq extends IncomingMessage {
  body: any;
  method?: string;
}

interface VercelRes extends ServerResponse {
  status: (code: number) => VercelRes;
  json: (body: any) => void;
  send: (body: any) => void;
}

export default async function handler(req: VercelReq, res: VercelRes) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).send('OK');
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // use as is
      }
    }

    const { url, method = 'GET' } = body || {};
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL endpoint wajib diisi.' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method,
      headers: { 'User-Agent': 'AZRYLPREM-HealthCheck/1.0' },
      signal: controller.signal
    });
    clearTimeout(timeout);

    return res.status(200).json({
      success: true,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      error: err.message
    });
  }
}
