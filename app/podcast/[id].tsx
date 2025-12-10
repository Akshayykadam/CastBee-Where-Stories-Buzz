import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Heart, Play, Pause, Download, Check } from "lucide-react-native";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import Colors from "@/constants/colors";
import { Podcast, Episode } from "@/types/podcast";
import { usePlayer } from "@/contexts/PlayerContext";
import { useFollowedPodcasts } from "@/contexts/FollowedPodcastsContext";
import { useDownloads } from "@/contexts/DownloadContext";


const parseRSS = async (url: string): Promise<Episode[]> => {
  try {
    const response = await fetch(url);
    const text = await response.text();

    const episodes: Episode[] = [];
    const itemMatches = text.match(/<item[^>]*>([\s\S]*?)<\/item>/gi);

    if (!itemMatches) return [];

    for (let i = 0; i < Math.min(itemMatches.length, 20); i++) {
      const item = itemMatches[i];

      const titleMatch = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const contentMatch = item.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i);
      const descMatch = item.match(/<description[^>]*>([\s\S]*?)<\/description>/i) || item.match(/<itunes:summary[^>]*>([\s\S]*?)<\/itunes:summary>/i);
      const enclosureMatch = item.match(/<enclosure[^>]*url=["']([^"']*)["']/i);
      const pubDateMatch = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
      const durationMatch = item.match(/<itunes:duration[^>]*>([\s\S]*?)<\/itunes:duration>/i);
      const guidMatch = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);

      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : "Unknown Episode";

      // Prefer content:encoded, then description, then itunes:summary
      let rawDescription = "";
      if (contentMatch) {
        rawDescription = contentMatch[1];
      } else if (descMatch) {
        rawDescription = descMatch[1] || descMatch[2] || "";
      }

      // Remove CDATA, HTML tags, and extra whitespace
      const description = rawDescription
        .replace(/<!\[CDATA\[/g, "")
        .replace(/\]\]>/g, "")
        .replace(/<[^>]*>/g, "")
        .trim();

      const audioUrl = enclosureMatch ? enclosureMatch[1] : "";
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : "";
      const durationText = durationMatch ? durationMatch[1].trim() : "0";
      const guid = guidMatch ? guidMatch[1].replace(/<[^>]*>/g, "").trim() : "";

      const duration = parseDuration(durationText);

      episodes.push({
        id: guid || audioUrl || `episode-${i}`,
        title,
        description,
        audioUrl,
        pubDate,
        duration,
        artwork: "",
      });
    }

    return episodes;
  } catch (error) {
    console.error("Error parsing RSS:", error);
    return [];
  }
};

const parseDuration = (duration: string): number => {
  const parts = duration.split(":");
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  } else if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return parseInt(duration) || 0;
};

const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function PodcastDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { playEpisode, currentEpisode, isPlaying, togglePlayPause, setPodcastEpisodes } = usePlayer();
  const { isFollowing, toggleFollow } = useFollowedPodcasts();
  const { downloadEpisode, isDownloaded, getDownloadProgress } = useDownloads();

  const { data: podcast, isLoading } = useQuery({
    queryKey: ["podcast", id],
    queryFn: async () => {
      const response = await fetch(
        `https://itunes.apple.com/lookup?id=${id}`
      );
      const data = await response.json();
      return data.results[0] as Podcast;
    },
  });

  const { data: episodes = [], isLoading: isEpisodesLoading } = useQuery({
    queryKey: ["episodes", podcast?.feedUrl],
    queryFn: () => parseRSS(podcast?.feedUrl || ""),
    enabled: !!podcast?.feedUrl,
  });

  // Update podcast episodes in PlayerContext for continuation logic
  React.useEffect(() => {
    if (episodes.length > 0) {
      setPodcastEpisodes(episodes);
    }
  }, [episodes, setPodcastEpisodes]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!podcast) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>Podcast not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color={Colors.primaryText} size={24} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.artworkContainer}>
            <Image
              source={{ uri: podcast.artworkUrl600 }}
              style={styles.artwork}
              contentFit="cover"
            />
          </View>

          <Text style={styles.podcastName}>{podcast.collectionName}</Text>
          <Text style={styles.artistName}>{podcast.artistName}</Text>

          <View style={styles.actions}>
            <Pressable
              style={[
                styles.followButton,
                isFollowing(podcast.collectionId) && styles.followButtonActive
              ]}
              onPress={() => toggleFollow(podcast)}
            >
              <Heart
                color={isFollowing(podcast.collectionId) ? Colors.accent : Colors.primaryText}
                size={20}
                fill={isFollowing(podcast.collectionId) ? Colors.accent : "transparent"}
              />
              <Text style={[
                styles.followButtonText,
                isFollowing(podcast.collectionId) && styles.followButtonTextActive
              ]}>
                {isFollowing(podcast.collectionId) ? "Following" : "Follow"}
              </Text>
            </Pressable>


          </View>

          <View style={styles.episodesSection}>
            <Text style={styles.sectionTitle}>Episodes</Text>

            {isEpisodesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.accent} />
              </View>
            ) : episodes.length === 0 ? (
              <Text style={styles.noEpisodes}>No episodes available</Text>
            ) : (
              episodes.map((episode) => {
                const isCurrentEpisode = currentEpisode?.id === episode.id;
                const isThisPlaying = isCurrentEpisode && isPlaying;
                const downloaded = isDownloaded(episode.id);
                const progress = getDownloadProgress(episode.id);
                const isDownloading = progress > 0 && progress < 100;

                const handlePress = () => {

                  if (isCurrentEpisode) {

                    togglePlayPause();
                  } else {

                    playEpisode(episode, podcast);
                  }
                };

                const handleDownload = () => {
                  if (!downloaded && !isDownloading) {
                    downloadEpisode(episode, podcast);
                  }
                };

                return (
                  <View key={episode.id} style={styles.episodeRow}>
                    <Pressable
                      style={styles.episodeItem}
                      onPress={handlePress}
                    >
                      <View style={styles.episodeLeft}>
                        <View style={styles.playIconContainer}>
                          {isThisPlaying ? (
                            <Pause
                              color={Colors.accent}
                              size={16}
                              fill={Colors.accent}
                            />
                          ) : (
                            <Play
                              color={Colors.accent}
                              size={16}
                              fill={Colors.accent}
                            />
                          )}
                        </View>
                        <View style={styles.episodeInfo}>
                          <Text style={styles.episodeTitle} numberOfLines={2}>
                            {episode.title}
                          </Text>
                          <Text style={styles.episodeDescription} numberOfLines={2}>
                            {episode.description}
                          </Text>
                          <View style={styles.episodeMeta}>
                            <Text style={styles.episodeMetaText}>
                              {formatDate(episode.pubDate)}
                            </Text>
                            <Text style={styles.episodeMetaText}> • </Text>
                            <Text style={styles.episodeMetaText}>
                              {formatDuration(episode.duration)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>

                    <Pressable
                      style={[styles.downloadButton, (downloaded || isDownloading) && styles.downloadButtonDisabled]}
                      onPress={handleDownload}
                      disabled={downloaded || isDownloading}
                    >
                      {isDownloading ? (
                        <ActivityIndicator size="small" color={Colors.secondaryText} />
                      ) : downloaded ? (
                        <Check size={20} color={Colors.accent} />
                      ) : (
                        <Download size={20} color={Colors.secondaryText} />
                      )}
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>
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
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.black,
  },
  errorText: {
    color: Colors.primaryText,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  artworkContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  artwork: {
    width: 240,
    height: 240,
    borderRadius: 12,
    backgroundColor: Colors.cardBg,
  },
  podcastName: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.primaryText,
    textAlign: "center",
    marginTop: 24,
    paddingHorizontal: 32,
  },
  artistName: {
    fontSize: 16,
    color: Colors.secondaryText,
    textAlign: "center",
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    gap: 12,
    paddingHorizontal: 32,
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followButtonActive: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(255, 76, 76, 0.1)', // Light accent color background
  },
  followButtonText: {
    color: Colors.primaryText,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  followButtonTextActive: {
    color: Colors.accent,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.cardBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  episodesSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.primaryText,
    marginBottom: 16,
  },
  noEpisodes: {
    color: Colors.secondaryText,
    fontSize: 14,
    textAlign: "center",
    marginTop: 32,
  },
  episodeRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingRight: 8,
  },
  episodeItem: {
    flex: 1,
    paddingVertical: 12,
  },
  episodeLeft: {
    flexDirection: "row",
    flex: 1,
    gap: 12,
  },
  playIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBg,
    justifyContent: "center",
    alignItems: "center",
  },
  episodeInfo: {
    flex: 1,
  },
  episodeTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primaryText,
    marginBottom: 4,
  },
  episodeDescription: {
    fontSize: 13,
    color: Colors.secondaryText,
    marginBottom: 6,
  },
  episodeMeta: {
    flexDirection: "row",
  },
  episodeMetaText: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
  },
  downloadButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButtonDisabled: {
    opacity: 0.6,
  },
});
