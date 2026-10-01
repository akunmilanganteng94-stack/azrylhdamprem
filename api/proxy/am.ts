import type { IncomingMessage, ServerResponse } from 'http';

interface VercelReq extends IncomingMessage {
  body: any;
  query: Record<string, string | string[]>;
  method?: string;
}

interface VercelRes extends ServerResponse {
  status: (code: number) => VercelRes;
  json: (body: any) => void;
  send: (body: any) => void;
}

export default async function handler(req: VercelReq, res: VercelRes) {
  // Set CORS headers for Vercel deployment
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).send('OK');
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
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

    const { count = 1, endpoint } = body || {};
    const targetUrl = endpoint || 'https://api.zyvor.my.id/api/am/bulkv3';
    const requestPayload = { count: String(count) };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AZRYLPREM-Client/1.0',
        'Accept': 'application/json, text/plain, */*'
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal
    });
    clearTimeout(timeout);

    const textResponse = await response.text();
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(textResponse);
    } catch {
      jsonResponse = { raw: textResponse };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: jsonResponse.message || jsonResponse.error || 'Gagal memproses order AM Prem ke server penyedia.',
        details: jsonResponse
      });
    }

    return res.status(200).json({
      success: true,
      data: jsonResponse
    });
  } catch (err: any) {
    console.error('Vercel AM Proxy Error:', err);
    const isTimeout = err.name === 'AbortError';
    return res.status(500).json({
      success: false,
      error: isTimeout 
        ? 'Koneksi ke API AM Prem timeout (server penyedia sibuk).' 
        : (err.message || 'Terjadi kesalahan sistem saat menghubungi server AM Prem.')
    });
  }
}
