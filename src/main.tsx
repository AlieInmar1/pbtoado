import React from 'react';
import { createRoot } from 'react-dom/client';
import { queryClient } from './lib/api/reactQuery';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

// Mount application
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {/* Temporarily removed ReactQueryDevtools to fix the error */}
      {/* {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />} */}
    </QueryClientProvider>
  </React.StrictMode>
);
