import { create } from "zustand";
import { persist } from "zustand/middleware";
import { secretStore } from "../lib/secrets";
import type { ModelProviderConfig } from "../types/model";

interface ModelStore {
  providers: ModelProviderConfig[];
  activeId: string | null;
  upsertProvider: (config: ModelProviderConfig) => Promise<void>;
  removeProvider: (id: string) => Promise<void>;
  setActive: (id: string | null) => void;
  getActive: () => ModelProviderConfig | null;
}

export const useModelStore = create<ModelStore>()(
  persist(
    (set, get) => ({
      providers: [],
      activeId: null,

      upsertProvider: async (config) => {
        if (config.apiKey) await secretStore.set(config.id, config.apiKey);
        set((state) => {
          const exists = state.providers.some((p) => p.id === config.id);
          return {
            providers: exists
              ? state.providers.map((p) => (p.id === config.id ? config : p))
              : [...state.providers, config],
            activeId: state.activeId ?? config.id,
          };
        });
      },

      removeProvider: async (id) => {
        await secretStore.remove(id);
        set((state) => {
          const providers = state.providers.filter((p) => p.id !== id);
          return {
            providers,
            activeId:
              state.activeId === id ? (providers[0]?.id ?? null) : state.activeId,
          };
        });
      },

      setActive: (id) => set({ activeId: id }),

      getActive: () => {
        const state = get();
        return state.providers.find((p) => p.id === state.activeId) ?? null;
      },
    }),
    {
      name: "acs-model-store",
      // API keys must never be persisted to localStorage
      partialize: (state) => ({
        providers: state.providers.map(({ apiKey: _apiKey, ...rest }) => rest),
        activeId: state.activeId,
      }),
    },
  ),
);
