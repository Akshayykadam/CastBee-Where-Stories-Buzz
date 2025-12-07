import { useRouter } from "expo-router";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import Colors from "@/constants/colors";
import { Podcast } from "@/types/podcast";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.42;

const fetchFeaturedPodcasts = async (): Promise<Podcast[]> => {
  const genres = ["Technology", "Comedy", "News", "True Crime", "Business"];
  const randomGenre = genres[Math.floor(Math.random() * genres.length)];

  const response = await fetch(
    `https://itunes.apple.com/search?term=${randomGenre}&media=podcast&limit=10`
  );
  const data = await response.json();
  return data.results;
};

const fetchPodcastsByCategory = async (category: string): Promise<Podcast[]> => {
  const response = await fetch(
    `https://itunes.apple.com/search?term=${category}&media=podcast&limit=6`
  );
  const data = await response.json();
  return data.results;
};

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

export default function HomeScreen() {
  const router = useRouter();

  const { data: featured = [] } = useQuery({
    queryKey: ["featured"],
    queryFn: fetchFeaturedPodcasts,
  });

  const { data: technology = [] } = useQuery({
    queryKey: ["technology"],
    queryFn: () => fetchPodcastsByCategory("Technology"),
  });

  const { data: comedy = [] } = useQuery({
    queryKey: ["comedy"],
    queryFn: () => fetchPodcastsByCategory("Comedy"),
  });

  const { data: trueCrime = [] } = useQuery({
    queryKey: ["true-crime"],
    queryFn: () => fetchPodcastsByCategory("True Crime"),
  });

  const renderPodcastCard = (podcast: Podcast, large?: boolean) => (
    <Pressable
      key={podcast.collectionId}
      style={({ pressed }) => [
        styles.card,
        large && styles.cardLarge,
        pressed && styles.cardPressed,
      ]}
      onPress={() => router.push(`/podcast/${podcast.collectionId}` as any)}
    >
      <Image
        source={{ uri: podcast.artworkUrl600 }}
        style={[styles.artwork, large && styles.artworkLarge]}
        contentFit="cover"
      />
      <Text style={styles.podcastName} numberOfLines={2}>
        {podcast.collectionName}
      </Text>
      <Text style={styles.artistName} numberOfLines={1}>
        {podcast.artistName}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>{getGreeting()}</Text>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {featured.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Featured Today</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {featured.map((podcast) => renderPodcastCard(podcast, true))}
              </ScrollView>
            </View>
          )}

          {technology.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Technology</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {technology.map((podcast) => renderPodcastCard(podcast))}
              </ScrollView>
            </View>
          )}

          {comedy.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Comedy</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {comedy.map((podcast) => renderPodcastCard(podcast))}
              </ScrollView>
            </View>
          )}

          {trueCrime.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>True Crime</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {trueCrime.map((podcast) => renderPodcastCard(podcast))}
              </ScrollView>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.primaryText,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.primaryText,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  horizontalScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
  },
  cardLarge: {
    width: width * 0.58,
  },
  artwork: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 8,
    backgroundColor: Colors.cardBg,
  },
  artworkLarge: {
    width: width * 0.58,
    height: width * 0.58,
  },
  podcastName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primaryText,
    marginTop: 8,
  },
  artistName: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  bottomPadding: {
    height: 80,
  },
  cardPressed: {
    opacity: 0.7,
  },
});
