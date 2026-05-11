"use client";

import { ThemeProvider } from "@/shared/components/ThemeProvider";
import { ToastProvider } from "@/shared/components/ui/Toast";
import { AuthProvider } from "@/shared/auth/AuthContext";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
