import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";
import { useAuthStore } from "../store/authStore";

export function WelcomeScreen() {
  const navigation = useNavigation();
  const { setHasSeenWelcome } = useAuthStore();

  const handleContinue = () => {
    setHasSeenWelcome(true);
    navigation.reset({ index: 0, routes: [{ name: "Main" as never }] });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logo}><Text style={styles.logoText}>🏊</Text></View>
        <Text style={styles.title}>OBM RecFind</Text>
        <Text style={styles.tagline}>Drop-In</Text>
        <Text style={styles.description}>
          Find recreation programs across Oakville, Burlington & Mississauga
        </Text>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  logo: { width: 100, height: 100, borderRadius: 24, backgroundColor: colors.primary + "15", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  logoText: { fontSize: 48 },
  title: { fontSize: 32, fontWeight: "700", color: colors.textPrimary },
  tagline: { fontSize: 20, fontWeight: "500", color: colors.primary, marginTop: 4 },
  description: { fontSize: 16, color: colors.textTertiary, textAlign: "center", marginTop: 16 },
  buttons: { padding: 24 },
  button: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  buttonText: { fontSize: 17, fontWeight: "600", color: colors.textInverse },
});
