import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  accessToken: string | null;
  subscriptionTier: "free" | "premium";
  hasSeenWelcome: boolean;
  signIn: (data: { accessToken: string; refreshToken: string; userId: string }) => void;
  signOut: () => void;
  setSubscriptionTier: (tier: "free" | "premium") => void;
  setHasSeenWelcome: (seen: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userId: null,
      accessToken: null,
      subscriptionTier: "free",
      hasSeenWelcome: false,
      signIn: ({ accessToken, userId }) => set({ isAuthenticated: true, accessToken, userId }),
      signOut: () => set({ isAuthenticated: false, accessToken: null, userId: null }),
      setSubscriptionTier: (tier) => set({ subscriptionTier: tier }),
      setHasSeenWelcome: (seen) => set({ hasSeenWelcome: seen }),
    }),
    { name: "auth-storage", storage: createJSONStorage(() => AsyncStorage) }
  )
);
