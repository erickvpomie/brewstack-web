import { Button, Modal } from '@heroui/react';
import { useDeleteProduct } from '../hooks/useProducts';
import type { Product } from '../types/product';

export function DeleteProductDialog({
  product,
  onClose,
  onDeleted,
}: {
  product: Product;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const remove = useDeleteProduct();
  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open && !remove.isPending) onClose();
      }}
    >
      <Modal.Backdrop
        isDismissable={!remove.isPending}
        isKeyboardDismissDisabled={remove.isPending}
      >
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.Header>
              <Modal.Heading>Eliminar producto</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-default-700">
                Vas a eliminar <strong>{product.name}</strong>. Esta acción no se puede deshacer.
              </p>
              <p className="mt-3 text-sm text-default-500">
                Solo se permite si no está vinculado a inventario, proveedores ni pedidos. Si está
                en uso, puedes desactivarlo desde Editar.
              </p>
              {remove.isError && (
                <p role="alert" className="mt-4 text-sm text-danger">
                  {remove.error.message}
                </p>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" autoFocus isDisabled={remove.isPending} onPress={onClose}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                isDisabled={remove.isPending}
                onPress={() => remove.mutate(product.id, { onSuccess: onDeleted })}
              >
                {remove.isPending ? 'Eliminando…' : 'Eliminar producto'}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
