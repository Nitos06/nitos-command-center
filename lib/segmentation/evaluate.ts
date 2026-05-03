import { createClient } from "@supabase/supabase-js";

export interface SegmentRule {
  operator: "AND" | "OR";
  conditions: Condition[];
}

export interface Condition {
  field: string;
  op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "not_contains" | "in" | "not_in" | "before" | "after" | "within_days";
  value: any;
}

export function evaluateContact(contact: Record<string, any>, rules: SegmentRule): boolean {
  if (!rules?.conditions?.length) return false;

  const results = rules.conditions.map((c) => evaluateCondition(contact, c));

  if (rules.operator === "OR") return results.some(Boolean);
  return results.every(Boolean);
}

function evaluateCondition(contact: Record<string, any>, condition: Condition): boolean {
  const { field, op, value } = condition;

  // Support nested fields like custom_properties.vip
  const contactValue = field.includes(".")
    ? getNestedValue(contact, field)
    : contact[field];

  switch (op) {
    case "eq": return contactValue === value;
    case "neq": return contactValue !== value;
    case "gt": return Number(contactValue) > Number(value);
    case "gte": return Number(contactValue) >= Number(value);
    case "lt": return Number(contactValue) < Number(value);
    case "lte": return Number(contactValue) <= Number(value);
    case "contains":
      if (Array.isArray(contactValue)) return contactValue.includes(value);
      return String(contactValue ?? "").includes(String(value));
    case "not_contains":
      if (Array.isArray(contactValue)) return !contactValue.includes(value);
      return !String(contactValue ?? "").includes(String(value));
    case "in": return Array.isArray(value) && value.includes(contactValue);
    case "not_in": return Array.isArray(value) && !value.includes(contactValue);
    case "before": return new Date(contactValue) < new Date(value);
    case "after": return new Date(contactValue) > new Date(value);
    case "within_days": {
      if (!contactValue) return false;
      const daysDiff = (Date.now() - new Date(contactValue).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= Number(value);
    }
    default: return false;
  }
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function evaluateAllSegments(brandId: string) {
  const supabase = sb();

  const { data: segments } = await supabase
    .from("segments")
    .select("*")
    .eq("brand_id", brandId)
    .eq("auto_evaluate", true);

  if (!segments?.length) return { evaluated: 0 };

  const { data: contacts } = await supabase
    .from("email_contacts")
    .select("*")
    .eq("brand_id", brandId)
    .eq("subscribed", true);

  if (!contacts?.length) return { evaluated: segments.length, changes: 0 };

  let totalChanges = 0;

  for (const segment of segments) {
    const rules = segment.rules as SegmentRule | null;
    if (!rules?.conditions?.length) continue;

    const { data: currentMembers } = await supabase
      .from("segment_memberships")
      .select("contact_id")
      .eq("segment_id", segment.id)
      .is("left_at", null);

    const currentIds = new Set((currentMembers ?? []).map((m: any) => m.contact_id));
    const newIds = new Set<string>();

    for (const contact of contacts) {
      if (evaluateContact(contact, rules)) {
        newIds.add(contact.id);
      }
    }

    // Add new members
    const toAdd = [...newIds].filter((id) => !currentIds.has(id));
    if (toAdd.length) {
      await supabase.from("segment_memberships").upsert(
        toAdd.map((contact_id) => ({
          segment_id: segment.id,
          contact_id,
          brand_id: brandId,
          joined_at: new Date().toISOString(),
          left_at: null,
        })),
        { onConflict: "segment_id,contact_id" }
      );
      totalChanges += toAdd.length;
    }

    // Mark leavers
    const toRemove = [...currentIds].filter((id) => !newIds.has(id));
    if (toRemove.length) {
      await supabase
        .from("segment_memberships")
        .update({ left_at: new Date().toISOString() })
        .eq("segment_id", segment.id)
        .in("contact_id", toRemove)
        .is("left_at", null);
      totalChanges += toRemove.length;
    }

    // Update count
    await supabase
      .from("segments")
      .update({
        subscriber_count: newIds.size,
        last_evaluated_at: new Date().toISOString(),
      })
      .eq("id", segment.id);
  }

  return { evaluated: segments.length, changes: totalChanges };
}

export async function evaluateContactForSegments(brandId: string, contactId: string) {
  const supabase = sb();

  const { data: contact } = await supabase
    .from("email_contacts")
    .select("*")
    .eq("id", contactId)
    .single();

  if (!contact) return;

  const { data: segments } = await supabase
    .from("segments")
    .select("*")
    .eq("brand_id", brandId)
    .eq("auto_evaluate", true);

  if (!segments?.length) return;

  for (const segment of segments) {
    const rules = segment.rules as SegmentRule | null;
    if (!rules?.conditions?.length) continue;

    const matches = evaluateContact(contact, rules);

    const { data: existing } = await supabase
      .from("segment_memberships")
      .select("id")
      .eq("segment_id", segment.id)
      .eq("contact_id", contactId)
      .is("left_at", null)
      .maybeSingle();

    if (matches && !existing) {
      await supabase.from("segment_memberships").upsert({
        segment_id: segment.id,
        contact_id: contactId,
        brand_id: brandId,
        joined_at: new Date().toISOString(),
        left_at: null,
      }, { onConflict: "segment_id,contact_id" });

      await supabase.from("contact_events").insert({
        brand_id: brandId,
        contact_id: contactId,
        email: contact.email,
        event_type: "segment_joined",
        event_data: { segment_id: segment.id, segment_name: segment.name },
      });
    } else if (!matches && existing) {
      await supabase
        .from("segment_memberships")
        .update({ left_at: new Date().toISOString() })
        .eq("id", existing.id);

      await supabase.from("contact_events").insert({
        brand_id: brandId,
        contact_id: contactId,
        email: contact.email,
        event_type: "segment_left",
        event_data: { segment_id: segment.id, segment_name: segment.name },
      });
    }
  }
}
