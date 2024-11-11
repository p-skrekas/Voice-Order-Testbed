import React from 'react';
import { Toaster as SonnerToaster, toast } from 'sonner';

export const CustomToaster: React.FC = () => {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--toast-background)',
          color: 'var(--toast-color)',
        },
      }}
    />
  );
};

export const useCustomToast = () => {
  return {
    success: (message: string) => toast.success(message, {
      style: { '--toast-background': '#4caf50', '--toast-color': '#ffffff' } as React.CSSProperties,
      duration: 3000,
    }),
    error: (message: string) => toast.error(message, {
      style: { '--toast-background': '#f44336', '--toast-color': '#ffffff' } as React.CSSProperties,
      duration: 3000,
    }),
  };
};

