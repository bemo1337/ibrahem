'use client';

import { ReactNode, useEffect } from 'react';
import { SSRProvider } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Set RTL direction for toast notifications
    const toastContainer = document.querySelector('.Toastify') as HTMLElement;
    if (toastContainer) {
      toastContainer.setAttribute('dir', 'rtl');
    }
  }, []);

  return (
    <SSRProvider>
      {children}
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={true}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        aria-label="Notification"
      />
    </SSRProvider>
  );
}
