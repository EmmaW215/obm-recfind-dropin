import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { useAuthStore } from "../store/authStore";

const features = [
  { icon: "globe-outline", title: "All 3 cities" },
  { icon: "calendar-outline", title: "Calendar view" },
  { icon: "time-outline", title: "Real-time data" },
  { icon: "heart-outline", title: "Favorites & notifications" },
  { icon: "remove-circle-outline", title: "No ads" },
];

export function UpgradeScreen() {
  const navigation = useNavigation();
  const { setSubscriptionTier } = useAuthStore();
  const [plan, setPlan] = useState<"monthly" | "annual">("annual");

  const handlePurchase = () => {
    setSubscriptionTier("premium");
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <TouchableOpacity style={styles.close} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.content}>
          <Text style={styles.title}>Upgrade to Premium</Text>
          
          <View style={styles.features}>
            {features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name={f.icon as any} size={24} color={colors.primary} />
                <Text style={styles.featureText}>{f.title}</Text>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              </View>
            ))}
          </View>
          
          <View style={styles.plans}>
            <TouchableOpacity style={[styles.plan, plan === "annual" && styles.planSelected]} onPress={() => setPlan("annual")}>
              <Text style={styles.planTitle}>Annual</Text>
              <Text style={styles.planPrice}>$29.99/year</Text>
              <Text style={styles.planSave}>Save 37%</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.plan, plan === "monthly" && styles.planSelected]} onPress={() => setPlan("monthly")}>
              <Text style={styles.planTitle}>Monthly</Text>
              <Text style={styles.planPrice}>$3.99/month</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handlePurchase}>
          <Text style={styles.buttonText}>Subscribe Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  close: { alignSelf: "flex-end", padding: 16 },
  content: { padding: 24 },
  title: { fontSize: 28, fontWeight: "700", color: colors.textPrimary, textAlign: "center" },
  features: { marginTop: 32, gap: 16 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureText: { flex: 1, fontSize: 16, color: colors.textPrimary },
  plans: { flexDirection: "row", gap: 12, marginTop: 32 },
  plan: { flex: 1, backgroundColor: colors.backgroundSecondary, padding: 16, borderRadius: 12, alignItems: "center", borderWidth: 2, borderColor: "transparent" },
  planSelected: { borderColor: colors.primary },
  planTitle: { fontSize: 18, fontWeight: "600", color: colors.textPrimary },
  planPrice: { fontSize: 16, fontWeight: "700", color: colors.primary, marginTop: 4 },
  planSave: { fontSize: 14, color: colors.success, marginTop: 4 },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: colors.border },
  button: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  buttonText: { fontSize: 18, fontWeight: "600", color: colors.textInverse },
});
