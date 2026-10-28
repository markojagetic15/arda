import { Spinner } from '@heroui/react'
import { AlertCircle, X } from 'lucide-react'

import { uploadStatus, useUploadStatus } from '../model/upload-status'

/** "Uploading 2 images..." / last upload error, shown under the toolbar. */
export function UploadStatusBar() {
  const { pending, error } = useUploadStatus()
  if (!pending && !error) return null

  return (
    <div
      role="status"
      className={`flex items-center gap-2 border-b px-4 py-1.5 text-xs ${
        error ? 'border-danger/20 bg-danger-soft text-danger-soft-foreground' : 'border-border bg-surface-secondary text-muted'
      }`}
    >
      {pending ? (
        <>
          <Spinner size="sm" /> Uploading {pending === 1 ? 'image' : `${pending} images`}...
        </>
      ) : (
        <>
          <AlertCircle className="h-3.5 w-3.5" /> <span className="flex-1">{error}</span>
          <button type="button" aria-label="Dismiss" onClick={uploadStatus.dismiss}>
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  )
}
