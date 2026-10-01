import type { IncomingMessage, ServerResponse } from 'http';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface VercelReq extends IncomingMessage {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelRes extends ServerResponse {
  status: (code: number) => VercelRes;
  json: (body: any) => void;
  send: (body: any) => void;
}

export default async function handler(req: VercelReq, res: VercelRes) {
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
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const fullBody = Buffer.concat(chunks);

    const contentType = (req.headers['content-type'] as string) || 'multipart/form-data';
    const targetUrl = 'https://api.zyvor.my.id/api/imagehd/upscalev2';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'User-Agent': 'AZRYLPREM-Client/1.0'
      },
      body: fullBody,
      signal: controller.signal
    });
    clearTimeout(timeout);

    const respContentType = response.headers.get('content-type') || '';
    if (respContentType.includes('image/')) {
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:${respContentType};base64,${base64}`;
      return res.status(200).json({
        success: true,
        data: {
          resultUrl: dataUrl,
          format: respContentType,
          message: 'Foto berhasil di-upscale ke HD'
        }
      });
    }

    const textResponse = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(textResponse);
    } catch {
      parsed = { raw: textResponse };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: parsed.message || parsed.error || 'Server upscale mengembalikan status gagal.',
        details: parsed
      });
    }

    return res.status(200).json({
      success: true,
      data: parsed
    });
  } catch (err: any) {
    console.error('Vercel HD Proxy Error:', err);
    const isTimeout = err.name === 'AbortError';
    return res.status(500).json({
      success: false,
      error: isTimeout ? 'Proses HD Foto timeout. Server pengolah gambar sedang sibuk.' : (err.message || 'Gagal memproses gambar.')
    });
  }
}
