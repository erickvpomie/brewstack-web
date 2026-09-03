import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { ResourcePage } from './pages/ResourcePage';
import { InventoryPage } from './pages/InventoryPage';
import { OrdersPage } from './pages/OrdersPage';
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route
            path="/categories"
            element={
              <ResourcePage
                resource="categories"
                title="Categorías"
                fields={['name', 'description']}
              />
            }
          />
          <Route
            path="/warehouses"
            element={
              <ResourcePage
                resource="warehouses"
                title="Almacenes"
                fields={['name', 'description']}
              />
            }
          />
          <Route
            path="/suppliers"
            element={
              <ResourcePage
                resource="suppliers"
                title="Proveedores"
                fields={['name', 'contact', 'email', 'phone', 'products']}
              />
            }
          />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
