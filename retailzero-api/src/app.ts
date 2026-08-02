import { config } from 'dotenv';
config({ path: '.env', override: false });

import express from 'express';
import type { Request, Response } from 'express';
import { products } from './data/products.js';
import { orders as ordersData } from './data/orders.js';
import { customers } from './data/customers.js';
import type { Order } from './data/orders.js';
// TODO (Tour 04 - Step 5): Import the token validation middleware
// import { validateToken } from './middleware/auth.js';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(express.json());
// TODO (Tour 04 - Step 5): Uncomment to require a valid Auth0 access token on all /api/* routes
// app.use('/api/', validateToken);

const orders: Order[] = [...ordersData];

interface Refund {
  id: string;
  orderId: string;
  amount: number;
  reason: string;
  status: 'approved';
  createdAt: string;
}

const refunds: Refund[] = [];

// ─── Products ────────────────────────────────────────────────────────────────

app.get('/api/products', (_req: Request, res: Response) => {
  const { category, inStock } = _req.query;

  let result = products;
  if (category) {
    result = result.filter(
      (p) => p.category.toLowerCase() === (category as string).toLowerCase(),
    );
  }
  if (inStock === 'true') {
    result = result.filter((p) => p.stock > 0);
  }
  res.json(result);
});

app.get('/api/products/:id', (req: Request, res: Response) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    res.status(404).json({ error: `Product ${req.params.id} not found.` });
    return;
  }
  res.json(product);
});

// ─── Orders ──────────────────────────────────────────────────────────────────

app.get('/api/orders', (req: Request, res: Response) => {
  const { q, status } = req.query;

  let result = orders;

  if (q) {
    const query = (q as string).toLowerCase();
    result = result.filter(
      (o) =>
        o.id.toLowerCase().includes(query) ||
        o.customerName.toLowerCase().includes(query) ||
        o.customerEmail.toLowerCase().includes(query) ||
        o.customerId.toLowerCase().includes(query),
    );
  }

  if (status) {
    result = result.filter((o) => o.status === status);
  }

  const summary = result.map(({ items: _items, ...o }) => ({
    ...o,
    itemCount: _items.length,
  }));

  res.json(summary);
});

app.get('/api/orders/:id', (req: Request, res: Response) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: `Order ${req.params.id} not found.` });
    return;
  }
  res.json(order);
});

app.post('/api/orders/:id/cancel', (req: Request, res: Response) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: `Order ${req.params.id} not found.` });
    return;
  }
  if (order.status === 'delivered' || order.status === 'cancelled') {
    res.status(400).json({
      error: `Order ${req.params.id} cannot be cancelled — current status: ${order.status}.`,
    });
    return;
  }
  order.status = 'cancelled';
  res.json({ message: `Order ${req.params.id} has been cancelled.`, order });
});

// ─── Refunds ─────────────────────────────────────────────────────────────────

app.post('/api/refunds', (req: Request, res: Response) => {
  const { orderId, amount, reason } = req.body as {
    orderId: string;
    amount: number;
    reason: string;
  };

  if (!orderId || !amount || !reason) {
    res.status(400).json({ error: 'orderId, amount, and reason are required.' });
    return;
  }

  const order = orders.find((o) => o.id === orderId);
  if (!order) {
    res.status(404).json({ error: `Order ${orderId} not found.` });
    return;
  }
  if (order.status !== 'delivered') {
    res.status(400).json({
      error: `Refunds can only be issued for delivered orders. Order ${orderId} status: ${order.status}.`,
    });
    return;
  }
  if (amount > order.total) {
    res.status(400).json({
      error: `Refund amount $${amount.toFixed(2)} exceeds order total $${order.total.toFixed(2)}.`,
    });
    return;
  }

  const refund: Refund = {
    id: `REF-${String(refunds.length + 1).padStart(3, '0')}`,
    orderId,
    amount,
    reason,
    status: 'approved',
    createdAt: new Date().toISOString(),
  };
  refunds.push(refund);

  res.status(201).json({
    message: `Refund of $${amount.toFixed(2)} approved for order ${orderId}.`,
    refund,
  });
});

// ─── Customers ───────────────────────────────────────────────────────────────

app.get('/api/customers/:id', (req: Request, res: Response) => {
  const customer = customers.find((c) => c.id === req.params.id);
  if (!customer) {
    res.status(404).json({ error: `Customer ${req.params.id} not found.` });
    return;
  }
  const { phone: _p, address: _a, dateOfBirth: _d, paymentMethods: _pm, ...publicInfo } = customer;
  res.json(publicInfo);
});

app.get('/api/customers/:id/profile', (req: Request, res: Response) => {
  const customer = customers.find((c) => c.id === req.params.id);
  if (!customer) {
    res.status(404).json({ error: `Customer ${req.params.id} not found.` });
    return;
  }
  res.json(customer);
});

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'RetailZero API', timestamp: new Date().toISOString() });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`RetailZero API running at http://localhost:${PORT}`);
});
