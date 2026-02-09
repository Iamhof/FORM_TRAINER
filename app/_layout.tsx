import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { EnvCheck } from "@/components/EnvCheck";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { BodyMetricsProvider } from "@/contexts/BodyMetricsContext";
import { LeaderboardProvider } from "@/contexts/LeaderboardContext";
import { ProgrammeProvider } from "@/contexts/ProgrammeContext";
import { ScheduleProvider } from "@/contexts/ScheduleContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UserProvider } from "@/contexts/UserContext";
import { initCrashProtection } from "@/lib/crash-protection";
import { trpc, trpcClient } from "@/lib/trpc";

// Initialize crash protection for production builds
initCrashProtection();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="programme-create" 
        options={{ 
          presentation: 'modal',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.data?.code === 'UNAUTHORIZED' || error?.data?.code === 'FORBIDDEN') {
            return false;
          }
          // Retry network errors up to 3 times
          if (error?.message?.includes('Network') || error?.message?.includes('timeout')) {
            return failureCount < 3;
          }
          return false;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 5 * 60 * 1000, // 5 minutes - programme data rarely changes externally
        gcTime: 10 * 60 * 1000, // 10 minutes - keep cached data longer to survive tab switches
        refetchOnMount: 'always', // Still checks, but staleTime gates actual network calls
        refetchOnWindowFocus: false, // Disabled - was causing thundering herd on every app foreground
        refetchOnReconnect: true, // Keep - useful after real disconnects
        networkMode: 'online', // Only fetch when online
      },
      mutations: {
        retry: 2,
        retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
        networkMode: 'always',
      },
    },
  }));

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <EnvCheck>
        <QueryClientProvider client={queryClient}>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <UserProvider>
              <ThemeProvider>
                <ProgrammeProvider>
                  <AnalyticsProvider>
                    <ScheduleProvider>
                      <BodyMetricsProvider>
                        <LeaderboardProvider>
                          <GestureHandlerRootView style={{ flex: 1 }}>
                            <RootLayoutNav />
                          </GestureHandlerRootView>
                        </LeaderboardProvider>
                      </BodyMetricsProvider>
                    </ScheduleProvider>
                  </AnalyticsProvider>
                </ProgrammeProvider>
              </ThemeProvider>
            </UserProvider>
          </trpc.Provider>
        </QueryClientProvider>
      </EnvCheck>
    </ErrorBoundary>
  );
}
