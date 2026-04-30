import { shopifyAdminFetch, shopifyAdminRest } from "./shopify";

// ─── Products ──────────────────────────────────────────────────────────────

export async function getProducts(limit = 50, brandId: string) {
  const data = await shopifyAdminFetch<{ products: { edges: { node: ShopifyProduct }[] } }>(
    `query GetProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
            status
            totalInventory
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  price
                  compareAtPrice
                  inventoryQuantity
                  sku
                }
              }
            }
            images(first: 1) {
              edges { node { url altText } }
            }
          }
        }
      }
    }`,
    { first: limit },
    brandId
  );
  return data.products.edges.map((e) => e.node);
}

export async function updateVariantPrice(variantId: string, price: string, brandId: string, compareAtPrice?: string) {
  return shopifyAdminFetch(
    `mutation UpdateVariant($input: ProductVariantInput!) {
      productVariantUpdate(input: $input) {
        productVariant { id price compareAtPrice }
        userErrors { field message }
      }
    }`,
    { input: { id: variantId, price, compareAtPrice: compareAtPrice ?? null } },
    brandId
  );
}

// ─── Orders ────────────────────────────────────────────────────────────────

export async function getOrders(brandId: string, limit = 50, sinceDate?: string) {
  const query = sinceDate ? `created_at:>='${sinceDate}'` : undefined;
  const data = await shopifyAdminFetch<{ orders: { edges: { node: ShopifyOrder }[] } }>(
    `query GetOrders($first: Int!, $query: String) {
      orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            email
            phone
            totalPriceSet { shopMoney { amount currencyCode } }
            createdAt
            fulfillmentStatus
            financialStatus
            lineItems(first: 10) {
              edges {
                node {
                  name
                  quantity
                  product { id title }
                  variant { id title price }
                }
              }
            }
            customer { id email firstName lastName }
            shippingAddress { city countryCode }
          }
        }
      }
    }`,
    { first: limit, query },
    brandId
  );
  return data.orders.edges.map((e) => e.node);
}

// ─── Customers ─────────────────────────────────────────────────────────────

export async function getCustomers(limit = 100, brandId: string) {
  const data = await shopifyAdminFetch<{ customers: { edges: { node: ShopifyCustomer }[] } }>(
    `query GetCustomers($first: Int!) {
      customers(first: $first, sortKey: TOTAL_SPENT, reverse: true) {
        edges {
          node {
            id
            email
            firstName
            lastName
            phone
            tags
            numberOfOrders
            amountSpent { amount currencyCode }
            createdAt
          }
        }
      }
    }`,
    { first: limit },
    brandId
  );
  return data.customers.edges.map((e) => e.node);
}

// ─── Script Tags (for widget injection) ───────────────────────────────────

export async function addScriptTag(src: string, brandId: string) {
  return shopifyAdminRest(
    "script_tags.json",
    "POST",
    { script_tag: { event: "onload", src } },
    brandId
  );
}

export async function listScriptTags(brandId: string) {
  return shopifyAdminRest<{ script_tags: { id: number; src: string }[] }>(
    "script_tags.json",
    "GET",
    undefined,
    brandId
  );
}

export async function deleteScriptTag(scriptTagId: number, brandId: string) {
  return shopifyAdminRest(`script_tags/${scriptTagId}.json`, "DELETE", undefined, brandId);
}

// ─── Discounts ─────────────────────────────────────────────────────────────

export async function createAutomaticDiscount(
  title: string,
  value: number,
  valueType: "PERCENTAGE" | "FIXED_AMOUNT",
  brandId: string
) {
  return shopifyAdminFetch(
    `mutation CreateDiscount($discount: DiscountAutomaticBasicInput!) {
      discountAutomaticBasicCreate(automaticBasicDiscount: $discount) {
        automaticDiscountNode { id }
        userErrors { field message }
      }
    }`,
    {
      discount: {
        title,
        startsAt: new Date().toISOString(),
        customerGets: {
          value: valueType === "PERCENTAGE"
            ? { percentage: value / 100 }
            : { discountAmount: { amount: value, appliesOnEachItem: false } },
          items: { all: true },
        },
        minimumRequirement: { subtotal: { greaterThanOrEqualToSubtotal: "0" } },
      },
    },
    brandId
  );
}

export async function createPriceRuleCode(
  title: string,
  code: string,
  value: number,
  valueType: "percentage" | "fixed_amount",
  brandId: string
) {
  const res = await shopifyAdminRest<{ price_rule: { id: number } }>(
    "price_rules.json",
    "POST",
    {
      price_rule: {
        title,
        value_type: valueType,
        value: `-${value}`,
        customer_selection: "all",
        target_type: "line_item",
        target_selection: "all",
        allocation_method: "across",
        starts_at: new Date().toISOString(),
      },
    },
    brandId
  );
  const priceRuleId = res.price_rule.id;
  await shopifyAdminRest(
    `price_rules/${priceRuleId}/discount_codes.json`,
    "POST",
    { discount_code: { code } },
    brandId
  );
  return priceRuleId;
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  status: string;
  totalInventory: number;
  variants: { edges: { node: ShopifyVariant }[] };
  images: { edges: { node: { url: string; altText: string } }[] };
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: string;
  compareAtPrice: string | null;
  inventoryQuantity: number;
  sku: string | null;
}

export interface ShopifyOrder {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  createdAt: string;
  fulfillmentStatus: string;
  financialStatus: string;
  lineItems: { edges: { node: { name: string; quantity: number; product: { id: string; title: string } | null; variant: { id: string; title: string; price: string } | null } }[] };
  customer: ShopifyCustomer | null;
  shippingAddress: { city: string; countryCode: string } | null;
}

export interface ShopifyCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  tags: string[];
  numberOfOrders: number;
  amountSpent: { amount: string; currencyCode: string };
  createdAt: string;
}
