import { useState } from 'react';
import { Button, Card, Chip, Input, ListBox, Modal, Select, Spinner, Table } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiAlertCircle, FiEdit3, FiPlus } from 'react-icons/fi';
import { motion } from 'motion/react';
import { createResource, listResource, updateResource, type ResourceItem } from '../services/api';

function text(value: unknown, fallback = '—') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

export function InventoryPage() {
  const [editing, setEditing] = useState<ResourceItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [quantity, setQuantity] = useState('');
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['inventory'],
    queryFn: () => listResource('inventory', ''),
  });
  const products = useQuery({
    queryKey: ['products', 'inventory-create'],
    queryFn: () => listResource('products', ''),
  });
  const warehouses = useQuery({
    queryKey: ['warehouses', 'inventory-create'],
    queryFn: () => listResource('warehouses', ''),
  });
  const mutation = useMutation({
    mutationFn: ({ item, next }: { item: ResourceItem; next: number }) => {
      return updateResource('inventory', item.id, { quantity: next });
    },
    onSuccess: () => {
      setEditing(null);
      void client.invalidateQueries({ queryKey: ['inventory'] });
      void client.invalidateQueries({ queryKey: ['products'] });
    },
  });
  const createMutation = useMutation({
    mutationFn: () =>
      createResource('inventory', {
        productId,
        warehouseId,
        quantity: Number(quantity || 0),
      }),
    onSuccess: () => {
      setCreating(false);
      setProductId('');
      setWarehouseId('');
      setQuantity('');
      void client.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const openEditor = (item: ResourceItem) => {
    setEditing(item);
    setQuantity(String(item.quantity ?? 0));
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-sm text-amber-600">Control de existencias</p>
          <h2 className="text-3xl font-bold tracking-tight">Inventario</h2>
          <p className="mt-2 text-default-500">
            Consulta y actualiza las cantidades por ubicación.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button variant="secondary" onPress={() => setCreating(true)}>
            <FiPlus aria-hidden="true" /> Vincular producto
          </Button>
          <Button variant="primary" onPress={() => (window.location.href = '/orders?new=1')}>
            <FiPlus aria-hidden="true" /> Crear pedido
          </Button>
        </div>
      </div>
      <Modal isOpen={creating} onOpenChange={(open) => !open && setCreating(false)}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <p className="text-sm font-medium text-amber-600">Relación de inventario</p>
                <Modal.Heading>Vincular producto a almacén</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <form
                  className="brew-form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (productId && warehouseId && Number(quantity || 0) >= 0)
                      createMutation.mutate();
                  }}
                >
                  <div className="brew-form-field brew-form-span-full">
                    <span className="block text-sm font-medium text-default-700">Producto</span>
                    <Select
                      aria-label="Producto"
                      placeholder="Selecciona un producto"
                      value={productId}
                      onChange={(value) => setProductId(String(value))}
                      isDisabled={products.isPending || products.isError}
                    >
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {products.data
                            ?.filter((item) => item.active !== false)
                            .map((item) => (
                              <ListBox.Item key={item.id} id={item.id}>
                                {item.name}
                              </ListBox.Item>
                            ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                  <div className="brew-form-field brew-form-span-full">
                    <span className="block text-sm font-medium text-default-700">Almacén</span>
                    <Select
                      aria-label="Almacén"
                      placeholder="Selecciona un almacén"
                      value={warehouseId}
                      onChange={(value) => setWarehouseId(String(value))}
                      isDisabled={warehouses.isPending || warehouses.isError}
                    >
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {warehouses.data
                            ?.filter((item) => item.active !== false)
                            .map((item) => (
                              <ListBox.Item key={item.id} id={item.id}>
                                {item.name}
                              </ListBox.Item>
                            ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                  <div className="brew-form-field brew-form-span-full">
                    <span className="block text-sm font-medium text-default-700">
                      Cantidad inicial
                    </span>
                    <Input
                      aria-label="Cantidad inicial"
                      type="number"
                      min="0"
                      step="0.01"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      required
                    />
                  </div>
                  {createMutation.isError && (
                    <p className="brew-form-span-full text-sm text-danger">
                      {createMutation.error.message}
                    </p>
                  )}
                  <div className="brew-form-span-full flex justify-end gap-4">
                    <Button
                      type="submit"
                      variant="primary"
                      isDisabled={createMutation.isPending || !productId || !warehouseId}
                    >
                      {createMutation.isPending ? 'Guardando…' : 'Vincular inventario'}
                    </Button>
                  </div>
                </form>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      <Modal isOpen={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <p className="text-sm font-medium text-amber-600">Ajuste de existencias</p>
                <Modal.Heading>{text(editing?.productName, 'Inventario')}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <form
                  className="brew-form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const next = Number(quantity);
                    if (
                      editing &&
                      Number.isFinite(next) &&
                      next >= 0 &&
                      next !== Number(editing.quantity)
                    ) {
                      mutation.mutate({ item: editing, next });
                    }
                  }}
                >
                  <p className="brew-form-span-full text-sm text-default-500">
                    Cantidad actual:{' '}
                    <strong className="text-default-900">{text(editing?.quantity, '0')}</strong>{' '}
                    {text(editing?.unit, 'unidades')}
                  </p>
                  <div className="brew-form-field brew-form-span-full">
                    <span className="block text-sm font-medium text-default-700">
                      Nueva cantidad
                    </span>
                    <Input
                      aria-label="Nueva cantidad"
                      autoFocus
                      type="number"
                      min="0"
                      step="0.01"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      required
                    />
                  </div>
                  {mutation.isError && (
                    <p className="brew-form-span-full text-sm text-danger">
                      {mutation.error.message}
                    </p>
                  )}
                  <div className="brew-form-span-full flex justify-end gap-4">
                    <Button type="submit" variant="primary" isDisabled={mutation.isPending}>
                      {mutation.isPending ? 'Actualizando…' : 'Actualizar inventario'}
                    </Button>
                  </div>
                </form>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      <Card className="rounded-2xl border border-default-200/70 shadow-none">
        <Card.Content className="p-0">
          {query.isPending ? (
            <div className="flex min-h-56 items-center justify-center p-10">
              <Spinner />
            </div>
          ) : query.isError ? (
            <p className="p-10 text-center text-danger">No se pudo cargar el inventario.</p>
          ) : !query.data?.length ? (
            <p className="p-10 text-center text-default-500">No hay existencias registradas.</p>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Table.ScrollContainer className="overflow-x-auto">
                <Table>
                  <Table.Content
                    aria-label="Inventario"
                    className="brew-table min-w-[720px] text-sm"
                  >
                    <Table.Header className="bg-default-100/80 text-xs uppercase tracking-wider text-default-600">
                      <Table.Column>Producto</Table.Column>
                      <Table.Column>Ubicación</Table.Column>
                      <Table.Column>Stock actual</Table.Column>
                      <Table.Column>Stock mínimo</Table.Column>
                      <Table.Column>Estado</Table.Column>
                      <Table.Column>Acciones</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {query.data.map((item) => {
                        const current = Number(item.quantity ?? 0);
                        const minimum = Number(item.minimumStock ?? 0);
                        const low = current <= minimum;
                        return (
                          <Table.Row
                            key={item.id}
                            className="transition-colors hover:bg-amber-50/50"
                          >
                            <Table.Cell>
                              <p className="font-semibold text-default-900">
                                {text(item.productName, 'Producto')}
                              </p>
                            </Table.Cell>
                            <Table.Cell>
                              <p>{text(item.warehouseName, 'Almacén')}</p>
                              <p className="text-xs text-default-500">Almacén de almacenamiento</p>
                            </Table.Cell>
                            <Table.Cell>
                              <span className={low ? 'font-bold text-danger' : 'font-semibold'}>
                                {current}
                              </span>
                            </Table.Cell>
                            <Table.Cell>{minimum}</Table.Cell>
                            <Table.Cell>
                              <Chip color={low ? 'danger' : 'success'} size="sm">
                                {low ? (
                                  <>
                                    <FiAlertCircle aria-hidden="true" /> Stock bajo
                                  </>
                                ) : (
                                  'En rango'
                                )}
                              </Chip>
                            </Table.Cell>
                            <Table.Cell>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="secondary"
                                aria-label={`Ajustar ${text(item.productName, 'producto')}`}
                                onPress={() => openEditor(item)}
                              >
                                <FiEdit3 aria-hidden="true" />
                              </Button>
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table.Content>
                </Table>
              </Table.ScrollContainer>
            </motion.div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
