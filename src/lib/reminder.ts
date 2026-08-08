import { sql } from "./db";
import { daysUntil, dueLabel, formatDateId, todayYmd } from "./dates";
import { listOpenTasksForReminder, listTasks, type ReminderTask } from "./tasks";
import { groupId, normalizePhone, sendWa, waProviderName } from "./wa";
import { isDone } from "./types";

/** Mulai mengingatkan H-2 sebelum due date (bisa diubah lewat env). */
function leadDays(): number {
  const parsed = Number(process.env.REMINDER_LEAD_DAYS);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 2;
}

function appUrl(): string {
  const raw =
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "");
  return raw.replace(/\/+$/, "");
}

const HEADER_DATE = (ymd: string) => formatDateId(ymd);

function taskLine(task: ReminderTask, today: string): string {
  const d = daysUntil(task.dueDate, today);
  const icon = d < 0 ? "🔴" : d === 0 ? "🟠" : "🟡";
  const parts = [
    `${icon} *${task.title}*`,
    `   ${dueLabel(task.dueDate, today)} (${formatDateId(task.dueDate)})`,
  ];
  if (task.target) parts.push(`   Target: ${task.target}`);
  parts.push(`   Progress: ${task.progress}% · ${task.status}`);
  return parts.join("\n");
}

export function buildPersonalMessage(
  ownerName: string,
  tasks: ReminderTask[],
  today: string,
): string {
  const url = appUrl();
  const lines = [
    `Halo ${ownerName} 👋`,
    `Pengingat tugas Envilog — ${HEADER_DATE(today)}`,
    "",
    ...tasks.map((t) => taskLine(t, today)),
    "",
    url
      ? `Update progress di: ${url}`
      : "Update progress lewat aplikasi Task Tracker.",
  ];
  return lines.join("\n");
}

export function buildRecapMessage(
  rows: {
    ownerName: string;
    total: number;
    selesai: number;
    terlambat: number;
    avgProgress: number;
  }[],
  overdue: { ownerName: string; title: string; dueDate: string }[],
  soon: { ownerName: string; title: string; dueDate: string }[],
  today: string,
): string {
  const url = appUrl();
  const lines = [
    "📋 *Rekap Harian — Task Tracker Envilog*",
    HEADER_DATE(today),
    "",
  ];

  if (rows.length === 0) {
    lines.push("Belum ada tugas yang tercatat.");
  } else {
    for (const r of rows) {
      const flag = r.terlambat > 0 ? " ⚠️" : "";
      lines.push(
        `• *${r.ownerName}* — ${r.selesai}/${r.total} selesai · rata-rata ${r.avgProgress}%` +
          (r.terlambat > 0 ? ` · ${r.terlambat} terlambat${flag}` : ""),
      );
    }
  }

  if (overdue.length > 0) {
    lines.push("", "🔴 *Lewat due date:*");
    for (const t of overdue) {
      lines.push(
        `   - ${t.ownerName}: ${t.title} (${dueLabel(t.dueDate, today)})`,
      );
    }
  }

  if (soon.length > 0) {
    lines.push("", "🟡 *Jatuh tempo ≤ 2 hari:*");
    for (const t of soon) {
      lines.push(
        `   - ${t.ownerName}: ${t.title} (${dueLabel(t.dueDate, today)})`,
      );
    }
  }

  if (overdue.length === 0 && soon.length === 0 && rows.length > 0) {
    lines.push("", "✅ Tidak ada tugas yang mendesak hari ini. Mantap!");
  }

  if (url) lines.push("", `Dashboard: ${url}`);
  return lines.join("\n");
}

export type ReminderReport = {
  date: string;
  dryRun: boolean;
  provider: string;
  leadDays: number;
  personal: {
    ownerName: string;
    phone: string;
    taskIds: number[];
    sent: boolean;
    detail: string;
    message?: string;
  }[];
  recap: {
    attempted: boolean;
    sent: boolean;
    detail: string;
    message?: string;
  };
};

export async function runReminders(
  options: { dryRun?: boolean } = {},
): Promise<ReminderReport> {
  const dryRun = options.dryRun === true;
  const today = todayYmd();
  const lead = leadDays();

  const report: ReminderReport = {
    date: today,
    dryRun,
    provider: waProviderName(),
    leadDays: lead,
    personal: [],
    recap: { attempted: false, sent: false, detail: "" },
  };

  // ---- 1. Pengingat personal (H-2 s/d lewat due date, diulang tiap hari) ----
  const openTasks = await listOpenTasksForReminder();
  const dueSoon = openTasks.filter((t) => daysUntil(t.dueDate, today) <= lead);

  const sentToday = await sql<{ task_id: number }[]>`
    SELECT task_id FROM reminder_log
    WHERE kind = 'personal' AND run_date = ${today}::date AND task_id IS NOT NULL
  `;
  const alreadySent = new Set(sentToday.map((r) => r.task_id));
  const pending = dryRun
    ? dueSoon
    : dueSoon.filter((t) => !alreadySent.has(t.id));

  const byOwner = new Map<number, ReminderTask[]>();
  for (const task of pending) {
    const list = byOwner.get(task.userId) ?? [];
    list.push(task);
    byOwner.set(task.userId, list);
  }

  for (const [userId, tasks] of byOwner) {
    const ownerName = tasks[0].ownerName;
    const phone = normalizePhone(tasks[0].ownerPhone);
    const message = buildPersonalMessage(ownerName, tasks, today);
    const taskIds = tasks.map((t) => t.id);

    if (dryRun) {
      report.personal.push({
        ownerName,
        phone,
        taskIds,
        sent: false,
        detail: "dry run",
        message,
      });
      continue;
    }

    if (!phone) {
      report.personal.push({
        ownerName,
        phone: "",
        taskIds,
        sent: false,
        detail: "nomor WA kosong",
      });
      continue;
    }

    const result = await sendWa({ kind: "personal", phone }, message);

    if (result.ok) {
      // Dicatat supaya cron yang jalan dua kali tidak mengirim dobel.
      // Kalau gagal sengaja tidak dicatat, biar bisa dicoba lagi.
      for (const taskId of taskIds) {
        await sql`
          INSERT INTO reminder_log (kind, task_id, user_id, run_date, ok, detail)
          VALUES ('personal', ${taskId}, ${userId}, ${today}::date, TRUE, ${result.detail})
          ON CONFLICT DO NOTHING
        `;
      }
    }

    report.personal.push({
      ownerName,
      phone,
      taskIds,
      sent: result.ok,
      detail: result.detail,
    });
  }

  // ---- 2. Rekap harian ke grup WA ----
  const allTasks = await listTasks();
  const perOwner = new Map<
    string,
    { total: number; selesai: number; terlambat: number; progressSum: number }
  >();

  for (const t of allTasks) {
    const bucket = perOwner.get(t.ownerName) ?? {
      total: 0,
      selesai: 0,
      terlambat: 0,
      progressSum: 0,
    };
    bucket.total += 1;
    bucket.progressSum += t.progress;
    if (isDone(t)) bucket.selesai += 1;
    else if (daysUntil(t.dueDate, today) < 0) bucket.terlambat += 1;
    perOwner.set(t.ownerName, bucket);
  }

  const recapRows = [...perOwner.entries()]
    .map(([ownerName, b]) => ({
      ownerName,
      total: b.total,
      selesai: b.selesai,
      terlambat: b.terlambat,
      avgProgress: b.total ? Math.round(b.progressSum / b.total) : 0,
    }))
    .sort((a, b) => b.terlambat - a.terlambat || a.ownerName.localeCompare(b.ownerName));

  const openForRecap = allTasks.filter((t) => !isDone(t));
  const overdue = openForRecap
    .filter((t) => daysUntil(t.dueDate, today) < 0)
    .map((t) => ({ ownerName: t.ownerName, title: t.title, dueDate: t.dueDate }));
  const soon = openForRecap
    .filter((t) => {
      const d = daysUntil(t.dueDate, today);
      return d >= 0 && d <= lead;
    })
    .map((t) => ({ ownerName: t.ownerName, title: t.title, dueDate: t.dueDate }));

  const recapMessage = buildRecapMessage(recapRows, overdue, soon, today);
  const gid = groupId();

  if (dryRun) {
    report.recap = {
      attempted: true,
      sent: false,
      detail: gid ? "dry run" : "dry run (WA_GROUP_ID kosong)",
      message: recapMessage,
    };
    return report;
  }

  if (!gid) {
    report.recap = { attempted: false, sent: false, detail: "WA_GROUP_ID belum di-set" };
    return report;
  }

  const recapLock = await sql<{ id: number }[]>`
    INSERT INTO reminder_log (kind, run_date, ok, detail)
    VALUES ('recap', ${today}::date, TRUE, 'mengirim')
    ON CONFLICT DO NOTHING
    RETURNING id
  `;

  if (recapLock.length === 0) {
    report.recap = { attempted: false, sent: false, detail: "rekap hari ini sudah dikirim" };
    return report;
  }

  const recapResult = await sendWa({ kind: "group", groupId: gid }, recapMessage);

  if (recapResult.ok) {
    await sql`
      UPDATE reminder_log SET detail = ${recapResult.detail}
      WHERE id = ${recapLock[0].id}
    `;
  } else {
    // Lepas kunci supaya percobaan berikutnya bisa mengirim ulang.
    await sql`DELETE FROM reminder_log WHERE id = ${recapLock[0].id}`;
  }

  report.recap = {
    attempted: true,
    sent: recapResult.ok,
    detail: recapResult.detail,
  };
  return report;
}
