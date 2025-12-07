import { useRouter } from "expo-router";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useFollowedPodcasts } from "@/contexts/FollowedPodcastsContext";
import { useLikedEpisodes } from "@/contexts/LikedEpisodesContext";
import { useDownloads } from "@/contexts/DownloadContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { Play, Trash } from "lucide-react-native";
import { useState } from "react";

export default function LibraryScreen() {
  const router = useRouter();
  const { followedPodcasts } = useFollowedPodcasts();
  const { likedEpisodes } = useLikedEpisodes();
  const { downloads, deleteDownload } = useDownloads(); // NEW
  const { playEpisode, setQueue } = usePlayer();
  const [activeTab, setActiveTab] = useState<'following' | 'liked' | 'downloads'>('following'); // NEW

  const renderPodcastItem = ({ item }: { item: any }) => (
    <Pressable
      style={styles.podcastItem}
      onPress={() => router.push(`/podcast/${item.collectionId}`)}
    >
      <Image source={{ uri: item.artworkUrl600 }} style={styles.artwork} contentFit="cover" />
      <Text style={styles.podcastTitle} numberOfLines={2}>
        {item.collectionName}
      </Text>
      <Text style={styles.podcastAuthor} numberOfLines={1}>
        {item.artistName}
      </Text>
    </Pressable>
  );

  const startLikedPlayback = (episode: any, index: number) => {
    // Set the queue to be all subsequent liked episodes
    const nextEpisodes = likedEpisodes.slice(index + 1);
    setQueue(nextEpisodes);

    playEpisode(episode, {
      collectionId: episode.collectionId || -1,
      collectionName: episode.podcastTitle || 'Unknown Podcast',
      artistName: episode.artistName || 'Unknown Artist',
      artworkUrl600: episode.artwork || '',
      artworkUrl100: episode.artwork || '',
      feedUrl: '',
      trackCount: 0,
      releaseDate: '',
      primaryGenreName: '',
      collectionViewUrl: '',
    });
  };

  const startDownloadPlayback = (episode: any) => {
    // For now, playing single downloaded episode. Could build a queue too.
    playEpisode(episode, {
      collectionId: -1,
      collectionName: episode.podcastName || 'Downloaded',
      artistName: episode.artistName || 'Unknown',
      artworkUrl600: episode.podcastArtwork || episode.artwork || '',
      artworkUrl100: episode.podcastArtwork || episode.artwork || '',
      feedUrl: '',
      trackCount: 0,
      releaseDate: '',
      primaryGenreName: '',
      collectionViewUrl: '',
    });
  };

  const renderLikedEpisode = ({ item, index }: { item: any, index: number }) => (
    <Pressable style={styles.episodeContainer} onPress={() => startLikedPlayback(item, index)}>
      <Image source={{ uri: item.artwork }} style={styles.episodeArtwork} contentFit="cover" />
      <View style={styles.episodeInfo}>
        <Text style={styles.episodeTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.episodeDate}>{item.podcastTitle || item.collectionName || 'Unknown Podcast'}</Text>
      </View>
      <View style={styles.playIconContainer}>
        <Play size={20} color={Colors.primaryText} fill={Colors.primaryText} />
      </View>
    </Pressable>
  );

  const renderDownloadedEpisode = ({ item }: { item: any }) => (
    <Pressable style={styles.episodeContainer} onPress={() => startDownloadPlayback(item)}>
      <Image source={{ uri: item.podcastArtwork || item.artwork }} style={styles.episodeArtwork} contentFit="cover" />
      <View style={styles.episodeInfo}>
        <Text style={styles.episodeTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.episodeDate}>
          {item.status === 'downloading' ? `Downloading ${Math.round(item.progress)}%` : (item.podcastName || 'Downloaded')}
        </Text>
      </View>
      <Pressable
        style={styles.playIconContainer}
        onPress={() => deleteDownload(item.id)}
        hitSlop={10}
      >
        <Trash size={20} color={Colors.secondaryText} />
      </Pressable>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <Text style={styles.headerTitle}>Library</Text>

        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tabButton, activeTab === 'following' && styles.activeTab]}
            onPress={() => setActiveTab('following')}
          >
            <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>Following</Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === 'liked' && styles.activeTab]}
            onPress={() => setActiveTab('liked')}
          >
            <Text style={[styles.tabText, activeTab === 'liked' && styles.activeTabText]}>Liked</Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === 'downloads' && styles.activeTab]}
            onPress={() => setActiveTab('downloads')}
          >
            <Text style={[styles.tabText, activeTab === 'downloads' && styles.activeTabText]}>Downloads</Text>
          </Pressable>
        </View>

        {activeTab === 'following' ? (
          <FlatList
            key="#" // Force fresh render for grid
            data={followedPodcasts}
            renderItem={renderPodcastItem}
            keyExtractor={(item) => item.collectionId.toString()}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>You haven&apos;t followed any podcasts yet.</Text>
              </View>
            }
          />
        ) : activeTab === 'liked' ? (
          <FlatList
            key="_" // Force fresh render for list
            data={likedEpisodes}
            renderItem={renderLikedEpisode}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No liked episodes yet.</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            key="@"
            data={Object.values(downloads) as any[]}
            renderItem={renderDownloadedEpisode}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No downloaded episodes.</Text>
              </View>
            }
          />
        )}

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
  headerTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: Colors.primaryText,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 16,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.cardBg,
  },
  activeTab: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  activeTabText: {
    color: Colors.black,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Space for mini player
  },
  columnWrapper: {
    gap: 16,
  },
  podcastItem: {
    flex: 1,
    marginBottom: 16,
    maxWidth: "48%",
  },
  artwork: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: Colors.cardBg,
  },
  podcastTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primaryText,
    marginBottom: 4,
  },
  podcastAuthor: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.secondaryText,
  },
  episodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.cardBg,
    borderRadius: 8,
    marginBottom: 12,
    height: 80,
  },
  episodeArtwork: {
    width: 56,
    height: 56,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: '#333',
  },
  episodeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  episodeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryText,
    marginBottom: 4,
  },
  episodeDate: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  playIconContainer: {
    padding: 8,
  }
});
