import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Chip, Input, Modal, Spinner, Table } from '@heroui/react';
import { FiEdit3, FiPlus, FiPower } from 'react-icons/fi';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { listResource } from '../services/api';
import { useProducts, useToggleProduct } from '../hooks/useProducts';
import { ProductForm } from '../components/ProductForm';
import type { Product } from '../types/product';
export function ProductsPage() {
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const { data, isPending, isFetching, isError } = useProducts(search);
  const inventory = useQuery({
    queryKey: ['inventory', 'products'],
    queryFn: () => listResource('inventory', ''),
  });
  const toggle = useToggleProduct();
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-sm text-amber-700">Base del inventario</p>
          <h2 className="text-3xl font-bold">Productos</h2>
        </div>
        <Button variant="primary" onPress={() => setCreating(true)}>
          <FiPlus aria-hidden="true" /> Nuevo producto
        </Button>
      </div>
      <Modal
        isOpen={creating || Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <p className="text-sm font-medium text-amber-600">Catálogo</p>
                <Modal.Heading>{editing ? 'Editar producto' : 'Nuevo producto'}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <ProductForm
                  product={editing ?? undefined}
                  onDone={() => {
                    setCreating(false);
                    setEditing(null);
                  }}
                />
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      <Card className="rounded-2xl border border-default-200/70 shadow-none">
        <Card.Content className="p-0 flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-default-200/70 bg-default-50/60 pb-4">
            <div>
              <p className="text-sm font-semibold text-default-700">Catálogo de productos</p>
              <p className="mt-1 text-xs text-default-500">
                Consulta y administra los artículos de tu cafetería.
              </p>
            </div>
            <Input
              value={search}
              placeholder="Buscar productos…"
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Buscar productos"
              className="w-full max-w-xs"
            />
          </div>
          {isPending ? (
            <div className="flex min-h-56 items-center justify-center p-10">
              <Spinner />
            </div>
          ) : isError ? (
            <p className="p-10 text-center text-red-600">No se pudieron cargar los productos.</p>
          ) : !data?.length ? (
            <p className="p-10 text-center text-stone-500">No se encontraron productos.</p>
          ) : (
            <motion.div
              className="relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {isFetching && (
                <div className="absolute right-5 top-3 z-10 flex items-center gap-4 text-xs text-default-500">
                  <Spinner size="sm" /> Actualizando
                </div>
              )}
              <Table.ScrollContainer className="-mx-2 overflow-x-auto px-2">
                <Table>
                  <Table.Content aria-label="Productos" className="brew-table min-w-160 text-sm">
                    <Table.Header className="bg-default-100/70 text-xs uppercase tracking-wider text-default-600">
                      <Table.Column>Producto</Table.Column>
                      <Table.Column>Almacenes</Table.Column>
                      <Table.Column>Categoría</Table.Column>
                      <Table.Column>Stock</Table.Column>
                      <Table.Column>Coste</Table.Column>
                      <Table.Column>Estado</Table.Column>
                      <Table.Column>Acciones</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {data.map((product) => (
                        <Table.Row
                          key={product.id}
                          className="border-b border-default-100 transition-colors duration-300 hover:bg-amber-50/50"
                        >
                          <Table.Cell>
                            <Link
                              className="font-semibold text-default-900 transition-colors hover:text-amber-700"
                              to={`/products/${product.id}`}
                            >
                              {product.name}
                            </Link>
                            <p className="text-xs text-default-500">
                              {product.suppliers.length
                                ? product.suppliers.map((supplier) => supplier.name).join(', ')
                                : 'Sin proveedores'}
                            </p>
                          </Table.Cell>
                          <Table.Cell>
                            {inventory.data
                              ?.filter((item) => item.productId === product.id)
                              .map(
                                (item) =>
                                  `${item.warehouseName ?? 'Sin almacén'}: ${item.quantity ?? 0}`,
                              )
                              .join(', ') || 'Sin existencias'}
                          </Table.Cell>
                          <Table.Cell>{product.category}</Table.Cell>
                          <Table.Cell>
                            {(() => {
                              const stock =
                                inventory.data
                                  ?.filter((item) => item.productId === product.id)
                                  .reduce((sum, item) => sum + Number(item.quantity ?? 0), 0) ?? 0;
                              const low = stock <= product.minimumStock;
                              return (
                                <Chip color={low ? 'danger' : 'success'} size="sm">
                                  {low ? 'Stock bajo' : `${stock} ${product.unit}`}
                                </Chip>
                              );
                            })()}
                          </Table.Cell>
                          <Table.Cell>
                            ${product.cost.toFixed(2)} / {product.unit}
                          </Table.Cell>
                          <Table.Cell>
                            <Chip color={product.active ? 'success' : 'default'} size="sm">
                              {product.active ? 'Activo' : 'Inactivo'}
                            </Chip>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex items-center gap-4">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="secondary"
                                aria-label={`Editar ${product.name}`}
                                onPress={() => setEditing(product)}
                              >
                                <FiEdit3 aria-hidden="true" />
                              </Button>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="secondary"
                                aria-label={
                                  product.active
                                    ? `Desactivar ${product.name}`
                                    : `Activar ${product.name}`
                                }
                                onPress={() =>
                                  toggle.mutate({ id: product.id, active: !product.active })
                                }
                              >
                                <FiPower aria-hidden="true" />
                              </Button>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table>
              </Table.ScrollContainer>
            </motion.div>
          )}
        </Card.Content>
      </Card>
    </>
  );
}
