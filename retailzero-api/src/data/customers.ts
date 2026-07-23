export interface CustomerPublic {
  id: string;
  name: string;
  email: string;
  memberSince: string;
  totalOrders: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

export interface CustomerPrivate extends CustomerPublic {
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  dateOfBirth: string;
  paymentMethods: Array<{
    type: 'Visa' | 'Mastercard' | 'Amex';
    last4: string;
    expiresAt: string;
  }>;
}

export const customers: CustomerPrivate[] = [
  {
    id: 'CUST-001',
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@example.com',
    memberSince: '2021-03-12',
    totalOrders: 14,
    tier: 'Gold',
    phone: '+1-312-555-0182',
    address: {
      street: '847 Lakeview Drive',
      city: 'Chicago',
      state: 'IL',
      zip: '60614',
      country: 'US',
    },
    dateOfBirth: '1989-07-23',
    paymentMethods: [
      { type: 'Visa', last4: '4821', expiresAt: '2026-09' },
      { type: 'Mastercard', last4: '7743', expiresAt: '2027-03' },
    ],
  },
  {
    id: 'CUST-002',
    name: 'James Rodriguez',
    email: 'james.r@example.com',
    memberSince: '2022-08-05',
    totalOrders: 7,
    tier: 'Silver',
    phone: '+1-305-555-0239',
    address: {
      street: '214 Coral Way',
      city: 'Miami',
      state: 'FL',
      zip: '33145',
      country: 'US',
    },
    dateOfBirth: '1994-11-08',
    paymentMethods: [
      { type: 'Amex', last4: '3001', expiresAt: '2025-12' },
    ],
  },
  {
    id: 'CUST-003',
    name: 'Priya Sharma',
    email: 'priya.s@example.com',
    memberSince: '2020-11-17',
    totalOrders: 31,
    tier: 'Platinum',
    phone: '+1-415-555-0167',
    address: {
      street: '5500 Market Street Apt 12B',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      country: 'US',
    },
    dateOfBirth: '1986-04-14',
    paymentMethods: [
      { type: 'Visa', last4: '9934', expiresAt: '2028-06' },
      { type: 'Mastercard', last4: '1127', expiresAt: '2026-11' },
    ],
  },
  {
    id: 'CUST-004',
    name: 'Marcus Thompson',
    email: 'marcus.t@example.com',
    memberSince: '2023-01-30',
    totalOrders: 3,
    tier: 'Bronze',
    phone: '+1-206-555-0314',
    address: {
      street: '99 Pike St',
      city: 'Seattle',
      state: 'WA',
      zip: '98101',
      country: 'US',
    },
    dateOfBirth: '2001-02-28',
    paymentMethods: [
      { type: 'Visa', last4: '5566', expiresAt: '2027-08' },
    ],
  },
  {
    id: 'CUST-005',
    name: 'Emma Walsh',
    email: 'emma.w@example.com',
    memberSince: '2021-06-22',
    totalOrders: 19,
    tier: 'Gold',
    phone: '+1-617-555-0451',
    address: {
      street: '120 Tremont Street',
      city: 'Boston',
      state: 'MA',
      zip: '02108',
      country: 'US',
    },
    dateOfBirth: '1991-09-17',
    paymentMethods: [
      { type: 'Mastercard', last4: '8823', expiresAt: '2026-05' },
      { type: 'Amex', last4: '7419', expiresAt: '2027-01' },
    ],
  },
];
