import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { createHash, randomInt, randomUUID } from "crypto";

export type GameAccount = {
  qq: string;
  nickname: string;
  phone: string;
  passwordHash: string;
  inviteCode: string;
  createdAt: number;
  lastLoginAt?: number;
};

export type InviteCode = {
  code: string;
  status: "available" | "used";
  createdAt: number;
  usedBy?: string;
  usedAt?: number;
};

type PhoneCode = {
  phone: string;
  code: string;
  expiresAt: number;
};

type AccountDatabase = {
  accounts: Record<string, GameAccount>;
  invites: Record<string, InviteCode>;
  phoneCodes: Record<string, PhoneCode>;
};

const dbDir = process.env.VERCEL ? path.join("/tmp", "zangai-data") : path.join(process.cwd(), "data");
const dbPath = path.join(dbDir, "backend-db.json");

function passwordHash(password: string) {
  return createHash("sha256").update(`zangai-2009:${password}`).digest("hex");
}

function createInviteCode() {
  return `ZA-${randomUUID().slice(0, 4).toUpperCase()}-${randomInt(1000, 9999)}`;
}

function defaultDatabase(): AccountDatabase {
  const initialInvites = Array.from({ length: 8 }, () => createInviteCode());
  return {
    accounts: {
      "20090001": {
        qq: "20090001",
        nickname: "冷少",
        phone: "13800002009",
        passwordHash: passwordHash("123456"),
        inviteCode: "ZA-DEMO-2009",
        createdAt: Date.now(),
      },
    },
    invites: Object.fromEntries([
      ["ZA-DEMO-2009", { code: "ZA-DEMO-2009", status: "used", createdAt: Date.now(), usedBy: "20090001", usedAt: Date.now() }],
      ...initialInvites.map((code) => [code, { code, status: "available", createdAt: Date.now() } satisfies InviteCode]),
    ]),
    phoneCodes: {},
  };
}

function ensureDatabase() {
  if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });
  if (!existsSync(dbPath)) writeFileSync(dbPath, JSON.stringify(defaultDatabase(), null, 2));
}

export function readAccountDatabase(): AccountDatabase {
  ensureDatabase();
  return JSON.parse(readFileSync(dbPath, "utf8")) as AccountDatabase;
}

function writeAccountDatabase(database: AccountDatabase) {
  ensureDatabase();
  writeFileSync(dbPath, JSON.stringify(database, null, 2));
}

export function listInviteCodes() {
  const database = readAccountDatabase();
  return Object.values(database.invites).sort((a, b) => b.createdAt - a.createdAt);
}

export function applyInviteCode() {
  const database = readAccountDatabase();
  let code = createInviteCode();
  while (database.invites[code]) code = createInviteCode();
  database.invites[code] = { code, status: "available", createdAt: Date.now() };
  writeAccountDatabase(database);
  return { code, invites: listInviteCodes() };
}

export function registerAccount(input: { qq: string; nickname: string; phone: string; password: string; inviteCode: string }) {
  const database = readAccountDatabase();
  const qq = input.qq.trim();
  const phone = input.phone.trim();
  const inviteCode = input.inviteCode.trim().toUpperCase();
  if (!/^[1-9]\d{4,11}$/.test(qq)) return { error: "QQ号需要 5-12 位数字", status: 400 as const };
  if (database.accounts[qq]) return { error: "这个QQ号已经存在", status: 409 as const };
  if (!/^1\d{10}$/.test(phone)) return { error: "请输入 11 位手机号", status: 400 as const };
  if (input.password.length < 6) return { error: "密码至少 6 位", status: 400 as const };
  const invite = database.invites[inviteCode];
  if (!invite || invite.status !== "available") return { error: "邀请码不存在或已被使用", status: 403 as const };

  const account: GameAccount = {
    qq,
    nickname: input.nickname.trim() || `QQ${qq}`,
    phone,
    passwordHash: passwordHash(input.password),
    inviteCode,
    createdAt: Date.now(),
  };
  database.accounts[qq] = account;
  database.invites[inviteCode] = { ...invite, status: "used", usedBy: qq, usedAt: Date.now() };
  writeAccountDatabase(database);
  return { account: publicAccount(account), invites: listInviteCodes() };
}

export function loginAccount(qq: string, password: string) {
  const database = readAccountDatabase();
  const account = database.accounts[qq.trim()];
  if (!account) return { error: "账号不存在，请先注册新账号", status: 404 as const };
  if (account.passwordHash !== passwordHash(password)) return { error: "密码不正确，请取回密码", status: 401 as const };
  account.lastLoginAt = Date.now();
  database.accounts[account.qq] = account;
  writeAccountDatabase(database);
  return { account: publicAccount(account) };
}

export function requestPhoneCode(qq: string, phone: string) {
  const database = readAccountDatabase();
  const account = database.accounts[qq.trim()];
  if (!account || account.phone !== phone.trim()) return { error: "账号和绑定手机不匹配", status: 404 as const };
  const code = String(randomInt(100000, 999999));
  database.phoneCodes[account.qq] = { phone: account.phone, code, expiresAt: Date.now() + 5 * 60_000 };
  writeAccountDatabase(database);
  return { code, message: "验证码已发送到绑定手机" };
}

export function resetPassword(input: { qq: string; phone: string; code: string; password: string }) {
  const database = readAccountDatabase();
  const account = database.accounts[input.qq.trim()];
  const phoneCode = database.phoneCodes[input.qq.trim()];
  if (!account || account.phone !== input.phone.trim()) return { error: "账号和绑定手机不匹配", status: 404 as const };
  if (!phoneCode || phoneCode.code !== input.code.trim() || phoneCode.expiresAt < Date.now()) return { error: "验证码错误或已过期", status: 401 as const };
  if (input.password.length < 6) return { error: "新密码至少 6 位", status: 400 as const };
  account.passwordHash = passwordHash(input.password);
  database.accounts[account.qq] = account;
  delete database.phoneCodes[account.qq];
  writeAccountDatabase(database);
  return { account: publicAccount(account) };
}

function publicAccount(account: GameAccount) {
  return {
    qq: account.qq,
    nickname: account.nickname,
    phone: account.phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2"),
    inviteCode: account.inviteCode,
    createdAt: account.createdAt,
    lastLoginAt: account.lastLoginAt ?? null,
  };
}
