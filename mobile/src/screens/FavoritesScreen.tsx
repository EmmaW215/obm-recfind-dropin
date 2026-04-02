import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { useAuthStore } from "../store/authStore";

export function FavoritesScreen() {
  const navigation = useNavigation();
  const { subscriptionTier } = useAuthStore();

  if (subscriptionTier !== "premium") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.locked}>
          <Ionicons name="heart" size={48} color={colors.gray300} />
          <Text style={styles.lockedTitle}>Favorites</Text>
          <Text style={styles.lockedText}>Save your favorite programs with Premium</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Upgrade" as never)}>
            <Text style={styles.buttonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Favorites</Text></View>
      <View style={styles.empty}>
        <Ionicons name="heart-outline" size={64} color={colors.gray300} />
        <Text style={styles.emptyText}>No favorites yet</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16 },
  title: { fontSize: 28, fontWeight: "700", color: colors.textPrimary },
  locked: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  lockedTitle: { fontSize: 24, fontWeight: "700", color: colors.textPrimary, marginTop: 16 },
  lockedText: { fontSize: 16, color: colors.textTertiary, textAlign: "center", marginTop: 8 },
  button: { backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, marginTop: 24 },
  buttonText: { fontSize: 16, fontWeight: "600", color: colors.textInverse },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 18, color: colors.textTertiary, marginTop: 16 },
});
