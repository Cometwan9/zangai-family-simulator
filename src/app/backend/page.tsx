import Link from "next/link";
import { readAccountDatabase } from "@/lib/account-store";
import { backendStore, getBackendStats } from "@/lib/backend-store";

export const dynamic = "force-dynamic";

function time(value?: number | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}

function preview(value: unknown) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function BackendPage() {
  const stats = getBackendStats();
  const players = [...backendStore.players.values()].sort((a, b) => b.lastSeen - a.lastSeen);
  const records = backendStore.records.slice(-80).reverse();
  const snapshots = [...backendStore.snapshots.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  const accountDatabase = readAccountDatabase();
  const accounts = Object.values(accountDatabase.accounts).sort((a, b) => b.createdAt - a.createdAt);
  const invites = Object.values(accountDatabase.invites).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <main className="backend-page">
      <header className="backend-hero">
        <div>
          <span>ZA-AI-JIA-ZU BACKEND</span>
          <h1>葬AI 后端数据看板</h1>
          <p>独立页面 · 不进入 XP 桌面 · QQ、日志、微信数据分开同步</p>
        </div>
        <nav>
          <Link href="/">返回游戏</Link>
          <Link href="/api/backend">查看 API</Link>
        </nav>
      </header>

      <section className="backend-stats">
        <article><b>{stats.totalPlayers}</b><span>总玩家</span></article>
        <article><b>{stats.onlinePlayers}</b><span>在线玩家</span></article>
        <article><b>{stats.records}</b><span>后端记录</span></article>
        <article><b>{accounts.length}</b><span>注册账号</span></article>
      </section>

      <section className="backend-grid">
        <article className="backend-card">
          <h2>玩家</h2>
          <div className="backend-table">
            {players.length ? players.map((player) => (
              <p key={player.id}>
                <b>{player.name}</b>
                <span>{player.id}</span>
                <small>最后在线 {time(player.lastSeen)}</small>
              </p>
            )) : <em>暂无在线同步玩家</em>}
          </div>
        </article>

        <article className="backend-card">
          <h2>账号</h2>
          <div className="backend-table">
            {accounts.map((account) => (
              <p key={account.qq}>
                <b>{account.nickname}</b>
                <span>QQ {account.qq}</span>
                <small>注册 {time(account.createdAt)} · 邀请码 {account.inviteCode}</small>
              </p>
            ))}
          </div>
        </article>

        <article className="backend-card wide">
          <h2>同步快照</h2>
          <div className="backend-snapshots">
            {snapshots.length ? snapshots.map((snapshot) => (
              <section key={snapshot.playerId}>
                <header>
                  <b>{snapshot.playerId}</b>
                  <span>{time(snapshot.updatedAt)}</span>
                </header>
                {Object.entries(snapshot.modules).map(([module, data]) => (
                  <details key={module}>
                    <summary>{module}</summary>
                    <pre>{preview(data)}</pre>
                  </details>
                ))}
              </section>
            )) : <em>暂无同步快照</em>}
          </div>
        </article>

        <article className="backend-card">
          <h2>邀请码库</h2>
          <div className="backend-table">
            {invites.slice(0, 24).map((invite) => (
              <p key={invite.code}>
                <b>{invite.code}</b>
                <span>{invite.status === "available" ? "可用" : "已使用"}</span>
                <small>{invite.usedBy ? `使用者 ${invite.usedBy}` : `创建 ${time(invite.createdAt)}`}</small>
              </p>
            ))}
          </div>
        </article>

        <article className="backend-card wide">
          <h2>模块记录</h2>
          <div className="backend-records">
            {records.length ? records.map((record) => (
              <details key={record.id}>
                <summary><b>{record.module}</b><span>{record.playerId}</span><small>{time(record.createdAt)}</small></summary>
                <pre>{preview(record.payload)}</pre>
              </details>
            )) : <em>暂无模块记录</em>}
          </div>
        </article>
      </section>
    </main>
  );
}
