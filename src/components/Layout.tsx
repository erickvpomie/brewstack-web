import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Button } from '@heroui/react';
import {
  FiArchive,
  FiBox,
  FiChevronLeft,
  FiChevronRight,
  FiClipboard,
  FiGrid,
  FiMenu,
  FiPackage,
  FiTruck,
} from 'react-icons/fi';
import { motion } from 'motion/react';

const navigation = [
  ['Panel', '/', FiGrid],
  ['Productos', '/products', FiPackage],
  ['Inventario', '/inventory', FiArchive],
  ['Pedidos', '/orders', FiClipboard],
  ['Almacenes', '/warehouses', FiBox],
  ['Proveedores', '/suppliers', FiTruck],
  ['Categorías', '/categories', FiGrid],
] as const;

export function Layout() {
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {open && (
        <div
          className="sidebar-backdrop lg:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`sidebar ${open ? 'sidebar-open' : ''} ${compact ? 'sidebar-compact' : ''}`}
      >
        <div className="mb-10 flex items-center justify-between text-2xl font-bold text-white">
          <span className="sidebar-brand">
            Brew<span className="text-amber-400">Stack</span>
          </span>
          <Button
            className="lg:hidden"
            size="sm"
            variant="ghost"
            onPress={() => setOpen(false)}
            aria-label="Cerrar navegación"
          >
            <FiChevronLeft size={20} />
          </Button>
          <Button
            className="hidden lg:inline-flex"
            size="sm"
            variant="ghost"
            onPress={() => setCompact((value) => !value)}
            aria-label={compact ? 'Expandir navegación' : 'Compactar navegación'}
          >
            {compact ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
          </Button>
        </div>
        <nav className="space-y-1">
          {navigation.map(([label, to, Icon]) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <Icon aria-hidden="true" className="shrink-0" size={18} />
              <span className="sidebar-label">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className={`layout-main ${compact ? 'layout-main-compact' : ''}`}>
        <header className="flex min-h-20 items-center justify-between gap-4 border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-10">
          <Button
            className="lg:hidden"
            variant="ghost"
            onPress={() => setOpen(true)}
            aria-label="Abrir navegación"
          >
            <FiMenu size={20} />
          </Button>
          <div>
            <p className="text-sm text-stone-500">Espacio de trabajo</p>
            <h1 className="text-xl font-semibold">Operaciones de cafetería</h1>
          </div>
        </header>
        <motion.section
          className="p-4 md:p-6 lg:p-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.section>
      </main>
    </div>
  );
}
