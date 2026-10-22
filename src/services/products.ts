import type { Product, ProductInput } from '../types/product';
const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  if (options?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? 'Request failed');
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export const listProducts = (search: string) =>
  request<Product[]>(`/api/products${search ? `?search=${encodeURIComponent(search)}` : ''}`);
export const getProduct = (id: string) => request<Product>(`/api/products/${id}`);
export const createProduct = (input: ProductInput) =>
  request<Product>('/api/products', { method: 'POST', body: JSON.stringify(input) });
export const updateProduct = (id: string, input: Partial<ProductInput>) =>
  request<Product>(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
export const deleteProduct = (id: string) =>
  request<void>(`/api/products/${id}`, { method: 'DELETE' });
