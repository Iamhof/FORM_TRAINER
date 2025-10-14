import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { supabase } from '@/lib/supabase';

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  
  if (!baseUrl) {
    console.error('[TRPC] Missing EXPO_PUBLIC_RORK_API_BASE_URL');
    console.error('[TRPC] Using fallback URL. Please set EXPO_PUBLIC_RORK_API_BASE_URL in .env');
    return 'http://localhost:8081';
  }
  
  console.log('[TRPC] Base URL:', baseUrl);
  return baseUrl;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      async headers() {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        console.log('[TRPC] Request headers - Token present:', !!token);
        
        return {
          authorization: token ? `Bearer ${token}` : '',
        };
      },
      fetch(url, options) {
        console.log('[TRPC] Making request to:', url);
        return fetch(url, options).catch((error) => {
          console.error('[TRPC] Network error:', error.message);
          console.error('[TRPC] Base URL:', getBaseUrl());
          throw error;
        });
      },
    }),
  ],
});
