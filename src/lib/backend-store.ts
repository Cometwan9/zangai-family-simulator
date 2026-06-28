export type BackendModule = "logs" | "qq" | "wechat";

export type BackendPlayer = {
  id: string;
  name: string;
  firstSeen: number;
  lastSeen: number;
};

export type BackendRecord = {
  id: string;
  playerId: string;
  module: BackendModule;
  payload: unknown;
  createdAt: number;
};

export type BackendSnapshot = {
  playerId: string;
  modules: Partial<Record<BackendModule, unknown>>;
  updatedAt: number;
};

type BackendStore = {
  players: Map<string, BackendPlayer>;
  records: BackendRecord[];
  snapshots: Map<string, BackendSnapshot>;
};

const globalStore = globalThis as typeof globalThis & {
  zangAiBackendStore?: BackendStore;
};

export const backendStore: BackendStore =
  globalStore.zangAiBackendStore ??
  (globalStore.zangAiBackendStore = {
    players: new Map(),
    records: [],
    snapshots: new Map(),
  });

export function getBackendStats() {
  const now = Date.now();
  const onlineCutoff = now - 30_000;
  const onlinePlayers = [...backendStore.players.values()].filter((player) => player.lastSeen >= onlineCutoff).length;

  return {
    totalPlayers: backendStore.players.size,
    onlinePlayers,
    records: backendStore.records.length,
    lastUpdated: now,
  };
}

export function trimRecords() {
  if (backendStore.records.length > 500) {
    backendStore.records.splice(0, backendStore.records.length - 500);
  }
}
