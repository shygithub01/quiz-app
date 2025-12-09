import * as React from "react"
import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export const useToast = () => {
  const toast = React.useCallback((props: ToastProps) => {
    if (props.variant === "destructive") {
      sonnerToast.error(props.title || "Error", {
        description: props.description,
      })
    } else {
      sonnerToast.success(props.title || "Success", {
        description: props.description,
      })
    }
  }, [])

  return { toast }
}

export { sonnerToast as toast }
