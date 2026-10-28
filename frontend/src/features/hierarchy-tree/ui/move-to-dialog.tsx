import { Button, Modal } from '@heroui/react'
import { useMemo } from 'react'

import { collectSubtreeIds, getSiblings, type HierarchyNode } from '@/entities/hierarchy-node'

import { useMoveNode } from '../model/use-move-node'

interface MoveToDialogProps {
  node: HierarchyNode | null
  nodes: HierarchyNode[]
  onClose: () => void
}

export function MoveToDialog({ node, nodes, onClose }: MoveToDialogProps) {
  const moveNode = useMoveNode()

  const targets = useMemo(() => {
    if (!node) return []
    if (node.kind === 'project') {
      return nodes.filter((candidate) => candidate.kind === 'space')
    }
    if (node.kind === 'page') {
      const excluded = collectSubtreeIds(nodes, node.id)
      return nodes.filter(
        (candidate) => (candidate.kind === 'project' || candidate.kind === 'page') && !excluded.has(candidate.id),
      )
    }
    return []
  }, [node, nodes])

  const handleSelect = (targetId: string) => {
    if (!node) return
    const index = getSiblings(nodes, targetId).length
    moveNode.mutate(
      { id: node.id, kind: node.kind, targetParentId: targetId, index },
      { onSuccess: onClose, onError: onClose },
    )
  }

  return (
    <Modal isOpen={node !== null} onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Move &ldquo;{node?.label}&rdquo;</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
                {targets.length === 0 ? (
                  <p className="text-sm">No valid destination available.</p>
                ) : (
                  targets.map((target) => (
                    <Button
                      key={target.id}
                      variant="ghost"
                      fullWidth
                      isDisabled={moveNode.isPending}
                      onPress={() => handleSelect(target.id)}
                    >
                      {target.label}
                    </Button>
                  ))
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={onClose}>
                Cancel
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
