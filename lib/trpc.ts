import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { supabase } from '@/lib/supabase';

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const apiBaseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  
  // Validate the API base URL if provided
  if (apiBaseUrl && apiBaseUrl.trim() !== '') {
    const cleanUrl = apiBaseUrl.replace(/\/+$/, '');
    
    // Check if URL is valid
    try {
      new URL(cleanUrl);
      console.log('[TRPC] Using EXPO_PUBLIC_RORK_API_BASE_URL:', cleanUrl);
      return cleanUrl;
    } catch (error) {
      console.error('[TRPC] Invalid EXPO_PUBLIC_RORK_API_BASE_URL:', cleanUrl);
      console.error('[TRPC] Falling back to local URL');
    }
  } else {
    console.warn('[TRPC] EXPO_PUBLIC_RORK_API_BASE_URL is not set or empty');
  }
  
  // For web, use the current origin (works for development and production)
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    console.log('[TRPC] Using local web URL:', origin);
    return origin;
  }
  
  // For React Native, try common local development URLs
  const platform = process.env.EXPO_PUBLIC_PLATFORM;
  if (platform === 'ios') {
    console.log('[TRPC] Using iOS simulator localhost');
    return 'http://localhost:8081';
  } else if (platform === 'android') {
    console.log('[TRPC] Using Android emulator localhost');
    return 'http://10.0.2.2:8081';
  }
  
  console.log('[TRPC] Using default localhost for native');
  return 'http://localhost:8081';
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
        const baseUrl = getBaseUrl();
        console.log('[TRPC] Making request to:', url);
        console.log('[TRPC] Request method:', options?.method || 'GET');
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          console.log('[TRPC] Response status:', response.status, response.statusText);
          
          if (!response.ok) {
            const text = await response.text();
            console.error('[TRPC] HTTP error:', response.status, response.statusText);
            console.error('[TRPC] Response body:', text.substring(0, 500));
            
            if (text.startsWith('<')) {
              throw new Error(`Server returned HTML instead of JSON (Status: ${response.status}). Backend may not be running at ${baseUrl}`);
            }
            
            throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
          }
          
          console.log('[TRPC] Request successful');
          return response;
        } catch (error) {
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              console.error('[TRPC] Request timeout (30s) - Backend may be unresponsive');
              throw new Error(`Request timeout: Backend at ${baseUrl} did not respond within 30 seconds`);
            }
            
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
              console.error('[TRPC] Network connection failed');
              console.error('[TRPC] Possible issues:');
              console.error('[TRPC]   1. Backend server is not running');
              console.error('[TRPC]   2. EXPO_PUBLIC_RORK_API_BASE_URL is incorrect:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
              console.error('[TRPC]   3. CORS issues (check backend CORS configuration)');
              console.error('[TRPC]   4. Network connectivity problems');
              console.error('[TRPC] Current base URL:', baseUrl);
              console.error('[TRPC] Full request URL:', url);
              
              throw new Error(`Network error: Cannot reach backend at ${baseUrl}. Check if backend is running and EXPO_PUBLIC_RORK_API_BASE_URL is correct.`);
            }
            
            console.error('[TRPC] Request error:', error.message);
            throw error;
          }
          
          console.error('[TRPC] Unknown error:', String(error));
          throw new Error(`Unknown error occurred: ${String(error)}`);
        }
      },
    }),
  ],
});
