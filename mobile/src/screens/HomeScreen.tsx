import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { useAuthStore } from "../store/authStore";
import { useAppStore } from "../store/appStore";

export function HomeScreen() {
  const navigation = useNavigation();
  const { subscriptionTier } = useAuthStore();
  const { setSelectedCity } = useAppStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome!</Text>
          <Text style={styles.subtitle}>Find your next drop-in activity</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.grid}>
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("Search" as never)}>
              <Ionicons name="search" size={24} color={colors.primary} />
              <Text style={styles.cardText}>Search</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("Calendar" as never)}>
              <Ionicons name="calendar" size={24} color={colors.success} />
              <Text style={styles.cardText}>This Week</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by City</Text>
          {["Oakville", "Burlington", "Mississauga"].map((city) => {
            const locked = subscriptionTier !== "premium" && city === "Mississauga";
            return (
              <TouchableOpacity 
                key={city} 
                style={[styles.cityRow, locked && styles.locked]}
                onPress={() => {
                  if (locked) {
                    navigation.navigate("Upgrade" as never);
                  } else {
                    setSelectedCity(city.toLowerCase());
                    navigation.navigate("Search" as never);
                  }
                }}
              >
                <Text style={styles.cityText}>{city}</Text>
                {locked && <Ionicons name="lock-closed" size={16} color={colors.gray400} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16 },
  greeting: { fontSize: 28, fontWeight: "700", color: colors.textPrimary },
  subtitle: { fontSize: 15, color: colors.textTertiary, marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: colors.textPrimary, marginBottom: 12 },
  grid: { flexDirection: "row", gap: 12 },
  card: { flex: 1, backgroundColor: colors.backgroundSecondary, padding: 16, borderRadius: 12, alignItems: "center", gap: 8 },
  cardText: { fontSize: 14, fontWeight: "500", color: colors.textPrimary },
  cityRow: { backgroundColor: colors.backgroundSecondary, padding: 16, borderRadius: 12, marginBottom: 8, flexDirection: "row", justifyContent: "space-between" },
  locked: { opacity: 0.6 },
  cityText: { fontSize: 16, fontWeight: "500", color: colors.textPrimary },
});
