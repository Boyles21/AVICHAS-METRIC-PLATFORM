import serverless from 'serverless-http';
import { createApp } from '../../server';

let cached: ReturnType<typeof serverless> | null = null;

export const handler = async (event: any, context: any) => {
  if (!cached) {
    cached = serverless(await createApp());
  }
  // Netlify may deliver either the original path (/api/...) or the function path
  // (/.netlify/functions/api/...). Normalise both to /api/...
  const fnPrefix = '/.netlify/functions/api';
  if (typeof event.path === 'string' && event.path.startsWith(fnPrefix)) {
    const rest = event.path.slice(fnPrefix.length);
    event.path = '/api' + (rest.startsWith('/') ? rest : rest ? '/' + rest : '');
  }
  return cached(event, context);
};
