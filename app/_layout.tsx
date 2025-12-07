import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { FollowedPodcastsProvider } from "@/contexts/FollowedPodcastsContext";
import { LikedEpisodesProvider } from "@/contexts/LikedEpisodesContext";
import MiniPlayer from "@/components/MiniPlayer";
import { DownloadProvider } from "@/contexts/DownloadContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="player"
        options={{
          presentation: "modal",
          headerShown: false,
          animation: "slide_from_bottom"
        }}
      />
      <Stack.Screen
        name="podcast/[id]"
        options={{
          headerShown: false,
          animation: "slide_from_right"
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <FollowedPodcastsProvider>
          <LikedEpisodesProvider>
            <DownloadProvider>
              <PlayerProvider>
                <RootLayoutNav />
                <MiniPlayer />
              </PlayerProvider>
            </DownloadProvider>
          </LikedEpisodesProvider>
        </FollowedPodcastsProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
