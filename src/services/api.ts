const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type ResourceItem = {
  id: string;
  name?: string;
  description?: string;
  active?: boolean;
  [key: string]: unknown;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? 'Request failed');
  }
  return (await response.json()) as T;
}

const camel = (key: string) =>
  key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
const normalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [camel(key), normalize(item)]),
  );
};

export const listResource = (resource: string, search: string): Promise<ResourceItem[]> =>
  request<unknown>(`/api/${resource}${search ? `?search=${encodeURIComponent(search)}` : ''}`).then(
    (data) => {
      const items = (Array.isArray(data) ? data : []) as Record<string, unknown>[];
      return items.map((item) => {
        const normalized = normalize(item) as ResourceItem;
        const normalizedRecord = normalized as Record<string, unknown>;
        if (resource === 'suppliers' && Array.isArray(normalizedRecord.productSuppliers)) {
          normalizedRecord.products = normalizedRecord.productSuppliers
            .map((entry) =>
              entry && typeof entry === 'object'
                ? (entry as Record<string, unknown>).product
                : undefined,
            )
            .filter(Boolean);
        }
        const related = normalizedRecord.products ?? normalizedRecord.product;
        const warehouse = normalizedRecord.warehouses ?? normalizedRecord.warehouse;
        return {
          ...normalized,
          productName:
            (related as Record<string, unknown> | undefined)?.name ?? normalized.productName,
          minimumStock:
            (related as Record<string, unknown> | undefined)?.minimumStock ??
            normalized.minimumStock,
          warehouseName:
            (warehouse as Record<string, unknown> | undefined)?.name ?? normalized.warehouseName,
        } as ResourceItem;
      });
    },
  );
export const createResource = (resource: string, input: Record<string, unknown>) =>
  request<ResourceItem>(`/api/${resource}`, { method: 'POST', body: JSON.stringify(input) });
export const updateResource = (resource: string, id: string, input: Record<string, unknown>) =>
  request<ResourceItem>(`/api/${resource}/${id}`, { method: 'PATCH', body: JSON.stringify(input) });

export type OrderItemInput = { productId: string; quantity: number };
export type OrderInput = { items: OrderItemInput[]; notes?: string };
export type Order = ResourceItem & {
  items: Array<
    ResourceItem & {
      product?: ResourceItem;
      quantity: number;
      unitCost: number;
      lineTotal: number;
    }
  >;
  total: number;
  status?: string;
};
export const listOrders = () =>
  request<unknown>('/api/orders').then((data) =>
    (Array.isArray(data) ? data : []).map((item) => normalize(item) as Order),
  );
export const createOrder = (input: OrderInput) =>
  request<Order>('/api/orders', { method: 'POST', body: JSON.stringify(input) }).then(
    normalize,
  ) as Promise<Order>;
