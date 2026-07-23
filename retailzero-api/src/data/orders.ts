export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: string;
  trackingNumber?: string;
  createdAt: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
}

export const orders: Order[] = [
  {
    id: 'ORD-1001',
    customerId: 'CUST-001',
    customerName: 'Sarah Mitchell',
    customerEmail: 'sarah.mitchell@example.com',
    status: 'delivered',
    items: [
      { productId: 'P001', productName: 'AirPods Pro X', quantity: 1, unitPrice: 199.99, total: 199.99 },
    ],
    subtotal: 199.99,
    tax: 17.00,
    shipping: 0.00,
    total: 216.99,
    shippingAddress: '847 Lakeview Drive, Chicago, IL 60614',
    trackingNumber: 'RZ7842019301US',
    createdAt: '2025-06-01',
    estimatedDelivery: '2025-06-05',
    deliveredAt: '2025-06-04',
  },
  {
    id: 'ORD-1002',
    customerId: 'CUST-002',
    customerName: 'James Rodriguez',
    customerEmail: 'james.r@example.com',
    status: 'shipped',
    items: [
      { productId: 'P002', productName: 'CloudRunner Pro', quantity: 1, unitPrice: 149.99, total: 149.99 },
      { productId: 'P003', productName: 'Flex Yoga Mat', quantity: 1, unitPrice: 39.99, total: 39.99 },
    ],
    subtotal: 189.98,
    tax: 16.15,
    shipping: 9.99,
    total: 216.12,
    shippingAddress: '214 Coral Way, Miami, FL 33145',
    trackingNumber: 'RZ9130482017US',
    createdAt: '2025-06-20',
    estimatedDelivery: '2025-06-25',
  },
  {
    id: 'ORD-1003',
    customerId: 'CUST-003',
    customerName: 'Priya Sharma',
    customerEmail: 'priya.s@example.com',
    status: 'delivered',
    items: [
      { productId: 'P009', productName: 'CodePad 4K', quantity: 1, unitPrice: 449.99, total: 449.99 },
      { productId: 'P005', productName: 'RaiseDesk Pro', quantity: 1, unitPrice: 59.99, total: 59.99 },
    ],
    subtotal: 509.98,
    tax: 43.35,
    shipping: 0.00,
    total: 553.33,
    shippingAddress: '5500 Market Street Apt 12B, San Francisco, CA 94102',
    trackingNumber: 'RZ5510293847US',
    createdAt: '2025-05-10',
    estimatedDelivery: '2025-05-15',
    deliveredAt: '2025-05-14',
  },
  {
    id: 'ORD-1004',
    customerId: 'CUST-001',
    customerName: 'Sarah Mitchell',
    customerEmail: 'sarah.mitchell@example.com',
    status: 'processing',
    items: [
      { productId: 'P006', productName: 'SmartWatch Z1', quantity: 1, unitPrice: 299.99, total: 299.99 },
    ],
    subtotal: 299.99,
    tax: 25.50,
    shipping: 0.00,
    total: 325.49,
    shippingAddress: '847 Lakeview Drive, Chicago, IL 60614',
    createdAt: '2025-07-18',
    estimatedDelivery: '2025-07-23',
  },
  {
    id: 'ORD-1005',
    customerId: 'CUST-004',
    customerName: 'Marcus Thompson',
    customerEmail: 'marcus.t@example.com',
    status: 'delivered',
    items: [
      { productId: 'P004', productName: 'BrewMaster Elite', quantity: 1, unitPrice: 129.99, total: 129.99 },
    ],
    subtotal: 129.99,
    tax: 11.05,
    shipping: 9.99,
    total: 151.03,
    shippingAddress: '99 Pike St, Seattle, WA 98101',
    trackingNumber: 'RZ3318204752US',
    createdAt: '2025-05-28',
    estimatedDelivery: '2025-06-02',
    deliveredAt: '2025-06-01',
  },
  {
    id: 'ORD-1006',
    customerId: 'CUST-005',
    customerName: 'Emma Walsh',
    customerEmail: 'emma.w@example.com',
    status: 'delivered',
    items: [
      { productId: 'P010', productName: 'ZeroFlex Chair', quantity: 1, unitPrice: 399.99, total: 399.99 },
    ],
    subtotal: 399.99,
    tax: 34.00,
    shipping: 0.00,
    total: 433.99,
    shippingAddress: '120 Tremont Street, Boston, MA 02108',
    trackingNumber: 'RZ7701928364US',
    createdAt: '2025-04-15',
    estimatedDelivery: '2025-04-22',
    deliveredAt: '2025-04-20',
  },
  {
    id: 'ORD-1007',
    customerId: 'CUST-003',
    customerName: 'Priya Sharma',
    customerEmail: 'priya.s@example.com',
    status: 'cancelled',
    items: [
      { productId: 'P008', productName: 'ThermoFit Jacket', quantity: 2, unitPrice: 179.99, total: 359.98 },
    ],
    subtotal: 359.98,
    tax: 30.60,
    shipping: 0.00,
    total: 390.58,
    shippingAddress: '5500 Market Street Apt 12B, San Francisco, CA 94102',
    createdAt: '2025-06-12',
  },
  {
    id: 'ORD-1008',
    customerId: 'CUST-005',
    customerName: 'Emma Walsh',
    customerEmail: 'emma.w@example.com',
    status: 'delivered',
    items: [
      { productId: 'P007', productName: 'BlastMax Speaker', quantity: 1, unitPrice: 89.99, total: 89.99 },
      { productId: 'P003', productName: 'Flex Yoga Mat', quantity: 2, unitPrice: 39.99, total: 79.98 },
    ],
    subtotal: 169.97,
    tax: 14.45,
    shipping: 0.00,
    total: 184.42,
    shippingAddress: '120 Tremont Street, Boston, MA 02108',
    trackingNumber: 'RZ4422019831US',
    createdAt: '2025-06-08',
    estimatedDelivery: '2025-06-13',
    deliveredAt: '2025-06-12',
  },
  {
    id: 'ORD-1009',
    customerId: 'CUST-002',
    customerName: 'James Rodriguez',
    customerEmail: 'james.r@example.com',
    status: 'pending',
    items: [
      { productId: 'P001', productName: 'AirPods Pro X', quantity: 1, unitPrice: 199.99, total: 199.99 },
    ],
    subtotal: 199.99,
    tax: 17.00,
    shipping: 9.99,
    total: 226.98,
    shippingAddress: '214 Coral Way, Miami, FL 33145',
    createdAt: '2025-07-21',
    estimatedDelivery: '2025-07-26',
  },
  {
    id: 'ORD-1010',
    customerId: 'CUST-001',
    customerName: 'Sarah Mitchell',
    customerEmail: 'sarah.mitchell@example.com',
    status: 'delivered',
    items: [
      { productId: 'P002', productName: 'CloudRunner Pro', quantity: 1, unitPrice: 149.99, total: 149.99 },
    ],
    subtotal: 149.99,
    tax: 12.75,
    shipping: 0.00,
    total: 162.74,
    shippingAddress: '847 Lakeview Drive, Chicago, IL 60614',
    trackingNumber: 'RZ8823741029US',
    createdAt: '2025-04-02',
    estimatedDelivery: '2025-04-07',
    deliveredAt: '2025-04-06',
  },
  {
    id: 'ORD-1011',
    customerId: 'CUST-004',
    customerName: 'Marcus Thompson',
    customerEmail: 'marcus.t@example.com',
    status: 'shipped',
    items: [
      { productId: 'P005', productName: 'RaiseDesk Pro', quantity: 1, unitPrice: 59.99, total: 59.99 },
      { productId: 'P007', productName: 'BlastMax Speaker', quantity: 1, unitPrice: 89.99, total: 89.99 },
    ],
    subtotal: 149.98,
    tax: 12.75,
    shipping: 9.99,
    total: 172.72,
    shippingAddress: '99 Pike St, Seattle, WA 98101',
    trackingNumber: 'RZ6641928374US',
    createdAt: '2025-07-15',
    estimatedDelivery: '2025-07-22',
  },
  {
    id: 'ORD-1012',
    customerId: 'CUST-003',
    customerName: 'Priya Sharma',
    customerEmail: 'priya.s@example.com',
    status: 'delivered',
    items: [
      { productId: 'P006', productName: 'SmartWatch Z1', quantity: 1, unitPrice: 299.99, total: 299.99 },
      { productId: 'P001', productName: 'AirPods Pro X', quantity: 1, unitPrice: 199.99, total: 199.99 },
    ],
    subtotal: 499.98,
    tax: 42.50,
    shipping: 0.00,
    total: 542.48,
    shippingAddress: '5500 Market Street Apt 12B, San Francisco, CA 94102',
    trackingNumber: 'RZ9930182847US',
    createdAt: '2025-03-20',
    estimatedDelivery: '2025-03-25',
    deliveredAt: '2025-03-24',
  },
];
