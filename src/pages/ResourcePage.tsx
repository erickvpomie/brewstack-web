import { useState } from 'react';
import { Button, Card, Chip, Input, Modal, Spinner, Table } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { FiEdit3 } from 'react-icons/fi';
import { createResource, listResource, updateResource, type ResourceItem } from '../services/api';

type Props = { resource: string; title: string; fields: string[]; readOnly?: boolean };
const labels: Record<string, string> = {
  name: 'Nombre',
  description: 'Descripción',
  code: 'Código',
  address: 'Dirección',
  contactName: 'Persona de contacto',
  email: 'Correo electrónico',
  phone: 'Teléfono',
  productName: 'Producto',
  warehouseName: 'Almacén',
  quantity: 'Cantidad',
  type: 'Tipo',
  createdAt: 'Fecha de creación',
  active: 'Estado',
  products: 'Productos',
};
const singularTitles: Record<string, string> = {
  categories: 'categoría',
  warehouses: 'almacén',
  suppliers: 'proveedor',
  inventory: 'registro de inventario',
};
const valueLabels: Record<string, string> = {
  ENTRY: 'Entrada',
  EXIT: 'Salida',
  TRANSFER: 'Transferencia',
  ADJUSTMENT: 'Ajuste',
  NORMAL: 'Normal',
  WARNING: 'Advertencia',
  CRITICAL: 'Crítico',
  OFFLINE: 'Sin conexión',
};
const label = (field: string) =>
  labels[field] ?? field.replace(/([A-Z])/g, ' $1').replace(/^./, (v) => v.toUpperCase());
const displayValue = (field: string, value: unknown) => {
  if (field === 'products' && Array.isArray(value)) {
    return (
      value
        .map((entry) => {
          if (!entry || typeof entry !== 'object') return null;
          return (entry as Record<string, unknown>).name;
        })
        .filter((name): name is string => typeof name === 'string')
        .join(', ') || 'Sin productos'
    );
  }
  return valueLabels[String(value)] ?? String(value ?? '—');
};

export function ResourcePage({ resource, title, fields, readOnly = false }: Props) {
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ResourceItem | null>(null);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: [resource, search],
    queryFn: () => listResource(resource, search),
  });
  const mutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => createResource(resource, input),
    onSuccess: () => {
      setCreating(false);
      void client.invalidateQueries({ queryKey: [resource] });
    },
  });
  const edit = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      updateResource(resource, id, input),
    onSuccess: () => {
      setEditing(null);
      void client.invalidateQueries({ queryKey: [resource] });
    },
  });
  const closeModal = () => {
    setCreating(false);
    setEditing(null);
  };
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-sm text-amber-600">Operaciones de BrewStack</p>
          <h2 className="text-3xl font-bold">{title}</h2>
        </div>
        {!readOnly && (
          <Button variant="primary" onPress={() => setCreating(true)}>
            + Nuevo {singularTitles[resource] ?? title.toLowerCase()}
          </Button>
        )}
      </div>
      <Modal
        isOpen={creating || Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <p className="text-sm font-medium text-amber-600">Operaciones</p>
                <Modal.Heading>
                  {editing ? 'Editar' : 'Nuevo'} {singularTitles[resource] ?? 'registro'}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <ResourceForm
                  fields={fields}
                  initialValues={editing}
                  onSubmit={(data) =>
                    editing ? edit.mutate({ id: editing.id, input: data }) : mutation.mutate(data)
                  }
                  pending={mutation.isPending || edit.isPending}
                />
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      <Card className="rounded-2xl border border-default-200/70 shadow-none">
        <Card.Content className="p-0">
          <div className="brew-table-toolbar mb-4 pt-0">
            <div>
              <p className="text-sm font-semibold text-default-700">
                Listado de {title.toLowerCase()}
              </p>
              <p className="mt-1 text-xs text-default-500">
                Gestiona la información de forma rápida y clara.
              </p>
            </div>
            <Input
              placeholder={`Buscar ${title.toLowerCase()}…`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label={`Buscar ${title.toLowerCase()}`}
              className="w-full max-w-xs"
            />
          </div>
          {query.isPending ? (
            <div className="flex min-h-56 items-center justify-center p-10">
              <Spinner />
            </div>
          ) : query.isError ? (
            <p className="p-8 text-danger">No se pudo cargar {title.toLowerCase()}.</p>
          ) : !query.data?.length ? (
            <p className="p-8 text-center text-default-500">
              No se encontraron {title.toLowerCase()}.
            </p>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {query.isFetching && (
                <div className="mb-3 flex items-center gap-4 text-xs text-default-500">
                  <Spinner size="sm" /> Actualizando
                </div>
              )}
              <Table.ScrollContainer className="brew-table-scroll">
                <Table>
                  <Table.Content
                    aria-label={title}
                    className="brew-table min-w-160 text-sm"
                  >
                    <Table.Header className="bg-default-100/70 text-xs uppercase tracking-wider text-default-600">
                      {fields.map((field) => (
                        <Table.Column key={field}>{label(field)}</Table.Column>
                      ))}
                      {!readOnly && <Table.Column>Acciones</Table.Column>}
                    </Table.Header>
                    <Table.Body>
                      {query.data.map((item) => (
                        <Table.Row
                          key={item.id}
                          className="border-b border-default-100 transition-colors duration-300 hover:bg-amber-50/50"
                        >
                          {fields.map((field) => (
                            <Table.Cell key={field} data-label={label(field)}>
                              {field === 'active' ? (
                                <Chip color={item.active ? 'success' : 'default'} size="sm">
                                  {item.active ? 'ACTIVO' : 'INACTIVO'}
                                </Chip>
                              ) : (
                                displayValue(field, item[field])
                              )}
                            </Table.Cell>
                          ))}
                          {!readOnly && (
                            <Table.Cell data-label="Acciones">
                              <div className="flex flex-wrap gap-4">
                                {fields.includes('name') && (
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="secondary"
                                    aria-label={`Editar ${String(item.name ?? 'registro')}`}
                                    onPress={() => setEditing(item)}
                                  >
                                    <FiEdit3 aria-hidden="true" />
                                  </Button>
                                )}
                              </div>
                            </Table.Cell>
                          )}
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
    </div>
  );
}

function ResourceForm({
  fields,
  initialValues,
  onSubmit,
  pending,
}: {
  fields: string[];
  onSubmit: (data: Record<string, unknown>) => void;
  pending: boolean;
  initialValues: ResourceItem | null;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field, String(initialValues?.[field] ?? '')])),
  );
  return (
    <form
      className="brew-form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          ...values,
          ...(values.quantity ? { quantity: Number(values.quantity) } : {}),
          ...(!initialValues ? { active: true } : {}),
        });
      }}
    >
      {fields
        .filter((f) => !['productName', 'warehouseName', 'products'].includes(f))
        .map((field) => (
          <div key={field} className="brew-form-field">
            <span className="block text-sm font-medium text-default-700">{label(field)}</span>
            <Input
              aria-label={label(field)}
              type={field === 'quantity' ? 'number' : 'text'}
              value={values[field] ?? ''}
              onChange={(event) =>
                setValues((current) => ({ ...current, [field]: event.target.value }))
              }
              required={field === 'name' || field === 'code'}
            />
          </div>
        ))}
      <div className="brew-form-span-full flex justify-end gap-4">
        <Button type="submit" variant="primary" isDisabled={pending}>
          {pending ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
