import { sendEmail } from "@/lib/ses";

export type NotificationChannel = "telegram" | "email" | "slack";

export interface Notification {
  title: string;
  message: string;
  level?: "info" | "warn" | "crit";
  channels?: NotificationChannel[];
  brandId?: string;
}

// Unified notification sender — Telegram, Email, or Slack
export async function notify(n: Notification) {
  const channels = n.channels ?? ["telegram"];
  const results: Record<string, boolean> = {};

  await Promise.allSettled(
    channels.map(async (channel) => {
      try {
        if (channel === "telegram") {
          results.telegram = await sendTelegram(n);
        } else if (channel === "email") {
          results.email = await sendEmailNotification(n);
        } else if (channel === "slack") {
          results.slack = await sendSlack(n);
        }
      } catch {
        results[channel] = false;
      }
    })
  );

  return results;
}

async function sendTelegram(n: Notification): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return false;

  const emoji = n.level === "crit" ? "🚨" : n.level === "warn" ? "⚠️" : "ℹ️";
  const text = `${emoji} *${escapeMarkdown(n.title)}*\n${escapeMarkdown(n.message)}`;

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });

  return res.ok;
}

async function sendEmailNotification(n: Notification): Promise<boolean> {
  const ownerEmail = process.env.OWNER_EMAIL ?? process.env.SES_FROM_EMAIL;
  if (!ownerEmail) return false;

  const bgColor = n.level === "crit" ? "#fee2e2" : n.level === "warn" ? "#fef9c3" : "#eff6ff";
  const borderColor = n.level === "crit" ? "#fca5a5" : n.level === "warn" ? "#fde047" : "#93c5fd";

  const html = `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
  <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:8px;padding:16px">
    <strong style="font-size:14px">${n.title}</strong>
    <p style="margin:8px 0 0;font-size:13px;color:#374151">${n.message}</p>
  </div>
</div>`;

  await sendEmail({
    to: ownerEmail,
    subject: `[Nitos] ${n.level === "crit" ? "🚨 " : n.level === "warn" ? "⚠️ " : ""}${n.title}`,
    html,
  });
  return true;
}

async function sendSlack(n: Notification): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return false;

  const emoji = n.level === "crit" ? ":rotating_light:" : n.level === "warn" ? ":warning:" : ":information_source:";
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: `${emoji} *${n.title}*\n${n.message}` }),
  });
  return res.ok;
}

function escapeMarkdown(text: string) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}
