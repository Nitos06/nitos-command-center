import type { SegmentRule } from "./evaluate";

export interface SegmentPreset {
  name: string;
  description: string;
  rules: SegmentRule;
}

export const SEGMENT_PRESETS: SegmentPreset[] = [
  {
    name: "VIP Customers",
    description: "Customers with 5+ orders and $500+ total spend",
    rules: {
      operator: "AND",
      conditions: [
        { field: "total_orders", op: "gte", value: 5 },
        { field: "total_spent", op: "gte", value: 500 },
      ],
    },
  },
  {
    name: "One-Time Buyers",
    description: "Customers who bought once over 30 days ago",
    rules: {
      operator: "AND",
      conditions: [
        { field: "total_orders", op: "eq", value: 1 },
        { field: "rfm_recency", op: "gt", value: 30 },
      ],
    },
  },
  {
    name: "Churning Customers",
    description: "Previously active buyers who haven't ordered in 90+ days",
    rules: {
      operator: "AND",
      conditions: [
        { field: "total_orders", op: "gte", value: 2 },
        { field: "rfm_recency", op: "gt", value: 90 },
      ],
    },
  },
  {
    name: "High AOV",
    description: "Customers with average order value above $100",
    rules: {
      operator: "AND",
      conditions: [
        { field: "avg_order_value", op: "gte", value: 100 },
        { field: "total_orders", op: "gte", value: 1 },
      ],
    },
  },
  {
    name: "Engaged Subscribers",
    description: "Subscribers who opened 3+ emails in recent history",
    rules: {
      operator: "AND",
      conditions: [
        { field: "emails_opened", op: "gte", value: 3 },
        { field: "subscribed", op: "eq", value: true },
      ],
    },
  },
  {
    name: "Inactive Subscribers",
    description: "Subscribers who haven't opened an email in 60+ days",
    rules: {
      operator: "AND",
      conditions: [
        { field: "last_email_opened_at", op: "before", value: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
        { field: "subscribed", op: "eq", value: true },
      ],
    },
  },
  {
    name: "New Subscribers (7d)",
    description: "Subscribers who joined in the last 7 days",
    rules: {
      operator: "AND",
      conditions: [
        { field: "created_at", op: "within_days", value: 7 },
      ],
    },
  },
  {
    name: "Champions (RFM)",
    description: "Top RFM score — recent, frequent, high-spending customers",
    rules: {
      operator: "AND",
      conditions: [
        { field: "rfm_recency", op: "lte", value: 14 },
        { field: "rfm_frequency", op: "gte", value: 5 },
        { field: "rfm_monetary", op: "gte", value: 300 },
      ],
    },
  },
];
