import { create } from "zustand";

type AnalyticsStore = {
  refreshKey: number;
  refreshHistory: () => void;
};

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  refreshKey: 0,

  refreshHistory: () =>
    set((state) => ({
      refreshKey: state.refreshKey + 1,
    })),
}));