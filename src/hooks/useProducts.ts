import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/products';
import type { ProductInput } from '../types/product';
export const useProducts = (search: string) =>
  useQuery({ queryKey: ['products', search], queryFn: () => api.listProducts(search) });
export const useProduct = (id: string) =>
  useQuery({ queryKey: ['products', id], queryFn: () => api.getProduct(id), enabled: Boolean(id) });
export function useSaveProduct(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) =>
      id ? api.updateProduct(id, input) : api.createProduct(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['products'] });
      void client.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
export function useToggleProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.updateProduct(id, { active }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['products'] }),
  });
}
export function useDeleteProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.deleteProduct,
    onSuccess: (_data, id) => {
      client.removeQueries({ queryKey: ['products', id], exact: true });
      void client.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
