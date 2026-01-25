import { logger } from '@/lib/logger';

export function GET(request: Request) {
  logger.debug('[Test API] GET request received');
  return Response.json({ message: 'Test API works', url: request.url });
}
