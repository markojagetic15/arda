import { AlertDialog, Button } from '@heroui/react'

import type { HierarchyNode } from '@/entities/hierarchy-node'

import { useDeleteNode } from '../model/use-delete-node'

interface DeleteConfirmDialogProps {
  node: HierarchyNode | null
  onClose: () => void
}

const KIND_LABEL: Record<HierarchyNode['kind'], string> = {
  space: 'space',
  project: 'project',
  page: 'page',
}

export function DeleteConfirmDialog({ node, onClose }: DeleteConfirmDialogProps) {
  const deleteNode = useDeleteNode()

  const handleConfirm = () => {
    if (!node) return
    deleteNode.mutate({ id: node.id, kind: node.kind }, { onSuccess: onClose, onError: onClose })
  }

  return (
    <AlertDialog isOpen={node !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>Delete {node ? KIND_LABEL[node.kind] : ''}?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              {`“${node?.label ?? ''}” and everything nested inside it will be permanently deleted. This can't be undone.`}
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="secondary" onPress={onClose}>
                Cancel
              </Button>
              <Button variant="danger" isDisabled={deleteNode.isPending} onPress={handleConfirm}>
                Delete
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  )
}
