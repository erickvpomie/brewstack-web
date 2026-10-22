import { Button } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FiAlertCircle,
  FiArchive,
  FiArrowRight,
  FiBox,
  FiCheckCircle,
  FiClipboard,
  FiPackage,
  FiPlus,
} from 'react-icons/fi';
import { listResource } from '../services/api';
import { useProducts } from '../hooks/useProducts';

const quantityFormat = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 4 });
const actions = [
  {
    to: '/inventory',
    title: 'Actualizar existencias',
    description: 'Ajusta cantidades por almacén',
    Icon: FiArchive,
  },
  {
    to: '/orders?new=1',
    title: 'Crear un pedido',
    description: 'Prepara tu próxima compra',
    Icon: FiClipboard,
  },
  {
    to: '/products?new=1',
    title: 'Agregar producto',
    description: 'Amplía tu catálogo',
    Icon: FiPlus,
  },
];

export function DashboardPage() {
  const products = useProducts('');
  const inventory = useQuery({
    queryKey: ['inventory'],
    queryFn: () => listResource('inventory', ''),
  });
  const warehouses = useQuery({
    queryKey: ['warehouses', 'dashboard'],
    queryFn: () => listResource('warehouses', ''),
  });
  const results = [products, inventory, warehouses];
  const stockByProduct = new Map<string, number>();
  for (const item of inventory.data ?? []) {
    if (typeof item.productId === 'string') {
      stockByProduct.set(
        item.productId,
        (stockByProduct.get(item.productId) ?? 0) + Number(item.quantity ?? 0),
      );
    }
  }
  const activeProducts = products.data?.filter((product) => product.active) ?? [];
  const activeWarehouses = warehouses.data?.filter((warehouse) => warehouse.active !== false) ?? [];
  const lowStock = activeProducts
    .filter((product) => (stockByProduct.get(product.id) ?? 0) <= product.minimumStock)
    .sort((a, b) => (stockByProduct.get(a.id) ?? 0) - (stockByProduct.get(b.id) ?? 0));
  const stats = [
    { name: 'Productos activos', value: activeProducts.length, Icon: FiPackage, to: '/products' },
    {
      name: 'Con existencias',
      value: activeProducts.filter((product) => (stockByProduct.get(product.id) ?? 0) > 0).length,
      Icon: FiArchive,
      to: '/inventory',
    },
    { name: 'Por reabastecer', value: lowStock.length, Icon: FiAlertCircle, to: '#stock-bajo' },
    { name: 'Almacenes activos', value: activeWarehouses.length, Icon: FiBox, to: '/warehouses' },
  ];
  return (
    <div className="dashboard">
      <header className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">Resumen general</p>
          <h2>Panel de inventario</h2>
          <p className="dashboard-subtitle">Lo que tienes, lo que falta y tu siguiente paso.</p>
        </div>
        <Link to="/orders?new=1" className="dashboard-primary-link">
          <FiPlus aria-hidden="true" size={16} /> Crear pedido
        </Link>
      </header>

      {results.some((result) => result.isError) ? (
        <section role="alert" className="dashboard-panel dashboard-feedback">
          <FiAlertCircle aria-hidden="true" size={28} />
          <h3>No pudimos cargar el resumen</h3>
          <p>Revisa tu conexión y vuelve a intentarlo. Tus datos no se han modificado.</p>
          <Button
            variant="secondary"
            isDisabled={results.some((result) => result.isFetching)}
            onPress={() => {
              for (const result of results) void result.refetch();
            }}
          >
            Reintentar
          </Button>
        </section>
      ) : results.some((result) => result.isPending) ? (
        <div role="status" aria-label="Cargando resumen">
          <span className="sr-only">Cargando resumen del inventario…</span>
          <div className="dashboard-metrics dashboard-skeleton" aria-hidden="true">
            {stats.map(({ name }) => (
              <div className="dashboard-stat" key={name}>
                <span className="dashboard-skeleton-line" />
                <span className="dashboard-skeleton-value" />
              </div>
            ))}
          </div>
          <div className="dashboard-grid" aria-hidden="true">
            <div className="dashboard-panel dashboard-skeleton-content" />
            <div className="dashboard-panel dashboard-skeleton-content" />
          </div>
        </div>
      ) : (
        <>
          <nav className="dashboard-metrics" aria-label="Indicadores del inventario">
            {stats.map(({ name, value, Icon, to }) => (
              <Link
                key={name}
                to={to}
                reloadDocument={to.startsWith('#')}
                className="dashboard-stat"
              >
                <span className="dashboard-stat-label">
                  <Icon aria-hidden="true" size={16} /> {name}
                </span>
                <span
                  className={`dashboard-stat-value${name === 'Por reabastecer' && value ? ' dashboard-warning-text' : ''}`}
                >
                  {quantityFormat.format(value)}
                  <FiArrowRight aria-hidden="true" size={16} />
                </span>
              </Link>
            ))}
          </nav>

          {!products.data?.length && (
            <section className="dashboard-onboarding" aria-labelledby="getting-started">
              <span className="dashboard-icon">
                <FiPackage aria-hidden="true" size={24} />
              </span>
              <div>
                <h3 id="getting-started">Todo empieza con tu primer producto</h3>
                <p>Crea una categoría, configura un almacén y registra tu catálogo.</p>
                <div className="dashboard-onboarding-links">
                  <Link to="/categories" className="dashboard-text-link">
                    Crear categoría <FiArrowRight aria-hidden="true" />
                  </Link>
                  <Link to="/products?new=1" className="dashboard-text-link">
                    Agregar producto <FiArrowRight aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </section>
          )}

          <div className="dashboard-grid">
            <section
              id="stock-bajo"
              className="dashboard-panel dashboard-stock"
              aria-labelledby="stock-title"
            >
              <div className="dashboard-panel-heading">
                <div>
                  <h3 id="stock-title">Necesitan atención</h3>
                  <p>Productos en el mínimo de stock o por debajo.</p>
                </div>
                <span
                  className={`dashboard-status${lowStock.length ? ' dashboard-status-warning' : ''}`}
                >
                  {lowStock.length ? (
                    <FiAlertCircle aria-hidden="true" />
                  ) : (
                    <FiCheckCircle aria-hidden="true" />
                  )}
                  {lowStock.length ? `${lowStock.length} por revisar` : 'Sin alertas'}
                </span>
              </div>
              {lowStock.length ? (
                <>
                  <div className="dashboard-stock-columns" aria-hidden="true">
                    <span>Producto</span>
                    <span>Disponible / mínimo</span>
                  </div>
                  <ul className="dashboard-stock-list">
                    {lowStock.slice(0, 6).map((product) => {
                      const stock = stockByProduct.get(product.id) ?? 0;
                      return (
                        <li key={product.id}>
                          <Link to={`/products/${product.id}`} className="dashboard-stock-row">
                            <span className="dashboard-product-icon">
                              <FiPackage aria-hidden="true" size={18} />
                            </span>
                            <div className="dashboard-product-name">
                              <span>{product.name}</span>
                              <small>{stock <= 0 ? 'Sin existencias' : 'Stock bajo'}</small>
                            </div>
                            <div className="dashboard-stock-quantity">
                              <span>
                                <strong>{quantityFormat.format(stock)}</strong> /{' '}
                                {quantityFormat.format(product.minimumStock)} {product.unit}
                              </span>
                              <span className="sr-only">disponibles / mínimo</span>
                            </div>
                            <FiArrowRight
                              aria-hidden="true"
                              className="dashboard-row-arrow"
                              size={16}
                            />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  {lowStock.length > 6 && (
                    <p className="dashboard-more">
                      Y {lowStock.length - 6} productos más por revisar.
                    </p>
                  )}
                </>
              ) : (
                <div className="dashboard-empty">
                  <span className="dashboard-empty-icon">
                    <FiCheckCircle aria-hidden="true" size={28} />
                  </span>
                  <h4>{activeProducts.length ? 'Todo en orden' : 'Tu resumen aparecerá aquí'}</h4>
                  <p>
                    {activeProducts.length
                      ? 'Tus productos activos están por encima del stock mínimo.'
                      : 'Agrega productos para saber cuáles necesitan reposición.'}
                  </p>
                </div>
              )}
              <footer className="dashboard-panel-footer">
                <span>Stock total de todos los almacenes</span>
                <Link to="/inventory" className="dashboard-text-link">
                  Ver inventario <FiArrowRight aria-hidden="true" size={15} />
                </Link>
              </footer>
            </section>

            <aside className="dashboard-aside" aria-label="Accesos y almacenes">
              <section className="dashboard-panel" aria-labelledby="quick-actions">
                <div className="dashboard-panel-heading">
                  <h3 id="quick-actions">Accesos rápidos</h3>
                </div>
                <div className="dashboard-actions">
                  {actions.map(({ to, title, description, Icon }) => (
                    <Link key={to} to={to} className="dashboard-action">
                      <span className="dashboard-action-icon">
                        <Icon aria-hidden="true" size={18} />
                      </span>
                      <span>
                        <strong>{title}</strong>
                        <small>{description}</small>
                      </span>
                      <FiArrowRight aria-hidden="true" size={15} className="dashboard-row-arrow" />
                    </Link>
                  ))}
                </div>
              </section>
              <section className="dashboard-panel" aria-labelledby="warehouses-title">
                <div className="dashboard-panel-heading">
                  <h3 id="warehouses-title">Tus almacenes</h3>
                  <Link to="/warehouses" className="dashboard-text-link">
                    Ver todos <FiArrowRight aria-hidden="true" size={14} />
                  </Link>
                </div>
                {activeWarehouses.length ? (
                  <ul className="dashboard-warehouse-list">
                    {activeWarehouses.slice(0, 3).map((warehouse) => {
                      const productCount = new Set(
                        inventory.data
                          ?.filter((item) => item.warehouseId === warehouse.id)
                          .map((item) => item.productId),
                      ).size;
                      return (
                        <li key={warehouse.id}>
                          <FiBox aria-hidden="true" size={17} />
                          <span>{warehouse.name ?? 'Sin nombre'}</span>
                          <small>
                            {productCount} {productCount === 1 ? 'producto' : 'productos'}
                          </small>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="dashboard-warehouse-empty">
                    No hay almacenes activos. Crea uno para organizar tus existencias.
                  </p>
                )}
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
