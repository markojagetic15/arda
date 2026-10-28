import { useEffect, useState } from 'react'
import { createTLStore, defaultBindingUtils, defaultShapeUtils, type TLRecord, type TLStore } from 'tldraw'
import * as Y from 'yjs'

const RECORDS_MAP = 'tldraw-records'
const LOCAL_ORIGIN = 'tldraw-yjs-store'

/**
 * Binds a tldraw `TLStore` to a `Y.Map` on the page's shared Yjs document, so
 * shapes/bindings/pages created in the store propagate to every other client
 * viewing the same page (and vice versa).
 *
 * Only document-scope records (shapes, bindings, assets, pages, the document
 * record) are synced this way — session-scope records (camera, instance
 * state) stay local to each client, and presence is handled separately via
 * `useTldrawPresence`.
 *
 * The store is created *inside* the effect below (not via `useMemo`) and
 * disposed in that same effect's cleanup, mirroring `useCollaboration`'s
 * Strict Mode-safe resource lifecycle.
 */
export function useTldrawYjsStore(doc: Y.Doc): TLStore | null {
  const [store, setStore] = useState<TLStore | null>(null)

  useEffect(() => {
    const tlStore = createTLStore({ shapeUtils: defaultShapeUtils, bindingUtils: defaultBindingUtils })
    const yRecords = doc.getMap<TLRecord>(RECORDS_MAP)

    if (yRecords.size > 0) {
      const remoteRecords = [...yRecords.values()]
      tlStore.mergeRemoteChanges(() => {
        tlStore.put(remoteRecords)
      })
    } else {
      const documentScopeTypes = tlStore.scopedTypes.document
      const initialRecords = tlStore.allRecords().filter((record) => documentScopeTypes.has(record.typeName))
      doc.transact(() => {
        for (const record of initialRecords) yRecords.set(record.id, record)
      }, LOCAL_ORIGIN)
    }

    const unsubscribeStore = tlStore.listen(
      ({ changes }) => {
        doc.transact(() => {
          for (const record of Object.values(changes.added)) yRecords.set(record.id, record)
          for (const [, to] of Object.values(changes.updated)) yRecords.set(to.id, to)
          for (const id of Object.keys(changes.removed)) yRecords.delete(id)
        }, LOCAL_ORIGIN)
      },
      { source: 'user', scope: 'document' },
    )

    const handleYjsChange = (event: Y.YMapEvent<TLRecord>, transaction: Y.Transaction) => {
      if (transaction.origin === LOCAL_ORIGIN) return

      const toPut: TLRecord[] = []
      const toRemove: TLRecord['id'][] = []
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'delete') {
          toRemove.push(key as TLRecord['id'])
        } else {
          const record = yRecords.get(key)
          if (record) toPut.push(record)
        }
      })

      tlStore.mergeRemoteChanges(() => {
        if (toPut.length > 0) tlStore.put(toPut)
        if (toRemove.length > 0) tlStore.remove(toRemove)
      })
    }
    yRecords.observe(handleYjsChange)

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStore(tlStore)

    return () => {
      yRecords.unobserve(handleYjsChange)
      unsubscribeStore()
      tlStore.dispose()
    }
  }, [doc])

  return store
}
