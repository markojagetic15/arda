import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'

import { IMAGE_TYPES } from '@/shared/api/uploads'

import { uploadStatus } from './upload-status'

export interface ImageUploadOptions {
  /** Uploads one file and resolves to the URL to embed. */
  upload: (file: File) => Promise<string>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageUpload: {
      /** Opens the file picker and inserts the chosen images at the cursor. */
      pickImages: () => ReturnType
    }
  }
}

function imageFiles(list: FileList | null | undefined): File[] {
  return [...(list ?? [])].filter((file) => file.type.startsWith('image/'))
}

/**
 * Images from the user's computer: via the file picker (toolbar, "/image"),
 * pasted from the clipboard, or dropped onto the page. Each file is uploaded
 * and then inserted as an image node at the position it was added.
 */
export const ImageUpload = Extension.create<ImageUploadOptions>({
  name: 'imageUpload',

  addOptions() {
    return { upload: () => Promise.reject(new Error('Uploads are not configured')) }
  },

  addCommands() {
    return {
      pickImages:
        () =>
        ({ editor }) => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = IMAGE_TYPES.join(',')
          input.multiple = true
          // Attached (hidden) while open: some browsers ignore clicks on detached inputs.
          input.style.display = 'none'
          document.body.appendChild(input)
          input.onchange = () => {
            void insertFiles(editor.view, imageFiles(input.files), editor.state.selection.from, this.options.upload)
            input.remove()
          }
          input.addEventListener('cancel', () => input.remove())
          input.click()
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const upload = this.options.upload
    return [
      new Plugin({
        key: new PluginKey('imageUpload'),
        props: {
          handlePaste: (view, event) => {
            const files = imageFiles(event.clipboardData?.files)
            if (files.length === 0) return false
            void insertFiles(view, files, view.state.selection.from, upload)
            return true
          },
          handleDrop: (view, event) => {
            const files = imageFiles(event.dataTransfer?.files)
            if (files.length === 0) return false
            event.preventDefault()
            const at = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? view.state.selection.from
            void insertFiles(view, files, at, upload)
            return true
          },
        },
      }),
    ]
  },
})

async function insertFiles(
  view: EditorView,
  files: File[],
  position: number,
  upload: ImageUploadOptions['upload'],
): Promise<void> {
  let at = position
  for (const file of files) {
    uploadStatus.start()
    try {
      const src = await upload(file)
      uploadStatus.done()
      if (view.isDestroyed) return
      const imageType = view.state.schema.nodes.image
      const pos = Math.min(at, view.state.doc.content.size)
      const tr = view.state.tr.insert(pos, imageType.create({ src, alt: file.name }))
      view.dispatch(tr.scrollIntoView())
      at = pos + 1
    } catch (error) {
      uploadStatus.fail(error instanceof Error ? error.message : 'Upload failed')
    }
  }
}
