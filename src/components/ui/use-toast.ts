import * as React from "react";
import type { ToastProps } from "@radix-ui/react-toast";

export type Toast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
};

type ToastContextType = {
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProviderCustom({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((t) => [...t, { ...toast, id }]);
    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastSimple() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToastSimple must be used within ToastProviderCustom");
  return context;
}
