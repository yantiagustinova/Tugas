/**
 * Pengiriman WhatsApp satu arah (app -> WA) lewat gateway.
 *
 * Provider dipilih dengan env WA_PROVIDER:
 *   - "fonnte" : https://fonnte.com
 *   - "wablas" : https://wablas.com
 *   - "log"    : tidak mengirim apa pun, hanya menulis ke console (default).
 *
 * Mode "log" sengaja jadi default supaya aplikasi tetap jalan sebelum
 * akun gateway dibeli/di-setup.
 */

export type WaTarget =
  | { kind: "personal"; phone: string }
  | { kind: "group"; groupId: string };

export type WaResult = { ok: boolean; detail: string };

type Provider = "fonnte" | "wablas" | "log";

function provider(): Provider {
  const raw = (process.env.WA_PROVIDER || "log").toLowerCase();
  return raw === "fonnte" || raw === "wablas" ? raw : "log";
}

/** 08123... / +62812... / 62812... -> 62812... */
export function normalizePhone(input: string): string {
  const digits = (input || "").replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

export function groupId(): string {
  return (process.env.WA_GROUP_ID || "").trim();
}

async function sendFonnte(target: WaTarget, message: string): Promise<WaResult> {
  const token = process.env.FONNTE_TOKEN;
  if (!token) return { ok: false, detail: "FONNTE_TOKEN belum di-set" };

  const body = new URLSearchParams({
    target: target.kind === "personal" ? target.phone : target.groupId,
    message,
    countryCode: "62",
  });

  const res = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const text = await res.text();
  return { ok: res.ok, detail: `${res.status} ${text.slice(0, 300)}` };
}

async function sendWablas(target: WaTarget, message: string): Promise<WaResult> {
  const token = process.env.WABLAS_TOKEN;
  if (!token) return { ok: false, detail: "WABLAS_TOKEN belum di-set" };
  const domain = (process.env.WABLAS_DOMAIN || "https://console.wablas.com").replace(/\/+$/, "");

  const isGroup = target.kind === "group";
  const url = `${domain}/api/${isGroup ? "send-group-message" : "send-message"}`;
  const body = new URLSearchParams(
    isGroup
      ? { group_id: target.groupId, message }
      : { phone: target.phone, message },
  );

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const text = await res.text();
  return { ok: res.ok, detail: `${res.status} ${text.slice(0, 300)}` };
}

export async function sendWa(target: WaTarget, message: string): Promise<WaResult> {
  const to = target.kind === "personal" ? target.phone : `grup ${target.groupId}`;
  if (!to || to === "grup ") {
    return { ok: false, detail: "Nomor/ID grup tujuan kosong" };
  }

  const active = provider();
  if (active === "log") {
    console.log(`[WA:log] -> ${to}\n${message}\n---`);
    return { ok: true, detail: "mode log (tidak dikirim)" };
  }

  try {
    return active === "fonnte"
      ? await sendFonnte(target, message)
      : await sendWablas(target, message);
  } catch (err) {
    return { ok: false, detail: `gagal kirim: ${(err as Error).message}` };
  }
}

export function waProviderName(): string {
  return provider();
}
