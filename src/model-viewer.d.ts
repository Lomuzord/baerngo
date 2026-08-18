import type { DetailedHTMLProps, HTMLAttributes } from "react"

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          src?: string
          alt?: string
          ar?: boolean
          "ar-modes"?: string
          "camera-controls"?: boolean
        },
        HTMLElement
      >
    }
  }
}

export {}
