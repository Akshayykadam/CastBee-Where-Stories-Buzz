import { useRouter } from "expo-router";
import { Search as SearchIcon, Clock, TrendingUp } from "lucide-react-native";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import Colors from "@/constants/colors";
import { Podcast } from "@/types/podcast";

const TRENDING_SEARCHES = [
  "Technology",
  "True Crime",
  "Comedy",
  "News",
  "Business",
  "Sports",
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          query
        )}&media=podcast&limit=20`
      );
      const data = await response.json();
      return data.results as Podcast[];
    },
    enabled: query.length > 0,
  });

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim() && !recentSearches.includes(searchQuery)) {
      setRecentSearches([searchQuery, ...recentSearches.slice(0, 4)]);
    }
  };

  const renderPodcastItem = ({ item }: { item: Podcast }) => (
    <Pressable
      style={styles.resultItem}
      onPress={() => router.push(`/podcast/${item.collectionId}` as any)}
    >
      <Image
        source={{ uri: item.artworkUrl600 }}
        style={styles.resultArtwork}
        contentFit="cover"
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={2}>
          {item.collectionName}
        </Text>
        <Text style={styles.resultArtist} numberOfLines={1}>
          {item.artistName}
        </Text>
        <Text style={styles.resultGenre} numberOfLines={1}>
          {item.primaryGenreName}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Search</Text>
        </View>

        <View style={styles.searchContainer}>
          <SearchIcon
            color={Colors.secondaryText}
            size={20}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Podcasts"
            placeholderTextColor={Colors.secondaryText}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch(query)}
          />
        </View>

        {query.length === 0 ? (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                {recentSearches.map((search, index) => (
                  <Pressable
                    key={index}
                    style={styles.listItem}
                    onPress={() => setQuery(search)}
                  >
                    <Clock color={Colors.secondaryText} size={20} />
                    <Text style={styles.listItemText}>{search}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trending</Text>
              {TRENDING_SEARCHES.map((trend) => (
                <Pressable
                  key={trend}
                  style={styles.listItem}
                  onPress={() => handleSearch(trend)}
                >
                  <TrendingUp color={Colors.accent} size={20} />
                  <Text style={styles.listItemText}>{trend}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={results}
            renderItem={renderPodcastItem}
            keyExtractor={(item) => item.collectionId.toString()}
            contentContainerStyle={styles.resultsContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !isLoading ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No results found</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Try different keywords
                  </Text>
                </View>
              ) : null
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.primaryText,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBg,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.primaryText,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.primaryText,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  listItemText: {
    fontSize: 16,
    color: Colors.primaryText,
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 150,
  },
  resultItem: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  resultArtwork: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.cardBg,
  },
  resultInfo: {
    flex: 1,
    justifyContent: "center",
  },
  resultName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primaryText,
    marginBottom: 4,
  },
  resultArtist: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginBottom: 2,
  },
  resultGenre: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.primaryText,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.secondaryText,
  },
});
