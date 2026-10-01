import type { IncomingMessage, ServerResponse } from 'http';

interface VercelRes extends ServerResponse {
  status: (code: number) => VercelRes;
  json: (body: any) => void;
}

export default async function handler(req: IncomingMessage, res: VercelRes) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  res.status(200).json({
    status: 'ok',
    service: 'AZRYLPREM Core API (Vercel Serverless)',
    timestamp: new Date().toISOString()
  });
}
