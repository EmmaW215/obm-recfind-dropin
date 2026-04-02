import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { HomeScreen } from "../screens/HomeScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { FavoritesScreen } from "../screens/FavoritesScreen";
import { CalendarScreen } from "../screens/CalendarScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { colors } from "../theme/colors";
import { useAuthStore } from "../store/authStore";

const Tab = createBottomTabNavigator();

export function MainTabNavigator() {
  const { subscriptionTier } = useAuthStore();
  const isPremium = subscriptionTier === "premium";

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, string> = {
            Home: focused ? "home" : "home-outline",
            Search: focused ? "search" : "search-outline",
            Favorites: focused ? "heart" : "heart-outline",
            Calendar: focused ? "calendar" : "calendar-outline",
            Settings: focused ? "settings" : "settings-outline",
          };
          return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ tabBarBadge: isPremium ? undefined : "🔒" }} />
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ tabBarBadge: isPremium ? undefined : "🔒" }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
