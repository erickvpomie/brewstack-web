export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  cost: number;
  minimumStock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  suppliers: Array<{ id: string; name: string }>;
  warehouses: Array<{ id: string; name: string; quantity: number }>;
};
export type ProductInput = Omit<
  Product,
  'id' | 'createdAt' | 'updatedAt' | 'suppliers' | 'warehouses'
> & {
  supplierIds: string[];
  warehouseIds: string[];
};
