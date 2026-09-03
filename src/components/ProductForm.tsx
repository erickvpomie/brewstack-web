import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, ListBox, Select, Switch, TextArea } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { listResource, listUnits } from '../services/api';
import type { Product, ProductInput } from '../types/product';
import { useSaveProduct } from '../hooks/useProducts';
const schema = z.object({
  name: z.string().min(1),
  description: z.string(),
  category: z.string().min(1),
  unit: z.string().min(1),
  cost: z.coerce.number().min(0),
  minimumStock: z.coerce.number().min(0),
  active: z.boolean(),
  supplierIds: z.array(z.string()),
  warehouseIds: z.array(z.string()),
});
export function ProductForm({ product, onDone }: { product?: Product; onDone: () => void }) {
  const save = useSaveProduct(product?.id);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ProductInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      category: product?.category ?? '',
      unit: product?.unit ?? 'pz',
      cost: product?.cost ?? 0,
      minimumStock: product?.minimumStock ?? 0,
      active: product?.active ?? true,
      supplierIds: product?.suppliers.map((supplier) => supplier.id) ?? [],
      warehouseIds: product?.warehouses.map((warehouse) => warehouse.id) ?? [],
    },
  });
  const suppliers = useQuery({
    queryKey: ['suppliers', 'product-form'],
    queryFn: () => listResource('suppliers', ''),
  });
  const categories = useQuery({
    queryKey: ['categories', 'product-form'],
    queryFn: () => listResource('categories', ''),
  });
  const warehouses = useQuery({
    queryKey: ['warehouses', 'product-form'],
    queryFn: () => listResource('warehouses', ''),
  });
  const units = useQuery({
    queryKey: ['units'],
    queryFn: listUnits,
    staleTime: 1000 * 60 * 60,
  });
  const selectedSupplierIds = watch('supplierIds') ?? [];
  const selectedWarehouseIds = watch('warehouseIds') ?? [];
  const selectedCategory = watch('category');
  const selectedUnit = watch('unit');
  const onSubmit = (data: ProductInput) => save.mutate(data, { onSuccess: onDone });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="brew-form-grid">
      <div className="brew-form-field">
        <span className="block text-sm font-medium text-default-700">Nombre</span>
        <Input aria-label="Nombre" {...register('name')} />
        {errors.name && <span className="text-xs text-red-600">Campo obligatorio</span>}
      </div>
      <div className="brew-form-field">
        <span className="block text-sm font-medium text-default-700">Unidad</span>
        <Select
          className="brew-select"
          aria-label="Unidad"
          placeholder="Selecciona una unidad"
          value={selectedUnit}
          isDisabled={units.isPending || units.isError}
          onChange={(key) =>
            setValue('unit', String(key), { shouldDirty: true, shouldValidate: true })
          }
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {units.data?.map((unit) => (
                <ListBox.Item key={unit.id} id={unit.id} textValue={unit.name}>
                  {unit.name} ({unit.symbol})
                </ListBox.Item>
              ))}
              {selectedUnit && !units.data?.some((unit) => unit.id === selectedUnit) && (
                <ListBox.Item id={selectedUnit} textValue={selectedUnit}>
                  {selectedUnit}
                </ListBox.Item>
              )}
            </ListBox>
          </Select.Popover>
        </Select>
        {units.isPending ? (
          <span className="text-xs text-default-500">Cargando unidades…</span>
        ) : units.isError ? (
          <span className="text-xs text-danger">No se pudieron cargar las unidades.</span>
        ) : errors.unit ? (
          <span className="text-xs text-red-600">Selecciona una unidad</span>
        ) : null}
      </div>
      <div className="brew-form-field">
        <span className="block text-sm font-medium text-default-700">Categoría</span>
        <Select
          className="brew-select"
          aria-label="Categoría"
          placeholder="Selecciona una categoría"
          value={selectedCategory}
          isDisabled={categories.isPending || categories.isError || !categories.data?.length}
          onChange={(key) =>
            setValue('category', String(key), { shouldDirty: true, shouldValidate: true })
          }
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {categories.data
                ?.filter((category) => category.active !== false)
                .map((category) => (
                  <ListBox.Item key={category.id} id={category.name ?? category.id}>
                    {category.name ?? 'Sin nombre'}
                  </ListBox.Item>
                ))}
            </ListBox>
          </Select.Popover>
        </Select>
        {categories.isPending ? (
          <span className="text-xs text-default-500">Cargando categorías…</span>
        ) : categories.isError ? (
          <span className="text-xs text-danger">No se pudieron cargar las categorías.</span>
        ) : !categories.data?.some((category) => category.active !== false) ? (
          <span className="text-xs text-default-500">No hay categorías activas disponibles.</span>
        ) : errors.category ? (
          <span className="text-xs text-red-600">Selecciona una categoría</span>
        ) : null}
      </div>
      <div className="brew-form-field brew-form-span-full">
        <span className="block text-sm font-medium text-default-700">Descripción</span>
        <TextArea aria-label="Descripción" {...register('description')} />
      </div>
      <div className="brew-form-field brew-form-span-full">
        <span className="text-sm font-medium">Almacenes</span>
        {warehouses.isPending ? (
          <p className="text-sm text-default-500">Cargando almacenes…</p>
        ) : warehouses.isError ? (
          <p className="text-sm text-danger">No se pudieron cargar los almacenes.</p>
        ) : !warehouses.data?.length ? (
          <p className="text-sm text-default-500">Aún no hay almacenes registrados.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {warehouses.data.map((warehouse) => {
              const selected = selectedWarehouseIds.includes(warehouse.id);
              return (
                <Button
                  key={warehouse.id}
                  type="button"
                  size="sm"
                  variant={selected ? 'primary' : 'secondary'}
                  onPress={() =>
                    setValue(
                      'warehouseIds',
                      selected
                        ? selectedWarehouseIds.filter((id) => id !== warehouse.id)
                        : [...selectedWarehouseIds, warehouse.id],
                      { shouldDirty: true },
                    )
                  }
                >
                  {warehouse.name ?? 'Sin nombre'}
                </Button>
              );
            })}
          </div>
        )}
      </div>
      <div className="brew-form-field">
        <span className="block text-sm font-medium text-default-700">Coste</span>
        <Input aria-label="Coste" type="number" step="0.01" {...register('cost')} />
      </div>
      <div className="brew-form-field">
        <span className="block text-sm font-medium text-default-700">Stock mínimo</span>
        <Input aria-label="Stock mínimo" type="number" step="0.01" {...register('minimumStock')} />
      </div>
      <div className="brew-form-field brew-form-span-full">
        <span className="text-sm font-medium">Proveedores</span>
        {suppliers.isPending ? (
          <p className="text-sm text-default-500">Cargando proveedores…</p>
        ) : suppliers.isError ? (
          <p className="text-sm text-danger">No se pudieron cargar los proveedores.</p>
        ) : !suppliers.data?.length ? (
          <p className="text-sm text-default-500">Aún no hay proveedores registrados.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {suppliers.data.map((supplier) => {
              const selected = selectedSupplierIds.includes(supplier.id);
              return (
                <Button
                  key={supplier.id}
                  type="button"
                  size="sm"
                  variant={selected ? 'primary' : 'secondary'}
                  onPress={() =>
                    setValue(
                      'supplierIds',
                      selected
                        ? selectedSupplierIds.filter((id) => id !== supplier.id)
                        : [...selectedSupplierIds, supplier.id],
                      { shouldDirty: true },
                    )
                  }
                >
                  {supplier.name ?? 'Sin nombre'}
                </Button>
              );
            })}
          </div>
        )}
      </div>
      <label className="brew-form-span-full flex items-center gap-4 text-sm">
        <Switch defaultSelected>Activo</Switch>
      </label>
      <Button
        type="submit"
        variant="primary"
        isDisabled={save.isPending}
        className="brew-form-span-full w-full"
      >
        {save.isPending ? 'Guardando…' : 'Guardar producto'}
      </Button>
      {save.isError && (
        <p className="brew-form-span-full text-sm text-red-600">{save.error.message}</p>
      )}
    </form>
  );
}
