import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl",
          description: "text-white/70",
          actionButton: "bg-white text-purple-600 hover:bg-white/90",
          cancelButton: "bg-white/20 text-white hover:bg-white/30",
        },
      }}
    />
  )
}
