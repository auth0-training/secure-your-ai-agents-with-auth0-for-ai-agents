export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  sku: string;
}

export const products: Product[] = [
  {
    id: 'P001',
    name: 'AirPods Pro X',
    description: 'Premium noise-cancelling wireless earbuds with spatial audio',
    price: 199.99,
    category: 'Electronics',
    stock: 23,
    sku: 'APX-001',
  },
  {
    id: 'P002',
    name: 'CloudRunner Pro',
    description: 'Lightweight responsive running shoes with cloud cushioning',
    price: 149.99,
    category: 'Footwear',
    stock: 8,
    sku: 'CRP-002',
  },
  {
    id: 'P003',
    name: 'Flex Yoga Mat',
    description: 'Non-slip 6mm thick yoga mat with carrying strap',
    price: 39.99,
    category: 'Sports',
    stock: 156,
    sku: 'FYM-003',
  },
  {
    id: 'P004',
    name: 'BrewMaster Elite',
    description: 'Programmable 12-cup coffee maker with thermal carafe',
    price: 129.99,
    category: 'Kitchen',
    stock: 17,
    sku: 'BME-004',
  },
  {
    id: 'P005',
    name: 'RaiseDesk Pro',
    description: 'Adjustable aluminum laptop stand with cable management',
    price: 59.99,
    category: 'Office',
    stock: 44,
    sku: 'RDP-005',
  },
  {
    id: 'P006',
    name: 'SmartWatch Z1',
    description: 'Health tracking smartwatch with GPS and 7-day battery',
    price: 299.99,
    category: 'Electronics',
    stock: 5,
    sku: 'SWZ-006',
  },
  {
    id: 'P007',
    name: 'BlastMax Speaker',
    description: 'Waterproof 360° Bluetooth speaker with 20-hour battery',
    price: 89.99,
    category: 'Electronics',
    stock: 31,
    sku: 'BMS-007',
  },
  {
    id: 'P008',
    name: 'ThermoFit Jacket',
    description: 'Insulated windproof jacket with moisture-wicking interior',
    price: 179.99,
    category: 'Apparel',
    stock: 0,
    sku: 'TFJ-008',
  },
  {
    id: 'P009',
    name: 'CodePad 4K',
    description: '27-inch 4K USB-C monitor with 99% sRGB and built-in hub',
    price: 449.99,
    category: 'Electronics',
    stock: 3,
    sku: 'CP4-009',
  },
  {
    id: 'P010',
    name: 'ZeroFlex Chair',
    description: 'Ergonomic mesh office chair with lumbar support and 4D armrests',
    price: 399.99,
    category: 'Office',
    stock: 7,
    sku: 'ZFC-010',
  },
];
