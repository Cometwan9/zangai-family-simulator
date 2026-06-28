import { NextRequest, NextResponse } from "next/server";
import { applyInviteCode, listInviteCodes, loginAccount, registerAccount, requestPhoneCode, resetPassword } from "@/lib/account-store";

type AccountBody = {
  action?: string;
  qq?: string;
  nickname?: string;
  phone?: string;
  password?: string;
  inviteCode?: string;
  code?: string;
};

function jsonResult(result: { error?: string; status?: number } & Record<string, unknown>) {
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  return NextResponse.json({ ok: true, ...result });
}

export async function GET() {
  return NextResponse.json({ ok: true, invites: listInviteCodes() });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as AccountBody | null;
  if (!body?.action) return NextResponse.json({ error: "action is required" }, { status: 400 });

  if (body.action === "login") {
    return jsonResult(loginAccount(body.qq ?? "", body.password ?? ""));
  }

  if (body.action === "register") {
    return jsonResult(registerAccount({
      qq: body.qq ?? "",
      nickname: body.nickname ?? "",
      phone: body.phone ?? "",
      password: body.password ?? "",
      inviteCode: body.inviteCode ?? "",
    }));
  }

  if (body.action === "apply-invite") {
    return jsonResult(applyInviteCode());
  }

  if (body.action === "request-code") {
    return jsonResult(requestPhoneCode(body.qq ?? "", body.phone ?? ""));
  }

  if (body.action === "reset-password") {
    return jsonResult(resetPassword({
      qq: body.qq ?? "",
      phone: body.phone ?? "",
      code: body.code ?? "",
      password: body.password ?? "",
    }));
  }

  return NextResponse.json({ error: "Unknown account action" }, { status: 400 });
}
