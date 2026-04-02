import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { useAuthStore } from "../store/authStore";

export function CalendarScreen() {
  const navigation = useNavigation();
  const { subscriptionTier } = useAuthStore();

  if (subscriptionTier !== "premium") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.locked}>
          <Ionicons name="calendar" size={48} color={colors.gray300} />
          <Text style={styles.lockedTitle}>Calendar View</Text>
          <Text style={styles.lockedText}>Plan your week with a visual calendar</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Upgrade" as never)}>
            <Text style={styles.buttonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Calendar</Text></View>
      <View style={styles.weekGrid}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <View key={day} style={styles.dayColumn}>
            <Text style={styles.dayText}>{day}</Text>
          </View>
        ))}
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
  weekGrid: { flexDirection: "row", paddingHorizontal: 16 },
  dayColumn: { flex: 1, alignItems: "center", paddingVertical: 12 },
  dayText: { fontSize: 14, fontWeight: "500", color: colors.textTertiary },
});
