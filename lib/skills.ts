import fs from "fs";
import path from "path";

export interface SkillMeta {
  name: string;
  description: string;
  schedule: string;
  mcpsRequired: string[];
  mcpsOptional: string[];
  references: string[];
  inputs: string[];
  outputs: string[];
}

function extractList(fm: string, key: string): string[] {
  const re = new RegExp(`${key}:\\s*\\n((?:[ \\t]+-[^\\n]*\\n?)+)`, "m");
  const m = fm.match(re);
  if (!m) return [];
  return m[1]
    .split("\n")
    .map(l => l.replace(/^[ \t]+-\s*/, "").split("#")[0].trim())
    .filter(Boolean);
}

function extractValue(fm: string, key: string): string {
  const re = new RegExp(`${key}:\\s*["']?([^"'\\n]+)["']?`, "m");
  return fm.match(re)?.[1]?.trim() ?? "";
}

function extractMcpSection(fm: string, sub: "required" | "optional"): string[] {
  const depsBlock = fm.match(/mcp_dependencies:\s*\n([\s\S]*?)(?=\n[a-z_]+:|$)/m)?.[1] ?? "";
  return extractList(depsBlock, sub);
}

function refLabel(ref: string): string {
  const parts = ref.replace(/\.md$/, "").split(/[\\/]/);
  const i = parts.lastIndexOf("skills");
  if (i >= 0) {
    const remaining = parts.slice(i + 1).filter(p => p !== "references");
    return remaining.join(" › ");
  }
  const last = parts[parts.length - 1];
  const second = parts[parts.length - 2];
  return second && second !== "references" ? `${second} › ${last}` : last;
}

export function readSkillMeta(skillDir: string): SkillMeta | null {
  const skillPath = path.join(process.cwd(), "skills", skillDir, "SKILL.md");
  try {
    const content = fs.readFileSync(skillPath, "utf-8");
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) return null;
    const fm = fmMatch[1];

    return {
      name: extractValue(fm, "name"),
      description: extractValue(fm, "description"),
      schedule: extractValue(fm, "scheduled").replace(/\s+Asia\/Jerusalem.*$/, "").trim(),
      mcpsRequired: extractMcpSection(fm, "required"),
      mcpsOptional: extractMcpSection(fm, "optional"),
      references: extractList(fm, "references").map(refLabel),
      inputs: extractList(fm, "inputs"),
      outputs: extractList(fm, "outputs"),
    };
  } catch {
    return null;
  }
}

export function cronToHuman(cron: string): string {
  if (!cron) return "—";
  const parts = cron.split(" ");
  if (parts.length < 5) return cron;
  const [min, hour, dom, , dow] = parts;

  if (min.startsWith("*/")) return `Every ${min.slice(2)} min`;
  if (hour.includes("-")) return `Every ${min} min (${hour.split("-")[0]}am–${hour.split("-")[1]}pm)`;

  const h = parseInt(hour);
  const m = parseInt(min);
  const time = `${h % 12 || 12}:${m.toString().padStart(2, "0")}${h < 12 ? "am" : "pm"}`;

  if (dom === "1" ) return `1st of month ${time}`;
  if (dow !== "*") {
    const days: Record<string, string> = { "0": "Sun", "1": "Mon", "2": "Tue", "3": "Wed", "4": "Thu", "5": "Fri", "6": "Sat" };
    const dayStr = dow.split(",").map(d => days[d] ?? d).join("/");
    return `${dayStr} ${time}`;
  }
  return `Daily ${time}`;
}

export interface AgentDef {
  id: string;
  label: string;
  skillDir: string;
  schedule: string;
  category: string;
}

export const AGENTS: AgentDef[] = [
  { id: "finance-il-reconciliation",       label: "Finance: Reconciliation",       skillDir: "finance-il",        schedule: "0 4 * * *",         category: "Finance" },
  { id: "finance-il-profit-watch",         label: "Finance: Profit Watch",          skillDir: "finance-il",        schedule: "0 8 * * *",         category: "Finance" },
  { id: "finance-il-monthly",              label: "Finance: Monthly Report",        skillDir: "finance-il",        schedule: "0 6 1 * *",         category: "Finance" },
  { id: "finance-il-telegram-poll",        label: "Finance: Telegram Poll",         skillDir: "finance-il",        schedule: "*/15 * * * *",      category: "Finance" },
  { id: "reviews-daily",                   label: "Reviews: Daily",                 skillDir: "reviews",           schedule: "0 6 * * *",         category: "Reviews" },
  { id: "seo-audit-autofix",               label: "SEO: Audit & Autofix",           skillDir: "seo",               schedule: "0 2 */5 * *",       category: "SEO" },
  { id: "seo-blog-post",                   label: "SEO: Blog Post",                 skillDir: "seo",               schedule: "0 6 * * 1,3,5",     category: "SEO" },
  { id: "email-weekly-campaign",           label: "Email: Weekly Campaign",         skillDir: "email-marketing",   schedule: "0 7 * * 1",         category: "Email" },
  { id: "email-monthly-topic-bank",        label: "Email: Topic Bank",              skillDir: "email-marketing",   schedule: "0 0 1 * *",         category: "Email" },
  { id: "email-deliverability-nightly",    label: "Email: Deliverability",          skillDir: "email-marketing",   schedule: "0 3 * * *",         category: "Email" },
  { id: "meta-ads-daily",                  label: "Meta Ads: Daily Optimizer",      skillDir: "meta-ads",          schedule: "0 9 * * *",         category: "Ads" },
  { id: "ads-multi-platform-daily",        label: "Ads: Multi-Platform",            skillDir: "ads-multi-platform",schedule: "0 9 * * *",         category: "Ads" },
  { id: "ads-competitor-weekly",           label: "Ads: Competitor Intel",          skillDir: "ads-competitor",    schedule: "0 4 * * 0",         category: "Ads" },
  { id: "hook-mining-daily",               label: "Hook Mining: Daily",             skillDir: "hook-mining",       schedule: "0 11 * * *",        category: "Ads" },
  { id: "analytics-daily",                 label: "Analytics: Daily KPIs",          skillDir: "analytics",         schedule: "0 7 * * *",         category: "Analytics" },
  { id: "advisory-weekly",                 label: "Advisory: Weekly",               skillDir: "advisory",          schedule: "0 8 * * 0",         category: "Analytics" },
  { id: "social-instagram-weekly-calendar",label: "Instagram: Weekly Calendar",     skillDir: "social-instagram",  schedule: "0 7 * * 1",         category: "Social" },
  { id: "social-instagram-daily",          label: "Instagram: Daily Post",          skillDir: "social-instagram",  schedule: "0 9 * * *",         category: "Social" },
  { id: "social-tiktok-daily",             label: "TikTok: Daily",                  skillDir: "social-tiktok",     schedule: "0 10 * * *",        category: "Social" },
  { id: "social-youtube-weekly",           label: "YouTube: Weekly",                skillDir: "social-youtube",    schedule: "0 11 * * 2",        category: "Social" },
  { id: "social-pinterest-daily",          label: "Pinterest: Daily",               skillDir: "social-pinterest",  schedule: "0 12 * * *",        category: "Social" },
  { id: "social-facebook-post",            label: "Facebook: Daily Post",           skillDir: "social-facebook",   schedule: "0 11 * * *",        category: "Social" },
  { id: "social-facebook-replies",         label: "Facebook: Reply Manager",        skillDir: "social-facebook",   schedule: "0 17 * * *",        category: "Social" },
  { id: "customer-service-poll",           label: "Customer Service: Poll",         skillDir: "customer-service",  schedule: "*/30 9-22 * * *",   category: "CX" },
  { id: "dm-funnel-nightly",               label: "DM Funnel: Nightly",             skillDir: "dm-funnel",         schedule: "0 1 * * *",         category: "CX" },
  { id: "dashboard-bridge",                label: "Dashboard Bridge",               skillDir: "dashboard-bridge",  schedule: "*/5 * * * *",       category: "System" },
];
