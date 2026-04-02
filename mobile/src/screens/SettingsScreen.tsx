import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { useAuthStore } from "../store/authStore";

export function SettingsScreen() {
  const navigation = useNavigation();
  const { isAuthenticated, subscriptionTier, signOut } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}><Text style={styles.title}>Settings</Text></View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          {!isAuthenticated ? (
            <TouchableOpacity style={styles.row}>
              <Ionicons name="log-in-outline" size={22} color={colors.textSecondary} />
              <Text style={styles.rowText}>Sign In</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("Upgrade" as never)}>
                <Ionicons name="star-outline" size={22} color={colors.textSecondary} />
                <Text style={styles.rowText}>{subscriptionTier === "premium" ? "Premium" : "Upgrade"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.row} onPress={() => Alert.alert("Sign Out", "Are you sure?", [{ text: "Cancel" }, { text: "Sign Out", onPress: signOut }])}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>OBM RecFind Drop-In v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  header: { padding: 16, backgroundColor: colors.background },
  title: { fontSize: 28, fontWeight: "700", color: colors.textPrimary },
  section: { backgroundColor: colors.background, marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "500", color: colors.textTertiary, padding: 16, paddingBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { fontSize: 16, color: colors.textPrimary },
  signOutText: { fontSize: 16, color: colors.error },
  footer: { alignItems: "center", padding: 24 },
  footerText: { fontSize: 13, color: colors.textTertiary },
});
