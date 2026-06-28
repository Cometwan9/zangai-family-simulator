import { NextRequest, NextResponse } from "next/server";
import { backendStore, BackendModule, getBackendStats, trimRecords } from "@/lib/backend-store";

const modules = new Set<BackendModule>(["logs", "qq", "wechat"]);

function isBackendModule(value: unknown): value is BackendModule {
  return typeof value === "string" && modules.has(value as BackendModule);
}

export async function GET(request: NextRequest) {
  const moduleName = request.nextUrl.searchParams.get("module");
  const playerId = request.nextUrl.searchParams.get("playerId");

  if (moduleName && !isBackendModule(moduleName)) {
    return NextResponse.json({ error: "Unknown module" }, { status: 400 });
  }

  const records = backendStore.records
    .filter((record) => (!moduleName || record.module === moduleName) && (!playerId || record.playerId === playerId))
    .slice(-80);

  return NextResponse.json({
    stats: getBackendStats(),
    records,
    snapshot: playerId ? backendStore.snapshots.get(playerId) ?? null : null,
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | {
        action?: string;
        playerId?: string;
        name?: string;
        module?: unknown;
        payload?: unknown;
        modules?: Partial<Record<BackendModule, unknown>>;
      }
    | null;

  if (!body?.playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  const now = Date.now();
  const player = backendStore.players.get(body.playerId);
  backendStore.players.set(body.playerId, {
    id: body.playerId,
    name: body.name?.trim() || player?.name || "冷少",
    firstSeen: player?.firstSeen ?? now,
    lastSeen: now,
  });

  if (body.action === "sync") {
    backendStore.snapshots.set(body.playerId, {
      playerId: body.playerId,
      modules: body.modules ?? {},
      updatedAt: now,
    });
  }

  if (body.action === "record" && isBackendModule(body.module)) {
    backendStore.records.push({
      id: `${now}-${Math.random().toString(16).slice(2)}`,
      playerId: body.playerId,
      module: body.module,
      payload: body.payload ?? null,
      createdAt: now,
    });
    trimRecords();
  }

  return NextResponse.json({
    ok: true,
    stats: getBackendStats(),
    snapshot: backendStore.snapshots.get(body.playerId) ?? null,
  });
}
