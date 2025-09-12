"use client";

import * as React from "react";
import { ToastProviderCustom, useToastSimple } from "./use-toast";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "./toast";

export function Toaster() {
  const { toasts } = useToastSimple();
  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, ...props }) => (
        <Toast key={id} {...props}>
          {title && <ToastTitle>{title}</ToastTitle>}
          {description && <ToastDescription>{description}</ToastDescription>}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

export function ToastProviders({ children }: { children: React.ReactNode }) {
  return <ToastProviderCustom>{children}</ToastProviderCustom>;
}
