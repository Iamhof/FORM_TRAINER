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
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          
          console.log('[TRPC] Request headers - Token present:', !!token);
          
          return {
            authorization: token ? `Bearer ${token}` : '',
          };
        } catch (error) {
          console.warn('[TRPC] Failed to get session for headers:', error);
          return {
            authorization: '',
          };
        }
      },
      async fetch(url, options) {
        console.log('[TRPC] Making request to:', url);
        console.log('[TRPC] Request method:', options?.method || 'GET');
        console.log('[TRPC] Request headers:', JSON.stringify(options?.headers || {}));
        
        try {
          const response = await fetch(url, options);
          
          console.log('[TRPC] Response status:', response.status, response.statusText);
          console.log('[TRPC] Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
          
          if (!response.ok) {
            const text = await response.text();
            console.error('[TRPC] HTTP error:', response.status, response.statusText);
            console.error('[TRPC] Response body:', text.substring(0, 500));
            
            if (text.startsWith('<')) {
              throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. Check if backend is running at ${getBaseUrl()}`);
            }
            
            throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
          }
          
          console.log('[TRPC] Request successful');
          return response;
        } catch (error) {
          console.error('[TRPC] Network error:', error instanceof Error ? error.message : String(error));
          console.error('[TRPC] Error stack:', error instanceof Error ? error.stack : 'No stack');
          console.error('[TRPC] Base URL:', getBaseUrl());
          console.error('[TRPC] Full request URL:', url);
          console.error('[TRPC] Make sure the backend server is running and EXPO_PUBLIC_RORK_API_BASE_URL is correct');
          throw error;
        }
      },
    }),
  ],
});
