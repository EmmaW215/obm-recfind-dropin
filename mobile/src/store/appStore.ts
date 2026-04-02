import { create } from "zustand";

interface AppState {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedCity: "oakville",
  setSelectedCity: (city) => set({ selectedCity: city }),
}));
