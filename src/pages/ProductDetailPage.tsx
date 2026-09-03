import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, Chip, Modal, Spinner } from '@heroui/react';
import { FiArrowLeft, FiEdit3 } from 'react-icons/fi';
import { useProduct } from '../hooks/useProducts';
import { useQuery } from '@tanstack/react-query';
import { listResource } from '../services/api';
import { ProductForm } from '../components/ProductForm';
export function ProductDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading, isError } = useProduct(id);
  const inventory = useQuery({
    queryKey: ['inventory', 'product', id],
    queryFn: () => listResource('inventory', ''),
    enabled: Boolean(id),
  });
  const [editing, setEditing] = useState(false);
  if (isLoading) return <Spinner aria-label="Cargando producto" />;
  if (isError || !data) return <p className="text-red-600">Producto no encontrado.</p>;
  return (
    <div className="max-w-2xl">
      <Link to="/products" className="inline-flex items-center gap-4 text-sm text-amber-700">
        <FiArrowLeft aria-hidden="true" /> Productos
      </Link>
      <Card className="mt-5 rounded-2xl border border-default-200/70 shadow-none">
        <Card.Content className="p-5 sm:p-8">
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold">{data.name}</h2>
              </div>
              {(() => {
                const stock =
                  inventory.data
                    ?.filter((item) => item.productId === data.id)
                    .reduce((sum, item) => sum + Number(item.quantity ?? 0), 0) ?? 0;
                return (
                  <Chip color={stock <= data.minimumStock ? 'danger' : 'success'} size="sm">
                    {stock <= data.minimumStock ? 'BAJO' : 'OK'}
                  </Chip>
                );
              })()}
              <Button size="sm" variant="secondary" onPress={() => setEditing(true)}>
                <FiEdit3 aria-hidden="true" /> Editar
              </Button>
            </div>
            <p className="mt-6 leading-7 text-default-600">
              {data.description || 'Sin descripción.'}
            </p>
            <dl className="mt-8 grid grid-cols-1 gap-4 text-sm min-[480px]:grid-cols-2">
              <div>
                <dt className="text-default-500">Categoría</dt>
                <dd className="mt-1 font-semibold">{data.category}</dd>
              </div>
              <div>
                <dt className="text-default-500">Proveedores</dt>
                <dd className="mt-1 font-semibold">
                  {data.suppliers.length
                    ? data.suppliers.map((supplier) => supplier.name).join(', ')
                    : 'Sin proveedores'}
                </dd>
              </div>
              <div>
                <dt className="text-default-500">Unidad</dt>
                <dd className="mt-1 font-semibold">{data.unit}</dd>
              </div>
              <div>
                <dt className="text-default-500">Coste</dt>
                <dd className="mt-1 font-semibold">${data.cost.toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-default-500">Stock mínimo</dt>
                <dd className="mt-1 font-semibold">{data.minimumStock}</dd>
              </div>
              <div className="min-[480px]:col-span-2">
                <dt className="text-default-500">Almacenes</dt>
                <dd className="mt-1 font-semibold">
                  {inventory.data
                    ?.filter((item) => item.productId === data.id)
                    .map(
                      (item) =>
                        `${item.warehouseName ?? 'Sin almacén'}: ${item.quantity ?? 0} ${data.unit}`,
                    )
                    .join(' · ') || 'Sin existencias asignadas'}
                </dd>
              </div>
            </dl>
            <Modal isOpen={editing} onOpenChange={setEditing}>
              <Modal.Backdrop>
                <Modal.Container>
                  <Modal.Dialog className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                    <Modal.CloseTrigger />
                    <Modal.Header>
                      <Modal.Heading>Editar producto</Modal.Heading>
                    </Modal.Header>
                    <Modal.Body>
                      <ProductForm product={data} onDone={() => setEditing(false)} />
                    </Modal.Body>
                  </Modal.Dialog>
                </Modal.Container>
              </Modal.Backdrop>
            </Modal>
          </>
        </Card.Content>
      </Card>
    </div>
  );
}
