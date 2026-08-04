import { tool, jsonSchema } from 'ai';
import { z } from 'zod';
// TODO (Tour 04 - Step 7): Uncomment after implementing token-exchange.ts:
// import { getRetailZeroToken } from '../lib/token-exchange.js';
// TODO (Tour 06 - #6): After completing auth0-ai.ts, uncomment this import:
// import { withRefundApproval, withCustomerDataApproval } from '../lib/auth0-ai.js';

const RETAILZERO_API = process.env.RETAILZERO_API_URL ?? 'http://localhost:3001';

// TODO (Tour 04 - Step 7): Uncomment this helper. It adds an Authorization header to every
// RetailZero API call using the access token from the user's session.
// async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
//   const token = await getRetailZeroToken();
//   return fetch(url, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${token}` } });
// }

// ─── Standard Tools ───────────────────────────────────────────────────────────
// These tools are safe for the AI agent to call without additional authorization.

export const listProductsTool = tool({
  description:
    'List RetailZero products. Optionally filter by category (Electronics, Footwear, Sports, Kitchen, Office, Apparel) or show only in-stock items.',
  inputSchema: jsonSchema<{ category?: string; inStockOnly?: boolean }>({
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Filter by product category (Electronics, Footwear, Sports, Kitchen, Office, Apparel)',
      },
      inStockOnly: {
        type: 'boolean',
        description: 'When true, only return products with available stock',
      },
    },
    additionalProperties: false,
  }),
  execute: async ({ category, inStockOnly }) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (inStockOnly) params.set('inStock', 'true');
    // TODO (Tour 04 - Step 12): Change fetch → apiFetch
    const res = await fetch(`${RETAILZERO_API}/api/products?${params}`);
    if (!res.ok) return { error: 'Failed to fetch products.' };
    return await res.json();
  },
});

export const searchOrdersTool = tool({
  description:
    'Search RetailZero orders by customer name, email, or order ID. Optionally filter by status (pending, processing, shipped, delivered, cancelled).',
  inputSchema: jsonSchema<{ query?: string; status?: string }>({
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search term: customer name, email address, or order ID (e.g. ORD-1001)',
      },
      status: {
        type: 'string',
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        description: 'Filter orders by status',
      },
    },
    additionalProperties: false,
  }),
  execute: async ({ query, status }) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (status) params.set('status', status);
    // TODO (Tour 04 - Step 13): Change fetch → apiFetch
    const res = await fetch(`${RETAILZERO_API}/api/orders?${params}`);
    if (!res.ok) return { error: 'Failed to fetch orders.' };
    return await res.json();
  },
});

export const getOrderDetailsTool = tool({
  description: 'Get full details for a specific order including line items, totals, and tracking information.',
  inputSchema: z.object({
    orderId: z.string().describe('The order ID (e.g. ORD-1001)'),
  }),
  execute: async ({ orderId }) => {
    // TODO (Tour 04 - Step 14): Change fetch → apiFetch
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
  // TODO (Tour 06 - #15): Replace `tool({` on this line with `withRefundApproval(tool({`
  //   and add a closing `)` after the final `})` of this tool definition.
  description:
    'Process a refund for a delivered order.',
  inputSchema: z.object({
    orderId: z.string().describe('The order ID to refund (e.g. ORD-1001)'),
    amount: z.number().positive().describe('Refund amount in USD'),
    reason: z.string().describe('Reason for the refund'),
  }),
  execute: async ({ orderId, amount, reason }) => {
    // TODO (Tour 04 - Step 7): Change fetch → apiFetch
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
  // TODO (Tour 06 - #8): Replace `tool({` on this line with `withCustomerDataApproval(tool({`
  //   and add a closing `)` after the final `})` of this tool definition.
  description:
    'Retrieve a customer\'s full profile including private contact details (phone, address) and payment information.',
  inputSchema: z.object({
    customerId: z.string().describe('The customer ID (e.g. CUST-001)'),
  }),
  execute: async ({ customerId }) => {
    // TODO (Tour 04 - Step 16): Change fetch → apiFetch
    const res = await fetch(`${RETAILZERO_API}/api/customers/${customerId}/profile`);
    if (!res.ok) return { error: `Customer ${customerId} not found.` };
    return await res.json();
  },
});
