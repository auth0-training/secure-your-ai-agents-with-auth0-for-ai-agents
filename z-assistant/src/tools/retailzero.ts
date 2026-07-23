import { tool } from 'ai';
import { z } from 'zod';
// TODO (Tour 05 - Step 5): After completing auth0-ai.ts, uncomment this import:
// import { withRefundApproval, withCustomerDataApproval } from '../lib/auth0-ai.js';

const RETAILZERO_API = process.env.RETAILZERO_API_URL ?? 'http://localhost:3001';

// ─── Standard Tools ───────────────────────────────────────────────────────────
// These tools are safe for the AI agent to call without additional authorization.

export const listProductsTool = tool({
  description:
    'List RetailZero products. Optionally filter by category (Electronics, Footwear, Sports, Kitchen, Office, Apparel) or show only in-stock items.',
  parameters: z.object({
    category: z
      .string()
      .optional()
      .describe('Filter by product category'),
    inStockOnly: z
      .boolean()
      .optional()
      .default(false)
      .describe('When true, only return products with available stock'),
  }),
  execute: async ({ category, inStockOnly }) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (inStockOnly) params.set('inStock', 'true');
    const res = await fetch(`${RETAILZERO_API}/api/products?${params}`);
    if (!res.ok) return { error: 'Failed to fetch products.' };
    return await res.json();
  },
});

export const searchOrdersTool = tool({
  description:
    'Search RetailZero orders by customer name, email, or order ID. Optionally filter by status (pending, processing, shipped, delivered, cancelled).',
  parameters: z.object({
    query: z
      .string()
      .optional()
      .describe('Search term: customer name, email address, or order ID (e.g. ORD-1001)'),
    status: z
      .enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
      .optional()
      .describe('Filter orders by status'),
  }),
  execute: async ({ query, status }) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (status) params.set('status', status);
    const res = await fetch(`${RETAILZERO_API}/api/orders?${params}`);
    if (!res.ok) return { error: 'Failed to fetch orders.' };
    return await res.json();
  },
});

export const getOrderDetailsTool = tool({
  description: 'Get full details for a specific order including line items, totals, and tracking information.',
  parameters: z.object({
    orderId: z.string().describe('The order ID (e.g. ORD-1001)'),
  }),
  execute: async ({ orderId }) => {
    const res = await fetch(`${RETAILZERO_API}/api/orders/${orderId}`);
    if (!res.ok) return { error: `Order ${orderId} not found.` };
    return await res.json();
  },
});

// ─── Sensitive Tools ──────────────────────────────────────────────────────────
// These tools perform sensitive operations. After completing Tour 05 they will be
// protected by CIBA: the logged-in user must approve each invocation on their
// registered device before the operation can execute.

export const processRefundTool = tool({
  // TODO (Tour 05 - Step 6): Replace `tool({` on this line with `withRefundApproval(tool({`
  //   and add a closing `)` after the final `})` of this tool definition.
  description:
    'Process a refund for a delivered order. This is a sensitive financial operation that requires explicit manager approval via CIBA before execution.',
  parameters: z.object({
    orderId: z.string().describe('The order ID to refund (e.g. ORD-1001)'),
    amount: z.number().positive().describe('Refund amount in USD'),
    reason: z.string().describe('Reason for the refund'),
  }),
  execute: async ({ orderId, amount, reason }) => {
    const res = await fetch(`${RETAILZERO_API}/api/refunds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amount, reason }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: (body as any).error ?? 'Refund request failed.' };
    }
    return await res.json();
  },
});

export const getCustomerProfileTool = tool({
  // TODO (Tour 05 - Step 7): Replace `tool({` on this line with `withCustomerDataApproval(tool({`
  //   and add a closing `)` after the final `})` of this tool definition.
  description:
    'Retrieve a customer\'s full profile including private contact details (phone, address) and payment information. This is sensitive PII — access requires explicit authorization via CIBA.',
  parameters: z.object({
    customerId: z.string().describe('The customer ID (e.g. CUST-001)'),
  }),
  execute: async ({ customerId }) => {
    const res = await fetch(`${RETAILZERO_API}/api/customers/${customerId}/profile`);
    if (!res.ok) return { error: `Customer ${customerId} not found.` };
    return await res.json();
  },
});
