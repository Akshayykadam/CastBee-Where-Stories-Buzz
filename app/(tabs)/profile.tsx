import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Settings, Bell, Download, Moon } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>

            <Pressable style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Bell color={Colors.primaryText} size={24} />
                <Text style={styles.settingText}>Notifications</Text>
              </View>
            </Pressable>

            <Pressable style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Download color={Colors.primaryText} size={24} />
                <Text style={styles.settingText}>Download Settings</Text>
              </View>
            </Pressable>

            <Pressable style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Moon color={Colors.primaryText} size={24} />
                <Text style={styles.settingText}>Dark Mode</Text>
              </View>
              <Text style={styles.settingValue}>Always On</Text>
            </Pressable>

            <Pressable style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Settings color={Colors.primaryText} size={24} />
                <Text style={styles.settingText}>Playback Settings</Text>
              </View>
            </Pressable>
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.primaryText,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.primaryText,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  settingText: {
    fontSize: 16,
    color: Colors.primaryText,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.secondaryText,
  },
});
