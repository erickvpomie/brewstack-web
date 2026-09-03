import { Button, Card, Spinner } from '@heroui/react';
import { useQueries } from '@tanstack/react-query';
import { listResource } from '../services/api';
import { motion } from 'motion/react';
import {
  FiAlertCircle,
  FiArchive,
  FiBox,
  FiMessageCircle,
  FiPackage,
  FiStar,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';

export function DashboardPage() {
  const results = useQueries({
    queries: ['products', 'inventory', 'warehouses'].map((resource) => ({
      queryKey: [resource, 'dashboard'],
      queryFn: () => listResource(resource, ''),
    })),
  });
  const [products, inventory, warehouses] = results;
  const stats: { name: string; value: number; Icon: IconType }[] = [
    { name: 'Productos', value: products.data?.length ?? 0, Icon: FiPackage },
    {
      name: 'Unidades en inventario',
      value: inventory.data?.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0) ?? 0,
      Icon: FiArchive,
    },
    {
      name: 'Almacenes activos',
      value: warehouses.data?.filter((item) => item.active).length ?? 0,
      Icon: FiBox,
    },
    {
      name: 'Productos con stock bajo',
      value:
        inventory.data?.filter(
          (item) => Number(item.quantity ?? 0) <= Number(item.minimumStock ?? 0),
        ).length ?? 0,
      Icon: FiAlertCircle,
    },
  ];
  return (
    <div>
      <div className="mb-8">
        <p className="mb-1 text-sm text-amber-600">Buenos días</p>
        <h2 className="text-3xl font-bold">Resumen de operaciones</h2>
        <p className="mt-2 text-default-500">
          Lo esencial para mantener tu cafetería abastecida y en marcha.
        </p>
      </div>
      <Card className="personalized-banner mb-6 overflow-hidden border-0 shadow-none">
        <Card.Content className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="personalized-banner-icon" aria-hidden="true">
              <FiStar size={20} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-75">
                Experiencia personalizada
              </p>
              <p className="mt-1 text-lg font-bold">Hecho a la medida para Rachith</p>
              <p className="mt-1 text-sm opacity-80">
                Una operación más clara para el día a día de tu cafetería.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
            <span className="personalized-banner-version">Versión 1.0</span>
            <Button
              variant="secondary"
              onPress={() =>
                window.open(
                  'https://wa.me/525614218380?text=Hola%2C%20quiero%20ponerme%20en%20contacto%20sobre%20BrewStack.',
                  '_blank',
                  'noopener,noreferrer',
                )
              }
            >
              <FiMessageCircle aria-hidden="true" /> Contactar por WhatsApp
            </Button>
          </div>
        </Card.Content>
      </Card>
      {results.some((r) => r.isPending) ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : results.some((r) => r.isError) ? (
        <p className="rounded-2xl bg-danger-50 p-6 text-danger">
          No se pudieron cargar los datos del panel.
        </p>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {stats.map(({ name, value, Icon }) => (
              <Card key={name} className="border border-default-200/70">
                <Card.Content className="gap-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-default-500">{name}</p>
                    <span className="rounded-2xl bg-amber-100 p-2 text-amber-700">
                      <Icon aria-hidden="true" size={18} />
                    </span>
                  </div>
                  <p className="text-3xl font-bold tracking-tight">{value}</p>
                </Card.Content>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border border-default-200/70">
              <Card.Content className="gap-4">
                <h3 className="text-lg font-semibold">Resumen de almacenes</h3>
                <p className="text-sm text-default-500">
                  {warehouses.data?.filter((item) => item.active).length ?? 0} almacenes activos
                  para organizar tus existencias.
                </p>
              </Card.Content>
            </Card>
            <Card className="border border-default-200/70">
              <Card.Content>
                <h3 className="text-lg font-semibold">Operación diaria</h3>
                <p className="mt-2 text-sm text-default-500">
                  Mantén cada producto asignado a un almacén y revisa aquí los niveles bajos.
                </p>
              </Card.Content>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
}
