import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../store/authStore";
import { MainTabNavigator } from "./MainTabNavigator";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { UpgradeScreen } from "../screens/UpgradeScreen";

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { hasSeenWelcome } = useAuthStore();
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!hasSeenWelcome && <Stack.Screen name="Welcome" component={WelcomeScreen} />}
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="Upgrade" component={UpgradeScreen} options={{ presentation: "modal" }} />
    </Stack.Navigator>
  );
}
