import { useRouter } from "expo-router";
import {
  ChevronDown,
  Heart,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  RotateCw,
  Download,
  Check,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  UIManager,
  LayoutAnimation,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Slider from "@react-native-community/slider";
import Colors from "@/constants/colors";
import { usePlayer } from "@/contexts/PlayerContext";
import { useLikedEpisodes } from "@/contexts/LikedEpisodesContext";
import { useDownloads } from "@/contexts/DownloadContext";

const { width } = Dimensions.get("window");

const formatTime = (millis: number): string => {
  const totalSeconds = Math.floor(millis / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function PlayerScreen() {
  const router = useRouter();
  const {
    currentEpisode,
    currentPodcast,
    isPlaying,
    isLoading,
    position,
    duration,
    playbackRate,
    togglePlayPause,
    seekTo,
    skipForward,
    skipBackward,
    togglePlaybackSpeed,
    playNext,
    playPrevious,
  } = usePlayer();

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const { isLiked, toggleLike } = useLikedEpisodes();
  const { isDownloaded, getDownloadProgress, downloadEpisode, deleteDownload } = useDownloads();

  const toggleDescription = () => {
    // Enable LayoutAnimation for Android
    if (Platform.OS === 'android') {
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback to home/library if no history (e.g. after deep link or reload)
      router.replace("/(tabs)");
    }
  };

  if (!currentEpisode || !currentPodcast) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable onPress={handleBack}>
              <ChevronDown color={Colors.primaryText} size={32} />
            </Pressable>
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No episode playing</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const currentPosition = isSeeking ? seekPosition : position;
  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={handleBack}>
            <ChevronDown color={Colors.primaryText} size={32} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Now Playing
          </Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.artworkContainer}>
            <Image
              source={{ uri: currentPodcast.artworkUrl600 }}
              style={styles.artwork}
              contentFit="cover"
            />
          </View>

          <View style={styles.info}>
            <Text style={styles.episodeTitle} numberOfLines={2}>
              {currentEpisode.title}
            </Text>
            <Text style={styles.podcastName} numberOfLines={1}>
              {currentPodcast.collectionName}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration > 0 ? duration : 0.001} // Prevent 0 maximumValue which might cause crash if min is also 0
              value={currentPosition}
              onValueChange={(value: number) => {
                setIsSeeking(true);
                setSeekPosition(value);
              }}
              onSlidingComplete={(value: number) => {
                setIsSeeking(false);
                seekTo(value);
              }}
              minimumTrackTintColor={Colors.accent}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.accent}
            />
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <Pressable onPress={skipBackward}>
              <RotateCcw color={Colors.primaryText} size={28} />
              <Text style={styles.skipText}>10</Text>
            </Pressable>

            <Pressable onPress={playPrevious}>
              <SkipBack color={Colors.primaryText} size={36} />
            </Pressable>

            <Pressable style={styles.playButton} onPress={togglePlayPause}>
              {isLoading ? (
                <ActivityIndicator size="large" color={Colors.black} />
              ) : isPlaying ? (
                <Pause
                  color={Colors.black}
                  size={36}
                  fill={Colors.primaryText}
                />
              ) : (
                <Play color={Colors.black} size={36} fill={Colors.primaryText} />
              )}
            </Pressable>

            <Pressable onPress={playNext}>
              <SkipForward color={Colors.primaryText} size={36} />
            </Pressable>

            <Pressable onPress={skipForward}>
              <RotateCw color={Colors.primaryText} size={28} />
              <Text style={styles.skipText}>10</Text>
            </Pressable>
          </View>

          <View style={styles.secondaryControls}>
            <Pressable onPress={() => toggleLike({
              ...currentEpisode,
              artwork: currentEpisode.artwork || currentPodcast.artworkUrl600,
              podcastTitle: currentPodcast.collectionName,
              artistName: currentPodcast.artistName,
            })}>
              <Heart
                color={isLiked(currentEpisode.id) ? Colors.accent : Colors.primaryText}
                size={24}
                fill={isLiked(currentEpisode.id) ? Colors.accent : "transparent"}
              />
            </Pressable>

            {/* Download Button */}
            <Pressable
              style={styles.downloadButtonPill}
              onPress={() => {
                if (isDownloaded(currentEpisode.id)) {
                  deleteDownload(currentEpisode.id);
                } else if (getDownloadProgress(currentEpisode.id) === 0) {
                  downloadEpisode(currentEpisode, currentPodcast);
                }
              }}
            >
              {getDownloadProgress(currentEpisode.id) > 0 && getDownloadProgress(currentEpisode.id) < 100 ? (
                <>
                  <ActivityIndicator size="small" color={Colors.primaryText} />
                  <Text style={styles.downloadButtonText}>Downloading</Text>
                </>
              ) : isDownloaded(currentEpisode.id) ? (
                <>
                  <Check color={Colors.accent} size={18} />
                  <Text style={[styles.downloadButtonText, { color: Colors.accent }]}>Downloaded</Text>
                </>
              ) : (
                <>
                  <Download color={Colors.primaryText} size={18} />
                  <Text style={styles.downloadButtonText}>Download</Text>
                </>
              )}
            </Pressable>

            <Pressable onPress={togglePlaybackSpeed}>
              <Text style={styles.speedText}>{playbackRate.toFixed(1)}x</Text>
            </Pressable>
          </View>

          {currentEpisode.description && (
            <Pressable style={styles.description} onPress={toggleDescription}>
              <View style={styles.descriptionHeader}>
                <Text style={styles.descriptionTitle}>About this episode</Text>
                <ChevronDown
                  color={Colors.secondaryText}
                  size={20}
                  style={{ transform: [{ rotate: isDescriptionExpanded ? '180deg' : '0deg' }] }}
                />
              </View>
              <Text
                style={styles.descriptionText}
                numberOfLines={isDescriptionExpanded ? undefined : 3}
              >
                {currentEpisode.description}
              </Text>
            </Pressable>
          )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primaryText,
    flex: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120, // Increased to ensure description is fully visible
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: Colors.secondaryText,
  },
  artworkContainer: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 40,
  },
  artwork: {
    width: width - 80,
    height: width - 80,
    borderRadius: 16,
    backgroundColor: Colors.cardBg,
  },
  info: {
    marginBottom: 40,
  },
  episodeTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.primaryText,
    textAlign: "center",
    marginBottom: 8,
  },
  podcastName: {
    fontSize: 16,
    color: Colors.secondaryText,
    textAlign: "center",
  },
  progressContainer: {
    marginBottom: 24,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  timeText: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryText,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  speedText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primaryText,
  },
  description: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.primaryText,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.secondaryText,
    lineHeight: 20,
  },
  skipText: {
    position: 'absolute',
    fontSize: 8,
    fontWeight: 'bold',
    color: Colors.primaryText,
    top: 9,
    left: 9, // Adjust based on icon size and desired centering
  },
  downloadButtonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    minWidth: 140,
    justifyContent: 'center',
  },
  downloadButtonText: {
    color: Colors.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
});
