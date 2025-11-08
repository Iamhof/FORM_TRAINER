import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProgrammeProvider } from "@/contexts/ProgrammeContext";
import { UserProvider } from "@/contexts/UserContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { ScheduleProvider } from "@/contexts/ScheduleContext";
import { BodyMetricsProvider } from "@/contexts/BodyMetricsContext";
import { LeaderboardProvider } from "@/contexts/LeaderboardContext";
import { trpc, trpcClient } from "@/lib/trpc";

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
        retry: false,
        staleTime: 5 * 60 * 1000,
        networkMode: 'offlineFirst',
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        gcTime: 1000 * 60 * 5,
        refetchOnMount: false,
      },
      mutations: {
        networkMode: 'offlineFirst',
      },
    },
  }));

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
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
  );
}
