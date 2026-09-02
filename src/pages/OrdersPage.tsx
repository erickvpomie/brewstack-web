import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Chip,
  Input,
  ListBox,
  Modal,
  Select,
  Spinner,
  TextArea,
} from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiFileText, FiPlus, FiPrinter, FiTrash2 } from 'react-icons/fi';
import { motion } from 'motion/react';
import { createOrder, listOrders, listResource, type Order } from '../services/api';

type DraftLine = { productId: string; quantity: string };
const money = (value: number) => `$${value.toFixed(2)}`;
const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  received: 'Recibido',
  cancelled: 'Cancelado',
};

export function OrdersPage() {
  const [creating, setCreating] = useState(new URLSearchParams(location.search).has('new'));
  const [lines, setLines] = useState<DraftLine[]>([{ productId: '', quantity: '1' }]);
  const [notes, setNotes] = useState('');
  const client = useQueryClient();
  const products = useQuery({
    queryKey: ['products', 'orders'],
    queryFn: () => listResource('products', ''),
  });
  const orders = useQuery({ queryKey: ['orders'], queryFn: listOrders });
  const save = useMutation({
    mutationFn: () =>
      createOrder({
        items: lines
          .filter((line) => line.productId && Number(line.quantity) > 0)
          .map((line) => ({ productId: line.productId, quantity: Number(line.quantity) })),
        notes,
      }),
    onSuccess: () => {
      setCreating(false);
      setLines([{ productId: '', quantity: '1' }]);
      setNotes('');
      void client.invalidateQueries({ queryKey: ['orders'] });
    },
  });
  const total = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const product = products.data?.find((item) => item.id === line.productId);
        return sum + (product ? Number(product.cost ?? 0) * Number(line.quantity || 0) : 0);
      }, 0),
    [lines, products.data],
  );
  const totalQuantity = lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
  const openNew = () => {
    setLines([{ productId: '', quantity: '1' }]);
    setCreating(true);
  };
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-sm text-amber-600">Abastecimiento</p>
          <h2 className="text-3xl font-bold tracking-tight">Pedidos</h2>
          <p className="mt-2 text-default-500">
            Prepara la relación de compra para tus proveedores.
          </p>
        </div>
        <Button variant="primary" onPress={openNew}>
          <FiPlus aria-hidden="true" /> Nuevo pedido
        </Button>
      </div>
      <Modal isOpen={creating} onOpenChange={setCreating}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <p className="text-sm font-medium text-amber-600">Abastecimiento</p>
                <Modal.Heading>Nuevo pedido</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <form
                  className="brew-form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (lines.some((line) => line.productId && Number(line.quantity) > 0))
                      save.mutate();
                  }}
                >
                  <div className="brew-form-span-full grid gap-4">
                    {lines.map((line, index) => {
                      const product = products.data?.find((item) => item.id === line.productId);
                      return (
                        <div
                          key={index}
                          className="grid gap-4 rounded-2xl border border-default-200 p-4 sm:grid-cols-[1fr_9rem_auto] sm:items-end"
                        >
                          <div className="space-y-2">
                            <span className="block text-sm font-medium text-default-700">
                              Producto
                            </span>
                            <Select
                              aria-label="Producto"
                              placeholder="Selecciona un producto"
                              value={line.productId}
                              onChange={(key) =>
                                setLines((current) =>
                                  current.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, productId: String(key) }
                                      : item,
                                  ),
                                )
                              }
                            >
                              <Select.Trigger>
                                <Select.Value />
                              </Select.Trigger>
                              <Select.Popover>
                                <ListBox>
                                  {products.data
                                    ?.filter((item) => item.active)
                                    .map((item) => (
                                      <ListBox.Item key={item.id} id={item.id}>
                                        {item.name}
                                      </ListBox.Item>
                                    ))}
                                </ListBox>
                              </Select.Popover>
                            </Select>
                            {product && (
                              <span className="block text-xs text-default-500">
                                Proveedores:{' '}
                                {Array.isArray(product.suppliers)
                                  ? product.suppliers
                                      .map((supplier) =>
                                        String((supplier as { name?: unknown }).name ?? ''),
                                      )
                                      .join(', ') || 'Sin proveedores'
                                  : 'Sin proveedores'}
                              </span>
                            )}
                          </div>
                          <div className="space-y-2">
                            <span className="block text-sm font-medium text-default-700">
                              Cantidad
                            </span>
                            <Input
                              aria-label="Cantidad"
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={line.quantity}
                              onChange={(event) =>
                                setLines((current) =>
                                  current.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, quantity: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            isIconOnly
                            variant="ghost"
                            aria-label="Quitar producto"
                            onPress={() =>
                              setLines((current) =>
                                current.length === 1
                                  ? current
                                  : current.filter((_, itemIndex) => itemIndex !== index),
                              )
                            }
                          >
                            <FiTrash2 aria-hidden="true" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="justify-self-start"
                    onPress={() =>
                      setLines((current) => [...current, { productId: '', quantity: '1' }])
                    }
                  >
                    <FiPlus aria-hidden="true" /> Añadir producto
                  </Button>
                  <div className="brew-form-field brew-form-span-full">
                    <span className="text-sm font-medium text-default-700">Notas</span>
                    <TextArea
                      aria-label="Notas del pedido"
                      placeholder="Notas para el proveedor (opcional)"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                  </div>
                  <div className="brew-form-span-full flex items-center justify-between rounded-2xl bg-amber-50 p-4">
                    <div>
                      <span className="font-medium">Total estimado</span>
                      <p className="text-sm text-default-500">{totalQuantity} unidades</p>
                    </div>
                    <strong className="text-xl">{money(total)}</strong>
                  </div>
                  {save.isError && (
                    <p className="brew-form-span-full text-sm text-danger">{save.error.message}</p>
                  )}
                  <div className="brew-form-span-full flex justify-end gap-4">
                    <Button type="submit" variant="primary" isDisabled={save.isPending}>
                      {save.isPending ? 'Guardando…' : 'Crear pedido'}
                    </Button>
                  </div>
                </form>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      <Card className="rounded-2xl border border-default-200/70 shadow-none">
        <Card.Content className="p-5 sm:p-6">
          {orders.isPending ? (
            <div className="flex min-h-48 items-center justify-center">
              <Spinner />
            </div>
          ) : orders.isError ? (
            <p className="text-danger">No se pudieron cargar los pedidos.</p>
          ) : !orders.data?.length ? (
            <div className="py-12 text-center">
              <FiFileText className="mx-auto mb-4 text-3xl text-amber-600" />
              <p className="font-semibold">Aún no hay pedidos</p>
              <p className="mt-1 text-sm text-default-500">
                Crea uno para reunir productos y proveedores.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.data.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const totalQuantity =
    order.items?.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0) ?? 0;
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-default-200 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-semibold">
            Pedido del {new Date(String(order.createdAt)).toLocaleDateString('es-MX')}
          </p>
          <p className="mt-1 text-sm text-default-500">
            {order.items?.length ?? 0} productos · {totalQuantity} unidades
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Chip color="warning" size="sm">
            {statusLabels[order.status ?? ''] ?? 'Pedido'}
          </Chip>
          <strong>{money(Number(order.total ?? 0))}</strong>
          <Button
            isIconOnly
            size="sm"
            variant="secondary"
            aria-label="Imprimir pedido o guardar como PDF"
            onPress={() => window.print()}
          >
            <FiPrinter aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        {order.items?.map((item) => (
          <div key={item.id} className="flex justify-between border-b border-default-100 py-2">
            <span>
              <strong>{String(item.product?.name ?? item.productName ?? 'Producto')}</strong> ×{' '}
              {item.quantity}
              <small className="mt-1 block text-default-500">
                Proveedores:{' '}
                {Array.isArray(item.product?.suppliers)
                  ? item.product.suppliers.map((supplier) => supplier.name).join(', ') ||
                    'Sin proveedores'
                  : 'Sin proveedores'}
              </small>
            </span>
            <span className="font-medium">{money(Number(item.lineTotal ?? 0))}</span>
          </div>
        ))}
      </div>
    </motion.article>
  );
}
